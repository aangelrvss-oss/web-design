import { useEffect, useState } from 'react';
import type { PrivateView, PublicView } from '../../shared/engine/views';
import { errorText, listJoin, playerName, plural, zoneName } from '../lib/text';
import { sfx } from '../lib/sound';
import { store } from '../net/store';
import { Board } from '../ui/game';
import { shortNames } from '../lib/colors';
import { NotesButton, NoteTag } from './Notes';
import { ExaminationResult, isForgeryRound } from '../ui/pruebaFalsa';
import { ActionBar, Pin, Stamp, Token, TopBar, URGENT_SECS, useAction, useCountdown } from '../ui/kit';
import { cue } from '../lib/haptics';

export function Vote({ pub, priv, onMenu }: { pub: PublicView; priv: PrivateView | null; onMenu: () => void }) {
  const round = pub.round!;
  const short = shortNames(round.participants.map((id) => ({ id, name: pub.players.find((p) => p.id === id)?.name ?? '?' })));
  const runoff = pub.phase === 'runoff' ? round.runoff! : null;
  const me = priv?.playerId ?? '';
  const myVote = runoff ? priv?.runoffVote ?? null : priv?.vote ?? null;
  const [choice, setChoice] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const [boardSel, setBoardSel] = useState<string | null>(null);
  const { busy, run } = useAction();
  const candidates = (runoff ? runoff.candidates : round.participants).filter((id) => id !== me);
  const voted = runoff ? runoff.voted : round.voted;
  const active = round.participants.filter((id) => pub.players.find((p) => p.id === id)?.connected);
  const inRound = !!priv?.inRound;
  // The last seconds while your vote is still missing: a line in the bar (and, if on, one buzz).
  const { left } = useCountdown(inRound && !myVote ? pub.phaseEndsAt : null);
  const secs = pub.phaseEndsAt && inRound && !myVote ? Math.ceil(left / 1000) : null;
  const hurry = secs !== null && secs > 0 && secs <= URGENT_SECS;
  useEffect(() => {
    if (hurry) cue(`${pub.code}|${round.number}|${pub.phase}|vote-hurry|${me}`);
  }, [hurry, pub.code, round.number, pub.phase, me]);

  const cast = () =>
    void run(
      () => store.send('game:vote', { target: choice }),
      () => sfx.stamp(),
      errorText,
    );

  return (
    <main className="screen">
      <TopBar title={runoff ? 'Desempate' : 'Votación'} phase={pub.phase} step="Tu voto es secreto hasta el veredicto." endsAt={pub.phaseEndsAt} onMenu={onMenu} />
      <section className="stack">
        <h2>{runoff ? `Empate entre ${listJoin(runoff.candidates.map((id) => playerName(pub, id)))}` : '¿Quién lo hizo?'}</h2>
        <p className="muted">
          {runoff
            ? 'Votad otra vez, solo entre las personas empatadas. Si vuelve a haber empate, nadie es acusado y la persona culpable se libra.'
            : `Si la persona más votada es la culpable, gana el grupo de inocentes.${pub.phaseEndsAt !== null ? ' Quien no vote a tiempo no cuenta.' : ''}`}
        </p>
      </section>

      {inRound && !myVote && (
        <p className="vote-reminder" role="note">
          <b>{runoff ? 'Desempate:' : 'Tu turno:'}</b>{' '}
          {runoff ? 'vota otra vez, solo entre las personas empatadas, y confirma con «Acusar».' : 'vota a quien crees culpable: toca su nombre y confirma con «Acusar».'}
        </p>
      )}

      {isForgeryRound(pub) && <ExaminationResult pub={pub} />}

      {myVote ? (
        <section className="paper center stack" style={{ alignItems: 'center' }} aria-live="polite">
          <Stamp tone="ink" big animate>
            Votado
          </Stamp>
          <p>
            Acusas a <b>{playerName(pub, myVote)}</b>.
          </p>
          <p className="small muted">Tu voto está registrado y ya no se puede cambiar.</p>
        </section>
      ) : inRound ? (
        <section className="paper" role="radiogroup" aria-label="Elige a quién acusas">
          {candidates.map((id) => {
            const p = pub.players.find((x) => x.id === id);
            if (!p) return null;
            const decl = round.declarations?.[id];
            const contra = round.testimonies.filter((t) => t.subject === id && t.status === 'contradice').length;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={choice === id}
                className="player-row"
                onClick={() => setChoice(id)}
                style={{
                  width: '100%',
                  background: choice === id ? 'var(--graphite)' : 'transparent',
                  color: choice === id ? 'var(--paper)' : 'inherit',
                  border: 0,
                  borderBottom: '1px solid var(--rule)',
                  borderRadius: 6,
                  padding: '8px 8px',
                  textAlign: 'left',
                }}
              >
                <Pin player={p} size="lg" />
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="player-name" style={{ display: 'block' }}>
                    {p.name}
                  </span>
                  {decl && (
                    <span className="small" style={{ opacity: 0.75, display: 'block' }}>
                      {decl.zones.map((z) => zoneName(pub, z)).join(' → ')}
                    </span>
                  )}
                  {/* Under the alibi, not beside it: on a 320 px phone a side column squeezed the alibi to a word per line. */}
                  <span className="row wrap" style={{ gap: 4, marginTop: 4 }}>
                    {contra > 0 && <span className="tag red">{plural(contra, 'contradicción', 'contradicciones')}</span>}
                    <NoteTag pub={pub} me={me} id={id} />
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      ) : (
        <p className="muted">Estás viendo esta ronda sin jugar; jugarás en la siguiente.</p>
      )}

      {inRound && <NotesButton pub={pub} me={me} />}
      <button className="btn btn-ghost btn-block" onClick={() => setShowBoard((v) => !v)} aria-expanded={showBoard}>
        {showBoard ? 'Ocultar tablero' : 'Ver tablero y pruebas'}
      </button>
      {showBoard && <Board pub={pub} selected={boardSel} onSelect={setBoardSel} />}

      <section className="stack" aria-label="Quién ha votado">
        <div className="label on-ink">
          {voted.length} de {active.length} han votado
        </div>
        <div className="row wrap token-row" role="group" aria-label="Quién ha votado">
          {round.participants.map((id) => {
            const p = pub.players.find((x) => x.id === id);
            if (!p) return null;
            const done = voted.includes(id);
            return (
              <span key={id} role="img" aria-label={`${p.name}: ${done ? 'ha votado' : 'aún no ha votado'}`}>
                <Token player={p} label={short[id]} pinClass={done ? '' : 'dim'} badge={done ? '✓' : undefined} />
              </span>
            );
          })}
        </div>
      </section>

      {inRound && !myVote && (
        <ActionBar
          hint={
            <span className={hurry ? 'vote-hurry' : undefined} role={hurry ? 'alert' : undefined}>
              {hurry
                ? `Quedan ${secs} s: si no confirmas tu voto, no contará.`
                : choice
                  ? `Falta confirmar: pulsa «Acusar a ${playerName(pub, choice)}». Después no se puede cambiar.`
                  : 'Toca a una persona de la lista para elegirla.'}
            </span>
          }
        >
          <button className="btn btn-primary" disabled={!choice || busy} onClick={cast}>
            {choice ? `Acusar a ${playerName(pub, choice)}` : 'Elige a alguien'}
          </button>
        </ActionBar>
      )}
    </main>
  );
}
