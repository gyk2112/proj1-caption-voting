import { createClient } from '@/lib/supabase/server'
import CaptionVoting from './CaptionVoting'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  const { data: captions, error } = await supabase
    .from('captions')
    .select('id, content, like_count, images(url)')
    .order('created_datetime_utc', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[10px] text-[#444] tracking-[0.3em] uppercase mb-1">Crackd</div>
        <h1 className="text-2xl text-white tracking-tight">Caption Voting</h1>
        <p className="text-xs text-[#555] mt-1 tracking-wide">
          Upvote or downvote captions. You must be signed in to vote.
        </p>
      </div>

      {error && (
        <div className="border border-red-900 bg-red-950/30 p-3 text-red-400 text-xs">
          Failed to load captions: {error.message}
        </div>
      )}

      <CaptionVoting initialCaptions={captions ?? []} />
    </div>
  )
}
