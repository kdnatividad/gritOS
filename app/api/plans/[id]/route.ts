import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Null out sessions referencing this plan before deleting
    await prisma.workoutSession.updateMany({ where: { planId: id }, data: { planId: null } })
    await prisma.workoutPlanItem.deleteMany({ where: { planId: id } })
    await prisma.workoutPlan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
