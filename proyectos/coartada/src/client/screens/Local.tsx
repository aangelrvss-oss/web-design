import { AVATARS, isAvatar, type AvatarId } from '../../shared/characters';
// Single-phone mode ("pásame el móvil"). The same engine runs in the browser.
// Secret steps (alibi, vote) are done one person at a time behind a hand-off screen;
// the board and the discussion are shared. Nothing here touches the network.

import { useEffect, useMemo, useRef, useState } from 'react';
import { SCENARIOS } from '../../shared/content/scenarios';
import {
  addPlayer,
  chooseAvatar,
  createRoom,
  declare,
  endDefense,
  examine,
  forceAdvance,
  forge,
  nextRound,
  point,
  startRound,
  testify,
  tick,
  toLobby,
  updateSettings,
  vote,
  type EngineDeps,
  type Result as EngineResult,
} from '../../shared/engine/game';
import { privateView, publicView, type PrivateView, type PublicView } from '../../shared/engine/views';
import type { Ack, ClientEvent } from '../../shared/protocol';
import { FORGERY_CHANCES, MAX_PLAYERS, MIN_PLAYERS, type ForgeryChance, type RoomState } from '../../shared/types';
import { errorText, PACE_TEXT } from '../lib/text';
import { store, useStore } from '../net/store';
import { ActionBar, Icon, openGuide, Pin, Segmented, Sheet, Switch, toast, TopBar } from '../ui/kit';
import { PrivateFile, TraceCard } from '../ui/game';
import { avatarLabel, PortraitCard } from '../ui/portraits';
import { clearNotes, LOCAL_CODE } from '../lib/notes';
import { useDefenseEndCue } from '../lib/haptics';
import { NotesPanel } from './Notes';
import { ExperimentalTag, ForgeryNote } from '../ui/pruebaFalsa';
import { setPrefs, usePrefs } from '../lib/prefs';
import { Declare } from './Declare';
import { Investigate } from './Investigate';
import { Defense } from './Defense';
import { Vote } from './Vote';
import { Final, Result } from './Result';

/** One row of the setup: a stable key, so a removed row takes its character with it. */
interface SetupRow {
  key: number;
  name: string;
  avatar: AvatarId | null;
}
let rowKey = 0;
const firstFree = (rows: SetupRow[]): AvatarId | null => AVATARS.find((a) => !rows.some((r) => r.avatar === a)) ?? null;
const newRows = (count: number): SetupRow[] => {
  const rows: SetupRow[] = [];
  for (let i = 0; i < count; i++) rows.push({ key: ++rowKey, name: '', avatar: firstFree(rows) });
  return rows;
};
/** The last setup, in memory only: «Volver» or a finished game bring it back as it was. */
let lastSetup: SetupRow[] | null = null;
/** A remembered setup, cleaned: characters that no longer exist or appear twice are freed. */
const restoreRows = (rows: SetupRow[]): SetupRow[] => {
  const seen = new Set<string>();
  return rows.map((r) => {
    const ok = r.avatar && isAvatar(r.avatar) && !seen.has(r.avatar);
    if (ok) seen.add(r.avatar!);
    return { ...r, avatar: ok ? r.avatar : null };
  });
};

let n = 0;
const deps: EngineDeps = {
  scenarios: SCENARIOS,
  makeId: () => `l${++n}`,
  makeToken: () => `local-token-${n}-xxxxxxxxxxxxxxxx`,
  makeSeed: () => Math.random().toString(36).slice(2, 10),
};

