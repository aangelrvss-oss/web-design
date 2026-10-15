// Single-phone mode ("pásame el móvil"). The same engine runs in the browser.
// Secret steps (alibi, vote) are done one person at a time behind a hand-off screen;
// the board and the discussion are shared. Nothing here touches the network.

import { useEffect, useMemo, useRef, useState } from 'react';
import { SCENARIOS } from '../../shared/content/scenarios';
import {
  addPlayer,
  createRoom,
  declare,
  forceAdvance,
  nextRound,
  startRound,
  testify,
  tick,
  toLobby,
  updateSettings,
  vote,
  type EngineDeps,
  type Result as EngineResult,
} from '../../shared/engine/game';
import { privateView, publicView } from '../../shared/engine/views';
import type { Ack, ClientEvent } from '../../shared/protocol';
import { MAX_PLAYERS, MIN_PLAYERS, type RoomState } from '../../shared/types';
import { errorText, PACE_TEXT } from '../lib/text';
import { store, useStore } from '../net/store';
import { ActionBar, Icon, Pin, Segmented, Switch, toast, TopBar } from '../ui/kit';
import { Declare } from './Declare';
import { Investigate } from './Investigate';
import { Vote } from './Vote';
import { Final, Result } from './Result';
import { RulesContent } from './Rules';

let n = 0;
const deps: EngineDeps = {
  scenarios: SCENARIOS,
  makeId: () => `l${++n}`,
  makeToken: () => `local-token-${n}-xxxxxxxxxxxxxxxx`,
  makeSeed: () => Math.random().toString(36).slice(2, 10),
};

