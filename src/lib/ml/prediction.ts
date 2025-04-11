import { CostData } from '@prisma/client';

interface SimulationInput {
  newDeployments: number;
  expectedGrowth: number;
  plannedChanges: string;
}

interface CostPrediction {
  date: string;
  predictedCost: number;
  confidenceInterval: [number, number];
}

export async function predictFutureCosts(
  historicalData: CostData[],
  simulationInput: SimulationInput
): Promise<CostPrediction[]> {
  // Group data by date
  const dailyCosts = historicalData.reduce((acc, data) => {
    const date = new Date(data.timestamp).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += data.cost;
    return acc;
  }, {} as Record<string, number>);

  // Calculate daily growth rate
  const dates = Object.keys(dailyCosts).sort();
  const costs = dates.map((date) => dailyCosts[date]);
  const growthRate = calculateGrowthRate(costs);

  // Generate predictions for next 30 days
  const predictions: CostPrediction[] = [];
  const lastDate = new Date(dates[dates.length - 1]);
  const lastCost = costs[costs.length - 1];

  for (let i = 1; i <= 30; i++) {
    const predictionDate = new Date(lastDate);
    predictionDate.setDate(lastDate.getDate() + i);

    // Base prediction
    let predictedCost = lastCost * Math.pow(1 + growthRate, i);

    // Apply simulation inputs
    if (simulationInput.newDeployments > 0) {
      predictedCost *= 1 + (simulationInput.newDeployments * 0.1); // 10% cost increase per new deployment
    }

    if (simulationInput.expectedGrowth > 0) {
      predictedCost *= 1 + simulationInput.expectedGrowth / 100;
    }

    // Calculate confidence interval
    const variance = calculateVariance(costs);
    const standardDeviation = Math.sqrt(variance);
    const confidenceInterval: [number, number] = [
      predictedCost - 1.96 * standardDeviation,
      predictedCost + 1.96 * standardDeviation,
    ];

    predictions.push({
      date: predictionDate.toISOString().split('T')[0],
      predictedCost,
      confidenceInterval,
    });
  }

  return predictions;
}

function calculateGrowthRate(costs: number[]): number {
  if (costs.length < 2) return 0;

  const firstCost = costs[0];
  const lastCost = costs[costs.length - 1];
  const periods = costs.length - 1;

  return Math.pow(lastCost / firstCost, 1 / periods) - 1;
}

function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDifferences = numbers.map((n) => Math.pow(n - mean, 2));
  return squaredDifferences.reduce((a, b) => a + b, 0) / numbers.length;
} 