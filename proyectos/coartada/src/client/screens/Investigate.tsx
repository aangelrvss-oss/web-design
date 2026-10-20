import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MAX_TESTIMONIES, timingsFor } from '../../shared/types';
import type { PrivateView, PublicView } from '../../shared/engine/views';
import { atHour, errorText, playerName, zoneName } from '../lib/text';
import { useEvidenceNotice } from '../lib/evidence';
import { getPrefs } from '../lib/prefs';
import { sfx } from '../lib/sound';
import { store } from '../net/store';
import { Board, CaseHeader, PrivateFile, TestimonyList, TraceCard } from '../ui/game';
import { EvidenceBag, Lineup } from '../ui/illustrations';
import { ExaminePanel, isForgeryRound } from '../ui/pruebaFalsa';
import { NoteLine, NotesPanel } from './Notes';
import { ActionBar, Icon, Pin, Sheet, toast, TopBar, URGENT_SECS, useAction, useCountdown } from '../ui/kit';

export interface LocalInvestigateProps {
  speakers: string[];
  speakerPriv: PrivateView | null;
  onSpeaker: (id: string) => void;
  onClose: () => void;
  /** Hand the phone to one person so they can re-read their own file. */
  onFile?: () => void;
}

export function Investigate({ pub, priv, onMenu, local }: { pub: PublicView; priv: PrivateView | null; onMenu: () => void; local?: LocalInvestigateProps }) {
  const round = pub.round!;
  const [selected, setSelected] = useState<string | null>(null);
  // The hour of the pin that was tapped (null when chosen from the list of names under the board).
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [testifyOpen, setTestifyOpen] = useState(false);
  // Person and hour already filled in when the testimony starts from a pin; nothing is published
  // until «Publicar testimonio» is pressed in the sheet.
  const [preset, setPreset] = useState<{ subject: string; slot: number | null } | null>(null);
  const openTestify = (p: { subject: string; slot: number | null } | null) => {
    setPreset(p);
    setTestifyOpen(true);
  };
  const closeTestify = () => {
    setTestifyOpen(false);
    setPreset(null);
  };
  const [fileOpen, setFileOpen] = useState(false);
  const [fileTab, setFileTab] = useState<'file' | 'notes'>('notes');
  const [suspectOpen, setSuspectOpen] = useState(false);
  const { busy, run } = useAction();
  const me = priv?.playerId ?? null;
  const inRound = !!priv?.inRound;
  const ready = !!me && round.ready.includes(me);
  const active = round.participants.filter((id) => pub.players.find((p) => p.id === id)?.connected);
  const readyCount = round.ready.filter((id) => active.includes(id)).length;
  const secondStep = round.traces.length >= 2;
  const defenseSecs = timingsFor(pub.settings.pace, round.participants.length).defense;

  // New evidence: announced once per phone, from the room's state (lib/evidence.ts).
  const notice = useEvidenceNotice(pub);
  const [flip] = useState(round.traces.length === 1 && round.testimonies.length === 0);
  const newest = notice.indices.length ? notice.indices[notice.indices.length - 1] : null;
  useEffect(() => {
    // The first one comes with the flip of the board, which has its own sound.
    if (newest !== null && newest > 0) sfx.paper();
  }, [newest]);
  useEffect(() => {
    if (flip) sfx.reveal();
  }, [flip]);
  const lookAtEvidence = () => {
    const reduce = getPrefs().reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector('.board .cell.fresh-trace')?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    notice.look();
  };

  const toggleReady = () => void run(() => store.send('game:ready', { ready: !ready }), undefined, errorText);

  const point = useAction();
  const pointAt = (target: string | null) => point.run(() => store.send('game:point', { target }), undefined, errorText);
  const goToPointing = () => {
    const reduce = getPrefs().reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('point-panel')?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    document.querySelector<HTMLButtonElement>('#point-panel .point-option')?.focus({ preventScroll: true });
  };

  return (
    <main className="screen">
      <TopBar
        title="Investigación"
        phase="investigate"
        step={secondStep ? 'Prueba 2 de 2. Después: última defensa y votación.' : 'Prueba 1 de 2. Testificad y comparad coartadas.'}
        endsAt={pub.phaseEndsAt}
        onMenu={onMenu}
        notice={notice.banner ? <NewEvidenceNotice pub={pub} indices={notice.indices} onLook={lookAtEvidence} onClose={notice.dismiss} /> : undefined}
      />
      <CaseHeader pub={pub} compact />
      <div className="stack">
        {round.traces
          .map((_, i) => i)
          .reverse()
          .map((i) => (
            <TraceCard key={i} pub={pub} index={i} fresh={notice.indices.includes(i)} />
          ))}
      </div>
      {inRound && priv && isForgeryRound(pub) && <ExaminePanel pub={pub} priv={priv} />}
      {local?.onFile && (
        <button type="button" className="btn btn-ghost btn-block" onClick={local.onFile}>
          <span style={{ width: 22 }}>
            <Icon name="folder" />
          </span>
          Cuaderno y expediente (en privado)
        </button>
      )}
      {local && isForgeryRound(pub) && (
        <section className="paper tabbed" data-tab="Revisar prueba" aria-label="Revisión de pruebas con un solo móvil">
          <p className="small">
            Una de las pruebas puede ser falsa. Al terminar la investigación, el móvil pasará por cada persona para marcar en secreto qué prueba
            queréis revisar. Nadie verá las marcas: solo el resultado de la revisión.
          </p>
        </section>
      )}
      <Board
        pub={pub}
        selected={selected}
        selectedSlot={selectedSlot}
        onSelect={(id, slot) => {
          setSelected(id);
          setSelectedSlot(id && slot !== undefined ? slot : null);
        }}
        flip={flip}
        freshTraces={notice.indices}
      />
      {selected && (
        <SelectedSummary
          pub={pub}
          id={selected}
          slot={selectedSlot}
          pointing={inRound && priv && selected !== priv.playerId ? { current: priv.pointer, onPoint: () => void pointAt(selected) } : undefined}
          note={inRound && priv && selected !== priv.playerId ? priv.playerId : undefined}
          testify={
            (inRound && priv && selected !== priv.playerId) || local
              ? { left: priv?.inRound ? priv.testimoniesLeft : null, onTestify: () => openTestify({ subject: selected, slot: selectedSlot }) }
              : undefined
          }
        />
      )}
      {inRound && priv && <PointPanel pub={pub} priv={priv} defenseSecs={defenseSecs} />}
      <TestimonyList pub={pub} focus={selected} />

      {inRound && (
        <ActionBar
          hint={<ReadyHint pub={pub} pointed={!!priv?.pointer} ready={readyCount} active={active.length} onPoint={goToPointing} />}
        >
          <button className="btn btn-paper file-btn" onClick={() => setFileOpen(true)} aria-label="Tu cuaderno y tu expediente">
            <span style={{ width: 22 }}>
              <Icon name="folder" />
            </span>
            <span className="file-btn-caption" aria-hidden>
              Cuaderno
            </span>
          </button>
          <button className="btn btn-paper" onClick={() => openTestify(null)} disabled={priv!.testimoniesLeft === 0} aria-label={`Testificar, te quedan ${priv!.testimoniesLeft}`}>
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
            <button className="btn btn-paper" onClick={() => openTestify(null)}>
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
          <Sheet open={testifyOpen && !local.speakerPriv} onClose={closeTestify} label="¿Quién testifica?">
            <h2>¿Quién testifica?</h2>
            {preset && (
              <p className="small" style={{ marginTop: 6 }}>
                Sobre {playerName(pub, preset.subject)}
                {preset.slot !== null ? ` ${atHour(round.scenario.slots[preset.slot])}` : ''}. Elige quién da el testimonio.
              </p>
            )}
            <div className="row wrap" style={{ marginTop: 12 }}>
              {local.speakers
                .filter((id) => id !== preset?.subject)
                .map((id) => {
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
                closeTestify();
                local.onClose();
              }}
              pub={pub}
              priv={local.speakerPriv}
              preset={preset}
            />
          )}
          <SuspectSheet
            open={suspectOpen}
            onClose={() => setSuspectOpen(false)}
            pub={pub}
            candidates={round.participants}
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
          <Sheet open={fileOpen} onClose={() => setFileOpen(false)} label="Tu cuaderno y tu expediente">
            <div className="sheet-tabs" role="tablist" aria-label="Cuaderno y expediente">
              <button type="button" role="tab" id="tab-notes" aria-selected={fileTab === 'notes'} aria-controls="panel-notes" onClick={() => setFileTab('notes')}>
                Mi cuaderno
              </button>
              <button type="button" role="tab" id="tab-file" aria-selected={fileTab === 'file'} aria-controls="panel-file" onClick={() => setFileTab('file')}>
                Expediente
              </button>
            </div>
            <div role="tabpanel" id={fileTab === 'file' ? 'panel-file' : 'panel-notes'} aria-labelledby={fileTab === 'file' ? 'tab-file' : 'tab-notes'}>
              {fileTab === 'file' ? <PrivateFile pub={pub} priv={priv} startOpen /> : <NotesPanel pub={pub} me={priv.playerId} />}
            </div>
          </Sheet>
          <TestifySheet open={testifyOpen} onClose={closeTestify} pub={pub} priv={priv} preset={preset} />
        </>
      )}
    </main>
  );
}

