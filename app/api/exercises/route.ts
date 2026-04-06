import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const DEFAULT_EXERCISES = [
  { name: 'Bench Press', category: 'push' },
  { name: 'Squat', category: 'legs' },
  { name: 'Deadlift', category: 'pull' },
  { name: 'Overhead Press', category: 'push' },
  { name: 'Pull-ups', category: 'pull' },
  { name: 'Barbell Row', category: 'pull' },
  { name: 'Incline Bench', category: 'push' },
  { name: 'Bicep Curl', category: 'push' },
  { name: 'Tricep Pushdown', category: 'push' },
  { name: 'Leg Press', category: 'legs' },
]

export async function GET() {
  try {
    let exercises = await prisma.exercise.findMany({
      orderBy: { name: 'asc' },
    })

    if (exercises.length === 0) {
      await prisma.exercise.createMany({
        data: DEFAULT_EXERCISES.map((e) => ({ ...e, isDefault: true })),
      })
      exercises = await prisma.exercise.findMany({
        orderBy: { name: 'asc' },
      })
    }

    return NextResponse.json(exercises)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, category } = await req.json()
    const exercise = await prisma.exercise.create({
      data: { name, category, isDefault: false },
    })
    return NextResponse.json(exercise)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 })
  }
}