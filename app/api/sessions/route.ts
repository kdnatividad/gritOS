import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const sessions = await prisma.workoutSession.findMany({
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        sets: {
          include: { exercise: true },
        },
        plan: true,
      },
    })
    return NextResponse.json(sessions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { planId, notes } = await req.json()
    const session = await prisma.workoutSession.create({
      data: { planId: planId || null, notes: notes || null },
    })
    return NextResponse.json(session)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}