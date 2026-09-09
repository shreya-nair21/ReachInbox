export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RESCHEDULED';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  slackConnected?: boolean;
  slackDetails?: {
    id: string;
    teamName: string | null;
    channel: string | null;
    createdAt: string;
  } | null;
}

export interface EmailSchedule {
  id: string;
  userId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string | null;
  status: EmailStatus;
  errorMessage?: string | null;
  etherealPreviewUrl?: string | null;
  rateLimitRescheduleCount: number;
  batchId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueueCounts {
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
}

export interface DashboardStats {
  scheduled: number;
  sent: number;
  failed: number;
  rescheduled: number;
  total: number;
  queue: QueueCounts;
  esStatus: {
    available: boolean;
    node: string;
    index: string;
  };
}

export interface ComposeEmailPayload {
  senderEmail: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime?: string;
  delayBetweenSeconds: number;
  hourlyLimit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
