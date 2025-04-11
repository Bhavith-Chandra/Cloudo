export function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }

  const mean = numbers.reduce((a: number, b: number) => a + b, 0) / numbers.length;
  const squaredDifferences = numbers.map((n: number) => Math.pow(n - mean, 2));
  const variance = squaredDifferences.reduce((a: number, b: number) => a + b, 0) / numbers.length;

  return variance;
}

export function calculateStandardDeviation(numbers: number[]): number {
  return Math.sqrt(calculateVariance(numbers));
}

export function calculatePercentile(numbers: number[], percentile: number): number {
  if (numbers.length === 0) {
    return 0;
  }

  const sorted = [...numbers].sort((a: number, b: number) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper >= sorted.length) {
    return sorted[sorted.length - 1];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function calculateMovingAverage(numbers: number[], windowSize: number): number[] {
  if (numbers.length === 0 || windowSize <= 0) {
    return [];
  }

  const result: number[] = [];
  for (let i = 0; i < numbers.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = numbers.slice(start, i + 1);
    const average = window.reduce((a: number, b: number) => a + b, 0) / window.length;
    result.push(average);
  }

  return result;
}

export function calculateTrend(numbers: number[]): number {
  if (numbers.length < 2) {
    return 0;
  }

  const xMean = (numbers.length - 1) / 2;
  const yMean = numbers.reduce((a: number, b: number) => a + b, 0) / numbers.length;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < numbers.length; i++) {
    const xDiff = i - xMean;
    const yDiff = numbers[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  return denominator === 0 ? 0 : numerator / denominator;
} 