export function LocalGame({ onExit }: { onExit: () => void }) {
  const [names, setNames] = useState<string[]>(['', '', '', '']);
  const [pace, setPace] = useState<'relajado' | 'normal' | 'rapido'>('normal');
  const [encargos, setEncargos] = useState(false);
  const [rules, setRules] = useState(false);
  const roomRef = useRef<RoomState | null>(null);
  const [actor, setActor] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const speakerRef = useRef<string | null>(null);
  /** Phase in which the current phone holder took the phone. */
  const actorPhase = useRef<string | null>(null);
  const [, bump] = useState(0);
  const snap = useStore();
  const room = roomRef.current;

  const sync = (who: string | null = actor) => {
    const r = roomRef.current;
    if (!r) return;
    // Secret steps have no clock in this mode: the phone takes as long as it takes to go round.
    if (r.phase === 'declare' || r.phase === 'vote' || r.phase === 'runoff') r.phaseEndsAt = null;
    store.set({
      mode: 'local',
      pub: publicView(r, SCENARIOS),
      priv: who ? privateView(r, who) : null,
      me: who ?? r.hostId,
      conn: 'online',
      clockOffset: 0,
    });
    bump((x) => x + 1);
  };

  // Route the screens' actions to the local engine, acting as the current phone holder.
  useEffect(() => {
    store.localHandler = (event: ClientEvent, payload: unknown): Ack => {
      const r = roomRef.current;
      if (!r) return { ok: false, error: 'not_in_room' };
      const now = Date.now();
      const p = payload as Record<string, never>;
      const host = r.hostId;
      let res: EngineResult;
      switch (event) {
        case 'game:declare':
          res = declare(r, actor ?? '', p.zones, p.lock, now);
          break;
        case 'game:vote':
          res = vote(r, actor ?? '', p.target, now);
          break;
        case 'game:testify':
          res = testify(r, actor ?? speakerRef.current ?? '', p.subject, p.slot, now);
          break;
        case 'game:advance':
          res = forceAdvance(r, host, now);
          break;
        case 'game:next':
          res = nextRound(r, host, now, deps);
          break;
        case 'game:lobby':
          res = toLobby(r, host, now);
          break;
        default:
          return { ok: false, error: 'invalid' };
      }
      sync();
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    };
    return () => {
      store.localHandler = null;
    };
  });

  // Investigation is the only timed step here.
  useEffect(() => {
    const h = setInterval(() => {
      const r = roomRef.current;
      if (r && r.phase === 'investigate' && tick(r, Date.now())) sync(null);
    }, 500);
    return () => clearInterval(h);
  });

  // Leaving from the menu clears the store: go back home.
  useEffect(() => {
    if (room && snap.mode !== 'local') {
      roomRef.current = null;
      onExit();
    }
  }, [snap.mode, room, onExit]);

  useEffect(
    () => () => {
      if (store.snap.mode === 'local') store.set({ mode: 'online', pub: null, priv: null, me: null });
    },
    [],
  );

  const start = () => {
    const list = names.map((x) => x.trim()).filter(Boolean);
    if (new Set(list.map((x) => x.toLowerCase())).size !== list.length) return toast('Hay nombres repetidos.', true);
    if (list.length < MIN_PLAYERS) return toast(`Hacen falta al menos ${MIN_PLAYERS} nombres.`, true);
    const created = createRoom('MOVIL', list[0], Date.now(), deps);
    if (!created.ok) return;
    const r = created.room;
    for (const x of list.slice(1)) addPlayer(r, x, Date.now(), deps);
    updateSettings(r, r.hostId, { pace, encargos, rounds: 5 }, Date.now());
    const res = startRound(r, r.hostId, Date.now(), deps);
    if (!res.ok) return toast(errorText(res.error), true);
    roomRef.current = r;
    setActor(null);
    sync(null);
  };

  // ───────────── setup ─────────────
  if (!room) {
    return (
      <main className="screen">
        <TopBar title="Un solo móvil" step="Os lo vais pasando para las partes secretas." />
        <section className="paper tabbed stack" data-tab="Quién juega">
          {names.map((v, i) => (
            <div key={i} className="row">
              <input
                className="input"
                style={{ background: '#fff8', color: 'var(--graphite)', borderColor: 'var(--rule)' }}
                value={v}
                maxLength={16}
                placeholder={`Persona ${i + 1}`}
                aria-label={`Nombre ${i + 1}`}
                onChange={(e) => setNames((list) => list.map((x, k) => (k === i ? e.target.value : x)))}
              />
              {names.length > MIN_PLAYERS && (
                <button className="icon-btn" style={{ background: 'transparent', color: 'var(--graphite)', borderColor: 'var(--rule)' }} aria-label={`Quitar persona ${i + 1}`} onClick={() => setNames((l) => l.filter((_, k) => k !== i))}>
                  <Icon name="close" />
                </button>
              )}
            </div>
          ))}
          {names.length < MAX_PLAYERS && (
            <button className="btn btn-ghost" onClick={() => setNames((l) => [...l, ''])}>
              Añadir persona
            </button>
          )}
        </section>
        <div className="field">
          <span className="label on-ink">Tiempo de investigación</span>
          <Segmented label="Ritmo" value={pace} onChange={setPace} options={(['relajado', 'normal', 'rapido'] as const).map((v) => ({ value: v, label: PACE_TEXT[v] }))} />
        </div>
        <Switch label="Encargos secretos" hint="Una misión extra de +1 punto para cada cual." checked={encargos} onChange={setEncargos} />
        <button className="link-btn" onClick={() => setRules((v) => !v)}>
          {rules ? 'Ocultar reglas' : 'Cómo se juega'}
        </button>
        {rules && (
          <div className="paper">
            <RulesContent />
          </div>
        )}
        <ActionBar>
          <button className="btn btn-ghost" style={{ flex: 'none' }} onClick={onExit}>
            Volver
          </button>
          <button className="btn btn-primary" onClick={start}>
            Empezar
          </button>
        </ActionBar>
      </main>
    );
  }

  const pub = snap.pub;
  if (!pub || snap.mode !== 'local') return null;
  const openMenu = () => {
    if (confirm('¿Terminar la partida en este móvil?')) void store.leave();
  };

  // Who still has to do a secret step in this phase?
  const round = room.round;
  const pendingSecret = (() => {
    if (!round) return [];
    if (room.phase === 'declare') return round.participants.filter((id) => !round.declarations[id]);
    if (room.phase === 'vote') return round.participants.filter((id) => !round.votes[id]);
    if (room.phase === 'runoff') return round.participants.filter((id) => !round.runoff!.votes[id]);
    return [];
  })();

  if (pendingSecret.length > 0 || (actor && (room.phase === 'declare' || room.phase === 'vote' || room.phase === 'runoff'))) {
    const current = actor && round?.participants.includes(actor) ? actor : null;
    const done =
      current &&
      (actorPhase.current !== room.phase ||
        (room.phase === 'declare' && round!.declarations[current]) ||
        (room.phase === 'vote' && round!.votes[current]) ||
        (room.phase === 'runoff' && round!.runoff!.votes[current]));
    if (!current || !revealed) {
      const nextId = current ?? pendingSecret[0];
      const p = room.players.find((x) => x.id === nextId)!;
      return (
        <Handoff
          name={p.name}
          color={p.color}
          what={room.phase === 'declare' ? 'declarar su coartada' : 'votar en secreto'}
          remaining={pendingSecret.length}
          onReady={() => {
            actorPhase.current = room.phase;
            setActor(nextId);
            setRevealed(true);
            sync(nextId);
          }}
          onMenu={openMenu}
        />
      );
    }
    if (done) {
      return (
        <main className="screen" style={{ justifyContent: 'center' }}>
          <section className="paper center stack" style={{ alignItems: 'center' }}>
            <h2>Hecho</h2>
            <p>Pulsa para tapar la pantalla antes de pasar el móvil.</p>
          </section>
          <ActionBar>
            <button
              className="btn btn-primary"
              onClick={() => {
                setActor(null);
                setRevealed(false);
                sync(null);
              }}
            >
              Ocultar y pasar
            </button>
          </ActionBar>
        </main>
      );
    }
    const priv = snap.priv!;
    if (room.phase === 'declare') return <Declare pub={pub} priv={priv} onMenu={openMenu} />;
    return <Vote key={room.phase} pub={pub} priv={priv} onMenu={openMenu} />;
  }

  // The last secret action just closed the step: hide that person's screen and let
  // the group reveal the next public moment together.
  if (actor) {
    const toBoard = room.phase === 'investigate';
    return (
      <main className="screen" style={{ justifyContent: 'center' }}>
        <section className="paper center stack" style={{ alignItems: 'center', padding: 'var(--s-6) var(--s-4)' }}>
          <h2>{toBoard ? 'Todas las coartadas, selladas' : 'Todos los votos, dentro'}</h2>
          <p>{toBoard ? 'Poned el móvil en el centro de la mesa y destapadlas a la vez.' : 'Poned el móvil donde lo veáis todos.'}</p>
        </section>
        <ActionBar>
          <button
            className="btn btn-primary"
            onClick={() => {
              setActor(null);
              setRevealed(false);
              sync(null);
            }}
          >
            {toBoard ? 'Destapar coartadas' : 'Ver el veredicto'}
          </button>
        </ActionBar>
      </main>
    );
  }

  switch (room.phase) {
    case 'investigate':
      return <LocalInvestigate pub={pub} onMenu={openMenu} room={room} speakerRef={speakerRef} />;
    case 'result':
      return <Result key={round?.number} pub={pub} priv={null} onMenu={openMenu} shared />;
    case 'final':
      return <Final pub={pub} me={room.hostId} onMenu={openMenu} />;
    case 'lobby': {
      // "Nueva partida" from the final screen: straight into a new round with the same people.
      const res = startRound(room, room.hostId, Date.now(), deps);
      if (!res.ok) toast(errorText(res.error), true);
      queueMicrotask(() => sync(null));
      return null;
    }
    default:
      return null;
  }
}

