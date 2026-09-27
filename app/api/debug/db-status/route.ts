import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Temporary read-only diagnostic endpoint to check whether the Postgres schema
// matches what Prisma expects after a deploy. Safe to hit repeatedly.
export async function GET() {
  const checks: Record<string, unknown> = {};

  try {
    checks.userCount = await prisma.user.count();
  } catch (err) {
    checks.userError = (err as Error).message;
  }

  try {
    checks.coupleCount = await prisma.couple.count();
  } catch (err) {
    checks.coupleError = (err as Error).message;
  }

  try {
    checks.habitCount = await prisma.habit.count();
  } catch (err) {
    checks.habitError = (err as Error).message;
  }

  return NextResponse.json(checks);
}
