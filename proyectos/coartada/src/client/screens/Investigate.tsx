import { useEffect, useRef, useState } from 'react';
import { MAX_TESTIMONIES, timingsFor } from '../../shared/types';
import type { PrivateView, PublicView } from '../../shared/engine/views';
import { atHour, errorText, playerName, zoneName } from '../lib/text';
import { sfx } from '../lib/sound';
import { store } from '../net/store';
import { Board, CaseHeader, PrivateFile, TestimonyList, TraceCard } from '../ui/game';
import { ActionBar, Icon, Pin, Sheet, toast, TopBar, useAction } from '../ui/kit';

export interface LocalInvestigateProps {
  speakers: string[];
  speakerPriv: PrivateView | null;
  onSpeaker: (id: string) => void;
  onClose: () => void;
}

export function Investigate({ pub, priv, onMenu, local }: { pub: PublicView; priv: PrivateView | null; onMenu: () => void; local?: LocalInvestigateProps }) {
  const round = pub.round!;
  const [selected, setSelected] = useState<string | null>(null);
  const [testifyOpen, setTestifyOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [suspectOpen, setSuspectOpen] = useState(false);
  const { busy, run } = useAction();
  const me = priv?.playerId ?? null;
  const inRound = !!priv?.inRound;
  const ready = !!me && round.ready.includes(me);
  const active = round.participants.filter((id) => pub.players.find((p) => p.id === id)?.connected);
  const readyCount = round.ready.filter((id) => active.includes(id)).length;
  const secondStep = round.traces.length >= 2;
  const defenseSecs = timingsFor(pub.settings.pace, round.participants.length).defense;

  // Remember which traces were already seen so only new ones animate.
  const seenTraces = useRef(round.traces.length);
  const [freshTrace, setFreshTrace] = useState<number | null>(null);
  const [flip] = useState(round.traces.length === 1 && round.testimonies.length === 0);
  useEffect(() => {
    if (round.traces.length > seenTraces.current) {
      setFreshTrace(round.traces.length - 1);
      sfx.paper();
      seenTraces.current = round.traces.length;
    }
  }, [round.traces.length]);
  useEffect(() => {
    if (flip) sfx.reveal();
  }, [flip]);

  const toggleReady = () => void run(() => store.send('game:ready', { ready: !ready }), undefined, errorText);

  return (
    <main className="screen">
      <TopBar
        title="Investigación"
        phase="investigate"
        step={secondStep ? 'Prueba 2 de 2. Después: última defensa y votación.' : 'Prueba 1 de 2. Testificad y comparad coartadas.'}
        endsAt={pub.phaseEndsAt}
        onMenu={onMenu}
      />
      <CaseHeader pub={pub} compact />
      <div className="stack">
        {round.traces
          .map((_, i) => i)
          .reverse()
          .map((i) => (
            <TraceCard key={i} pub={pub} index={i} fresh={freshTrace === i} />
          ))}
      </div>
      <Board pub={pub} selected={selected} onSelect={setSelected} flip={flip} />
      {selected && <SelectedSummary pub={pub} id={selected} />}
      {inRound && priv && (
        <section className="paper tabbed" data-tab="Última defensa" aria-label="Tu sospechoso para la última defensa">
          <div className="suspect-card">
            {priv.pointer ? (
              (() => {
                const p = pub.players.find((x) => x.id === priv.pointer);
                return p ? <Pin player={p} size="lg" /> : null;
              })()
            ) : (
              <span className="pin lg" style={{ ['--c' as string]: 'var(--rule)', color: 'var(--pencil)' }} aria-hidden>
                ?
              </span>
            )}
            <div className="grow">
              <div style={{ fontWeight: 700 }}>
                {priv.pointer ? `Señalas a ${playerName(pub, priv.pointer)}` : 'Aún no señalas a nadie'}
              </div>
              <div className="small muted">
                En secreto. Al terminar la investigación, la persona más señalada tendrá {defenseSecs} s para defenderse. {round.pointedCount} de{' '}
                {round.participants.length} ya han señalado.
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 10 }} onClick={() => setSuspectOpen(true)}>
            {priv.pointer ? 'Cambiar a quién señalo' : 'Señalar a alguien'}
          </button>
        </section>
      )}
      <TestimonyList pub={pub} focus={selected} />

      {inRound && (
        <ActionBar hint={`${readyCount} de ${active.length} piden ${secondStep ? 'terminar la investigación' : 'la prueba 2'}`}>
          <button className="btn btn-paper" onClick={() => setFileOpen(true)} aria-label="Ver mi expediente" style={{ flex: 'none', padding: '0 14px' }}>
            <span style={{ width: 22 }}>
              <Icon name="folder" />
            </span>
          </button>
          <button className="btn btn-paper" onClick={() => setTestifyOpen(true)} disabled={priv!.testimoniesLeft === 0} aria-label={`Testificar, te quedan ${priv!.testimoniesLeft}`}>
            Testificar
            <span className="tag" style={{ borderColor: 'var(--kraft-2)', color: 'var(--pencil)' }}>
              {priv!.testimoniesLeft}
            </span>
          </button>
          <button className={`btn ${ready ? 'btn-ghost' : 'btn-primary'}`} onClick={toggleReady} disabled={busy} aria-pressed={ready}>
            {ready ? 'Retirar petición' : secondStep ? 'Pedir terminar' : 'Pedir prueba 2'}
          </button>
        </ActionBar>
      )}

      {local && (
        <>
          <ActionBar hint="Hablad en voz alta. Pasad a lo siguiente cuando el grupo quiera.">
            <button className="btn btn-paper" onClick={() => setTestifyOpen(true)}>
              Testificar
            </button>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => (secondStep ? setSuspectOpen(true) : void run(() => store.send('game:advance'), undefined, errorText))}
            >
              {secondStep ? 'Terminar investigación' : 'Sacar la prueba 2'}
            </button>
          </ActionBar>
          <Sheet open={testifyOpen && !local.speakerPriv} onClose={() => setTestifyOpen(false)} label="¿Quién testifica?">
            <h2>¿Quién testifica?</h2>
            <div className="row wrap" style={{ marginTop: 12 }}>
              {local.speakers.map((id) => {
                const p = pub.players.find((x) => x.id === id);
                return p ? (
                  <button key={id} className="chip-player" onClick={() => local.onSpeaker(id)}>
                    <Pin player={p} />
                    {p.name}
                  </button>
                ) : null;
              })}
            </div>
          </Sheet>
          {local.speakerPriv && (
            <TestifySheet
              open={testifyOpen}
              onClose={() => {
                setTestifyOpen(false);
                local.onClose();
              }}
              pub={pub}
              priv={local.speakerPriv}
            />
          )}
          <SuspectSheet
            open={suspectOpen}
            onClose={() => setSuspectOpen(false)}
            pub={pub}
            candidates={round.participants}
            current={null}
            shared
            seconds={defenseSecs}
            onPick={(target) =>
              void run(
                async () => {
                  if (target) {
                    const a = await store.send('game:point', { target });
                    if (!a.ok) return a;
                  }
                  return store.send('game:advance');
                },
                () => setSuspectOpen(false),
                errorText,
              )
            }
          />
        </>
      )}

      {inRound && priv && (
        <>
          <Sheet open={fileOpen} onClose={() => setFileOpen(false)} label="Tu expediente">
            <PrivateFile pub={pub} priv={priv} startOpen />
          </Sheet>
          <TestifySheet open={testifyOpen} onClose={() => setTestifyOpen(false)} pub={pub} priv={priv} />
          <SuspectSheet
            open={suspectOpen}
            onClose={() => setSuspectOpen(false)}
            pub={pub}
            candidates={round.participants.filter((id) => id !== priv.playerId)}
            current={priv.pointer}
            seconds={defenseSecs}
            onPick={(target) =>
              void run(
                () => store.send('game:point', { target }),
                () => {
                  setSuspectOpen(false);
                  toast(target ? `Señalas a ${playerName(pub, target)}.` : 'Ya no señalas a nadie.');
                },
                errorText,
              )
            }
          />
        </>
      )}
    </main>
  );
}

