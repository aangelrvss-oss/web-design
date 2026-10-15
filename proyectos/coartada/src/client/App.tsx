import { useEffect, useRef, useState } from 'react';
import { errorText, PHASE_NAME } from './lib/text';
import { setPrefs, usePrefs } from './lib/prefs';
import { sfx } from './lib/sound';
import { store, useStore } from './net/store';
import { Home } from './screens/Home';
import { Lobby } from './screens/Lobby';
import { Declare } from './screens/Declare';
import { Investigate } from './screens/Investigate';
import { Vote } from './screens/Vote';
import { Defense } from './screens/Defense';
import { Final, Result } from './screens/Result';
import { RulesContent } from './screens/Rules';
import { LocalGame } from './screens/Local';
import { CaseHeader } from './ui/game';
import { Sheet, Switch, ToastHost, TopBar, toast, useAction } from './ui/kit';

export function App() {
  const snap = useStore();
  const [menu, setMenu] = useState(false);
  const [local, setLocal] = useState(false);

  useEffect(() => {
    void store.tryResumeAtStartup();
  }, []);

  // Public phase changes get a sound (same for everyone, reveals nothing private).
  const lastPhase = useRef<string | null>(null);
  useEffect(() => {
    const key = snap.pub ? `${snap.pub.phase}:${snap.pub.round?.number ?? 0}` : null;
    if (key && lastPhase.current && key !== lastPhase.current) {
      if (snap.pub?.phase === 'declare' || snap.pub?.phase === 'vote' || snap.pub?.phase === 'runoff') sfx.paper();
    }
    lastPhase.current = key;
    window.scrollTo({ top: 0 });
  }, [snap.pub?.phase, snap.pub?.round?.number]);

  if (local) return <LocalGame onExit={() => setLocal(false)} />;

  let body: React.ReactNode;
  const { pub, priv, me } = snap;
  if (snap.resuming && !pub) {
    body = (
      <main className="screen no-bar" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="row muted">
          <span className="spinner" /> Volviendo a tu sala…
        </div>
      </main>
    );
  } else if (!pub || !me) {
    body = <Home onLocal={() => setLocal(true)} />;
  } else {
    const openMenu = () => setMenu(true);
    const inRound = !!priv?.inRound;
    switch (pub.phase) {
      case 'lobby':
        body = <Lobby pub={pub} me={me} onMenu={openMenu} />;
        break;
      case 'declare':
        body = inRound ? <Declare pub={pub} priv={priv!} onMenu={openMenu} /> : <Watching pub={pub} onMenu={openMenu} />;
        break;
      case 'investigate':
        body = <Investigate pub={pub} priv={priv} onMenu={openMenu} />;
        break;
      case 'defense':
        body = <Defense pub={pub} priv={priv} onMenu={openMenu} />;
        break;
      case 'vote':
      case 'runoff':
        body = <Vote key={pub.phase} pub={pub} priv={priv} onMenu={openMenu} />;
        break;
      case 'result':
        body = <Result key={pub.round?.number} pub={pub} priv={priv} onMenu={openMenu} />;
        break;
      case 'final':
        body = <Final pub={pub} me={me} onMenu={openMenu} />;
        break;
    }
  }

  return (
    <>
      {body}
      {pub && me && <GameMenu open={menu} onClose={() => setMenu(false)} />}
      <ConnBanner />
      <ToastHost />
    </>
  );
}

function Watching({ pub, onMenu }: { pub: NonNullable<ReturnType<typeof useStore>['pub']>; onMenu: () => void }) {
  return (
    <main className="screen no-bar">
      <TopBar title={PHASE_NAME[pub.phase]} step="Estás viendo esta ronda; jugarás en la siguiente." endsAt={pub.phaseEndsAt} onMenu={onMenu} />
      <CaseHeader pub={pub} />
      <p className="muted">El resto está sellando su declaración. Cuando se revelen las coartadas, verás el tablero.</p>
    </main>
  );
}

function ConnBanner() {
  const snap = useStore();
  if (snap.mode !== 'online' || !snap.me || snap.conn === 'online' || snap.conn === 'idle') return null;
  return (
    <div className="conn-banner" role="status">
      <span className="spinner" />
      {snap.conn === 'connecting' ? 'Reconectando…' : 'Sin conexión. Reintentando…'}
    </div>
  );
}

function GameMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const snap = useStore();
  const prefs = usePrefs();
  const [rules, setRules] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const { busy, run } = useAction();
  const pub = snap.pub!;
  const isHost = pub.hostId === snap.me;
  const roundLive = ['declare', 'investigate', 'defense', 'vote', 'runoff'].includes(pub.phase);

  useEffect(() => {
    if (!open) {
      setConfirmLeave(false);
      setConfirmSkip(false);
      setRules(false);
    }
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose} tone="ink" label="Menú">
      {rules ? (
        <div className="paper">
          <RulesContent />
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setRules(false)}>
            Volver al menú
          </button>
        </div>
      ) : (
        <div className="stack">
          <div className="spread">
            <h2>Menú</h2>
            {snap.mode === 'online' && <span className="code-chip">Sala {pub.code}</span>}
          </div>
          <button className="btn btn-ghost btn-block" onClick={() => setRules(true)}>
            Cómo se juega
          </button>
          <Switch label="Sonido" hint="Solo suena en momentos que vive todo el mundo a la vez." checked={prefs.sound} onChange={(sound) => setPrefs({ sound })} />
          <Switch label="Reducir animaciones" checked={prefs.reduceMotion} onChange={(reduceMotion) => setPrefs({ reduceMotion })} />
          {isHost && roundLive && (
            <div className="stack" style={{ gap: 6 }}>
              {!confirmSkip ? (
                <button className="btn btn-ghost btn-block" onClick={() => setConfirmSkip(true)}>
                  Terminar esta fase
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-block"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () => store.send('game:advance'),
                      () => {
                        toast('Fase terminada.');
                        onClose();
                      },
                      errorText,
                    )
                  }
                >
                  Sí, terminar esta fase ya
                </button>
              )}
              <p className="small muted">
                Equivale a que se acabe el tiempo de la fase actual. En la declaración, quien no haya sellado recibe una coartada automática.
              </p>
            </div>
          )}
          {!confirmLeave ? (
            <button className="btn btn-ghost btn-block" onClick={() => setConfirmLeave(true)}>
              {snap.mode === 'local' ? 'Terminar partida' : 'Salir de la sala'}
            </button>
          ) : (
            <button
              className="btn btn-primary btn-block"
              onClick={async () => {
                await store.leave();
                onClose();
              }}
            >
              {roundLive ? 'Salir aunque la ronda siga' : 'Sí, salir'}
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}
