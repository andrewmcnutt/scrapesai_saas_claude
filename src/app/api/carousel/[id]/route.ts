import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Carousel ID is required' }, { status: 400 })
  }

  // Get authenticated user
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Query carousels table by id (RLS enforces user ownership)
  const { data: carousel, error } = await supabase
    .from('carousels')
    .select('status, image_urls, post_body_text, error_message, created_at, completed_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Carousel status query error:', error)
    return NextResponse.json({ error: 'Failed to fetch carousel status' }, { status: 500 })
  }

  if (!carousel) {
    return NextResponse.json({ error: 'Carousel not found' }, { status: 404 })
  }

  return NextResponse.json(carousel)
}
