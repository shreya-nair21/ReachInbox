import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { queueService } from '../services/queue.service';
import { elasticsearchService } from '../services/elasticsearch.service';
import { rateLimitService } from '../services/ratelimit.service';

const ScheduleEmailSchema = z.object({
  senderEmail: z.string().email('Valid sender email required'),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  subject: z.string().min(1, 'Subject cannot be empty'),
  body: z.string().min(1, 'Email body cannot be empty'),
  startTime: z.string().optional(),
  delayBetweenSeconds: z.number().min(0).default(2),
  hourlyLimit: z.number().min(1).optional(),
});

export class EmailController {
  /**
   * Schedules one or many emails (e.g., from uploaded CSV leads).
   * Spreads the emails based on startTime and delayBetweenSeconds.
   * Adds persistent delayed jobs to BullMQ with deterministic IDs.
   */
  public async scheduleEmails(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = ScheduleEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid schedule parameters',
          errors: parsed.error.errors,
        });
      }

      const {
        senderEmail,
        recipients,
        subject,
        body,
        startTime,
        delayBetweenSeconds,
        hourlyLimit,
      } = parsed.data;

      const userId = req.user!.id;
      const baseStartTime = startTime ? new Date(startTime) : new Date();
      const now = Date.now();
      const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const createdEmails: any[] = [];

      for (let i = 0; i < recipients.length; i++) {
        const recipientEmail = recipients[i].trim().toLowerCase();

        // Stagger each recipient by delayBetweenSeconds to space out delivery
        const targetRunTimestamp = baseStartTime.getTime() + i * (delayBetweenSeconds * 1000);
        const scheduledDate = new Date(targetRunTimestamp);
        const delayMs = Math.max(0, targetRunTimestamp - now);

        // 1. Create DB record in MySQL
        const emailRecord = await prisma.emailSchedule.create({
          data: {
            userId,
            senderEmail,
            recipientEmail,
            subject,
            body,
            scheduledAt: scheduledDate,
            status: 'SCHEDULED',
            batchId,
          },
        });

        // 2. Add delayed job to BullMQ (Idempotency key = emailRecord.id)
        await queueService.scheduleJob(
          {
            emailId: emailRecord.id,
            userId,
            senderEmail,
            recipientEmail,
            subject,
            body,
            scheduledAt: scheduledDate.toISOString(),
            customHourlyLimit: hourlyLimit,
            batchId,
          },
          delayMs
        );

        // 3. Index to Elasticsearch for instant searchability
        await elasticsearchService.indexEmail({
          id: emailRecord.id,
          userId,
          senderEmail,
          recipientEmail,
          subject,
          body,
          status: 'SCHEDULED',
          scheduledAt: scheduledDate.toISOString(),
          createdAt: emailRecord.createdAt.toISOString(),
        });

        createdEmails.push(emailRecord);
      }

      return res.status(201).json({
        success: true,
        message: `Successfully scheduled ${createdEmails.length} email(s)`,
        data: {
          batchId,
          totalScheduled: createdEmails.length,
          firstSendAt: createdEmails[0]?.scheduledAt,
          lastSendAt: createdEmails[createdEmails.length - 1]?.scheduledAt,
          emails: createdEmails.slice(0, 10), // Return preview of first 10
        },
      });
    } catch (err: any) {
      console.error('Error scheduling emails:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Scheduled Emails (status: SCHEDULED, RESCHEDULED, PROCESSING)
   */
  public async getScheduledEmails(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const skip = (page - 1) * limit;

      const [emails, total] = await Promise.all([
        prisma.emailSchedule.findMany({
          where: {
            userId: req.user!.id,
            status: { in: ['SCHEDULED', 'RESCHEDULED', 'PROCESSING'] },
          },
          orderBy: { scheduledAt: 'asc' },
          skip,
          take: limit,
        }),
        prisma.emailSchedule.count({
          where: {
            userId: req.user!.id,
            status: { in: ['SCHEDULED', 'RESCHEDULED', 'PROCESSING'] },
          },
        }),
      ]);

      return res.json({
        success: true,
        data: {
          emails,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Sent Emails (status: SENT, FAILED)
   */
  public async getSentEmails(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const skip = (page - 1) * limit;

      const [emails, total] = await Promise.all([
        prisma.emailSchedule.findMany({
          where: {
            userId: req.user!.id,
            status: { in: ['SENT', 'FAILED'] },
          },
          orderBy: { sentAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.emailSchedule.count({
          where: {
            userId: req.user!.id,
            status: { in: ['SENT', 'FAILED'] },
          },
        }),
      ]);

      return res.json({
        success: true,
        data: {
          emails,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Full-text search across recipient, subject, and body via Elasticsearch (with DB fallback)
   */
  public async searchEmails(req: AuthenticatedRequest, res: Response) {
    try {
      const query = (req.query.q as string) || '';
      const status = req.query.status as string | undefined;

      if (!query.trim()) {
        return res.json({
          success: true,
          data: { total: 0, emails: [], source: 'empty_query' },
        });
      }

      const result = await elasticsearchService.searchEmails(req.user!.id, query, status);

      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Cancels a scheduled email
   */
  public async cancelEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const email = await prisma.emailSchedule.findFirst({
        where: { id, userId: req.user!.id },
      });

      if (!email) {
        return res.status(404).json({ success: false, message: 'Email not found' });
      }

      if (email.status === 'SENT') {
        return res.status(400).json({ success: false, message: 'Cannot cancel already sent email' });
      }

      // Remove from BullMQ queue
      await queueService.cancelJob(id);

      // Update in MySQL
      const updated = await prisma.emailSchedule.update({
        where: { id },
        data: {
          status: 'FAILED',
          errorMessage: 'Cancelled by user prior to sending',
        },
      });

      return res.json({
        success: true,
        message: 'Scheduled email cancelled successfully',
        data: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Aggregate statistics for dashboard KPI cards
   */
  public async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const [scheduledCount, sentCount, failedCount, rescheduledCount, queueMetrics] =
        await Promise.all([
          prisma.emailSchedule.count({
            where: { userId, status: 'SCHEDULED' },
          }),
          prisma.emailSchedule.count({
            where: { userId, status: 'SENT' },
          }),
          prisma.emailSchedule.count({
            where: { userId, status: 'FAILED' },
          }),
          prisma.emailSchedule.count({
            where: { userId, status: 'RESCHEDULED' },
          }),
          queueService.getQueueMetrics(),
        ]);

      return res.json({
        success: true,
        data: {
          scheduled: scheduledCount,
          sent: sentCount,
          failed: failedCount,
          rescheduled: rescheduledCount,
          total: scheduledCount + sentCount + failedCount + rescheduledCount,
          queue: queueMetrics,
          esStatus: elasticsearchService.getStatus(),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const emailController = new EmailController();
