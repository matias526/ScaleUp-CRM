import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const opportunityId = formData.get('opportunityId') as string
    const quoteId = formData.get('quoteId') as string
    const fileType = formData.get('fileType') as string // 'technical' or 'economical'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!opportunityId || !quoteId || !fileType) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // Create path: quotes/{opportunityId}/{quoteId}-{fileType}-{timestamp}.pdf
    const timestamp = Date.now()
    const pathname = `quotes/${opportunityId}/${quoteId}-${fileType}-${timestamp}.pdf`

    // Upload with private access
    const blob = await put(pathname, file, {
      access: 'private',
    })

    return NextResponse.json({ 
      pathname: blob.pathname,
      url: `/api/quotes/download?pathname=${encodeURIComponent(blob.pathname)}`,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
