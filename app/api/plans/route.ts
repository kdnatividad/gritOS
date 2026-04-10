import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const plans = await prisma.workoutPlan.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    })
    return NextResponse.json(plans)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json()
    const plan = await prisma.workoutPlan.create({
      data: { name, type: 'custom' },
      include: { items: { include: { exercise: true } } },
    })
    return NextResponse.json(plan)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
