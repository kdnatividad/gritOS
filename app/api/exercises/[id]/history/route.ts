import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const sets = await prisma.setLog.findMany({
    where: { exerciseId: id },
    orderBy: { createdAt: 'asc' },
  })

  if (sets.length === 0) {
    return NextResponse.json({ sessions: [], stats: null })
  }

  // Group sets by calendar day (using createdAt, no session dependency)
  const byDate = new Map<string, { date: string; unit: string; sets: typeof sets }>()
  for (const set of sets) {
    const dateKey = set.createdAt.toDateString()
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, {
        date: set.createdAt.toISOString(),
        unit: set.unit,
        sets: [],
      })
    }
    byDate.get(dateKey)!.sets.push(set)
  }

  const sessions = Array.from(byDate.values()).map(({ date, unit, sets: s }) => {
    const maxWeight = Math.max(...s.map((x) => x.weight))
    const totalVolume = s.reduce((acc, x) => acc + x.weight * x.reps, 0)
    const est1RM = Math.max(...s.map((x) => x.weight * (1 + x.reps / 30)))
    return {
      date,
      maxWeight,
      totalVolume: Math.round(totalVolume),
      est1RM: Math.round(est1RM),
      unit,
    }
  })

  const unit = sets[0].unit
  const lastSession = sessions[sessions.length - 1]
  const allTimePR = Math.max(...sessions.map((s) => s.maxWeight))
  const totalVolume = sessions.reduce((acc, s) => acc + s.totalVolume, 0)
  const allTimeEst1RM = Math.max(...sessions.map((s) => s.est1RM))
  const bestSessionVol = Math.max(...sessions.map((s) => s.totalVolume))

  return NextResponse.json({
    sessions,
    stats: {
      lastWeight: lastSession.maxWeight,
      lastDate: lastSession.date,
      allTimePR,
      sessionCount: sessions.length,
      totalVolume,
      est1RM: allTimeEst1RM,
      bestSessionVol,
      unit,
    },
  })
}
