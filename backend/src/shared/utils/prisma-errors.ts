import { Prisma } from '../../../generated/client';

function getErrorCode(error: unknown): string | undefined {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
   return error.code;
  }
  if (error && typeof error === 'object' && 'code' in error) {
   return String((error as { code: unknown }).code);
  }
  return undefined;
}

export function isPrismaUniqueViolation(error: unknown): boolean {
  return getErrorCode(error) === 'P2002';
}

export function isPrismaNotFound(error: unknown): boolean {
  return getErrorCode(error) === 'P2025';
}

export function isPrismaForeignKeyViolation(error: unknown): boolean {
  return getErrorCode(error) === 'P2003';
}
