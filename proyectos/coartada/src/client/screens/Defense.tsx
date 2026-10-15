// Última defensa: the most-pointed person gets a few seconds to speak before the secret
// vote. Nothing can be changed during it, and it reveals no role.
import { useState } from 'react';
import type { PrivateView, PublicView } from '../../shared/engine/views';
import { errorText, playerName } from '../lib/text';
import { store } from '../net/store';
import { Board } from '../ui/game';
import { ActionBar, Pin, TopBar, useAction, useCountdown } from '../ui/kit';

export function Defense({ pub, priv, onMenu, shared }: { pub: PublicView; priv: PrivateView | null; onMenu: () => void; shared?: boolean }) {
  const round = pub.round!;
  const d = round.defense!;
  const defender = pub.players.find((p) => p.id === d.defender);
  const me = priv?.playerId ?? null;
  const isMe = !!me && me === d.defender;
  const isHost = shared || pub.hostId === me;
  const { left } = useCountdown(pub.phaseEndsAt);
  const secs = Math.ceil(left / 1000);
  const [showBoard, setShowBoard] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const { busy, run } = useAction();
  const end = () => void run(() => store.send('game:endDefense'), undefined, errorText);
  const name = playerName(pub, d.defender);

  return (
    <main className="screen">
      <TopBar title="Última defensa" phase="defense" step="Después: votación secreta." endsAt={pub.phaseEndsAt} onMenu={onMenu} />
      <section className="paper center stack" style={{ alignItems: 'center', padding: 'var(--s-5) var(--s-4)' }} aria-live="polite">
        {defender && <Pin player={defender} size="xl" />}
        <div className="defense-name">{name}</div>
        <p className="small">
          {shared
            ? 'El grupo ha decidido escuchar a esta persona antes de votar.'
            : d.reason === 'sorteo'
              ? `Empate a ${d.pointerCount} señalamientos entre ${d.tiedCount} personas: la app ha sorteado quién se defiende.`
              : `La persona más señalada: ${d.pointerCount} ${d.pointerCount === 1 ? 'señalamiento' : 'señalamientos'}.`}
        </p>
        <div className="defense-clock" role="timer" aria-label={`Quedan ${secs} segundos de defensa`}>
          {secs}
        </div>
        <p style={{ fontWeight: 650, maxWidth: '34ch' }}>
          {isMe
            ? 'Te toca: explica en voz alta por qué te deberían creer.'
            : shared
              ? `Escuchad a ${name}.`
              : `Escucha a ${name}.`}
        </p>
        <p className="small muted" style={{ maxWidth: '40ch' }}>
          Nadie puede cambiar ya su declaración ni sus testimonios. Defenderse no revela el papel de nadie.
        </p>
      </section>

      <button className="btn btn-ghost btn-block" onClick={() => setShowBoard((v) => !v)} aria-expanded={showBoard}>
        {showBoard ? 'Ocultar tablero' : 'Ver tablero y pruebas'}
      </button>
      {showBoard && <Board pub={pub} selected={sel} onSelect={setSel} />}

      <ActionBar hint={isMe || isHost ? undefined : 'La votación empieza cuando se acabe el tiempo.'}>
        {isMe ? (
          <button className="btn btn-primary" disabled={busy} onClick={end}>
            He terminado mi defensa
          </button>
        ) : isHost ? (
          <button className="btn btn-ghost" disabled={busy} onClick={end}>
            Pasar a la votación
          </button>
        ) : null}
      </ActionBar>
    </main>
  );
}
