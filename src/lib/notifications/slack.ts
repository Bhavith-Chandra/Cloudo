import { WebClient } from '@slack/web-api'

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || '#cloud-monitoring'

const slackClient = new WebClient(SLACK_BOT_TOKEN)

export async function sendSlackNotification(message: string) {
  try {
    await slackClient.chat.postMessage({
      channel: SLACK_CHANNEL,
      text: message,
    })
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
  }
} 