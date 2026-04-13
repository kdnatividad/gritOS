import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { sessionId, exerciseId, reps, weight, unit, notes } = await req.json()

    // Compute setNumber as count of sets for this exercise today + 1
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const count = await prisma.setLog.count({
      where: {
        exerciseId,
        createdAt: { gte: todayStart },
      },
    })
    const setNumber = count + 1

    const set = await prisma.setLog.create({
      data: {
        sessionId: sessionId || null,
        exerciseId,
        reps,
        weight,
        unit,
        setNumber,
        notes: notes || null,
      },
    })
    return NextResponse.json(set)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log set' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const exerciseId = searchParams.get('exerciseId')

    const sets = await prisma.setLog.findMany({
      where: exerciseId ? { exerciseId } : {},
      orderBy: { createdAt: 'desc' },
      include: { exercise: true },
    })
    return NextResponse.json(sets)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sets' }, { status: 500 })
  }
}
