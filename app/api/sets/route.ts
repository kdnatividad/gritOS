import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { sessionId, exerciseId, reps, weight, unit, setNumber, notes } =
      await req.json()

    const set = await prisma.setLog.create({
      data: {
        sessionId,
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