import { useState } from 'react';
import type { PrivateView, PublicView } from '../../shared/engine/views';
import { errorText, listJoin, playerName, plural, zoneName } from '../lib/text';
import { sfx } from '../lib/sound';
import { store } from '../net/store';
import { Board } from '../ui/game';
import { ActionBar, Pin, Stamp, TopBar, useAction } from '../ui/kit';

export function Vote({ pub, priv, onMenu }: { pub: PublicView; priv: PrivateView | null; onMenu: () => void }) {
  const round = pub.round!;
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

  const cast = () =>
    void run(
      () => store.send('game:vote', { target: choice }),
      () => sfx.stamp(),
      errorText,
    );

  return (
    <main className="screen">
      <TopBar title={runoff ? 'Desempate' : 'Votación'} step="Tu voto es secreto hasta el veredicto." endsAt={pub.phaseEndsAt} onMenu={onMenu} />
      <section className="stack">
        <h2>{runoff ? `Empate entre ${listJoin(runoff.candidates.map((id) => playerName(pub, id)))}` : '¿Quién lo hizo?'}</h2>
        <p className="muted">
          {runoff
            ? 'Votad otra vez, solo entre ellos. Si vuelve a haber empate, nadie es acusado y el culpable se libra.'
            : 'Si la persona más votada es la culpable, gana el grupo. Votos fuera de plazo no cuentan.'}
        </p>
      </section>

      {myVote ? (
        <section className="paper center stack" style={{ alignItems: 'center' }} aria-live="polite">
          <Stamp tone="ink" big animate>
            Votado
          </Stamp>
          <p>
            Acusas a <b>{playerName(pub, myVote)}</b>.
          </p>
          <p className="small muted">Ya no se puede cambiar.</p>
        </section>
      ) : inRound ? (
        <section className="paper" role="radiogroup" aria-label="Elige a quién acusas">
          {candidates.map((id) => {
            const p = pub.players.find((x) => x.id === id);
            if (!p) return null;
            const decl = round.declarations?.[id];
            const contra = round.testimonies.filter((t) => t.subject === id && !t.matches).length;
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
                </span>
                {contra > 0 && <span className="tag red">{plural(contra, 'contradicción', 'contradicciones')}</span>}
              </button>
            );
          })}
        </section>
      ) : (
        <p className="muted">Estás mirando esta ronda. Entras en la siguiente.</p>
      )}

      <button className="btn btn-ghost btn-block" onClick={() => setShowBoard((v) => !v)} aria-expanded={showBoard}>
        {showBoard ? 'Ocultar tablero' : 'Ver tablero y pruebas'}
      </button>
      {showBoard && <Board pub={pub} selected={boardSel} onSelect={setBoardSel} />}

      <section className="stack" aria-label="Quién ha votado">
        <div className="label on-ink">
          {voted.length} de {active.length} han votado
        </div>
        <div className="row wrap">
          {round.participants.map((id) => {
            const p = pub.players.find((x) => x.id === id);
            if (!p) return null;
            return <Pin key={id} player={p} className={voted.includes(id) ? '' : 'dim'} badge={voted.includes(id) ? '✓' : undefined} />;
          })}
        </div>
      </section>

      {inRound && !myVote && (
        <ActionBar>
          <button className="btn btn-primary" disabled={!choice || busy} onClick={cast}>
            {choice ? `Acusar a ${playerName(pub, choice)}` : 'Elige a alguien'}
          </button>
        </ActionBar>
      )}
    </main>
  );
}