/** Pick who should get the last defense. Online: your secret pick. Single phone: the group decides aloud. */
function SuspectSheet({
  open,
  onClose,
  pub,
  candidates,
  current,
  onPick,
  shared,
  seconds,
}: {
  open: boolean;
  onClose: () => void;
  pub: PublicView;
  candidates: string[];
  current: string | null;
  onPick: (target: string | null) => void;
  shared?: boolean;
  seconds: number;
}) {
  return (
    <Sheet open={open} onClose={onClose} label="Señalar para la última defensa">
      <div className="stack">
        <h2>{shared ? '¿A quién señaláis?' : '¿A quién señalas?'}</h2>
        <p className="small">
          {shared
            ? `Decidid en voz alta a quién queréis oír antes de votar. Tendrá ${seconds} s para defenderse; después, votación secreta.`
            : `Tu elección es secreta y puedes cambiarla hasta que termine la investigación. La persona más señalada tendrá ${seconds} s para defenderse. Si hay empate, la app sortea entre los empatados; si nadie señala, se vota directamente.`}
        </p>
        <div className="row wrap">
          {candidates.map((id) => {
            const p = pub.players.find((x) => x.id === id);
            if (!p) return null;
            return (
              <button key={id} type="button" className="chip-player" aria-pressed={current === id} onClick={() => onPick(id)}>
                <Pin player={p} />
                {p.name}
              </button>
            );
          })}
        </div>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => onPick(null)}>
          {shared ? 'A nadie: votar ya' : 'No señalar a nadie'}
        </button>
      </div>
    </Sheet>
  );
}

