// Game-specific components: the alibi board, the private file, evidence and testimonies.
import { useState } from 'react';
import type { PrivateView, PublicTestimony, PublicView } from '../../shared/engine/views';
import { describeEncargo } from '../../shared/engine/encargos';
import { atHour, playerName, ROLE_GOAL, ROLE_NAME, zoneName } from '../lib/text';
import { Icon, Pin, Stamp } from './kit';

// Hand-drawn ballpoint ring used to circle evidence on the board.
function Ring() {
  return (
    <svg className="trace-ring" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
      <path
        d="M8 32 C 6 12, 40 4, 62 6 C 88 8, 98 22, 94 38 C 90 54, 50 58, 28 54 C 10 50, 4 40, 12 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Board({
  pub,
  selected,
  onSelect,
  flip,
}: {
  pub: PublicView;
  selected: string | null;
  onSelect: (id: string | null) => void;
  flip?: boolean;
}) {
  const round = pub.round!;
  const decl = round.declarations;
  if (!decl) return null;
  const { scenario, scene, traces, testimonies } = round;
  const conflicts = new Set<string>();
  for (const t of testimonies) {
    if (!t.matches) {
      conflicts.add(`${t.subject}|${t.slot}`);
      conflicts.add(`${t.by}|${t.slot}`);
    }
  }
  const players = round.participants.map((id) => pub.players.find((p) => p.id === id) ?? { id, name: '¿?', color: 0, connected: false });
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
                  className={`cell ${isScene ? 'scene' : ''}`}
                  aria-label={`${z.name} ${atHour(slotLabel)}: ${here.length ? here.map((p) => p.name).join(', ') : 'nadie'}${isScene ? ' (escena del crimen)' : ''}${traceIdx >= 0 ? ` (prueba ${traceIdx + 1})` : ''}`}
                >
                  {isScene && <span className="scene-tag">Escena</span>}
                  {traceIdx >= 0 && (
                    <>
                      <Ring />
                      <span className="trace-num">P{traceIdx + 1}</span>
                    </>
                  )}
                  {here.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelect(selected === p.id ? null : p.id)}
                      style={{ background: 'none', border: 0, padding: 0, lineHeight: 0 }}
                      aria-label={p.name}
                    >
                      <Pin
                        player={p}
                        style={{ ['--i' as string]: order++ }}
                        className={[
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
        <span>Rayado rojo: escena del crimen</span>
        <span>Círculo azul: prueba</span>
        <span>Aro rojo: alguien le contradice</span>
      </div>
    </section>
  );
}

export function TraceCard({ pub, index, fresh }: { pub: PublicView; index: number; fresh?: boolean }) {
  const t = pub.round!.traces[index];
  return (
    <article className={`paper trace-card ${fresh ? 'new-evidence' : ''}`} aria-label={`Prueba ${index + 1}`}>
      <div className="spread">
        <div className="label">Prueba {index + 1}. Las pruebas nunca mienten.</div>
        {fresh && <Stamp tone="blue" animate>Nueva</Stamp>}
      </div>
      <p className="doc-text">{t.text}</p>
      <p className="conclusion">
        El culpable estuvo en {zoneName(pub, t.zone)} {atHour(pub.round!.scenario.slots[t.slot])}.
      </p>
    </article>
  );
}

export function TestimonyItem({ pub, t }: { pub: PublicView; t: PublicTestimony }) {
  const by = pub.players.find((p) => p.id === t.by);
  const subjectZone = pub.round!.declarations?.[t.subject]?.zones[t.slot];
  const slot = pub.round!.scenario.slots[t.slot];
  return (
    <li className="testimony">
      {by ? <Pin player={by} /> : <span className="pin" />}
      <div>
        <div className="small" style={{ fontWeight: 700 }}>
          {playerName(pub, t.by)}
        </div>
        <q>
          Estuve con {playerName(pub, t.subject)} en {zoneName(pub, t.zone)} {atHour(slot)}.
        </q>
        {t.matches ? (
          <div className="verdict-line ok">
            <span style={{ display: 'inline-block', width: 16, verticalAlign: -3 }}>
              <Icon name="check" />
            </span>{' '}
            Cuadra con lo que declaró {playerName(pub, t.subject)}
          </div>
        ) : (
          <div className="verdict-line bad">
            <span style={{ display: 'inline-block', width: 16, verticalAlign: -3 }}>
              <Icon name="cross" />
            </span>{' '}
            No cuadra: {playerName(pub, t.subject)} dijo {zoneName(pub, subjectZone)}
          </div>
        )}
      </div>
    </li>
  );
}

export function TestimonyList({ pub }: { pub: PublicView }) {
  const list = pub.round!.testimonies;
  return (
    <section className="paper tabbed" data-tab={`Testimonios (${list.length})`} aria-label="Testimonios">
      {list.length === 0 ? (
        <p className="muted small">
          Nadie ha testificado todavía. Un testimonio es «estuve con X a tal hora»: el tablero dirá si cuadra con lo que X declaró.
        </p>
      ) : (
        <ul className="list-plain">
          {list
            .slice()
            .reverse()
            .map((t) => (
              <TestimonyItem key={t.id} pub={pub} t={t} />
            ))}
        </ul>
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
          Toca para abrir. Tápalo de miradas ajenas.
        </span>
      </button>
    );
  }
  const tone = role === 'inocente' ? 'blue' : 'red';
  const name = (id: string) => playerName(pub, id);
  const zone = (id: string) => zoneName(pub, id);
  return (
    <article className="paper tabbed reveal-in" data-tab="Expediente confidencial" aria-label="Tu expediente confidencial">
      <div className="spread" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="label">Tu papel</div>
          <Stamp tone={tone} animate>
            {ROLE_NAME[role]}
          </Stamp>
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
            ? `Tu cómplice es ${name(priv.partner.id)}. Te cubrirá si puede.`
            : `Cubres a ${name(priv.partner.id)}: es quien lo hizo.`}
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
              {role === 'culpable' && s === round.scene.slot && <strong style={{ color: 'var(--stamp-ink)' }}> · aquí lo hiciste</strong>}
            </span>
          </div>
        ))}
      </div>
      <hr className="rule" />
      <div className="label">Lo que recuerdas (es cierto, pero no lo recuerdas todo)</div>
      <ul className="list-plain doc-text">
        {priv.memories!.map((m) => (
          <li key={`${m.with}-${m.slot}`} className="mem-item">
            <span>
              {slots[m.slot]} — estuviste con <b>{name(m.with)}</b> en {zone(m.zone)}.
            </span>
          </li>
        ))}
      </ul>
      {priv.encargo && (
        <>
          <hr className="rule" />
          <div className="label">Encargo secreto (+1 punto)</div>
          <p className="doc-text">{describeEncargo(priv.encargo, name, zone)}</p>
        </>
      )}
    </article>
  );
}

export function CaseHeader({ pub, compact }: { pub: PublicView; compact?: boolean }) {
  const r = pub.round!;
  return (
    <section className="stack" aria-label="El caso">
      <div>
        <div className="label on-ink">
          Caso {r.number}: {r.scenario.venue}
        </div>
        <h1 style={{ fontSize: compact ? 'var(--t-2xl)' : undefined }}>{r.scenario.title}</h1>
      </div>
      {!compact && <p className="doc-text" style={{ color: 'var(--on-ink)' }}>{r.scenario.incident}</p>}
      <p className="scene-line">
        <span>Ocurrió en</span>
        <b style={{ color: '#ff8a7e' }}>{zoneName(pub, r.scene.zone)}</b>
        <span>{atHour(r.scenario.slots[r.scene.slot])}.</span>
        {!compact && r.scenario.sceneNote && <span className="muted small" style={{ fontWeight: 400 }}>{r.scenario.sceneNote}</span>}
      </p>
    </section>
  );
}
