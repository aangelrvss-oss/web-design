import { useEffect, useRef, useState } from 'react';
import type { PrivateView, PublicView } from '../../shared/engine/views';
import { atHour, errorText, plural } from '../lib/text';
import { sfx } from '../lib/sound';
import { store } from '../net/store';
import { CaseHeader, PrivateFile } from '../ui/game';
import { ActionBar, Pin, Stamp, TopBar, useAction } from '../ui/kit';

export function Declare({ pub, priv, onMenu }: { pub: PublicView; priv: PrivateView; onMenu: () => void }) {
  const round = pub.round!;
  const { slots, zones } = round.scenario;
  const isCulprit = priv.role === 'culpable';
  const initial = (): (string | null)[] =>
    priv.draft ?? priv.truth!.map((z, s) => (isCulprit && s === round.scene.slot ? null : z));
  const [choice, setChoice] = useState<(string | null)[]>(initial);
  const { busy, run } = useAction();
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = !!priv.declared;
  const complete = choice.every(Boolean);
  const pending = round.participants.length - round.locked.length;

  // Keep a server-side draft so a timeout uses what you picked, not the default.
  useEffect(() => {
    if (locked || !complete) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => void store.send('game:declare', { zones: choice, lock: false }), 600);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [choice, locked, complete]);

  const pick = (slot: number, zone: string) => setChoice((c) => c.map((z, i) => (i === slot ? zone : z)));
  const lock = () =>
    void run(
      () => store.send('game:declare', { zones: choice, lock: true }),
      () => sfx.stamp(),
      errorText,
    );

  const statusPins = (
    <div className="row wrap" aria-label="Quién ha sellado su coartada">
      {round.participants.map((id) => {
        const p = pub.players.find((x) => x.id === id);
        if (!p) return null;
        const done = round.locked.includes(id);
        return <Pin key={id} player={p} className={done ? '' : 'dim'} badge={done ? '✓' : undefined} />;
      })}
    </div>
  );

  return (
    <main className="screen">
      <TopBar title="Declaración" step={`Ronda ${round.number}. Todo el mundo declara a la vez.`} endsAt={pub.phaseEndsAt} onMenu={onMenu} />
      <CaseHeader pub={pub} />
      <PrivateFile pub={pub} priv={priv} />

      {!locked ? (
        <section className="paper tabbed" data-tab="Tu coartada" aria-label="Tu coartada">
          <p className="small">
            ¿Dónde dirás que estabas? Nadie lo verá hasta que todo el mundo selle la suya.
            {isCulprit ? ' A la hora del crimen estabas en la escena: tendrás que inventarte algo.' : ' Ya viene rellena con la verdad.'}
          </p>
          {slots.map((label, slot) => (
            <div key={label} className="hour-block" role="radiogroup" aria-label={`Dónde estabas ${atHour(label)}`}>
              <div className="spread">
                <span className="hour">{label}</span>
                {slot === round.scene.slot && <span className="tag red">Hora del crimen</span>}
              </div>
              <div className="choices">
                {zones.map((z) => {
                  const isTruth = priv.truth![slot] === z.id;
                  const isScene = slot === round.scene.slot && z.id === round.scene.zone;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      role="radio"
                      aria-checked={choice[slot] === z.id}
                      className={`choice ${isScene ? 'scene' : ''}`}
                      onClick={() => pick(slot, z.id)}
                    >
                      {z.name}
                      {isTruth && <span className="truth-mark">{isScene ? 'Aquí lo hiciste' : 'Aquí estabas'}</span>}
                      {!isTruth && isScene && <span className="truth-mark">Escena del crimen</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="paper tabbed" data-tab="Tu coartada" aria-label="Coartada sellada">
          <div className="spread">
            <p style={{ fontWeight: 650 }}>Sellada. Ya no se puede cambiar.</p>
            <Stamp tone="ink" animate>
              Sellado
            </Stamp>
          </div>
          <div className="night-table doc-text" style={{ marginTop: 8 }}>
            {priv.declared!.map((z, s) => (
              <div key={s} style={{ display: 'contents' }}>
                <span className="hour">{slots[s]}</span>
                <span>{zones.find((x) => x.id === z)?.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="stack" aria-label="Estado">
        <div className="label on-ink">{pending === 0 ? 'Todas selladas' : `Faltan ${plural(pending, 'coartada', 'coartadas')}`}</div>
        {statusPins}
      </section>

      <ActionBar hint={locked ? 'Cuando todo el mundo selle, se destapan todas a la vez.' : !complete ? 'Elige un sitio para cada hora.' : undefined}>
        {!locked ? (
          <button className="btn btn-primary" disabled={!complete || busy} onClick={lock}>
            Sellar coartada
          </button>
        ) : (
          <button className="btn btn-ghost" disabled>
            Esperando al resto…
          </button>
        )}
      </ActionBar>
    </main>
  );
}
