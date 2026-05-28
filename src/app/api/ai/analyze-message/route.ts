import { NextRequest, NextResponse } from 'next/server'
import { analyzeMessageInputSchema } from '@/lib/ai/schemas'
import { analyzeMessage } from '@/lib/ai/analyze-message'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const parseResult = analyzeMessageInputSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: parseResult.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 },
      )
    }

    // Run analysis
    const result = await analyzeMessage(parseResult.data)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Analysis API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
