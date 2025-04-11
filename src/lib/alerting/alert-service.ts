import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';
import { CustomError } from '../error';
import { sendEmail } from './email';
import { sendSlackMessage } from './slack';
import { createInAppNotification } from './in-app';

interface AlertConfig {
  userId: string;
  channels: {
    email?: boolean;
    slack?: boolean;
    inApp?: boolean;
  };
  thresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  preferences: {
    notifyOnCritical: boolean;
    notifyOnHigh: boolean;
    notifyOnMedium: boolean;
    notifyOnLow: boolean;
  };
}

interface Alert {
  id: string;
  userId: string;
  type: 'anomaly' | 'threshold' | 'forecast';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
}

const prisma = new PrismaClient();

export async function sendAlert(alert: Alert, config: AlertConfig): Promise<void> {
  try {
    // Check if alert should be sent based on severity and preferences
    if (!shouldSendAlert(alert, config)) {
      return;
    }

    const promises: Promise<void>[] = [];

    // Send email alert
    if (config.channels.email) {
      promises.push(
        sendEmail({
          to: alert.userId, // This should be the user's email
          subject: alert.title,
          text: alert.message,
          html: formatAlertHtml(alert),
        }).catch(error => {
          logger.error('Failed to send email alert', { error, alert });
        })
      );
    }

    // Send Slack alert
    if (config.channels.slack) {
      promises.push(
        sendSlackMessage({
          channel: alert.userId, // This should be the Slack channel ID
          text: alert.message,
          blocks: formatSlackBlocks(alert),
        }).catch(error => {
          logger.error('Failed to send Slack alert', { error, alert });
        })
      );
    }

    // Create in-app notification
    if (config.channels.inApp) {
      promises.push(
        createInAppNotification({
          userId: alert.userId,
          title: alert.title,
          message: alert.message,
          type: alert.type,
          severity: alert.severity,
          metadata: alert.metadata,
        }).catch(error => {
          logger.error('Failed to create in-app notification', { error, alert });
        })
      );
    }

    // Wait for all notifications to be sent
    await Promise.all(promises);

    // Update alert status
    await prisma.alert.update({
      where: { id: alert.id },
      data: { status: 'sent' },
    });
  } catch (error) {
    logger.error('Error sending alert', { error, alert });
    
    // Update alert status to failed
    await prisma.alert.update({
      where: { id: alert.id },
      data: { status: 'failed' },
    });
    
    throw error;
  }
}

function shouldSendAlert(alert: Alert, config: AlertConfig): boolean {
  switch (alert.severity) {
    case 'critical':
      return config.preferences.notifyOnCritical;
    case 'high':
      return config.preferences.notifyOnHigh;
    case 'medium':
      return config.preferences.notifyOnMedium;
    case 'low':
      return config.preferences.notifyOnLow;
    default:
      return false;
  }
}

function formatAlertHtml(alert: Alert): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${getSeverityColor(alert.severity)};">${alert.title}</h2>
      <p>${alert.message}</p>
      ${formatMetadataHtml(alert.metadata)}
      <p style="color: #666; font-size: 12px;">
        Sent on ${alert.createdAt.toLocaleString()}
      </p>
    </div>
  `;
}

function formatSlackBlocks(alert: Alert): any[] {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: alert.title,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: alert.message,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Severity: ${alert.severity.toUpperCase()}`,
        },
        {
          type: 'mrkdwn',
          text: `Sent on ${alert.createdAt.toLocaleString()}`,
        },
      ],
    },
  ];
}

function formatMetadataHtml(metadata: Record<string, any>): string {
  return Object.entries(metadata)
    .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
    .join('');
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#dc2626';
    case 'high':
      return '#ea580c';
    case 'medium':
      return '#d97706';
    case 'low':
      return '#65a30d';
    default:
      return '#6b7280';
  }
} 