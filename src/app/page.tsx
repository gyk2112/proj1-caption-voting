import { createClient } from '@/lib/supabase/server'
import CaptionVoting from './CaptionVoting'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: captions, error }, { data: { user } }] = await Promise.all([
    supabase
      .from('captions')
      .select('id, content, like_count, images(url)')
      .order('created_datetime_utc', { ascending: false })
      .limit(50),
    supabase.auth.getUser(),
  ])

  let initialVoted: Record<string, 1 | -1> = {}
  if (user && captions && captions.length > 0) {
    const { data: votes } = await supabase
      .from('caption_votes')
      .select('caption_id, vote_value')
      .eq('profile_id', user.id)
      .in('caption_id', captions.map(c => c.id))

    if (votes) {
      for (const v of votes) {
        initialVoted[v.caption_id] = v.vote_value as 1 | -1
      }
    }
  }

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

      <CaptionVoting initialCaptions={captions ?? []} initialVoted={initialVoted} />
    </div>
  )
}
