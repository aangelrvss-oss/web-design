// Reusable UI pieces of the dossier design system.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { AvatarId } from '../../shared/characters';
import { initials, pinColor } from '../lib/colors';
import { Portrait } from './portraits';
import { usePrefs, setPrefs } from '../lib/prefs';
import { sfx, unlockAudio } from '../lib/sound';
import { store } from '../net/store';
import type { PublicPlayer } from '../../shared/engine/views';
import type { Phase } from '../../shared/types';
import { PHASE_STEPS } from '../lib/text';

// ───────────── icons (24px, 2px stroke) ─────────────
const paths: Record<string, ReactNode> = {
  sound: <path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4 4 0 0 0-2-3.5v7a4 4 0 0 0 2-3.5zM14.5 4.2v2.1a6 6 0 0 1 0 11.4v2.1a8 8 0 0 0 0-15.6z" fill="currentColor" stroke="none" />,
  mute: <path d="M4 9v6h4l5 4V5L8 9H4zm12 .5 5 5m0-5-5 5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  share: <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />,
  copy: <path d="M9 9h10v12H9zM5 15V3h10" />,
  eye: <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  eyeOff: <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.6 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  cross: <path d="M6 6l12 12M18 6 6 18" />,
  minus: <path d="M5 12h14" />,
  mic: <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3" />,
  target: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />,
  folder: <path d="M3 6h7l2 2h9v11H3z" />,
  pen: <path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3" />,
  vote: <path d="M4 12l5 5L20 6" />,
  crown: <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" />,
  wifiOff: <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14 10.3A10 10 0 0 1 19 13M2 9.5A15 15 0 0 1 7 6.7M12 5a15 15 0 0 1 10 4.5M12 20h.01" />,
  help: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.4 9.3a2.7 2.7 0 1 1 3.9 2.4c-.8.4-1.3 1-1.3 1.9v.6M12 17.2h.01" />,
  search: <path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.3 15.3 21 21" />,
  stamp: <path d="M9 3h6v5l-1 3h4l2 4H4l2-4h4L9 8zM5 19h14" />,
};

export function Icon({ name, title }: { name: keyof typeof paths | string; title?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  );
}

// ───────────── pins ─────────────
// A player's pin: their character's portrait in a ring of their colour (initials if they have no
// character). Decorative: the player's own name always goes next to it or under it.
export function Pin({
  player,
  size,
  className = '',
  style,
  badge,
}: {
  player: Pick<PublicPlayer, 'name' | 'color'> & { connected?: boolean; avatar?: AvatarId | null };
  size?: 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
  badge?: ReactNode;
}) {
  return (
    <span
      className={`pin ${size ?? ''} ${player.avatar ? 'portrait' : ''} ${player.connected === false ? 'off' : ''} ${className}`}
      style={{ ['--c' as string]: pinColor(player.color), ...style }}
      aria-hidden
    >
      {player.avatar ? <Portrait id={player.avatar} /> : initials(player.name)}
      {badge !== undefined && <span className="badge">{badge}</span>}
    </span>
  );
}

/** A small portrait with the player's (short, unique) name under it, where there is no room for
 *  the full name beside it: the board and the "who has sealed / voted" rows. */
export function Token({
  player,
  label,
  pinClass = '',
  badge,
  style,
}: {
  player: Pick<PublicPlayer, 'name' | 'color'> & { connected?: boolean; avatar?: AvatarId | null };
  label: string;
  pinClass?: string;
  badge?: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span className="token">
      <Pin player={player} className={pinClass} badge={badge} style={style} />
      <span className="token-name" aria-hidden>
        {label}
      </span>
    </span>
  );
}

// ───────────── stamp ─────────────
export function Stamp({ children, tone = 'red', big, animate }: { children: ReactNode; tone?: 'red' | 'blue' | 'ink'; big?: boolean; animate?: boolean }) {
  return <span className={`stamp ${tone === 'red' ? '' : tone} ${big ? 'big' : ''} ${animate ? 'stamp-in' : ''}`}>{children}</span>;
}

