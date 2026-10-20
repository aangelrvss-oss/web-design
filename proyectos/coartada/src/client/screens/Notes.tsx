// The private notebook («cuaderno»): who you suspect and why, what you noticed and the
// contradictions you spotted, what to check again. Only on this phone (lib/notes.ts); nothing is
// sent, nothing scores.
import { useState } from 'react';
import type { PublicView } from '../../shared/engine/views';
import { atHour, playerName, zoneName } from '../lib/text';
import { CLUE_MAX, LOCAL_CODE, SUSPICION_TEXT, useNotes, WHY_MAX, type Clue, type Suspicion } from '../lib/notes';
import { Icon, Pin, Sheet } from '../ui/kit';

export function SuspicionPicker({ value, onChange, name }: { value: Suspicion; onChange: (v: Suspicion) => void; name: string }) {
  return (
    <div className="suspicion" role="group" aria-label={`Tu nota sobre ${name}`}>
      {([0, 1, 2] as Suspicion[]).map((v) => (
        <button key={v} type="button" className={`suspicion-${v}`} aria-pressed={value === v} onClick={() => onChange(v)}>
          {SUSPICION_TEXT[v]}
        </button>
      ))}
    </div>
  );
}

/** What a "to check again" entry refers to, in words. */
function reviewText(pub: PublicView, item: string): string {
  const r = pub.round!;
  if (/^P\d$/.test(item)) {
    const t = r.traces[Number(item.slice(1)) - 1];
    return t ? `Prueba ${item.slice(1)}: ${zoneName(pub, t.zone)} ${atHour(r.scenario.slots[t.slot])}` : item;
  }
  const [id, slot] = item.split('@');
  const z = r.declarations?.[id]?.zones[Number(slot)];
  return `${playerName(pub, id)} ${atHour(r.scenario.slots[Number(slot)])}${z ? ` (dice: ${zoneName(pub, z)})` : ''}`;
}

/** The private line under a selected person: your mark and, for a pin, "check this hour again". */
export function NoteLine({ pub, me, id, slot }: { pub: PublicView; me: string; id: string; slot: number | null }) {
  const [notes, update] = useNotes(pub, me);
  const name = playerName(pub, id);
  const item = slot !== null ? `${id}@${slot}` : null;
  const marked = item ? notes.review.includes(item) : false;
  return (
    <div className="note-line">
      <div className="label">
        <span className="action-tag private">Solo tú</span> Tus notas
      </div>
      <SuspicionPicker value={notes.suspicion[id] ?? 0} name={name} onChange={(v) => update((n) => ({ ...n, suspicion: { ...n.suspicion, [id]: v } }))} />
      {item && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-pressed={marked}
          onClick={() => update((n) => ({ ...n, review: marked ? n.review.filter((x) => x !== item) : [...n.review, item] }))}
        >
          <Icon name={marked ? 'check' : 'eye'} />
          {marked ? `Marcado para revisar: ${atHour(pub.round!.scenario.slots[slot!])}` : `Revisar luego ${atHour(pub.round!.scenario.slots[slot!])}`}
        </button>
      )}
    </div>
  );
}

