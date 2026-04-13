import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch recent sets with exercise + plan info
    const recentSets = await prisma.setLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        exercise: {
          include: {
            planItems: {
              include: { plan: true },
              take: 1,
            },
          },
        },
      },
    })

    // Deduplicate by exerciseId — keep the most recent (first in desc order)
    const seen = new Set<string>()
    const result: {
      exerciseId: string
      exerciseName: string
      category: string
      planName: string | null
      setCount: number
      lastDate: string
    }[] = []

    for (const set of recentSets) {
      if (seen.has(set.exerciseId)) continue
      seen.add(set.exerciseId)

      // Count sets for this exercise on the same calendar day
      const dayStart = new Date(set.createdAt)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const setCount = await prisma.setLog.count({
        where: {
          exerciseId: set.exerciseId,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      })

      result.push({
        exerciseId: set.exerciseId,
        exerciseName: set.exercise.name,
        category: set.exercise.category,
        planName: set.exercise.planItems[0]?.plan?.name ?? null,
        setCount,
        lastDate: set.createdAt.toISOString(),
      })

      if (result.length >= 10) break
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recent exercises' }, { status: 500 })
  }
}
