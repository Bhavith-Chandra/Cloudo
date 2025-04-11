import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function connect() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function disconnect() {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Database disconnection error:', error);
    throw error;
  }
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'user';
}) {
  return prisma.user.create({
    data: {
      ...data,
      role: data.role || 'user',
    },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    password?: string;
    role?: 'admin' | 'user';
  }
) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  });
}

export async function createCloudAccount(data: {
  provider: string;
  credentials: string;
  userId: string;
}) {
  return prisma.cloudAccount.create({
    data,
  });
}

export async function findCloudAccountsByUserId(userId: string) {
  return prisma.cloudAccount.findMany({
    where: { userId },
  });
}

export async function deleteCloudAccount(id: string) {
  return prisma.cloudAccount.delete({
    where: { id },
  });
}

export async function createCostRecord(data: {
  provider: string;
  service: string;
  region: string;
  cost: number;
  timestamp: Date;
  tags?: any;
  userId: string;
}) {
  return prisma.costRecord.create({
    data,
  });
}

export async function findCostRecordsByUserId(
  userId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    provider?: string;
    service?: string;
    region?: string;
  } = {}
) {
  const where: any = { userId };

  if (options.startDate) {
    where.timestamp = { ...where.timestamp, gte: options.startDate };
  }

  if (options.endDate) {
    where.timestamp = { ...where.timestamp, lte: options.endDate };
  }

  if (options.provider) {
    where.provider = options.provider;
  }

  if (options.service) {
    where.service = options.service;
  }

  if (options.region) {
    where.region = options.region;
  }

  return prisma.costRecord.findMany({
    where,
    orderBy: { timestamp: 'desc' },
  });
}

export async function deleteCostRecord(id: string) {
  return prisma.costRecord.delete({
    where: { id },
  });
} 