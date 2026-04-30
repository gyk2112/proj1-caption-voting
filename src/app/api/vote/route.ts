import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Require authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { caption_id?: string; vote?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { caption_id, vote } = body

  if (!caption_id || (vote !== 1 && vote !== -1)) {
    return NextResponse.json(
      { error: 'caption_id and vote (1 or -1) are required' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('caption_votes')
    .upsert(
      { caption_id, profile_id: user.id, vote_value: vote },
      { onConflict: 'profile_id,caption_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