/** Seconds left while `on` (null otherwise), so only the parts that need it tick every second. */
function useSecsLeft(endsAt: number | null, on: boolean): number | null {
  const { left } = useCountdown(on ? endsAt : null);
  return on && endsAt ? Math.ceil(left / 1000) : null;
}

/** Pointing ends with the investigation: in its last seconds, whoever hasn't pointed is called. */
function usePointCall(pub: PublicView, pointed: boolean): number | null {
  const secs = useSecsLeft(pub.phaseEndsAt, !pointed && pub.round!.traces.length >= 2);
  return secs !== null && secs <= URGENT_SECS ? secs : null;
}

/** Bottom-bar line: how many ask to move on and, while you haven't pointed, the way to the panel. */
function ReadyHint({ pub, pointed, ready, active, onPoint }: { pub: PublicView; pointed: boolean; ready: number; active: number; onPoint: () => void }) {
  const call = usePointCall(pub, pointed);
  const secondStep = pub.round!.traces.length >= 2;
  if (pointed) return <>{`${ready} de ${active} piden ${secondStep ? 'terminar la investigación' : 'la prueba 2'}`}</>;
  if (call !== null)
    return (
      <button type="button" className="hint-link urgent" onClick={onPoint}>
        <Icon name="target" />
        <span>Quedan {call} s: señala a quien crees culpable</span>
      </button>
    );
  return (
    <span className="hint-row">
      <span className="hint-count">
        {ready} de {active} lo piden
      </span>
      <button type="button" className="hint-link" onClick={onPoint}>
        <Icon name="target" />
        <span>Aún no señalas · Señalar</span>
      </button>
    </span>
  );
}