// ───────────── sheet (bottom drawer) ─────────────
export function Sheet({ open, onClose, children, tone = 'paper', label }: { open: boolean; onClose: () => void; children: ReactNode; tone?: 'paper' | 'ink'; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`sheet ${tone === 'paper' ? 'paper' : 'ink'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  );
}

// ───────────── quick guide opener ─────────────
// The "?" button lives in every top bar; the guide overlay (screens/QuickGuide) registers here.
let guideOpener: (() => void) | null = null;

export function openGuide(): void {
  guideOpener?.();
}

export function setGuideOpener(fn: (() => void) | null): void {
  guideOpener = fn;
}

// ───────────── toast ─────────────
type ToastMsg = { text: string; error?: boolean; id: number } | null;
let toastSet: ((t: ToastMsg) => void) | null = null;
let toastId = 0;

export function toast(text: string, error = false): void {
  toastSet?.({ text, error, id: ++toastId });
}

export function ToastHost() {
  const [t, setT] = useState<ToastMsg>(null);
  useEffect(() => {
    toastSet = setT;
    return () => {
      toastSet = null;
    };
  }, []);
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setT(null), t.error ? 3600 : 2200);
    return () => clearTimeout(h);
  }, [t]);
  if (!t) return null;
  return (
    <div className={`toast ${t.error ? 'error' : ''}`} role={t.error ? 'alert' : 'status'} key={t.id}>
      {t.text}
    </div>
  );
}

// ───────────── timer ─────────────
export function useCountdown(endsAt: number | null): { left: number; total: number } {
  const [, force] = useState(0);
  const start = useRef<{ endsAt: number | null; total: number }>({ endsAt: null, total: 1 });
  if (start.current.endsAt !== endsAt) {
    start.current = { endsAt, total: endsAt ? Math.max(1, endsAt - store.now()) : 1 };
  }
  useEffect(() => {
    if (!endsAt) return;
    const h = setInterval(() => force((x) => x + 1), 250);
    return () => clearInterval(h);
  }, [endsAt]);
  const left = endsAt ? Math.max(0, endsAt - store.now()) : 0;
  return { left, total: start.current.total };
}

// ───────────── top bar ─────────────
/** From this many seconds left, the phase's countdown takes over the title (see TopBar). */
export const URGENT_SECS = 15;
/** The last seconds, where each one is pressed in like a stamp. */
export const FINAL_SECS = 5;

export function TopBar({
  title,
  step,
  endsAt,
  onMenu,
  code,
  phase,
  bigClock = true,
  notice,
}: {
  title: string;
  step?: string;
  endsAt?: number | null;
  onMenu?: () => void;
  code?: string;
  /** Shows the "step N of 5" indicator for in-round screens. */
  phase?: Phase;
  /** Big countdown in the last seconds. Off where the screen already shows a big clock (the defense). */
  bigClock?: boolean;
  /** A passing notice hung under the bar, over the content, so nothing below it moves. */
  notice?: ReactNode;
}) {
  const stepIdx = phase ? PHASE_STEPS.findIndex((s) => s.phases.includes(phase)) : -1;
  const prefs = usePrefs();
  const { left, total } = useCountdown(endsAt ?? null);
  const secs = Math.ceil(left / 1000);
  const warn = !!endsAt && secs <= 10;
  // Last seconds: the countdown replaces the title in the same row (no layout shift, nothing
  // covered) and grows; in the final ones it turns into a red stamp that is pressed in each
  // second. Only the display changes: the end of the phase is still the server's.
  const urgent = bigClock && !!endsAt && secs <= URGENT_SECS;
  const final = urgent && secs <= FINAL_SECS;
  const lastTick = useRef(-1);
  useEffect(() => {
    if (warn && secs > 0 && secs <= 5 && secs !== lastTick.current) {
      lastTick.current = secs;
      sfx.tick();
    }
  }, [secs, warn]);
  return (
    <header className={`topbar ${urgent ? 'urgent' : ''}`}>
      <div className="topbar-row">
        {urgent ? (
          <div className={`grow countdown ${final ? 'final' : ''}`} role="timer" aria-live="off" aria-label={`${title}: quedan ${secs} segundos`}>
            <b key={final ? secs : 'urgent'} className="countdown-num">
              {secs}
            </b>
            <span className="countdown-label">
              <span>{secs === 0 ? '¡Tiempo!' : secs === 1 ? 'segundo' : 'segundos'}</span>
              <span className="countdown-phase">{title}</span>
            </span>
          </div>
        ) : (
          <div className="grow phase-name" style={{ minWidth: 0 }}>
            {title}
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {urgent ? `Quedan menos de ${URGENT_SECS} segundos de ${title.toLowerCase()}.` : ''}
        </span>
        {endsAt && !urgent ? (
          <span className={`timer-num ${warn ? 'warn' : ''}`} role="timer" aria-live="off" aria-label={`Tiempo restante de esta fase: ${secs} segundos`}>
            {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
          </span>
        ) : endsAt ? null : code ? (
          <span className="code-chip" aria-label={`Sala ${code}`}>
            {code}
          </span>
        ) : null}
        <button
          className="icon-btn"
          aria-label={prefs.sound ? 'Silenciar sonido' : 'Activar sonido'}
          aria-pressed={prefs.sound}
          onClick={() => {
            setPrefs({ sound: !prefs.sound });
            if (!prefs.sound) {
              unlockAudio();
              setTimeout(() => sfx.paper(), 30);
            }
          }}
        >
          <Icon name={prefs.sound ? 'sound' : 'mute'} />
        </button>
        <button className="icon-btn" aria-label="Guía rápida" onClick={openGuide}>
          <Icon name="help" />
        </button>
        {onMenu && (
          <button className="icon-btn" aria-label="Menú" onClick={onMenu}>
            <Icon name="menu" />
          </button>
        )}
      </div>
      {/* Below the buttons and full width, so it stays readable on narrow phones. */}
      {step && <div className="phase-step">{step}</div>}
      {stepIdx >= 0 && (
        <div className="phase-steps" role="img" aria-label={`Fase ${stepIdx + 1} de ${PHASE_STEPS.length}: ${PHASE_STEPS[stepIdx].label}`}>
          {PHASE_STEPS.map((s, i) => (
            <span key={s.label} className={i < stepIdx ? 'done' : i === stepIdx ? 'now' : ''} />
          ))}
        </div>
      )}
      {endsAt ? (
        <div className={`fuse ${warn ? 'warn' : ''}`} role="presentation">
          <i style={{ width: `${Math.min(100, (left / total) * 100)}%` }} />
        </div>
      ) : null}
      {notice && <div className="topbar-notice">{notice}</div>}
    </header>
  );
}

// ───────────── controls ─────────────
export function Switch({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)} disabled={disabled}>
      <span>
        <span style={{ fontWeight: 650 }}>{label}</span>
        {hint && <span className="muted small" style={{ display: 'block' }}>{hint}</span>}
      </span>
      <span className="track" />
    </button>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange, label, disabled }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string; disabled?: boolean }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)} disabled={disabled}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ActionBar({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="actionbar">
      {hint && <div className="hint">{hint}</div>}
      <div className="actionbar-inner">{children}</div>
    </div>
  );
}

/** Run an action with a busy flag and an error toast. Prevents double taps. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void, errorText?: (e?: string) => string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fn();
      if (res.ok) onOk?.();
      else toast(errorText ? errorText(res.error) : 'Algo ha fallado.', true);
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}
