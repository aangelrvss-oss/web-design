import { useEffect, useState } from 'react';
import type { PrivateView, PublicView } from '../../shared/engine/views';
import { describeEncargo } from '../../shared/engine/encargos';
import { MIN_PLAYERS, SCORE_POINTS } from '../../shared/types';
import { caseSummary, roundFacts, type FactKind } from '../lib/summary';
import { atHour, errorText, playerName, ROLE_NAME, SCORE_TEXT, zoneName } from '../lib/text';
import { usePrefs } from '../lib/prefs';
import { sfx } from '../lib/sound';
import { store } from '../net/store';
import { ActionBar, Icon, Pin, Stamp, TopBar, useAction } from '../ui/kit';
import { ForgeryReveal, isForgeryRound } from '../ui/pruebaFalsa';

type Step = 0 | 1 | 2;

export function Result({ pub, priv, onMenu, shared }: { pub: PublicView; priv: PrivateView | null; onMenu: () => void; shared?: boolean }) {
  const r = pub.round!;
  const rv = r.reveal!;
  const o = rv.outcome;
  const prefs = usePrefs();
  const me = priv?.playerId ?? '';
  const isHost = shared || pub.hostId === me;
  const [step, setStep] = useState<Step>(prefs.reduceMotion ? 2 : 0);
  const { busy, run } = useAction();
  const name = (id: string | null) => playerName(pub, id);
  const roles = rv.roles;
  const culprit = Object.keys(roles).find((p) => roles[p] === 'culpable')!;
  const accomplice = Object.keys(roles).find((p) => roles[p] === 'complice') ?? null;
  const lastRound = pub.settings.rounds > 0 && pub.roundsPlayed >= pub.settings.rounds;
  const { story, mentions } = caseSummary(pub);
  // Who is offline now (a locked phone, or gone): shown to the host before the next round.
  const offline = pub.players.filter((p) => !p.left && !p.connected);

  // One orchestrated reveal: tally → stamp → the whole truth. Tap to skip.
  useEffect(() => {
    if (step >= 2) return;
    const h = setTimeout(() => setStep((s) => (s + 1) as Step), step === 0 ? 1700 : 1500);
    return () => clearTimeout(h);
  }, [step]);
  useEffect(() => {
    if (step === 1) sfx.verdict();
  }, [step]);

  const tally = o.runoffTally ?? o.tally;
  const max = Math.max(1, ...Object.values(tally));
  const sortedTally = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const myLines = o.score[me] ?? [];
  const myPoints = myLines.reduce((s, l) => s + l.points, 0);
  const iWon = roles[me] ? (roles[me] === 'inocente' ? o.culpritCaught : !o.culpritCaught) : null;

  return (
    <main className="screen" onClick={() => step < 2 && setStep(2)}>
      <TopBar title="Veredicto" phase="result" step={`Ronda ${r.number}: ${r.scenario.title}`} onMenu={onMenu} code={pub.code} />

      <section className="paper stack" aria-label={o.runoffTally ? 'Votos del desempate' : 'Votos'}>
        <div className="label">{o.runoffTally ? 'Votos del desempate (hubo empate en la primera votación)' : 'Votos'}</div>
        {sortedTally.map(([id, n]) => {
          const p = pub.players.find((x) => x.id === id);
          if (!p) return null;
          return (
            <div key={id} className="tally-row">
              <Pin player={p} />
              <div>
                <div className="small" style={{ fontWeight: 650 }}>
                  {p.name}
                </div>
                <div className="tally-bar">
                  <i className={id === o.accused ? 'accused' : ''} style={{ width: `${(n / max) * 100}%` }} />
                </div>
              </div>
              <span className="delta">{n}</span>
            </div>
          );
        })}
      </section>

      {step >= 1 && (
        <section className="paper center stack" style={{ alignItems: 'center', padding: 'var(--s-5) var(--s-4)' }} aria-live="polite">
          {o.accused ? (
            <>
              <p className="doc-text">El grupo acusa a</p>
              {(() => {
                const p = pub.players.find((x) => x.id === o.accused);
                return p ? <Pin player={p} size="xl" /> : null;
              })()}
              <h2>{name(o.accused)}</h2>
              <Stamp tone={o.culpritCaught ? 'red' : 'blue'} big animate>
                {o.culpritCaught ? 'Culpable' : roles[o.accused] === 'complice' ? 'Cómplice' : 'Inocente'}
              </Stamp>
            </>
          ) : (
            <>
              <h2>Nadie fue acusado</h2>
              <p className="small">
                {Object.values(o.tally).every((n) => n === 0)
                  ? 'Nadie votó a tiempo.'
                  : 'El desempate volvió a terminar en empate.'}{' '}
                Sin acusación, la persona culpable se libra.
              </p>
              <Stamp tone="ink" big animate>
                Sin veredicto
              </Stamp>
            </>
          )}
          {!o.culpritCaught && (
            <p style={{ marginTop: 'var(--s-3)' }}>
              La persona culpable era <b>{name(culprit)}</b>
              {accomplice ? (
                <>
                  , con <b>{name(accomplice)}</b> de cómplice
                </>
              ) : null}
              .
            </p>
          )}
          {o.culpritCaught && accomplice && (
            <p style={{ marginTop: 'var(--s-3)' }}>
              Su cómplice era <b>{name(accomplice)}</b>.
            </p>
          )}
          {iWon !== null && (
            <p className="small" style={{ fontWeight: 700 }}>
              {iWon ? 'Tu bando gana esta ronda.' : 'Tu bando pierde esta ronda.'} {myPoints > 0 ? `+${myPoints} para ti.` : 'Sin puntos esta vez.'}
            </p>
          )}
        </section>
      )}

      {step >= 2 && (
        <>
          <CaseFile pub={pub} />
          {isForgeryRound(pub) && <ForgeryReveal pub={pub} />}

          <section className="paper tabbed reveal-in" data-tab="Crónica del caso">
            <p className="small muted" style={{ marginBottom: 6 }}>
              Contada con un poco de guasa a partir de los hechos de arriba.
            </p>
            {story.map((line, i) => (
              <p key={i} className="doc-text" style={{ marginBottom: 6 }}>
                {line}
              </p>
            ))}
            {mentions.length > 0 && (
              <>
                <hr className="rule" />
                <ul className="list-plain">
                  {mentions.map((m) => (
                    <li key={m.title}>
                      <b>{m.title}:</b> {m.who}. <span className="muted">{m.why}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="paper tabbed" data-tab="Puntos de la ronda" aria-label="Puntos de la ronda">
            <ul className="list-plain">
              {r.participants
                .slice()
                .sort((a, b) => (o.score[b] ?? []).reduce((s, l) => s + l.points, 0) - (o.score[a] ?? []).reduce((s, l) => s + l.points, 0))
                .map((id) => {
                  const p = pub.players.find((x) => x.id === id);
                  const lines = o.score[id] ?? [];
                  const pts = lines.reduce((s, l) => s + l.points, 0);
                  return (
                    <li key={id} className="player-row" style={{ alignItems: 'flex-start' }}>
                      {p ? <Pin player={p} /> : <span className="pin" />}
                      <div className="grow">
                        <div className="spread">
                          <span style={{ fontWeight: 700 }}>
                            {name(id)} {id === me && <span className="muted">(tú)</span>}
                          </span>
                          <span className={`tag ${roles[id] === 'inocente' ? 'blue' : 'red'}`}>{ROLE_NAME[roles[id]]}</span>
                        </div>
                        {lines.length === 0 && <div className="small muted">Sin puntos</div>}
                        {lines.map((l, i) => (
                          <div key={i} className="score-line">
                            <span>{SCORE_TEXT[l.reason]}</span>
                            <span className="delta plus">+{SCORE_POINTS[l.reason]}</span>
                          </div>
                        ))}
                        {rv.encargos && o.encargoDone && (
                          <div className="small muted">
                            Encargo: {describeEncargo(rv.encargos[id], (x) => name(x), (z) => zoneName(pub, z))}{' '}
                            {o.encargoDone[id] ? '(cumplido)' : '(no cumplido)'}
                          </div>
                        )}
                      </div>
                      <span className="delta" style={{ minWidth: 28, textAlign: 'right' }}>
                        {pts > 0 ? `+${pts}` : '0'}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </section>

          <section className="paper tabbed" data-tab="Coartadas contra la verdad" aria-label="Lo que dijo cada uno y dónde estuvo">
            <div style={{ overflowX: 'auto' }} tabIndex={0} role="region" aria-label="Tabla de coartadas y ubicaciones reales">
              <table className="truth-table">
                <thead>
                  <tr>
                    <th scope="col">Quién</th>
                    {r.scenario.slots.map((s, i) => (
                      <th key={s} scope="col" style={i === r.scene.slot ? { color: 'var(--stamp-ink)' } : undefined}>
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.participants.map((id) => (
                    <tr key={id}>
                      <th scope="row" style={{ fontSize: 'var(--t-sm)', color: 'var(--graphite)' }}>
                        {name(id)}
                        {roles[id] !== 'inocente' && <span className="tag red" style={{ marginLeft: 4 }}>{ROLE_NAME[roles[id]]}</span>}
                      </th>
                      {r.scenario.slots.map((_, s) => {
                        const said = r.declarations![id].zones[s];
                        const real = rv.truth[id][s];
                        const lie = said !== real;
                        return (
                          <td key={s} className={lie ? 'lie' : ''}>
                            {lie ? (
                              <>
                                <s>{zoneName(pub, said)}</s>
                                <span className="real">{zoneName(pub, real)}</span>
                              </>
                            ) : (
                              zoneName(pub, said)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted" style={{ marginTop: 6 }}>
              Tachado: lo que declaró. Debajo: dónde estuvo de verdad. Semilla de la ronda: {rv.seed}
            </p>
          </section>

          {r.testimonies.length > 0 && (
            <section className="paper tabbed" data-tab="Testimonios: ¿eran ciertos?" aria-label="Qué testimonios eran ciertos">
              <ul className="list-plain">
                {r.testimonies.map((t) => {
                  const real = rv.truth[t.by]?.[t.slot] === t.zone && rv.truth[t.subject]?.[t.slot] === t.zone;
                  return (
                    <li key={t.id} className="score-line" style={{ padding: '6px 0', borderBottom: '1px dashed var(--rule)' }}>
                      <span>
                        <b>{name(t.by)}</b>: «Estuve con {name(t.subject)} en {zoneName(pub, t.zone)} {atHour(r.scenario.slots[t.slot])}».
                      </span>
                      <span className={`tag ${real ? 'blue' : 'red'}`} style={{ alignSelf: 'flex-start' }}>
                        {real ? 'Cierto' : 'Falso'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      {isHost && !shared && step >= 2 && !lastRound && offline.length > 0 && (
        <section className="paper tabbed" data-tab="Sin conexión" aria-label="Personas sin conexión">
          <p className="small">
            Entran en la siguiente ronda aunque ahora tengan el móvil bloqueado. Para empezarla hacen falta al menos {MIN_PLAYERS} personas
            conectadas. Si alguien se ha ido, quítalo de la partida.
          </p>
          <ul className="list-plain" style={{ marginTop: 8 }}>
            {offline.map((p) => (
              <li key={p.id} className="row" style={{ padding: '4px 0' }}>
                <Pin player={p} />
                <span className="grow" style={{ fontWeight: 650 }}>
                  {p.name}
                </span>
                <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void run(() => store.send('room:kick', { playerId: p.id }), undefined, errorText)}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ActionBar hint={step < 2 ? 'Toca la pantalla para verlo todo.' : !isHost ? `Esperando a que ${name(pub.hostId)} continúe.` : undefined}>
        {isHost && step >= 2 ? (
          <>
            {/* Not after the last round: from the room, «Empezar» would add a round past the end
                («Ronda 4 de 3»). The final standings lead back to the room for a new match. */}
            {!shared && !lastRound && (
              <button className="btn btn-ghost" style={{ flex: 'none' }} disabled={busy} onClick={() => void run(() => store.send('game:lobby'), undefined, errorText)}>
                Ir a la sala
              </button>
            )}
            <button className="btn btn-primary" disabled={busy} onClick={() => void run(() => store.send('game:next'), undefined, errorText)}>
              {lastRound ? 'Ver clasificación final' : 'Siguiente ronda'}
            </button>
          </>
        ) : step < 2 ? (
          <button className="btn btn-ghost" onClick={() => setStep(2)}>
            Ver todo
          </button>
        ) : null}
      </ActionBar>
    </main>
  );
}

const FACT_ICON: Record<FactKind, string> = { evidence: 'search', lie: 'cross', defense: 'target', testimony: 'pen', vote: 'vote' };

/** The closed case: who did it, who was accused, and the round's checked facts (no "because"). */
function CaseFile({ pub }: { pub: PublicView }) {
  const r = pub.round!;
  const rv = r.reveal!;
  const o = rv.outcome;
  const culprit = Object.keys(rv.roles).find((p) => rv.roles[p] === 'culpable')!;
  const accomplice = Object.keys(rv.roles).find((p) => rv.roles[p] === 'complice') ?? null;
  const facts = roundFacts(pub);
  const person = (id: string, stamp: string, tone: 'red' | 'blue' | 'ink') => {
    const p = pub.players.find((x) => x.id === id);
    if (!p) return null;
    return (
      <figure key={`${id}-${stamp}`} className="casefile-person">
        <Pin player={p} size="xl" />
        <figcaption>
          <b>{p.name}</b>
          <Stamp tone={tone}>{stamp}</Stamp>
        </figcaption>
      </figure>
    );
  };
  return (
    <section className="paper tabbed casefile reveal-in" data-tab="Expediente cerrado" aria-label="Expediente cerrado: hechos de la ronda">
      <div className="casefile-people">
        {person(culprit, 'Culpable', 'red')}
        {accomplice && person(accomplice, 'Cómplice', 'red')}
        {o.accused && o.accused !== culprit && person(o.accused, 'Acusación', 'ink')}
      </div>
      <h3 className="casefile-h">Hechos comprobados</h3>
      <ol className="facts">
        {facts.map((f, i) => (
          <li key={i} className={`fact ${f.kind}`}>
            <span className="fact-icon" aria-hidden>
              <Icon name={FACT_ICON[f.kind]} />
            </span>
            <span>{f.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Final({ pub, me, onMenu }: { pub: PublicView; me: string; onMenu: () => void }) {
  const isHost = pub.hostId === me;
  const { busy, run } = useAction();
  const ranked = pub.players.filter((p) => !p.left).sort((a, b) => b.score - a.score);
  const podium = [ranked[1], ranked[0], ranked[2]];
  const heights = ['70px', '104px', '52px'];
  useEffect(() => {
    sfx.verdict();
  }, []);
  return (
    <main className="screen">
      <TopBar title="Clasificación final" step={pub.roundsPlayed === 1 ? '1 ronda jugada' : `${pub.roundsPlayed} rondas jugadas`} onMenu={onMenu} code={pub.code} />
      <section className="podium" aria-label="Podio">
        {podium.map((p, i) =>
          p ? (
            <div key={p.id} className="stack" style={{ alignItems: 'center', gap: 6 }}>
              <Pin player={p} size={i === 1 ? 'xl' : 'lg'} />
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div className="step" style={{ height: heights[i], width: '100%' }}>
                {p.score}
              </div>
            </div>
          ) : (
            <div key={i} />
          ),
        )}
      </section>
      <section className="paper tabbed" data-tab="Clasificación">
        <ol className="list-plain">
          {ranked.map((p, i) => (
            <li key={p.id} className="player-row">
              <span className="delta" style={{ width: 22 }}>
                {i + 1}
              </span>
              <Pin player={p} />
              <span className="player-name">{p.name}</span>
              <span className="delta">{p.score} pts</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="paper tabbed" data-tab="Casos">
        <ol className="list-plain">
          {pub.history.map((h) => (
            <li key={h.number} className="small">
              <b>{h.scenarioTitle}.</b> Culpable: {playerName(pub, h.culprit)}. {h.caught ? 'El grupo acertó.' : 'Se libró.'}
            </li>
          ))}
        </ol>
      </section>
      <ActionBar hint={isHost ? 'Nueva partida pone todos los puntos a cero.' : `Esperando a que ${playerName(pub, pub.hostId)} empiece una nueva partida.`}>
        {isHost && (
          <button className="btn btn-primary" disabled={busy} onClick={() => void run(() => store.send('game:lobby'), undefined, errorText)}>
            Nueva partida
          </button>
        )}
      </ActionBar>
    </main>
  );
}