export function LocalGame({ onExit }: { onExit: () => void }) {
  const [rows, setRowsState] = useState<SetupRow[]>(() => (lastSetup ? restoreRows(lastSetup) : newRows(MIN_PLAYERS)));
  const setRows = (next: (rows: SetupRow[]) => SetupRow[]) =>
    setRowsState((cur) => {
      const v = next(cur);
      lastSetup = v;
      return v;
    });
  /** Whose character is being chosen (row key), or null. */
  const [picking, setPicking] = useState<number | null>(null);
  const [pace, setPace] = useState<'relajado' | 'normal' | 'rapido'>('normal');
  const [encargos, setEncargos] = useState(false);
  const [forgeryRules, setForgeryRules] = useState(false);
  const [forgeryChance, setForgeryChance] = useState<ForgeryChance>(100);
  const [menuOpen, setMenuOpen] = useState(false);
  const prefs = usePrefs();
  const roomRef = useRef<RoomState | null>(null);
  const [actor, setActor] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const speakerRef = useRef<string | null>(null);
  /** Phase in which the current phone holder took the phone. */
  const actorPhase = useRef<string | null>(null);
  /**
   * Prueba falsificable: the secret examination marks are collected at the end of the investigation,
   * one person at a time (with one phone the live count of the multiplayer panel would show who
   * marked what). `queue` is who still has to mark; `revealed` whether the first of them has the phone.
   */
  const [ballot, setBallot] = useState<{ round: number; queue: string[]; revealed: boolean } | null>(null);
  const [, bump] = useState(0);
  const snap = useStore();
  const room = roomRef.current;

  const ballotOpen = (r: RoomState | null) => !!ballot && !!r?.round && ballot.round === r.round.number && r.phase === 'investigate';
  /** Variant rounds only: stop the clock and pass the phone round for the examination marks. */
  const needsBallot = (r: RoomState) => r.phase === 'investigate' && r.round?.variant === 'prueba_falsa' && r.round.tracesRevealed >= 2 && !ballotOpen(r);
  const openBallot = (r: RoomState) => {
    r.phaseEndsAt = null;
    setBallot({ round: r.round!.number, queue: r.round!.participants.slice(), revealed: false });
  };

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
        case 'game:forge':
          res = forge(r, actor ?? '', p.forgery, now);
          break;
        case 'game:advance':
          // With the experimental rules the investigation doesn't end yet: first the secret marks.
          if (needsBallot(r)) {
            openBallot(r);
            res = { ok: true };
          } else res = forceAdvance(r, host, now);
          break;
        case 'game:point': {
          // Single phone: the group picks aloud, so one pointer is enough. It is recorded
          // under any participant other than the person picked (nobody can point at self).
          const target = p.target as string;
          const by = r.round?.participants.find((id) => id !== target) ?? host;
          res = point(r, by, target, now);
          break;
        }
        case 'game:endDefense':
          res = endDefense(r, host, now);
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

  // Investigation and the last defense are the only timed steps here.
  useEffect(() => {
    const h = setInterval(() => {
      const r = roomRef.current;
      if (r && needsBallot(r) && r.phaseEndsAt !== null && Date.now() >= r.phaseEndsAt) {
        openBallot(r);
        sync(null);
        return;
      }
      if (r && (r.phase === 'investigate' || r.phase === 'defense') && tick(r, Date.now())) sync(null);
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

  // "Nueva partida" from the final screen lands in the lobby: deal a new round to the same people.
  useEffect(() => {
    const r = roomRef.current;
    if (r && r.phase === 'lobby') {
      clearNotes(LOCAL_CODE);
      const res = startRound(r, r.hostId, Date.now(), deps);
      if (!res.ok) toast(errorText(res.error), true);
      sync(null);
    }
  });

  useEffect(
    () => () => {
      clearNotes(LOCAL_CODE);
      if (store.snap.mode === 'local') store.set({ mode: 'online', pub: null, priv: null, me: null });
    },
    [],
  );

  const start = () => {
    const filled = rows.map((x) => ({ ...x, name: x.name.trim() })).filter((x) => x.name);
    const list = filled.map((x) => x.name);
    if (new Set(list.map((x) => x.toLowerCase())).size !== list.length) return toast('Hay nombres repetidos: cada persona necesita un nombre distinto.', true);
    if (list.length < MIN_PLAYERS) return toast(`Hacen falta al menos ${MIN_PLAYERS} nombres.`, true);
    const created = createRoom(LOCAL_CODE, list[0], Date.now(), deps);
    if (!created.ok) return;
    const r = created.room;
    for (const x of list.slice(1)) addPlayer(r, x, Date.now(), deps);
    // The characters chosen here, through the same rule as the lobby (one per person): the
    // automatic ones are cleared first so a choice never collides with a default.
    for (const p of r.players) p.avatar = null;
    r.players.forEach((p, i) => {
      const a = filled[i].avatar;
      if (a) chooseAvatar(r, p.id, a, Date.now());
    });
    updateSettings(r, r.hostId, { pace, encargos, rounds: 5, variant: forgeryRules ? 'prueba_falsa' : null, forgeryChance }, Date.now());
    const res = startRound(r, r.hostId, Date.now(), deps);
    if (!res.ok) return toast(errorText(res.error), true);
    clearNotes(LOCAL_CODE);
    roomRef.current = r;
    setActor(null);
    setBallot(null);
    sync(null);
  };

  useDefenseEndCue(snap.mode === 'local' ? snap.pub : null);

  // ───────────── setup ─────────────
  if (!room) {
    return (
      <main className="screen">
        <TopBar title="Un solo móvil" step="Os lo vais pasando para las partes secretas." />
        <section className="paper tabbed stack" data-tab="Quién juega">
          <p className="small muted">Toca el dibujo de cada persona para elegir su personaje. Cada personaje es de una sola persona.</p>
          {rows.map((row, i) => {
            const who = row.name.trim() || `Persona ${i + 1}`;
            return (
              <div key={row.key} className="row setup-row">
                <button
                  type="button"
                  className="setup-avatar"
                  aria-label={`Personaje de ${who}: ${row.avatar ? avatarLabel(row.avatar) : 'sin elegir'}. Cambiar`}
                  onClick={() => setPicking(row.key)}
                >
                  <Pin player={{ name: who, color: i, avatar: row.avatar }} size="lg" />
                  <span className="setup-avatar-edit" aria-hidden>
                    <Icon name="pen" />
                  </span>
                </button>
                <input
                  className="input"
                  style={{ background: '#fff8', color: 'var(--graphite)', borderColor: 'var(--rule)' }}
                  value={row.name}
                  maxLength={16}
                  placeholder={`Persona ${i + 1}`}
                  aria-label={`Nombre ${i + 1}`}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRows((list) => list.map((x) => (x.key === row.key ? { ...x, name: v } : x)));
                  }}
                />
                {rows.length > MIN_PLAYERS && (
                  <button
                    className="icon-btn"
                    style={{ background: 'transparent', color: 'var(--graphite)', borderColor: 'var(--rule)' }}
                    aria-label={`Quitar persona ${i + 1}`}
                    onClick={() => setRows((l) => l.filter((x) => x.key !== row.key))}
                  >
                    <Icon name="close" />
                  </button>
                )}
              </div>
            );
          })}
          {rows.length < MAX_PLAYERS && (
            <button className="btn btn-ghost" onClick={() => setRows((l) => [...l, { key: ++rowKey, name: '', avatar: firstFree(l) }])}>
              Añadir persona
            </button>
          )}
        </section>
        <SetupCharacterSheet
          rows={rows}
          editing={picking}
          onClose={() => setPicking(null)}
          onPick={(key, avatar) => {
            setRows((list) => (list.some((x) => x.key !== key && x.avatar === avatar) ? list : list.map((x) => (x.key === key ? { ...x, avatar } : x))));
            setPicking(null);
          }}
        />
        <div className="field">
          <span className="label on-ink">Ritmo (tiempo de investigación y de defensa)</span>
          <Segmented label="Ritmo" value={pace} onChange={setPace} options={(['relajado', 'normal', 'rapido'] as const).map((v) => ({ value: v, label: PACE_TEXT[v] }))} />
          <p className="small muted" style={{ marginTop: 6 }}>
            Con un solo móvil, declarar y votar no tienen tiempo límite: cada cual tarda lo que tarde el móvil en llegarle. Al terminar la
            investigación, el grupo decide en voz alta a quién escucha en la última defensa.
          </p>
        </div>
        <Switch
          label="Objetivos secretos"
          hint="Cada persona recibe una misión extra de +1 punto; alguna obliga a mentir. No cambian quién gana la ronda."
          checked={encargos}
          onChange={setEncargos}
        />
        <Switch
          label="Prueba falsificable · experimental"
          hint="La persona culpable puede falsificar una de las dos pruebas; al acabar la investigación, cada persona marca en secreto qué prueba revisar. Desactivado = juego normal."
          checked={forgeryRules}
          onChange={setForgeryRules}
        />
        {forgeryRules && (
          <div className="field">
            <span className="label on-ink">Oportunidad de falsificar (experimental)</span>
            <Segmented label="Oportunidad de falsificar" value={forgeryChance} onChange={setForgeryChance} options={FORGERY_CHANCES.map((v) => ({ value: v, label: `${v} %` }))} />
            <p className="small muted" style={{ marginTop: 6 }}>
              Probabilidad de que la persona culpable pueda falsificar en cada ronda; si la tiene, decide si la usa. Son condiciones de prueba para comparar
              con grupos reales, ninguna es mejor de antemano. Nadie más sabe si la tuvo hasta el veredicto.
            </p>
          </div>
        )}
        <button className="link-btn" onClick={openGuide}>
          Guía rápida
        </button>
        <ActionBar>
          <button className="btn btn-ghost" style={{ flex: 'none' }} onClick={onExit}>
            Volver
          </button>
          <button className="btn btn-primary" onClick={start}>
            Empezar partida
          </button>
        </ActionBar>
      </main>
    );
  }

  const pub = snap.pub;
  if (!pub || snap.mode !== 'local') return null;
  const openMenu = () => setMenuOpen(true);

  const renderRoom = (): React.ReactNode => {

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
            avatar={p.avatar}
            what={room.phase === 'declare' ? 'declarar' : 'votar'}
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
      if (room.phase === 'declare') return <Declare pub={pub} priv={priv} onMenu={openMenu} fileOpen />;
      return <Vote key={room.phase} pub={pub} priv={priv} onMenu={openMenu} />;
    }

    // The last secret action just closed the step: hide that person's screen and let
    // the group reveal the next public moment together.
    if (actor) {
      const toBoard = room.phase === 'investigate';
      return (
        <main className="screen" style={{ justifyContent: 'center' }}>
          <section className="paper center stack" style={{ alignItems: 'center', padding: 'var(--s-6) var(--s-4)' }}>
            <h2>{toBoard ? 'Todas las declaraciones, selladas' : 'Todos los votos, dentro'}</h2>
            <p>{toBoard ? 'Poned el móvil en el centro de la mesa y revelad las coartadas a la vez.' : 'Poned el móvil donde lo veáis todos.'}</p>
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
              {toBoard ? 'Revelar coartadas' : 'Ver el veredicto'}
            </button>
          </ActionBar>
        </main>
      );
    }

    if (ballotOpen(room)) {
      const queue = ballot!.queue;
      if (queue.length === 0) {
        return (
          <main className="screen" style={{ justifyContent: 'center' }}>
            <section className="paper center stack" style={{ alignItems: 'center', padding: 'var(--s-6) var(--s-4)' }}>
              <h2>Todas las marcas, selladas</h2>
              <p>Poned el móvil donde lo veáis todos: se revisa la prueba más marcada.</p>
            </section>
            <ActionBar>
              <button
                className="btn btn-primary"
                onClick={() => {
                  forceAdvance(room, room.hostId, Date.now());
                  setBallot(null);
                  sync(null);
                }}
              >
                Ver la revisión
              </button>
            </ActionBar>
          </main>
        );
      }
      const id = queue[0];
      const p = room.players.find((x) => x.id === id)!;
      if (!ballot!.revealed) {
        return (
          <Handoff
            name={p.name}
            color={p.color}
            avatar={p.avatar}
            what="revisar"
            remaining={queue.length}
            onReady={() => setBallot({ ...ballot!, revealed: true })}
            onMenu={openMenu}
          />
        );
      }
      return (
        <ExamineBallot
          key={id}
          pub={pub}
          priv={privateView(room, id)}
          onMenu={openMenu}
          onDone={(index) => {
            const res = examine(room, id, index, Date.now());
            if (!res.ok) return toast(errorText(res.error), true);
            setBallot({ ...ballot!, queue: queue.slice(1), revealed: false });
            sync(null);
          }}
        />
      );
    }

    switch (room.phase) {
      case 'investigate':
        return <LocalInvestigate pub={pub} onMenu={openMenu} room={room} speakerRef={speakerRef} />;
      case 'defense':
        return <Defense pub={pub} priv={null} onMenu={openMenu} shared />;
      case 'result':
        return <Result key={round?.number} pub={pub} priv={null} onMenu={openMenu} shared />;
      case 'final':
        return <Final pub={pub} me={room.hostId} onMenu={openMenu} />;
      default:
        return null;
    }
  };

  return (
    <>
      {renderRoom()}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} tone="ink" label="Menú">
        <div className="stack">
          <h2>Menú</h2>
          <button
            className="btn btn-ghost btn-block"
            onClick={() => {
              setMenuOpen(false);
              openGuide();
            }}
          >
            Guía rápida
          </button>
          <Switch label="Reducir animaciones" checked={prefs.reduceMotion} onChange={(reduceMotion) => setPrefs({ reduceMotion })} />
        <Switch
          label="Vibración"
          hint="Un toque breve cuando quedan pocos segundos para votar y al acabar la última defensa. Solo en móviles que lo admiten; la pantalla siempre lo avisa también."
          checked={prefs.vibrate}
          onChange={(vibrate) => setPrefs({ vibrate })}
        />
          <button className="btn btn-ghost btn-block" onClick={() => setMenuOpen(false)}>
            Seguir jugando
          </button>
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              setMenuOpen(false);
              void store.leave();
            }}
          >
            Terminar la partida
          </button>
        </div>
      </Sheet>
    </>
  );
}

