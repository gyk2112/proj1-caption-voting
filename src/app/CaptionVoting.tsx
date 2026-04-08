'use client'

import { useState } from 'react'

type Caption = {
  id: string
  content: string
  like_count: number | null
  images: { url: string }[] | { url: string } | null
}

function getImageUrl(images: Caption['images']): string | null {
  if (!images) return null
  if (Array.isArray(images)) return images[0]?.url ?? null
  return images.url ?? null
}

export default function CaptionVoting({ initialCaptions }: { initialCaptions: Caption[] }) {
  const [captions, setCaptions] = useState(initialCaptions)
  const [voted, setVoted] = useState<Record<string, 1 | -1>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVote = async (captionId: string, vote: 1 | -1) => {
    if (loading) return
    setLoading(captionId)
    setError(null)

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption_id: captionId, vote }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Vote failed')
      }

      // Optimistically update the displayed like_count
      setCaptions(prev =>
        prev.map(c => {
          if (c.id !== captionId) return c
          const prev_vote = voted[captionId] ?? 0
          const delta = vote - prev_vote
          return { ...c, like_count: (c.like_count ?? 0) + delta }
        })
      )
      setVoted(prev => ({ ...prev, [captionId]: vote }))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  if (captions.length === 0) {
    return (
      <div className="text-[#444] text-sm">No captions found.</div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="border border-red-900 bg-red-950/30 p-3 text-red-400 text-xs">{error}</div>
      )}

      {captions.map(caption => {
        const userVote = voted[caption.id]
        const isLoading = loading === caption.id

        return (
          <div key={caption.id} className="border border-[#1e1e1e] bg-[#111] p-5 flex gap-5">
            {/* Image */}
            {getImageUrl(caption.images) ? (
              <img
                src={getImageUrl(caption.images)!}
                alt=""
                className="w-32 h-32 object-cover flex-shrink-0 opacity-90"
              />
            ) : (
              <div className="w-32 h-32 bg-[#1a1a1a] flex-shrink-0 flex items-center justify-center">
                <span className="text-[#333] text-[10px] tracking-widest uppercase">No image</span>
              </div>
            )}

            {/* Caption content + voting */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <p className="text-sm text-white leading-relaxed">{caption.content}</p>

              <div className="flex items-center gap-4 mt-4">
                {/* Upvote */}
                <button
                  onClick={() => handleVote(caption.id, 1)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs tracking-widest uppercase transition-all duration-150 ${
                    userVote === 1
                      ? 'border-green-500 bg-green-500/10 text-green-400'
                      : 'border-[#333] text-[#666] hover:border-green-500 hover:text-green-400'
                  } disabled:opacity-40`}
                >
                  <span>▲</span>
                  <span>Up</span>
                </button>

                {/* Score */}
                <span className={`text-sm tabular-nums font-bold w-8 text-center ${
                  (caption.like_count ?? 0) > 0
                    ? 'text-green-400'
                    : (caption.like_count ?? 0) < 0
                    ? 'text-red-400'
                    : 'text-[#444]'
                }`}>
                  {caption.like_count ?? 0}
                </span>

                {/* Downvote */}
                <button
                  onClick={() => handleVote(caption.id, -1)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs tracking-widest uppercase transition-all duration-150 ${
                    userVote === -1
                      ? 'border-red-500 bg-red-500/10 text-red-400'
                      : 'border-[#333] text-[#666] hover:border-red-500 hover:text-red-400'
                  } disabled:opacity-40`}
                >
                  <span>▼</span>
                  <span>Down</span>
                </button>

                {isLoading && (
                  <span className="text-[10px] text-[#444] tracking-widest uppercase">Saving…</span>
                )}
                {userVote && !isLoading && (
                  <span className="text-[10px] text-[#444] tracking-widest uppercase">Voted</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
