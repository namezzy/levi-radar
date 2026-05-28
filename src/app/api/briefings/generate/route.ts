import { NextRequest, NextResponse } from 'next/server'
import { briefingInputSchema } from '@/lib/briefing/schemas'
import { generateBriefing } from '@/lib/briefing/generate-briefing'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parseResult = briefingInputSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: parseResult.error.issues.map(i => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 },
      )
    }

    const result = await generateBriefing(parseResult.data)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Briefing generation error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
