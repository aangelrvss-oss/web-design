// Small inline illustrations in the case-file style: graphite outlines on paper, stamp red for
// action, ballpoint blue for evidence. Same line weights as the icons (2–2.6 px at their size),
// no fills beyond flat paper tones, decorative only (aria-hidden): the text next to each one
// always says the same thing.

const INK = 'var(--graphite)';

/** A person's silhouette, tinted by role; `pair` adds the partner behind (the accomplice). */
export function Suspect({ tone = 'ink', mark, className = 'ill-suspect' }: { tone?: 'ink' | 'red' | 'blue'; mark?: 'pair'; className?: string }) {
  const color = tone === 'red' ? 'var(--stamp)' : tone === 'blue' ? 'var(--ballpoint)' : INK;
  return (
    <svg className={className} viewBox="0 0 64 56" aria-hidden style={{ color }}>
      {mark === 'pair' && <path d="M44 22a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM31 46c1-9 6-15 13-15s12 6 13 15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />}
      <path d="M26 26a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 52c1-12 8-20 17-20s16 8 17 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/** A sealed evidence bag under a magnifier: a new piece of evidence. */
export function EvidenceBag({ className = 'ill-evidence' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden>
      <path d="M12 16h36v38a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill="var(--paper)" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <rect x="12" y="10" width="36" height="9" rx="1.5" fill="var(--stamp)" stroke={INK} strokeWidth="2.2" />
      <path d="M17 14.5h4M25 14.5h4M33 14.5h4M41 14.5h3" stroke="var(--paper)" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="18" y="25" width="24" height="12" rx="1" fill="var(--kraft)" stroke={INK} strokeWidth="1.6" />
      <path d="M22 29.5h16M22 33h10" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="44" cy="45" r="9.5" fill="rgba(239,232,216,0.55)" stroke="var(--ballpoint)" strokeWidth="3" />
      <path d="M51 52l7 7" stroke="var(--ballpoint)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** A police line-up with one person circled in red: pointing at someone. */
export function Lineup({ className = 'ill-lineup' }: { className?: string }) {
  const person = (x: number) => `M${x} 27a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM${x - 13} 52c1-10 6-17 13-17s12 7 13 17`;
  return (
    <svg className={className} viewBox="0 0 120 60" aria-hidden>
      <path d="M4 12h112M4 24h112M4 36h112M4 48h112" stroke="var(--rule)" strokeWidth="1.2" strokeDasharray="3 4" />
      <path d={`${person(24)}${person(96)}`} fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
      <path d={person(60)} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M44 10c8-6 26-6 32 1 7 8 6 30 1 40-5 8-27 9-33 0-6-9-7-31 2-40 3-3 8-4 12-4" fill="none" stroke="var(--stamp)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M112 4c-6 4-14 10-24 16m0 0 9-1m-9 1 4-8" fill="none" stroke="var(--stamp)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