/** Pointing for the last defense, in the open: who you can point at, who you point at now (as
 *  the server has it), and what happens next. Optional, secret, changeable until the end. */
function PointPanel({ pub, priv, defenseSecs }: { pub: PublicView; priv: PrivateView; defenseSecs: number }) {
  const round = pub.round!;
  const secsLeft = usePointCall(pub, !!priv.pointer);
  const { busy, run } = useAction();
  const current = priv.pointer;
  const pick = (target: string | null) => void run(() => store.send('game:point', { target }), undefined, errorText);
  const candidates = round.participants.filter((id) => id !== priv.playerId);
  return (
    <section id="point-panel" className={`paper tabbed point-panel ${secsLeft !== null ? 'urgent' : ''}`} data-tab="Última defensa" aria-labelledby="point-title">
      <div className="point-head">
        <Lineup />
        <div>
          <h2 id="point-title" className="point-title">
            Señala a quien crees culpable
          </h2>
          <p className="small">Toca a una persona. Es secreto y puedes cambiarlo hasta que acabe la investigación.</p>
        </div>
      </div>
      {secsLeft !== null && <p className="point-urgent">Quedan {secsLeft} s de investigación y aún no has señalado.</p>}
      <div className="point-options" role="group" aria-label="A quién señalas">
        {candidates.map((id) => {
          const p = pub.players.find((x) => x.id === id);
          if (!p) return null;
          return (
            <button key={id} type="button" className="point-option" aria-pressed={current === id} disabled={busy} onClick={() => current !== id && pick(id)}>
              <Pin player={p} />
              <span className="point-name">{p.name}</span>
              {current === id && (
                <span className="point-check" aria-hidden>
                  <Icon name="check" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className={`point-status ${current ? 'done' : ''}`} role="status">
        {current ? (
          <>
            <span className="point-status-icon" aria-hidden>
              <Icon name="check" />
            </span>
            <span>
              <b>Registrado:</b> señalas a {playerName(pub, current)}.
            </span>
          </>
        ) : (
          <span>Aún no has señalado a nadie. Es opcional, pero si nadie señala no hay defensa.</span>
        )}
      </p>
      <p className="small muted">
        Al acabar la investigación, la persona más señalada tendrá {defenseSecs} s para defenderse en voz alta (si hay empate, decide un sorteo).
        Después, votación secreta. {round.pointedCount} de {round.participants.length} ya han señalado.
      </p>
      {current && (
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} disabled={busy} onClick={() => pick(null)}>
          No señalar a nadie
        </button>
      )}
    </section>
  );
}

/** The banner for evidence that has just come out (one piece, or two that came together). */
function NewEvidenceNotice({ pub, indices, onLook, onClose }: { pub: PublicView; indices: number[]; onLook: () => void; onClose: () => void }) {
  const round = pub.round!;
  const fact = (i: number) => `${zoneName(pub, round.traces[i].zone)} ${atHour(round.scenario.slots[round.traces[i].slot])}`;
  return (
    <div className="evidence-notice" role="status">
      <EvidenceBag />
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="evidence-notice-title">
          {indices.length > 1 ? 'Nuevas pruebas' : 'Nueva prueba'}{' '}
          {indices.map((i) => (
            <span key={i} className="trace-chip">
              P{i + 1}
            </span>
          ))}
        </div>
        <div className="small">
          {isForgeryRound(pub)
            ? `${indices.length > 1 ? 'Dicen' : 'Dice'} que la persona culpable estuvo en ${indices.map(fact).join(' y en ')}. Sin revisar: puede ser falsa.`
            : indices.length > 1
              ? `La persona culpable estuvo en ${indices.map(fact).join(' y en ')}.`
              : `La persona culpable estuvo en ${fact(indices[0])}.`}
        </div>
      </div>
      <button type="button" className="btn btn-sm btn-ballpoint" onClick={onLook}>
        Ver
      </button>
      <button type="button" className="notice-close" aria-label={indices.length > 1 ? 'Cerrar el aviso de las nuevas pruebas' : 'Cerrar el aviso de la nueva prueba'} onClick={onClose}>
        <Icon name="cross" />
      </button>
    </div>
  );
}

/** Single phone: the group picks aloud who gets the last defense when the investigation ends. */
function SuspectSheet({ open, onClose, pub, candidates, onPick, seconds }: { open: boolean; onClose: () => void; pub: PublicView; candidates: string[]; onPick: (target: string | null) => void; seconds: number }) {
  return (
    <Sheet open={open} onClose={onClose} label="Señalar para la última defensa">
      <div className="stack">
        <div className="point-head">
          <Lineup />
          <h2 className="point-title">Señalad a quien creéis culpable</h2>
        </div>
        <p className="small">Decidid en voz alta a quién queréis oír antes de votar. Tendrá {seconds} s para defenderse; después, votación secreta.</p>
        <div className="point-options">
          {candidates.map((id) => {
            const p = pub.players.find((x) => x.id === id);
            if (!p) return null;
            return (
              <button key={id} type="button" className="point-option" onClick={() => onPick(id)}>
                <Pin player={p} />
                <span className="point-name">{p.name}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => onPick(null)}>
          A nadie: votar ya
        </button>
      </div>
    </Sheet>
  );
}

/** What someone says, and what you can do about them: point at them (secret) or testify about
 *  them (public). Tapping a pin only opens this; nothing is sent from here without a second step. */
function SelectedSummary({
  pub,
  id,
  slot,
  pointing,
  testify,
  note,
}: {
  pub: PublicView;
  id: string;
  slot: number | null;
  pointing?: { current: string | null; onPoint: () => void };
  /** `left` is null when unknown (single phone: whoever testifies is chosen next). */
  testify?: { left: number | null; onTestify: () => void };
  /** Your id, to show your private note on this person (online players only). */
  note?: string;
}) {
  const round = pub.round!;
  const ref = useRef<HTMLElement>(null);
  // It opens under the board: bring it into view (just enough) when someone is picked.
  useEffect(() => {
    const reduce = getPrefs().reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    ref.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [id, slot]);
  const decl = round.declarations![id];
  const p = pub.players.find((x) => x.id === id);
  if (!decl || !p) return null;
  const about = round.testimonies.filter((t) => t.subject === id);
  const ok = about.filter((t) => t.status === 'coincide').length;
  const bad = about.filter((t) => t.status === 'contradice').length;
  const traceHits = round.traces.filter((t) => decl.zones[t.slot] === t.zone).length;
  return (
    <section ref={ref} className="paper summary" aria-live="polite">
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
      {(pointing || testify) && (
        <div className="summary-actions">
          {pointing &&
            (pointing.current === id ? (
              <p className="summary-done">
                <Icon name="check" />
                <span>Ya señalas a {p.name} para la última defensa.</span>
              </p>
            ) : (
              <button type="button" className="summary-action" onClick={pointing.onPoint}>
                <span className="summary-action-icon" aria-hidden>
                  <Icon name="target" />
                </span>
                <span className="grow">
                  <span className="action-tag secret">Secreto</span>
                  <b>Señalar a {p.name} para la última defensa</b>
                  <span className="small">Nadie verá a quién señalas.</span>
                </span>
              </button>
            ))}
          {testify && (
            <button type="button" className="summary-action" disabled={testify.left === 0} onClick={testify.onTestify}>
              <span className="summary-action-icon" aria-hidden>
                <Icon name="mic" />
              </span>
              <span className="grow">
                <span className="action-tag public">Público</span>
                <b>{slot !== null ? `Testificar: «Estuve con ${p.name} ${atHour(round.scenario.slots[slot])}»` : `Testificar sobre ${p.name}`}</b>
                <span className="small">{testify.left === 0 ? 'Ya no te quedan testimonios.' : 'Lo verá todo el mundo. Lo revisas antes de publicarlo.'}</span>
              </span>
            </button>
          )}
        </div>
      )}
      {note && <NoteLine pub={pub} me={note} id={id} slot={slot} />}
    </section>
  );
}

function TestifySheet({
  open,
  onClose,
  pub,
  priv,
  preset,
}: {
  open: boolean;
  onClose: () => void;
  pub: PublicView;
  priv: PrivateView;
  /** Person and hour to start with (from a pin on the board); still only a draft until published. */
  preset?: { subject: string; slot: number | null } | null;
}) {
  const round = pub.round!;
  const [subject, setSubject] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const { busy, run } = useAction();
  const mine = priv.declared ?? [];
  const already = new Set(round.testimonies.filter((t) => t.by === priv.playerId).map((t) => `${t.subject}|${t.slot}`));
  const others = round.participants.filter((id) => id !== priv.playerId);

  // Before paint, so the sheet never shows a frame without the person and hour it was opened with.
  useLayoutEffect(() => {
    const subj = open && preset && preset.subject !== priv.playerId ? preset.subject : null;
    setSubject(subj);
    // An hour already used for this person can't be published twice: leave the hour to choose.
    setSlot(subj && preset?.slot != null && !already.has(`${subj}|${preset.slot}`) ? preset.slot : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preset]);

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
