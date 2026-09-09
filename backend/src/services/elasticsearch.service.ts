import { Client } from '@elastic/elasticsearch';
import { ENV } from '../config/env';
import { prisma } from '../config/prisma';

export interface EmailDocument {
  id: string;
  userId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt?: string | null;
  etherealPreviewUrl?: string | null;
  createdAt: string;
}

export class ElasticsearchService {
  private client: Client;
  private isAvailable: boolean = false;
  private hasChecked: boolean = false;

  constructor() {
    this.client = new Client({
      node: ENV.ELASTICSEARCH_NODE,
      maxRetries: 2,
      requestTimeout: 3000,
    });
  }

  /**
   * Initializes the Elasticsearch index with mappings if ES is accessible.
   */
  public async initialize(): Promise<void> {
    try {
      const ping = await this.client.ping();
      this.isAvailable = ping;
      this.hasChecked = true;

      if (this.isAvailable) {
        console.log(`🔍 Elasticsearch connected successfully at ${ENV.ELASTICSEARCH_NODE}`);
        await this.ensureIndexExists();
      }
    } catch (err: any) {
      this.isAvailable = false;
      this.hasChecked = true;
      console.log(
        `ℹ️ Elasticsearch node not reachable at ${ENV.ELASTICSEARCH_NODE}. Search will gracefully fall back to MySQL database query.`
      );
    }
  }

  private async ensureIndexExists(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({
        index: ENV.ELASTICSEARCH_INDEX,
      });

      if (!exists) {
        await this.client.indices.create({
          index: ENV.ELASTICSEARCH_INDEX,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                userId: { type: 'keyword' },
                senderEmail: { type: 'keyword' },
                recipientEmail: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                subject: { type: 'text' },
                body: { type: 'text' },
                status: { type: 'keyword' },
                scheduledAt: { type: 'date' },
                sentAt: { type: 'date' },
                etherealPreviewUrl: { type: 'keyword' },
                createdAt: { type: 'date' },
              },
            },
          },
        });
        console.log(`✅ Elasticsearch index '${ENV.ELASTICSEARCH_INDEX}' created successfully.`);
      }
    } catch (err: any) {
      console.warn('⚠️ Could not verify/create Elasticsearch index:', err.message);
    }
  }

  /**
   * Indexes or updates an email document
   */
  public async indexEmail(doc: EmailDocument): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await this.client.index({
        index: ENV.ELASTICSEARCH_INDEX,
        id: doc.id,
        document: doc,
      });
    } catch (err: any) {
      console.warn(`⚠️ Failed to index email [${doc.id}] to Elasticsearch:`, err.message);
    }
  }

  /**
   * Searches emails by keyword matching recipientEmail, subject, or body.
   * If Elasticsearch is offline, seamlessly queries MySQL.
   */
  public async searchEmails(userId: string, query: string, status?: string) {
    if (this.isAvailable) {
      try {
        const mustClauses: any[] = [
          { term: { userId } },
          {
            multi_match: {
              query,
              fields: ['recipientEmail^3', 'subject^2', 'body', 'senderEmail'],
              fuzziness: 'AUTO',
            },
          },
        ];

        if (status) {
          mustClauses.push({ term: { status } });
        }

        const response = await this.client.search({
          index: ENV.ELASTICSEARCH_INDEX,
          body: {
            query: {
              bool: {
                must: mustClauses,
              },
            },
            sort: [{ scheduledAt: { order: 'desc' } }],
            size: 50,
          },
        });

        const hits = response.hits.hits.map((hit: any) => hit._source);
        return {
          source: 'elasticsearch',
          total: typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || hits.length,
          emails: hits,
        };
      } catch (err: any) {
        console.warn('⚠️ Elasticsearch search query failed, falling back to database:', err.message);
      }
    }

    // Resilient Fallback to MySQL
    const whereClause: any = {
      userId,
      OR: [
        { recipientEmail: { contains: query } },
        { subject: { contains: query } },
        { body: { contains: query } },
        { senderEmail: { contains: query } },
      ],
    };

    if (status) {
      whereClause.status = status;
    }

    const emails = await prisma.emailSchedule.findMany({
      where: whereClause,
      orderBy: { scheduledAt: 'desc' },
      take: 50,
    });

    return {
      source: 'database_fallback',
      total: emails.length,
      emails,
    };
  }

  public getStatus() {
    return {
      available: this.isAvailable,
      node: ENV.ELASTICSEARCH_NODE,
      index: ENV.ELASTICSEARCH_INDEX,
    };
  }
}

export const elasticsearchService = new ElasticsearchService();