/** Setup: choose one person's character. Taken ones say whose they are and can't be picked. */
function SetupCharacterSheet({
  rows,
  editing,
  onClose,
  onPick,
}: {
  rows: SetupRow[];
  editing: number | null;
  onClose: () => void;
  onPick: (key: number, avatar: AvatarId) => void;
}) {
  const idx = rows.findIndex((r) => r.key === editing);
  const row = idx >= 0 ? rows[idx] : null;
  const label = (r: SetupRow, i: number) => r.name.trim() || `Persona ${i + 1}`;
  const owners = new Map(rows.map((r, i) => [r.avatar, { key: r.key, name: label(r, i) }] as const).filter(([a]) => !!a));
  return (
    <Sheet open={!!row} onClose={onClose} label="Elegir personaje">
      {row && (
        <div className="stack">
          <div className="row" style={{ gap: 10 }}>
            <Pin player={{ name: label(row, idx), color: idx, avatar: row.avatar }} size="lg" />
            <div style={{ minWidth: 0 }}>
              <div className="label">Eligiendo personaje para</div>
              <h2 className="picker-title" style={{ overflowWrap: 'anywhere' }}>
                {label(row, idx)}
              </h2>
            </div>
          </div>
          <p className="small">Es solo un dibujo: no cambia nada del juego. Los que ya tienen dueño aparecen apagados, con su nombre.</p>
          <div className="picker-grid" role="group" aria-label="Personajes">
            {AVATARS.map((a) => {
              const who = owners.get(a);
              const isMine = who?.key === row.key;
              const taken = !!who && !isMine;
              return (
                <button
                  key={a}
                  type="button"
                  className={`picker-card ${isMine ? 'mine' : ''} ${taken ? 'taken' : ''}`}
                  aria-pressed={isMine}
                  disabled={taken}
                  aria-label={`${avatarLabel(a)}: ${isMine ? `el de ${label(row, idx)}` : taken ? `lo tiene ${who!.name}` : 'libre'}`}
                  onClick={() => (isMine ? onClose() : onPick(row.key, a))}
                >
                  <PortraitCard id={a} />
                  {isMine && (
                    <span className="picker-check" aria-hidden>
                      <Icon name="check" />
                    </span>
                  )}
                  {taken && (
                    <span className="picker-owner" aria-hidden>
                      {who!.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
            Listo
          </button>
        </div>
      )}
    </Sheet>
  );
}

function Handoff({
  name,
  color,
  avatar,
  what,
  remaining,
  onReady,
  onMenu,
}: {
  name: string;
  color: number;
  avatar: AvatarId | null;
  what: string;
  remaining: number;
  onReady: () => void;
  onMenu: () => void;
}) {
  return (
    <main className="screen" style={{ justifyContent: 'center' }}>
      <TopBar title="Pasa el móvil" step={remaining === 1 ? 'Falta 1 persona' : `Faltan ${remaining} personas`} onMenu={onMenu} />
      <section className="paper center stack" style={{ alignItems: 'center', padding: 'var(--s-6) var(--s-4)' }}>
        <Pin player={{ name, color, avatar }} size="xl" />
        <h2>Para {name}</h2>
        <p>
          {what === 'declarar'
            ? `Le toca a ${name}: leer su expediente en privado y sellar su declaración.`
            : what === 'revisar'
              ? `Le toca a ${name}: marcar en secreto qué prueba hay que revisar.`
              : `Le toca a ${name}: votar en secreto.`}{' '}
          Que nadie más mire la pantalla.
        </p>
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
  const [fileOpen, setFileOpen] = useState(false);
  const round = room.round!;
  // The testimony sheet is on a shared screen: it gets only what it needs (the speaker's declared
  // alibi, which is public, and how many testimonies are left), never the secret parts of the file.
  const speakerPriv = useMemo<PrivateView | null>(
    () =>
      speaker
        ? { ...privateView(room, speaker), role: null, truth: null, memories: [], partner: null, encargo: null, draft: null, forgery: null, canForge: null, examineMark: null }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [speaker, room, round.testimonies.length],
  );
  return (
    <>
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
          onFile: () => setFileOpen(true),
        }}
      />
      <PrivateReread open={fileOpen} onClose={() => setFileOpen(false)} pub={pub} room={room} />
    </>
  );
}

/**
 * Your notebook and your file during the investigation (as the «Cuaderno» button does with one
 * phone each): pick who, hand the phone over behind a cover, read or write, hide. The clock keeps
 * running.
 */
function PrivateReread({ open, onClose, pub, room }: { open: boolean; onClose: () => void; pub: PublicView; room: RoomState }) {
  const [who, setWho] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [tab, setTab] = useState<'notes' | 'file'>('notes');
  const close = () => {
    setWho(null);
    setShown(false);
    setTab('notes');
    onClose();
  };
  const p = who ? pub.players.find((x) => x.id === who) : null;
  return (
    <Sheet open={open} onClose={close} label="Cuaderno privado">
      {!p ? (
        <div className="stack">
          <h2>¿De quién es el cuaderno?</h2>
          <p className="small">Solo lo ve esa persona: su cuaderno de notas y su expediente. El resto, sin mirar. El tiempo sigue corriendo.</p>
          <div className="row wrap">
            {room.round!.participants.map((id) => {
              const x = pub.players.find((y) => y.id === id);
              return x ? (
                <button key={id} type="button" className="chip-player" onClick={() => setWho(id)}>
                  <Pin player={x} />
                  {x.name}
                </button>
              ) : null;
            })}
          </div>
        </div>
      ) : !shown ? (
        <div className="stack center" style={{ alignItems: 'center' }}>
          <Pin player={p} size="xl" />
          <h2>Para {p.name}</h2>
          <p>Pasa el móvil a {p.name}. Que nadie más mire la pantalla.</p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => setShown(true)}>
            Soy {p.name}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={close}>
            Cancelar
          </button>
        </div>
      ) : (
        <div className="stack">
          <div className="sheet-tabs" role="tablist" aria-label="Cuaderno y expediente">
            <button type="button" role="tab" id="ltab-notes" aria-selected={tab === 'notes'} aria-controls="lpanel" onClick={() => setTab('notes')}>
              Mi cuaderno
            </button>
            <button type="button" role="tab" id="ltab-file" aria-selected={tab === 'file'} aria-controls="lpanel" onClick={() => setTab('file')}>
              Expediente
            </button>
          </div>
          <div role="tabpanel" id="lpanel" aria-labelledby={tab === 'notes' ? 'ltab-notes' : 'ltab-file'}>
            {tab === 'notes' ? <NotesPanel pub={pub} me={who!} /> : <PrivateFile pub={pub} priv={privateView(room, who!)} startOpen />}
          </div>
          <button type="button" className="btn btn-primary btn-block" onClick={close}>
            Ocultar y devolver el móvil
          </button>
        </div>
      )}
    </Sheet>
  );
}

/** Prueba falsificable, one phone: one person's secret mark. Shows no counts and no one else's mark. */
function ExamineBallot({ pub, priv, onMenu, onDone }: { pub: PublicView; priv: PrivateView; onMenu: () => void; onDone: (index: number | null) => void }) {
  const round = pub.round!;
  const [pick, setPick] = useState<number | null | undefined>(undefined);
  return (
    <main className="screen">
      <TopBar title="Revisar prueba" step="Marca en secreto. Nadie verá tu marca ni el recuento." onMenu={onMenu} />
      <ExperimentalTag pub={pub} />
      <div className="stack">
        {round.traces.map((_, i) => (
          <TraceCard key={i} pub={pub} index={i} />
        ))}
      </div>
      <section className="paper tabbed examine-panel" data-tab="Tu marca" aria-labelledby="ballot-title">
        <h2 id="ballot-title" className="point-title">
          ¿Qué prueba queréis revisar?
        </h2>
        <p className="small">
          Una de las pruebas puede ser falsa. Se revisa la más marcada (si hay empate, decide un sorteo; si nadie marca, ninguna). Solo se sabrá el
          resultado de la revisión.
        </p>
        <div className="point-options" role="radiogroup" aria-label="Qué prueba marcas para revisar">
          {round.traces.map((_, i) => (
            <button key={i} type="button" role="radio" className="point-option" aria-checked={pick === i} onClick={() => setPick(i)}>
              <span className="point-name">Prueba {i + 1}</span>
            </button>
          ))}
          <button type="button" role="radio" className="point-option" aria-checked={pick === null} onClick={() => setPick(null)}>
            <span className="point-name">Ninguna</span>
          </button>
        </div>
        {priv.role !== 'inocente' && <ForgeryNote pub={pub} priv={priv} />}
      </section>
      <ActionBar>
        <button className="btn btn-primary" disabled={pick === undefined} onClick={() => onDone(pick ?? null)}>
          Confirmar y ocultar
        </button>
      </ActionBar>
    </main>
  );
}
