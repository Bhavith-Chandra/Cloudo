import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OpenAI } from 'openai';
import { AWSClient } from '@/lib/cloud/aws';
import { AzureClient } from '@/lib/cloud/azure';
import { GCPClient } from '@/lib/cloud/gcp';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatRequest {
  message: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json() as ChatRequest;

    // Get user's cloud providers
    const providers = await prisma.cloudProvider.findMany({
      where: {
        userId: session.user.id,
      },
    });

    // Initialize cloud clients
    const awsClient = providers.find(p => p.name === 'AWS') 
      ? new AWSClient({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          region: process.env.AWS_REGION!,
        })
      : null;

    const azureClient = providers.find(p => p.name === 'Azure')
      ? new AzureClient({
          clientId: process.env.AZURE_CLIENT_ID!,
          clientSecret: process.env.AZURE_CLIENT_SECRET!,
          tenantId: process.env.AZURE_TENANT_ID!,
          subscriptionId: process.env.AZURE_SUBSCRIPTION_ID!,
        })
      : null;

    const gcpClient = providers.find(p => p.name === 'GCP')
      ? new GCPClient({
          projectId: process.env.GCP_PROJECT_ID!,
          credentials: JSON.parse(process.env.GCP_CREDENTIALS!),
        })
      : null;

    // Get chat history for context
    const chatHistory = await prisma.chatMessage.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
    });

    // Prepare context for the AI
    const context = {
      user: session.user,
      providers: providers.map(p => p.name),
      recentMessages: chatHistory.map(m => ({
        role: m.role,
        content: m.content,
      })),
    };

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a cloud optimization assistant. You have access to the following cloud providers: ${context.providers.join(', ')}. 
          Your role is to help users optimize their cloud resources, provide cost insights, and execute optimization actions.
          Always be professional and provide clear, actionable responses.`,
        },
        ...context.recentMessages,
        { role: "user", content: message },
      ],
      functions: [
        {
          name: "getCostData",
          description: "Get cost data from cloud providers",
          parameters: {
            type: "object",
            properties: {
              provider: {
                type: "string",
                enum: ["AWS", "Azure", "GCP"],
              },
              timeRange: {
                type: "string",
                enum: ["last_7_days", "last_30_days", "last_90_days"],
              },
              granularity: {
                type: "string",
                enum: ["daily", "weekly", "monthly"],
              },
            },
            required: ["provider", "timeRange"],
          },
        },
        {
          name: "getResourceUtilization",
          description: "Get resource utilization data",
          parameters: {
            type: "object",
            properties: {
              provider: {
                type: "string",
                enum: ["AWS", "Azure", "GCP"],
              },
              resourceType: {
                type: "string",
                enum: ["EC2", "S3", "Lambda", "VM", "Storage", "Functions"],
              },
            },
            required: ["provider", "resourceType"],
          },
        },
        {
          name: "optimizeResource",
          description: "Optimize a cloud resource",
          parameters: {
            type: "object",
            properties: {
              provider: {
                type: "string",
                enum: ["AWS", "Azure", "GCP"],
              },
              resourceId: {
                type: "string",
              },
              action: {
                type: "string",
                enum: ["stop", "resize", "delete", "schedule"],
              },
              parameters: {
                type: "object",
              },
            },
            required: ["provider", "resourceId", "action"],
          },
        },
      ],
      function_call: "auto",
    });

    const response = completion.choices[0].message;

    // Save the interaction to the database
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        role: 'user',
        content: message,
        timestamp: new Date(),
      },
    });

    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        role: 'assistant',
        content: response.content || '',
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      text: response.content,
      data: response.function_call ? {
        type: response.function_call.name,
        payload: JSON.parse(response.function_call.arguments),
      } : undefined,
    });
  } catch (error) {
    console.error('Error in agent chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
} 