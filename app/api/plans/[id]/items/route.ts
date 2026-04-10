import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planId } = await params
    const { exerciseId } = await req.json()
    const count = await prisma.workoutPlanItem.count({ where: { planId } })
    const item = await prisma.workoutPlanItem.create({
      data: { planId, exerciseId, order: count },
      include: { exercise: true },
    })
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add exercise to plan' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { itemId } = await req.json()
    await prisma.workoutPlanItem.delete({ where: { id: itemId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove exercise from plan' }, { status: 500 })
  }
}
