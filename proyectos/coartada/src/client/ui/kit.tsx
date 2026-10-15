// Reusable UI pieces of the dossier design system.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { initials, pinColor } from '../lib/colors';
import { usePrefs, setPrefs } from '../lib/prefs';
import { sfx, unlockAudio } from '../lib/sound';
import { store } from '../net/store';
import type { PublicPlayer } from '../../shared/engine/views';

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
  folder: <path d="M3 6h7l2 2h9v11H3z" />,
  pen: <path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3" />,
  vote: <path d="M4 12l5 5L20 6" />,
  crown: <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" />,
  wifiOff: <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14 10.3A10 10 0 0 1 19 13M2 9.5A15 15 0 0 1 7 6.7M12 5a15 15 0 0 1 10 4.5M12 20h.01" />,
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
export function Pin({
  player,
  size,
  className = '',
  style,
  badge,
}: {
  player: Pick<PublicPlayer, 'name' | 'color'> & { connected?: boolean };
  size?: 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
  badge?: ReactNode;
}) {
  return (
    <span
      className={`pin ${size ?? ''} ${player.connected === false ? 'off' : ''} ${className}`}
      style={{ ['--c' as string]: pinColor(player.color), ...style }}
      aria-hidden
    >
      {initials(player.name)}
      {badge !== undefined && <span className="badge">{badge}</span>}
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
export function TopBar({ title, step, endsAt, onMenu, code }: { title: string; step?: string; endsAt?: number | null; onMenu?: () => void; code?: string }) {
  const prefs = usePrefs();
  const { left, total } = useCountdown(endsAt ?? null);
  const secs = Math.ceil(left / 1000);
  const warn = !!endsAt && secs <= 10;
  const lastTick = useRef(-1);
  useEffect(() => {
    if (warn && secs > 0 && secs <= 5 && secs !== lastTick.current) {
      lastTick.current = secs;
      sfx.tick();
    }
  }, [secs, warn]);
  return (
    <header className="topbar">
      <div className="topbar-row">
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="phase-name">{title}</div>
          {step && <div className="phase-step">{step}</div>}
        </div>
        {endsAt ? (
          <span className={`timer-num ${warn ? 'warn' : ''}`} role="timer" aria-live="off" aria-label={`Quedan ${secs} segundos`}>
            {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
          </span>
        ) : code ? (
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
        {onMenu && (
          <button className="icon-btn" aria-label="Menú" onClick={onMenu}>
            <Icon name="menu" />
          </button>
        )}
      </div>
      {endsAt ? (
        <div className={`fuse ${warn ? 'warn' : ''}`}>
          <i style={{ width: `${Math.min(100, (left / total) * 100)}%` }} />
        </div>
      ) : null}
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