function SelectedSummary({ pub, id }: { pub: PublicView; id: string }) {
  const round = pub.round!;
  const decl = round.declarations![id];
  const p = pub.players.find((x) => x.id === id);
  if (!decl || !p) return null;
  const about = round.testimonies.filter((t) => t.subject === id);
  const ok = about.filter((t) => t.status === 'coincide').length;
  const bad = about.filter((t) => t.status === 'contradice').length;
  const traceHits = round.traces.filter((t) => decl.zones[t.slot] === t.zone).length;
  return (
    <section className="paper" aria-live="polite">
      <div className="row">
        <Pin player={p} size="lg" />
        <div className="grow">
          <div style={{ fontWeight: 700 }}>{p.name} dice que estuvo en…</div>
          <div className="small doc-text">
            {decl.zones.map((z, s) => `${round.scenario.slots[s]} ${zoneName(pub, z)}`).join(', ')}
          </div>
        </div>
      </div>
      <div className="row wrap" style={{ marginTop: 8 }}>
        <span className="tag blue">{ok === 1 ? '1 testimonio coincide' : `${ok} testimonios coinciden`}</span>
        <span className="tag red">{bad === 1 ? '1 testimonio contradice' : `${bad} testimonios contradicen`}</span>
        <span className="tag">
          Encaja con {traceHits} de {round.traces.length} {round.traces.length === 1 ? 'prueba' : 'pruebas'}
        </span>
        {decl.auto && <span className="tag">Coartada automática</span>}
      </div>
    </section>
  );
}

function TestifySheet({ open, onClose, pub, priv }: { open: boolean; onClose: () => void; pub: PublicView; priv: PrivateView }) {
  const round = pub.round!;
  const [subject, setSubject] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const { busy, run } = useAction();
  const mine = priv.declared ?? [];
  const already = new Set(round.testimonies.filter((t) => t.by === priv.playerId).map((t) => `${t.subject}|${t.slot}`));
  const others = round.participants.filter((id) => id !== priv.playerId);

  useEffect(() => {
    if (!open) {
      setSubject(null);
      setSlot(null);
    }
  }, [open]);

  const publish = () =>
    void run(
      () => store.send('game:testify', { subject, slot }),
      () => {
        sfx.stamp();
        toast('Testimonio publicado.');
        onClose();
      },
      errorText,
    );

  return (
    <Sheet open={open} onClose={onClose} label="Testificar">
      <div className="stack">
        <h2>Testificar</h2>
        <p className="small">
          Un testimonio dice «estuve con esta persona a esta hora». El sitio sale de tu propia coartada para esa hora. Puede ser verdad o
          mentira: la app solo lo compara con la coartada de la otra persona. Te quedan {priv.testimoniesLeft} de {MAX_TESTIMONIES}.
        </p>
        {priv.memories && priv.memories.length > 0 && (
          <div>
            <div className="label">De tus recuerdos</div>
            <div className="row wrap">
              {priv.memories.map((m) => {
                const usable = mine[m.slot] === m.zone && !already.has(`${m.with}|${m.slot}`);
                return (
                  <button
                    key={`${m.with}-${m.slot}`}
                    type="button"
                    className="chip-player"
                    disabled={!usable}
                    aria-pressed={subject === m.with && slot === m.slot}
                    onClick={() => {
                      setSubject(m.with);
                      setSlot(m.slot);
                    }}
                    title={!usable ? 'Contradice tu propia coartada o ya lo usaste' : undefined}
                  >
                    {playerName(pub, m.with)}, {round.scenario.slots[m.slot]}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <div className="label">Estuve con…</div>
          <div className="row wrap">
            {others.map((id) => {
              const p = pub.players.find((x) => x.id === id);
              if (!p) return null;
              return (
                <button key={id} type="button" className="chip-player" aria-pressed={subject === id} onClick={() => setSubject(id)}>
                  <Pin player={p} />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="label">A las…</div>
          <div className="choices" style={{ gridTemplateColumns: '1fr' }}>
            {round.scenario.slots.map((label, s) => (
              <button
                key={label}
                type="button"
                className="choice"
                aria-pressed={slot === s}
                disabled={!!subject && already.has(`${subject}|${s}`)}
                onClick={() => setSlot(s)}
              >
                {label}, en {zoneName(pub, mine[s])}
                <span className="truth-mark">Según tu coartada</span>
              </button>
            ))}
          </div>
        </div>
        {subject && slot !== null && (
          <p className="doc-text" style={{ borderLeft: '3px solid var(--ballpoint)', paddingLeft: 10 }}>
            «Estuve con {playerName(pub, subject)} en {zoneName(pub, mine[slot])} {atHour(round.scenario.slots[slot])}.»
          </p>
        )}
        <button className="btn btn-primary btn-block" disabled={!subject || slot === null || busy || already.has(`${subject}|${slot}`)} onClick={publish}>
          Publicar testimonio
        </button>
      </div>
    </Sheet>
  );
}
