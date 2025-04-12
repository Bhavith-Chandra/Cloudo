import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Get historical predictions from the database
    const predictions = await prisma.aiPrediction.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: 30, // Last 30 days
    });

    // Format predictions for the frontend
    const formattedPredictions = predictions.map(prediction => ({
      timestamp: prediction.timestamp.toISOString(),
      predicted: prediction.predictedValue,
      actual: prediction.actualValue,
      accuracy: prediction.accuracy,
    }));

    return NextResponse.json(formattedPredictions);
  } catch (error) {
    console.error('Error fetching optimization predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimization predictions' },
      { status: 500 }
    );
  }
} 