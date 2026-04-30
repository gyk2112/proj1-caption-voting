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
  const [index, setIndex] = useState(0)

  const handleVote = async (captionId: string, vote: 1 | -1, advance: boolean) => {
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

      setCaptions(prev =>
        prev.map(c => {
          if (c.id !== captionId) return c
          const prevVote = voted[captionId] ?? 0
          const delta = vote - prevVote
          return { ...c, like_count: (c.like_count ?? 0) + delta }
        })
      )
      setVoted(prev => ({ ...prev, [captionId]: vote }))

      if (advance) {
        setIndex(i => Math.min(i + 1, captions.length))
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  if (captions.length === 0) {
    return <div className="text-[#444] text-sm">No captions found.</div>
  }

  if (index >= captions.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <p className="text-[#888] text-sm tracking-widest uppercase">All done</p>
        <button
          onClick={() => setIndex(captions.length - 1)}
          className="border border-[#333] text-[#666] px-5 py-2 text-xs tracking-widest uppercase hover:border-[#555] hover:text-[#aaa] transition-all"
        >
          ← Go Back
        </button>
      </div>
    )
  }

  const caption = captions[index]
  const imageUrl = getImageUrl(caption.images)
  const userVote = voted[caption.id]
  const isLoading = loading === caption.id

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {error && (
        <div className="border border-red-900 bg-red-950/30 p-3 text-red-400 text-xs">{error}</div>
      )}

      {/* Progress */}
      <div className="flex justify-between items-center text-[10px] text-[#444] tracking-widest uppercase">
        <span>{index + 1} / {captions.length}</span>
        {userVote && !isLoading && (
          <span className={userVote === 1 ? 'text-green-500' : 'text-red-500'}>
            {userVote === 1 ? '▲ Upvoted' : '▼ Downvoted'}
          </span>
        )}
        {isLoading && <span>Saving…</span>}
      </div>

      {/* Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="w-full aspect-[4/3] object-cover opacity-95"
        />
      ) : (
        <div className="w-full aspect-[4/3] bg-[#1a1a1a] flex items-center justify-center">
          <span className="text-[#333] text-[10px] tracking-widest uppercase">No image</span>
        </div>
      )}

      {/* Caption */}
      <p className="text-white text-base leading-relaxed">{caption.content}</p>

      {/* Score */}
      <div className="text-center">
        <span className={`text-2xl font-bold tabular-nums ${
          (caption.like_count ?? 0) > 0
            ? 'text-green-400'
            : (caption.like_count ?? 0) < 0
            ? 'text-red-400'
            : 'text-[#444]'
        }`}>
          {caption.like_count ?? 0}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setIndex(i => Math.max(i - 1, 0))}
          disabled={index === 0 || isLoading}
          className="flex-1 py-3 border border-[#333] text-[#666] text-xs tracking-widest uppercase hover:border-[#555] hover:text-[#aaa] transition-all disabled:opacity-20"
        >
          ← Back
        </button>

        <button
          onClick={() => handleVote(caption.id, 1, true)}
          disabled={isLoading}
          className={`flex-1 py-3 border text-xs tracking-widest uppercase transition-all duration-150 ${
            userVote === 1
              ? 'border-green-500 bg-green-500/10 text-green-400'
              : 'border-[#333] text-[#666] hover:border-green-500 hover:text-green-400'
          } disabled:opacity-40`}
        >
          ▲ Upvote
        </button>

        <button
          onClick={() => handleVote(caption.id, -1, true)}
          disabled={isLoading}
          className={`flex-1 py-3 border text-xs tracking-widest uppercase transition-all duration-150 ${
            userVote === -1
              ? 'border-red-500 bg-red-500/10 text-red-400'
              : 'border-[#333] text-[#666] hover:border-red-500 hover:text-red-400'
          } disabled:opacity-40`}
        >
          ▼ Downvote
        </button>
      </div>
    </div>
  )
}
