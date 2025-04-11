import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';
import { CustomError } from '../error';

interface InAppNotificationOptions {
  userId: string;
  title: string;
  message: string;
  type: 'anomaly' | 'threshold' | 'forecast';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
}

const prisma = new PrismaClient();

export async function createInAppNotification(options: InAppNotificationOptions): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: options.userId,
        title: options.title,
        message: options.message,
        type: options.type,
        severity: options.severity,
        metadata: options.metadata,
        status: 'unread',
      },
    });
    
    logger.info('In-app notification created successfully', { userId: options.userId });
  } catch (error) {
    logger.error('Failed to create in-app notification', { error, options });
    throw new CustomError('Failed to create in-app notification', 'NOTIFICATION_ERROR');
  }
} 