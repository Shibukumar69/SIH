// SamadhanSetu brand mark: a bridge (setu) arching over water, inside a rounded
// badge — "a bridge from problems to solutions". Pure SVG, scales crisply, zero weight.
export default function Logo({ size = 40, withWordmark = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="13" fill="url(#ss-grad)" />
        {/* water line */}
        <path d="M8 33c4 0 4 2 8 2s4-2 8-2 4 2 8 2 4-2 8-2" stroke="#bae6fd" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
        {/* bridge arch */}
        <path d="M9 30c3-9 12-14 15-14s12 5 15 14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        {/* deck + pillars */}
        <path d="M8 24h32" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M16 24v6M24 22v8M32 24v6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        {/* saffron sun/spark */}
        <circle cx="24" cy="14" r="4" fill="#fbbf24" />
        <defs>
          <linearGradient id="ss-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#059669" />
            <stop offset="1" stopColor="#047857" />
          </linearGradient>
        </defs>
      </svg>
      {withWordmark && (
        <span className="font-display font-extrabold leading-none">
          <span className="text-brand-700">Samadhan</span>
          <span className="text-saffron-500">Setu</span>
        </span>
      )}
    </span>
  )
}
