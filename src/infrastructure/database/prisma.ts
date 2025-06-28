import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Singleton PrismaClient instance
 * Prevents multiple instances in development with hot reloading
 */
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Prisma middleware for soft deletes
 */
prisma.$use(async (params, next) => {
  // Soft delete handling
  if (params.model && params.action === 'delete') {
    params.action = 'update';
    params.args['data'] = { deletedAt: new Date() };
  }

  if (params.model && params.action === 'deleteMany') {
    params.action = 'updateMany';
    if (params.args.data !== undefined) {
      params.args.data['deletedAt'] = new Date();
    } else {
      params.args['data'] = { deletedAt: new Date() };
    }
  }

  // Exclude soft deleted records from queries
  if (params.model && (params.action === 'findUnique' || params.action === 'findFirst')) {
    params.args.where = { ...params.args.where, deletedAt: null };
  }

  if (params.model && (params.action === 'findMany')) {
    if (params.args.where) {
      if (params.args.where.deletedAt === undefined) {
        params.args.where = { ...params.args.where, deletedAt: null };
      }
    } else {
      params.args['where'] = { deletedAt: null };
    }
  }

  return next(params);
});

export default prisma;