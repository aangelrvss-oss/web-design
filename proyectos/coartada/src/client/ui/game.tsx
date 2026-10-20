// Game-specific components: the alibi board, the private file, evidence and testimonies.
import { useLayoutEffect, useRef, useState } from 'react';
import type { PrivateView, PublicTestimony, PublicView } from '../../shared/engine/views';
import { describeEncargo } from '../../shared/engine/encargos';
import { ringBox, type Box } from '../lib/ring';
import { atHour, listJoin, playerName, ROLE_GOAL, ROLE_NAME, zoneName } from '../lib/text';
import { shortNames } from '../lib/colors';
import { CaseScene } from './ambience';
import { EvidenceBag, Suspect } from './illustrations';
import { Icon, Pin, Stamp, Token } from './kit';
import { ExperimentalTag, ForgeryChooser, ForgeryNote, isForgeryRound, TraceStatusTag } from './pruebaFalsa';

// Hand-drawn ballpoint loop around a piece of evidence on the board. It is measured against the
// pins actually in its cell (lib/ring.ts), so it hugs a pair, grows for a crowd and follows the
// pins when the screen width changes how they wrap. A rounded-box loop rather than an ellipse,
// so the pins in the corners of a block stay inside too.
export function TraceRing({ index, fresh }: { index: number; fresh?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const [fit, setFit] = useState<{ box: Box; cellWidth: number } | null>(null);
  useLayoutEffect(() => {
    const cell = ref.current?.parentElement;
    if (!cell) return;
    const measure = () => {
      // Each person is a pin with their name under it: the loop goes round both.
      const pins = [...cell.querySelectorAll<HTMLElement>('.token')].map((p) => ({ left: p.offsetLeft, top: p.offsetTop, width: p.offsetWidth, height: p.offsetHeight }));
      const box = ringBox(pins, { width: cell.clientWidth, height: cell.clientHeight });
      setFit((f) =>
        f && f.cellWidth === cell.clientWidth && f.box.left === box.left && f.box.top === box.top && f.box.width === box.width && f.box.height === box.height
          ? f
          : { box, cellWidth: cell.clientWidth },
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const resize = new ResizeObserver(measure);
    resize.observe(cell);
    const moves = new MutationObserver(measure);
    moves.observe(cell, { childList: true, subtree: true });
    return () => {
      resize.disconnect();
      moves.disconnect();
    };
  }, []);
  const b = fit?.box;
  return (
    <>
      <svg
        ref={ref}
        className={`trace-ring ${fresh ? 'fresh' : ''}`}
        style={b ? { left: b.left, top: b.top, width: b.width, height: b.height } : { visibility: 'hidden' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M12 2.5 C 40 1, 70 2, 88 1.8 C 97 1.5, 99 6, 98.6 14 C 98 40, 99.2 66, 98.4 86 C 98 96, 94 98.6, 84 98.3 C 60 99.2, 36 98.4, 14 98.8 C 4 99, 1.2 94, 1.5 84 C 1 60, 2 34, 1.4 14 C 1.2 5, 5 2, 18 3.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="trace-num"
        aria-hidden
        style={b && fit ? { right: Math.max(0, fit.cellWidth - (b.left + b.width) - 3), top: Math.max(0, b.top - 9) } : { visibility: 'hidden' }}
      >
        P{index + 1}
      </span>
    </>
  );
}

export function Board({
  pub,
  selected,
  selectedSlot,
  onSelect,
  flip,
  freshTraces = [],
}: {
  pub: PublicView;
  selected: string | null;
  /** The hour of the tapped pin, when a pin (not a name) was used to select someone. */
  selectedSlot?: number | null;
  /** `slot` is the hour of the pin tapped; undefined when chosen from the names under the board. */
  onSelect: (id: string | null, slot?: number) => void;
  flip?: boolean;
  /** Evidence that has just appeared: its cell flashes and its loop is drawn in. */
  freshTraces?: number[];
}) {
  const round = pub.round!;
  const decl = round.declarations;
  if (!decl) return null;
  const { scenario, scene, traces, testimonies } = round;
  const conflicts = new Set<string>();
  for (const t of testimonies) {
    if (t.status === 'contradice') {
      conflicts.add(`${t.subject}|${t.slot}`);
      conflicts.add(`${t.by}|${t.slot}`);
    }
  }
  const players = round.participants.map((id) => pub.players.find((p) => p.id === id) ?? { id, name: '¿?', color: 0, connected: false, avatar: null });
  // Under each pin, a short name that is never the same for two people; the full name is in the
  // button's label and in the summary that tapping opens.
  const short = shortNames(players, 5);
  let order = 0;
  return (
    <section className={`paper kraft board tabbed ${flip ? 'flip-in' : ''}`} data-tab="Tablero de coartadas" aria-label="Tablero de coartadas">
      <div className="board-grid" role="table" aria-label="Dónde dice cada persona que estuvo">
        <div role="row" style={{ display: 'contents' }}>
          <div className="hcell" role="columnheader">
            <span className="sr-only">Lugar</span>
          </div>
          {scenario.slots.map((s, i) => (
            <div key={s} className={`hcell ${i === scene.slot ? 'crime' : ''}`} role="columnheader">
              {s}
            </div>
          ))}
        </div>
        {scenario.zones.map((z) => (
          <div role="row" key={z.id} style={{ display: 'contents' }}>
            <div className="zcell" role="rowheader">
              {z.name}
            </div>
            {scenario.slots.map((slotLabel, slot) => {
              const here = players.filter((p) => decl[p.id]?.zones[slot] === z.id);
              const isScene = scene.zone === z.id && scene.slot === slot;
              const traceIdx = traces.findIndex((t) => t.zone === z.id && t.slot === slot);
              return (
                <div
                  key={slotLabel}
                  role="cell"
                  className={`cell ${isScene ? 'scene' : ''} ${traceIdx >= 0 && freshTraces.includes(traceIdx) ? 'fresh-trace' : ''}`}
                  aria-label={`${z.name} ${atHour(slotLabel)}: ${here.length ? here.map((p) => p.name).join(', ') : 'nadie'}${isScene ? ' (lugar del incidente)' : ''}${traceIdx >= 0 ? ` (prueba ${traceIdx + 1})` : ''}`}
                >
                  {isScene && <span className="scene-tag">Escena</span>}
                  {traceIdx >= 0 && <TraceRing index={traceIdx} fresh={freshTraces.includes(traceIdx)} />}
                  {here.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="board-token"
                      onClick={() => onSelect(selected === p.id && (selectedSlot === undefined || selectedSlot === slot) ? null : p.id, slot)}
                      aria-label={p.name}
                      title={p.name}
                    >
                      <Token
                        player={p}
                        label={short[p.id]}
                        style={{ ['--i' as string]: order++ }}
                        pinClass={[
                          selected && selected !== p.id ? 'dim' : '',
                          selected === p.id ? 'hit' : '',
                          conflicts.has(`${p.id}|${slot}`) ? 'conflict' : '',
                        ].join(' ')}
                      />
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="board-players" role="group" aria-label="Seguir a una persona">
        {players.map((p) => (
          <button key={p.id} type="button" className="chip-player" aria-pressed={selected === p.id} onClick={() => onSelect(selected === p.id ? null : p.id)}>
            <Pin player={p} />
            {p.name}
            {decl[p.id]?.auto && <span className="muted small">(auto)</span>}
          </button>
        ))}
      </div>
      <div className="board-legend">
        <span>Rayado rojo: lugar y hora del incidente</span>
        <span>{isForgeryRound(pub) ? 'Contorno azul: lo que dice una prueba (sin revisar puede ser falsa)' : 'Contorno azul: prueba'}</span>
        <span>Aro rojo: un testimonio contradice esa coartada</span>
      </div>
    </section>
  );
}

export function TraceCard({ pub, index, fresh }: { pub: PublicView; index: number; fresh?: boolean }) {
  const round = pub.round!;
  const t = round.traces[index];
  const hour = atHour(round.scenario.slots[t.slot]);
  const place = zoneName(pub, t.zone);
  // A fact about public claims, not about the truth: who SAYS they were there.
  const fits = round.participants.filter((id) => round.declarations?.[id]?.zones[t.slot] === t.zone).map((id) => playerName(pub, id));
  return (
    <article className={`paper trace-card ${fresh ? 'new-evidence' : ''}`} aria-label={`Prueba ${index + 1}`}>
      <div className="spread">
        <div className="row" style={{ gap: 'var(--s-2)' }}>
          <EvidenceBag />
          <div className="label" style={{ margin: 0 }}>
            Prueba {index + 1} de 2
          </div>
        </div>
        {fresh && (
          <Stamp tone="blue" animate>
            Nueva
          </Stamp>
        )}
        {!fresh && t.status && <TraceStatusTag t={t} />}
      </div>
      {fresh && t.status && (
        <p style={{ marginTop: 4 }}>
          <TraceStatusTag t={t} />
        </p>
      )}
      <p className="doc-text">{t.text}</p>
      <p className="conclusion">
        {t.status === 'sin_peritar' ? (
          <>
            La prueba dice que la persona culpable estuvo en {place} {hour}.
          </>
        ) : t.status === 'falsa' ? (
          <>
            Era falsa (decía {zoneName(pub, t.forgedZone)}). Hecho comprobado: la persona culpable estuvo en {place} {hour}.
          </>
        ) : (
          <>
            Hecho comprobado: la persona culpable estuvo en {place} {hour}.
          </>
        )}
      </p>
      <p className="small" style={{ marginTop: 6 }}>
        {fits.length > 0 ? (
          <>
            Coartadas que encajan con esta prueba: <b>{listJoin(fits)}</b>.
          </>
        ) : (
          <>Nadie ha declarado que estuviera allí a esa hora.</>
        )}{' '}
        Ojo: la persona culpable puede haber mentido justo en esa hora para no aparecer aquí.
      </p>
    </article>
  );
}

const STATUS_ICON = { coincide: 'check', contradice: 'cross', sin_contraste: 'minus' } as const;

export function TestimonyItem({ pub, t }: { pub: PublicView; t: PublicTestimony }) {
  const by = pub.players.find((p) => p.id === t.by);
  const subject = playerName(pub, t.subject);
  const subjectZone = pub.round!.declarations?.[t.subject]?.zones[t.slot];
  const slot = pub.round!.scenario.slots[t.slot];
  const tone = t.status === 'coincide' ? 'ok' : t.status === 'contradice' ? 'bad' : 'neutral';
  return (
    <li className={`testimony status-${t.status}`}>
      {by ? <Pin player={by} /> : <span className="pin" />}
      <div>
        <div className="small" style={{ fontWeight: 700 }}>
          {playerName(pub, t.by)}
        </div>
        <q>
          Estuve con {subject} en {zoneName(pub, t.zone)} {atHour(slot)}.
        </q>
        <div className={`verdict-line ${tone}`}>
          <span className="verdict-icon" aria-hidden>
            <Icon name={STATUS_ICON[t.status]} />
          </span>
          <span>
            {t.status === 'coincide' && <>Coincide con la coartada de {subject}.</>}
            {t.status === 'contradice' && (
              <>
                Contradice la coartada de {subject}, que dijo {zoneName(pub, subjectZone)}. Al menos uno de los dos miente.
              </>
            )}
            {t.status === 'sin_contraste' && <>Sin contraste: {subject} no selló su declaración y su coartada es automática.</>}
          </span>
        </div>
      </div>
    </li>
  );
}

type Filter = 'todos' | 'contradice' | 'coincide' | 'persona';

export function TestimonyList({ pub, focus }: { pub: PublicView; focus?: string | null }) {
  const list = pub.round!.testimonies;
  const [filter, setFilter] = useState<Filter>('todos');
  const count = (st: string) => list.filter((t) => t.status === st).length;
  const active: Filter = filter === 'persona' && !focus ? 'todos' : filter;
  const shown = list
    .filter((t) => (active === 'todos' ? true : active === 'persona' ? t.subject === focus || t.by === focus : t.status === active))
    .slice()
    .reverse();
  return (
    <section className="paper tabbed" data-tab={`Testimonios (${list.length})`} aria-label="Testimonios">
      {list.length === 0 ? (
        <p className="muted small">
          Nadie ha testificado todavía. Un testimonio dice «estuve con X a tal hora» y la app lo compara con la coartada que X declaró para
          esa hora.
        </p>
      ) : (
        <>
          <p className="small muted" style={{ marginBottom: 8 }}>
            La app solo compara declaraciones: «coincide» significa que las dos versiones encajan, no que sean verdad.
          </p>
          {list.length >= 4 && (
            <div className="filter-row" role="group" aria-label="Filtrar testimonios">
              <button type="button" className="chip-player" aria-pressed={active === 'todos'} onClick={() => setFilter('todos')}>
                Todos ({list.length})
              </button>
              <button type="button" className="chip-player" aria-pressed={active === 'contradice'} onClick={() => setFilter('contradice')}>
                Contradicen ({count('contradice')})
              </button>
              <button type="button" className="chip-player" aria-pressed={active === 'coincide'} onClick={() => setFilter('coincide')}>
                Coinciden ({count('coincide')})
              </button>
              {focus && (
                <button type="button" className="chip-player" aria-pressed={active === 'persona'} onClick={() => setFilter('persona')}>
                  Con {playerName(pub, focus)}
                </button>
              )}
            </div>
          )}
          {shown.length === 0 ? (
            <p className="muted small">Ningún testimonio con este filtro.</p>
          ) : (
            <ul className="list-plain">
              {shown.map((t) => (
                <TestimonyItem key={t.id} pub={pub} t={t} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

/** The confidential file. Closed by default so nobody reads it over your shoulder. */
export function PrivateFile({ pub, priv, startOpen = false }: { pub: PublicView; priv: PrivateView; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const round = pub.round!;
  const role = priv.role!;
  const slots = round.scenario.slots;
  if (!open) {
    return (
      <button type="button" className="paper tabbed cover" data-tab="Expediente confidencial" onClick={() => setOpen(true)} aria-label="Abrir tu expediente confidencial">
        <div className="bars" aria-hidden>
          <span style={{ width: '62%' }} />
          <span style={{ width: '88%' }} />
          <span style={{ width: '45%' }} />
        </div>
        <span className="row" style={{ fontWeight: 700 }}>
          <span style={{ width: 22 }}>
            <Icon name="eye" />
          </span>
          Toca para abrir. Que nadie más vea la pantalla.
        </span>
      </button>
    );
  }
  const tone = role === 'inocente' ? 'blue' : 'red';
  const name = (id: string) => playerName(pub, id);
  const zone = (id: string) => zoneName(pub, id);
  return (
    <article className="paper tabbed reveal-in" data-tab="Expediente confidencial" aria-label="Tu expediente confidencial">
      <div className="spread" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="label">Tu papel</div>
          <div className="row" style={{ gap: 'var(--s-2)' }}>
            <Suspect tone={tone} mark={role === 'complice' ? 'pair' : undefined} />
            <Stamp tone={tone} animate>
              {ROLE_NAME[role]}
            </Stamp>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Ocultar expediente">
          <span style={{ width: 20 }}>
            <Icon name="eyeOff" />
          </span>
          Ocultar
        </button>
      </div>
      <p style={{ marginTop: 10, fontWeight: 600 }}>{ROLE_GOAL[role]}</p>
      {priv.partner && (
        <p className="small" style={{ marginTop: 6 }}>
          {priv.partner.role === 'complice'
            ? `Tu cómplice es ${name(priv.partner.id)}. Sabe que fuiste tú y gana si no te acusan.`
            : `${name(priv.partner.id)} es quien lo hizo. Ganas si no le acusan.`}
        </p>
      )}
      <hr className="rule" />
      <div className="label">Tu noche real</div>
      <div className="night-table doc-text">
        {priv.truth!.map((z, s) => (
          <div key={s} style={{ display: 'contents' }}>
            <span className="hour">{slots[s]}</span>
            <span>
              {zone(z)}
              {role === 'culpable' && s === round.scene.slot && <strong style={{ color: 'var(--stamp-ink)' }}> (aquí lo hiciste)</strong>}
            </span>
          </div>
        ))}
      </div>
      <hr className="rule" />
      <div className="label">Tus recuerdos (son ciertos, pero no recuerdas a todo el mundo)</div>
      <ul className="list-plain doc-text">
        {priv.memories!.map((m) => (
          <li key={`${m.with}-${m.slot}`} className="mem-item">
            <span>
              {slots[m.slot]}: estuviste con <b>{name(m.with)}</b> en {zone(m.zone)}.
            </span>
          </li>
        ))}
      </ul>
      {priv.encargo && (
        <>
          <hr className="rule" />
          <div className="label">Objetivo secreto (opcional, +1 punto)</div>
          <p className="doc-text">{describeEncargo(priv.encargo, name, zone)}</p>
        </>
      )}
      {isForgeryRound(pub) &&
        (role === 'culpable' && pub.phase === 'declare' ? (
          <ForgeryChooser pub={pub} priv={priv} />
        ) : role !== 'inocente' ? (
          <ForgeryNote pub={pub} priv={priv} />
        ) : null)}
    </article>
  );
}

export function CaseHeader({ pub, compact }: { pub: PublicView; compact?: boolean }) {
  const r = pub.round!;
  return (
    <section className="stack" aria-label="El caso">
      <div>
        <div className="label on-ink">
          Ronda {r.number}
          {pub.settings.rounds > 0 ? ` de ${pub.settings.rounds}` : ''}: {r.scenario.venue}
        </div>
        <h1 style={{ fontSize: compact ? 'var(--t-2xl)' : undefined }}>{r.scenario.title}</h1>
        {isForgeryRound(pub) && <ExperimentalTag pub={pub} />}
      </div>
      {!compact && <CaseScene scenarioId={r.scenario.id} />}
      {!compact && <p className="doc-text" style={{ color: 'var(--on-ink)' }}>{r.scenario.incident}</p>}
      <p className="scene-line">
        <span>El incidente ocurrió en</span>
        <b style={{ color: '#ff8a7e' }}>{zoneName(pub, r.scene.zone)}</b>
        <span>{atHour(r.scenario.slots[r.scene.slot])}.</span>
        {!compact && r.scenario.sceneNote && <span className="muted small" style={{ fontWeight: 400 }}>{r.scenario.sceneNote}</span>}
      </p>
    </section>
  );
}
