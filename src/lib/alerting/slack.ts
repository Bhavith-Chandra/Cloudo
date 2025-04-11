import { WebClient } from '@slack/web-api';
import { logger } from '../logger';
import { CustomError } from '../error';

interface SlackMessageOptions {
  channel: string;
  text: string;
  blocks?: any[];
}

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function sendSlackMessage(options: SlackMessageOptions): Promise<void> {
  try {
    await client.chat.postMessage({
      channel: options.channel,
      text: options.text,
      blocks: options.blocks,
    });
    
    logger.info('Slack message sent successfully', { channel: options.channel });
  } catch (error) {
    logger.error('Failed to send Slack message', { error, options });
    throw new CustomError('Failed to send Slack message', 'SLACK_ERROR');
  }
} 