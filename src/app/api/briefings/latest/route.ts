import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { briefingOutputFallback, type BriefingOutput } from '@/lib/briefing/schemas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    let briefing

    if (workspaceId) {
      briefing = await prisma.briefing.findFirst({
        where: { workspaceId, type: 'daily' },
        orderBy: { date: 'desc' },
      })
    } else {
      briefing = await prisma.briefing.findFirst({
        where: { type: 'daily' },
        orderBy: { date: 'desc' },
      })
    }

    if (!briefing) {
      return NextResponse.json({
        success: true,
        data: briefingOutputFallback,
        source: 'fallback',
      })
    }

    const data = briefing.highlights as unknown as BriefingOutput | null

    return NextResponse.json({
      success: true,
      data: data || {
        ...briefingOutputFallback,
        title: briefing.title,
        overview: briefing.content,
        date: briefing.date.toISOString().slice(0, 10),
      },
      briefingId: briefing.id,
      source: 'database',
    })
  } catch (error) {
    console.error('Failed to fetch latest briefing:', error)
    return NextResponse.json({
      success: true,
      data: briefingOutputFallback,
      source: 'fallback',
    })
  }
}