function Handoff({ name, color, what, remaining, onReady, onMenu }: { name: string; color: number; what: string; remaining: number; onReady: () => void; onMenu: () => void }) {
  return (
    <main className="screen" style={{ justifyContent: 'center' }}>
      <TopBar title="Pasa el móvil" step={`Faltan ${remaining}`} onMenu={onMenu} />
      <section className="paper center stack" style={{ alignItems: 'center', padding: 'var(--s-6) var(--s-4)' }}>
        <Pin player={{ name, color }} size="xl" />
        <h2>Para {name}</h2>
        <p>Le toca {what}. Que nadie más mire la pantalla.</p>
      </section>
      <ActionBar>
        <button className="btn btn-primary" onClick={onReady}>
          Soy {name}
        </button>
      </ActionBar>
    </main>
  );
}

function LocalInvestigate({
  pub,
  room,
  speakerRef,
  onMenu,
}: {
  pub: NonNullable<ReturnType<typeof useStore>['pub']>;
  room: RoomState;
  speakerRef: React.MutableRefObject<string | null>;
  onMenu: () => void;
}) {
  const [speaker, setSpeaker] = useState<string | null>(null);
  const round = room.round!;
  // No memories here: the board is on a shared screen.
  const speakerPriv = useMemo(
    () => (speaker ? { ...privateView(room, speaker), memories: [] } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [speaker, room, round.testimonies.length],
  );
  return (
    <Investigate
      pub={pub}
      priv={null}
      onMenu={onMenu}
      local={{
        speakers: round.participants,
        speakerPriv,
        onSpeaker: (id) => {
          speakerRef.current = id;
          setSpeaker(id);
        },
        onClose: () => {
          speakerRef.current = null;
          setSpeaker(null);
        },
      }}
    />
  );
}