/** Your notebook: who you suspect and why, what you noticed, what to check again. */
export function NotesPanel({ pub, me }: { pub: PublicView; me: string }) {
  const [notes, update] = useNotes(pub, me);
  const round = pub.round!;
  const others = round.participants.filter((id) => id !== me);
  const marked = others.filter((id) => (notes.suspicion[id] ?? 0) > 0).length;
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'auto' });
  return (
    <div className="stack notes">
      <p className="small muted">
        Solo las ves tú{pub.code === LOCAL_CODE ? '' : ', en este móvil'}: no se envían a nadie y no dan puntos. Duran toda la ronda; una partida nueva empieza con el
        cuaderno en blanco.
      </p>
      <nav className="notes-index" aria-label="Partes del cuaderno">
        <button type="button" className="chip-player" onClick={() => jump('notes-suspects')}>
          Sospechas <span className="tag">{marked}</span>
        </button>
        <button type="button" className="chip-player" onClick={() => jump('notes-clues')}>
          Pistas <span className="tag">{notes.clues.length}</span>
        </button>
        <button type="button" className="chip-player" onClick={() => jump('notes-review')}>
          Por revisar <span className="tag">{notes.review.length}</span>
        </button>
      </nav>

      <section id="notes-suspects" className="stack" style={{ gap: 'var(--s-2)' }} aria-labelledby="notes-suspects-h">
        <h3 id="notes-suspects-h" className="notes-h">
          Sospechas
        </h3>
        {others.map((id) => {
          const p = pub.players.find((x) => x.id === id);
          if (!p) return null;
          return (
            <div key={id} className={`notes-person s${notes.suspicion[id] ?? 0}`}>
              <div className="row" style={{ gap: 8 }}>
                <Pin player={p} />
                <b className="grow notes-name">{p.name}</b>
              </div>
              <SuspicionPicker value={notes.suspicion[id] ?? 0} name={p.name} onChange={(v) => update((n) => ({ ...n, suspicion: { ...n.suspicion, [id]: v } }))} />
              <input
                className="notes-why"
                type="text"
                maxLength={WHY_MAX}
                placeholder="Por qué…"
                aria-label={`Por qué, sobre ${p.name}`}
                value={notes.why[id] ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  update((n) => ({ ...n, why: { ...n.why, [id]: v } }));
                }}
              />
            </div>
          );
        })}
      </section>

      <Clues pub={pub} me={me} />

      <section id="notes-review" className="stack" style={{ gap: 'var(--s-2)' }} aria-labelledby="notes-review-h">
        <h3 id="notes-review-h" className="notes-h">
          Por revisar
        </h3>
        {notes.review.length === 0 ? (
          <p className="small muted">Apunta aquí una prueba, o toca una ficha del tablero y pulsa «Revisar luego» para apuntar esa hora.</p>
        ) : (
          <ul className="list-plain notes-review">
            {notes.review.map((item) => (
              <li key={item} className="stack" style={{ gap: 6 }}>
                <div className="row">
                  <span className="grow small notes-item">{reviewText(pub, item)}</span>
                  <button
                    type="button"
                    className="notice-close"
                    aria-label={`Quitar «${reviewText(pub, item)}»`}
                    onClick={() =>
                      update((n) => {
                        const reviewWhy = { ...n.reviewWhy };
                        delete reviewWhy[item];
                        return { ...n, review: n.review.filter((x) => x !== item), reviewWhy };
                      })
                    }
                  >
                    <Icon name="cross" />
                  </button>
                </div>
                <input
                  className="notes-why"
                  type="text"
                  maxLength={WHY_MAX}
                  placeholder="Por qué quieres revisarlo…"
                  aria-label={`Por qué revisar ${reviewText(pub, item)}`}
                  value={notes.reviewWhy[item] ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    update((n) => ({ ...n, reviewWhy: { ...n.reviewWhy, [item]: v } }));
                  }}
                />
              </li>
            ))}
          </ul>
        )}
        <div className="row wrap">
          {round.traces.map((_, i) => {
            const item = `P${i + 1}`;
            const on = notes.review.includes(item);
            return (
              <button
                key={item}
                type="button"
                className="chip-player"
                aria-pressed={on}
                onClick={() => update((n) => ({ ...n, review: on ? n.review.filter((x) => x !== item) : [...n.review, item] }))}
              >
                {on ? `Prueba ${i + 1} apuntada` : `Apuntar la prueba ${i + 1}`}
              </button>
            );
          })}
        </div>
        {round.variant === 'prueba_falsa' && (
          <p className="small muted">Es solo tu recordatorio: no cuenta como marca para la revisión de la prueba.</p>
        )}
      </section>
    </div>
  );
}

