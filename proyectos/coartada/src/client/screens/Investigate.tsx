import { useEffect, useRef, useState } from 'react';
import { MAX_TESTIMONIES } from '../../shared/types';
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
  const { busy, run } = useAction();
  const me = priv?.playerId ?? null;
  const inRound = !!priv?.inRound;
  const ready = !!me && round.ready.includes(me);
  const active = round.participants.filter((id) => pub.players.find((p) => p.id === id)?.connected);
  const readyCount = round.ready.filter((id) => active.includes(id)).length;

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
        step={round.traces.length < 2 ? 'Prueba 1 de 2. La segunda sale cuando acabe el tiempo o estéis listos.' : 'Las dos pruebas están fuera. Después, a votar.'}
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
      <TestimonyList pub={pub} />

      {inRound && (
        <ActionBar hint={`${readyCount} de ${active.length} listos para seguir`}>
          <button className="btn btn-paper" onClick={() => setFileOpen(true)} aria-label="Ver mi expediente" style={{ flex: 'none', padding: '0 14px' }}>
            <span style={{ width: 22 }}>
              <Icon name="folder" />
            </span>
          </button>
          <button className="btn btn-paper" onClick={() => setTestifyOpen(true)} disabled={priv!.testimoniesLeft === 0}>
            Testificar ({priv!.testimoniesLeft})
          </button>
          <button className={`btn ${ready ? 'btn-ghost' : 'btn-primary'}`} onClick={toggleReady} disabled={busy} aria-pressed={ready}>
            {ready ? 'Esperar' : round.traces.length < 2 ? 'Siguiente prueba' : 'A votar'}
          </button>
        </ActionBar>
      )}

      {local && (
        <>
          <ActionBar hint="Hablad en voz alta. Cuando queráis, pasad a lo siguiente.">
            <button className="btn btn-paper" onClick={() => setTestifyOpen(true)}>
              Testificar
            </button>
            <button className="btn btn-primary" disabled={busy} onClick={() => void run(() => store.send('game:advance'), undefined, errorText)}>
              {round.traces.length < 2 ? 'Siguiente prueba' : 'A votar'}
            </button>
          </ActionBar>
          <Sheet
            open={testifyOpen && !local.speakerPriv}
            onClose={() => setTestifyOpen(false)}
            label="¿Quién testifica?"
          >
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
        </>
      )}

      {inRound && priv && (
        <>
          <Sheet open={fileOpen} onClose={() => setFileOpen(false)} label="Tu expediente">
            <PrivateFile pub={pub} priv={priv} startOpen />
          </Sheet>
          <TestifySheet open={testifyOpen} onClose={() => setTestifyOpen(false)} pub={pub} priv={priv} />
        </>
      )}
    </main>
  );
}

function SelectedSummary({ pub, id }: { pub: PublicView; id: string }) {
  const round = pub.round!;
  const decl = round.declarations![id];
  const p = pub.players.find((x) => x.id === id);
  if (!decl || !p) return null;
  const about = round.testimonies.filter((t) => t.subject === id);
  const ok = about.filter((t) => t.matches).length;
  const bad = about.length - ok;
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
        <span className="tag blue">{ok} le respaldan</span>
        <span className="tag red">{bad} le contradicen</span>
        <span className="tag">Coincide con {traceHits} de {round.traces.length} pruebas</span>
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
          Un testimonio dice «estuve con esta persona a esta hora», en el sitio que tú declaraste. Puede ser verdad o no. Te quedan{' '}
          {priv.testimoniesLeft} de {MAX_TESTIMONIES}.
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
