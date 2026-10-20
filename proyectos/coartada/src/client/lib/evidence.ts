// "New evidence" notice. The source of truth is the room's state: a piece of evidence is new for
// this phone when the server has published it (pub.round.traces) and this phone has not shown
// it yet. What was shown is remembered per device, keyed by the round's public data (room, round,
// case, the evidence itself and a fingerprint of everyone's declarations: a later game in the
// same room, or a new single-phone game after a reload, gets different keys),
// so the notice comes once: not again on a re-render, when the quick guide closes, on a
// reconnection or a reload, but still on a phone that was away when the evidence came out.
// Timers only decide how long the notice stays on screen, never whether there is one.
import { useCallback, useEffect, useState } from 'react';
import type { PublicView } from '../../shared/engine/views';

const KEY = 'coartada:seen-evidence';
const KEEP = 60;
/** How long the notice stays up while the screen is visible. */
export const NOTICE_MS = 9000;
/** After «Ver», the cell keeps its highlight this long, then the notice is done. */
export const LOOK_MS = 4000;

let seen: string[] = [];
try {
  seen = JSON.parse(localStorage.getItem(KEY) ?? '[]');
  if (!Array.isArray(seen)) seen = [];
} catch {
  seen = [];
}

/** FNV-1a, enough to tell rounds apart (not security). */
function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

export function evidenceKey(pub: PublicView, index: number): string {
  const r = pub.round!;
  const t = r.traces[index];
  const decl = r.participants.map((id) => `${id}:${r.declarations?.[id]?.zones.join(',') ?? ''}`).join(';');
  return `${pub.code}|${r.number}|${r.scenario.id}|${index}:${t.zone}@${t.slot}|${fingerprint(decl)}`;
}

function markSeen(keys: string[]): void {
  seen = [...seen.filter((k) => !keys.includes(k)), ...keys].slice(-KEEP);
  try {
    localStorage.setItem(KEY, JSON.stringify(seen));
  } catch {
    /* storage unavailable: the notice may show again after a reload */
  }
}

export interface EvidenceNotice {
  /** The pieces of evidence this phone has not shown yet, oldest first (their cells are lit). Two
   *  can come together (the host ends a step at once, or the phone was away): both are announced. */
  indices: number[];
  /** Whether the banner is up (it goes away on «Ver» while the cells stay lit a moment). */
  banner: boolean;
  look: () => void;
  dismiss: () => void;
}

export function useEvidenceNotice(pub: PublicView): EvidenceNotice {
  const traces = pub.round?.traces.length ?? 0;
  const keys = Array.from({ length: traces }, (_, i) => evidenceKey(pub, i));
  const unseen = keys.map((k, i) => (seen.includes(k) ? -1 : i)).filter((i) => i >= 0);
  const [state, setState] = useState<{ indices: number[]; banner: boolean }>({ indices: unseen, banner: unseen.length > 0 });
  const signature = keys.join(',');

  // Evidence the state has and this phone hasn't shown: announce it (with any still pending).
  useEffect(() => {
    if (unseen.length && unseen.join() !== state.indices.join()) setState({ indices: unseen, banner: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const dismiss = useCallback(() => {
    markSeen(keys);
    setState({ indices: [], banner: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // On screen for a while, counted only while the page is visible (a locked phone keeps it).
  const showing = state.indices.join();
  useEffect(() => {
    if (!showing) return;
    const ms = state.banner ? NOTICE_MS : LOOK_MS;
    let timer: ReturnType<typeof setTimeout> | null = null;
    // Hidden (locked phone, another app): stop the clock, so the notice is still there on return.
    const arm = () => {
      if (document.visibilityState !== 'visible') {
        if (timer) clearTimeout(timer);
        timer = null;
      } else if (!timer) timer = setTimeout(dismiss, ms);
    };
    arm();
    document.addEventListener('visibilitychange', arm);
    return () => {
      document.removeEventListener('visibilitychange', arm);
      if (timer) clearTimeout(timer);
    };
  }, [showing, state.banner, dismiss]);

  return {
    indices: state.indices,
    banner: state.banner && state.indices.length > 0,
    look: () => setState((s) => ({ ...s, banner: false })),
    dismiss,
  };
}