/** What you noticed and the contradictions you spotted: add, correct, delete. */
function Clues({ pub, me }: { pub: PublicView; me: string }) {
  const [notes, update] = useNotes(pub, me);
  const round = pub.round!;
  const [kind, setKind] = useState<Clue['kind']>('obs');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const add = (clue: Clue) => update((n) => ({ ...n, clues: [...n.clues, clue] }));
  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    add({ id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, kind, text });
    setDraft('');
  };
  // Public contradictions (a testimony against a sealed alibi), ready to copy into your notes.
  const seen = new Set(notes.clues.map((c) => c.id));
  const spotted = round.testimonies.filter((t) => t.status === 'contradice' && !seen.has(`t${t.id}`));
  const contraText = (t: (typeof round.testimonies)[number]) => {
    const said = round.declarations?.[t.subject]?.zones[t.slot];
    return `${playerName(pub, t.by)} dice que estuvo con ${playerName(pub, t.subject)} en ${zoneName(pub, t.zone)} ${atHour(round.scenario.slots[t.slot])}, pero ${playerName(pub, t.subject)} declaró ${said ? zoneName(pub, said) : 'otro sitio'}.`;
  };
  return (
    <section id="notes-clues" className="stack" style={{ gap: 'var(--s-2)' }} aria-labelledby="notes-clues-h">
      <h3 id="notes-clues-h" className="notes-h">
        Pistas y contradicciones
      </h3>
      <div className="stack" style={{ gap: 6 }}>
        <div className="suspicion clue-kind" role="radiogroup" aria-label="Tipo de nota">
          {(
            [
              ['obs', 'Observación'],
              ['contra', 'Contradicción'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" role="radio" className={k === 'contra' ? 'suspicion-2' : 'suspicion-0'} aria-checked={kind === k} onClick={() => setKind(k)}>
              {label}
            </button>
          ))}
        </div>
        <form
          className="row clue-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            className="notes-why grow"
            type="text"
            maxLength={CLUE_MAX}
            placeholder={kind === 'contra' ? 'Qué no encaja…' : 'Qué has notado…'}
            aria-label={kind === 'contra' ? 'Nueva contradicción' : 'Nueva observación'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="btn btn-paper btn-sm" disabled={!draft.trim()}>
            Apuntar
          </button>
        </form>
      </div>
      {notes.clues.length === 0 ? (
        <p className="small muted">Aún no has apuntado nada.</p>
      ) : (
        <ul className="list-plain notes-clues">
          {notes.clues.map((c) => (
            <li key={c.id} className={`clue ${c.kind}`}>
              <span className={`tag ${c.kind === 'contra' ? 'red' : ''}`}>{c.kind === 'contra' ? 'Contradicción' : 'Observación'}</span>
              {editing?.id === c.id ? (
                <form
                  className="stack"
                  style={{ gap: 6 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = editing.text.trim();
                    update((n) => ({ ...n, clues: text ? n.clues.map((x) => (x.id === c.id ? { ...x, text } : x)) : n.clues.filter((x) => x.id !== c.id) }));
                    setEditing(null);
                  }}
                >
                  <input
                    className="notes-why"
                    type="text"
                    maxLength={CLUE_MAX}
                    aria-label="Corregir la nota"
                    value={editing.text}
                    autoFocus
                    onChange={(e) => setEditing({ id: c.id, text: e.target.value })}
                  />
                  <div className="row">
                    <button type="submit" className="btn btn-paper btn-sm">
                      Guardar
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="doc-text clue-text">{c.text}</p>
                  <div className="row">
                    <button type="button" className="btn btn-ghost btn-sm" aria-label={`Corregir: ${c.text}`} onClick={() => setEditing({ id: c.id, text: c.text })}>
                      Corregir
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" aria-label={`Borrar: ${c.text}`} onClick={() => update((n) => ({ ...n, clues: n.clues.filter((x) => x.id !== c.id) }))}>
                      Borrar
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {spotted.length > 0 && (
        <div className="stack" style={{ gap: 6 }}>
          <div className="label">Contradicciones a la vista (testimonios públicos)</div>
          {spotted.map((t) => (
            <button
              key={t.id}
              type="button"
              className="btn btn-ghost btn-block clue-suggest"
              onClick={() => add({ id: `t${t.id}`, kind: 'contra', text: contraText(t) })}
            >
              <Icon name="pen" /> <span>Apuntar: {contraText(t)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/** Your own mark on someone, as a small tag (vote list). Nothing if unmarked. */
export function NoteTag({ pub, me, id }: { pub: PublicView; me: string; id: string }) {
  const [notes] = useNotes(pub, me);
  const v = notes.suspicion[id] ?? 0;
  return v ? <span className={`tag note-tag s${v}`}>Tu nota: {SUSPICION_TEXT[v]}</span> : null;
}

/** «Mi cuaderno» button and its sheet, for the screens after the investigation. */
export function NotesButton({ pub, me }: { pub: PublicView; me: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-ghost btn-block" onClick={() => setOpen(true)}>
        <span style={{ width: 20, display: 'inline-grid' }} aria-hidden>
          <Icon name="folder" />
        </span>
        Mi cuaderno
      </button>
      <NotesSheet open={open} onClose={() => setOpen(false)} pub={pub} me={me} />
    </>
  );
}

export function NotesSheet({ open, onClose, pub, me }: { open: boolean; onClose: () => void; pub: PublicView; me: string }) {
  return (
    <Sheet open={open} onClose={onClose} label="Mi cuaderno">
      <h2>Mi cuaderno</h2>
      <NotesPanel pub={pub} me={me} />
    </Sheet>
  );
}
