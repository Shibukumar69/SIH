import { useState } from 'react'
import { useLang } from '../context/LanguageContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { api } from '../lib/api.js'

// "I'm facing this too" — lets citizens upvote a shared problem so authorities
// can see how many people are affected and prioritise accordingly.
export default function VoteButton({ report, size = 'md', onVoted }) {
  const { t } = useLang()
  const { toast } = useToast()
  const [votes, setVotes] = useState(report.votes || 0)
  const [voted, setVoted] = useState(!!report.votedByMe)
  const [bump, setBump] = useState(false)

  async function handleVote(e) {
    e.preventDefault()
    e.stopPropagation()
    if (voted) return
    setVoted(true)
    setVotes((v) => v + 1)
    setBump(true)
    setTimeout(() => setBump(false), 300)
    const res = await api.voteReport(report.id)
    if (!res.alreadyVoted) toast(t('toast.voteAdded'), { icon: '🙌' })
    onVoted?.()
  }

  const big = size === 'lg'
  return (
    <button
      onClick={handleVote}
      disabled={voted}
      aria-pressed={voted}
      className={`group inline-flex items-center gap-2 rounded-full font-bold transition-all ${
        big ? 'px-5 py-3 text-base' : 'px-3.5 py-2 text-sm'
      } ${
        voted
          ? 'bg-brand-600 text-white cursor-default'
          : 'bg-white text-ink-700 border border-ink-200 hover:border-brand-400 hover:bg-brand-50 active:scale-95'
      }`}
    >
      <span className={`text-lg leading-none ${bump ? 'scale-150' : ''} transition-transform`}>
        {voted ? '🙌' : '🤚'}
      </span>
      <span>{voted ? t('vote.added') : t('vote.facingToo')}</span>
      <span className={`tabular-nums rounded-full px-2 py-0.5 text-xs ${voted ? 'bg-white/25' : 'bg-ink-100 group-hover:bg-white'}`}>
        {votes}
      </span>
    </button>
  )
}
