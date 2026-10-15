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
  // No pre-filled answers: everybody taps three times, so nobody can tell the culprit
  // by who seals last. The "Aquí estabas" marks make it quick for honest players.
  const initial = (): (string | null)[] => priv.draft ?? [null, null, null];
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
    <div className="row wrap" role="group" aria-label="Quién ha sellado su declaración">
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
      <TopBar title="Declaración" phase="declare" step="Lee tu expediente, elige un sitio para cada hora y sella." endsAt={pub.phaseEndsAt} onMenu={onMenu} />
      <CaseHeader pub={pub} />
      <PrivateFile pub={pub} priv={priv} />

      {!locked ? (
        <section className="paper tabbed" data-tab="Tu declaración" aria-label="Tu declaración">
          <p className="small">
            Elige dónde dirás que estabas a cada hora: esas son tus coartadas. Nadie las verá hasta que todo el mundo selle su declaración.
            {isCulprit
              ? ' A la hora del incidente estabas en el lugar del incidente: ahí tienes que inventarte una coartada.'
              : ' Lo habitual es decir la verdad; tu ubicación real aparece marcada con «Aquí estabas».'}
          </p>
          {slots.map((label, slot) => (
            <div key={label} className="hour-block" role="radiogroup" aria-label={`Dónde estabas ${atHour(label)}`}>
              <div className="spread">
                <span className="hour">{label}</span>
                {slot === round.scene.slot && <span className="tag red">Hora del incidente</span>}
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
                      {!isTruth && isScene && <span className="truth-mark">Lugar del incidente</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="paper tabbed" data-tab="Tu declaración" aria-label="Declaración sellada">
          <div className="spread">
            <p style={{ fontWeight: 650 }}>Sellada. Ya no se puede cambiar.</p>
            <Stamp tone="ink" animate>
              Sellada
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
        <div className="label on-ink">{pending === 0 ? 'Todas las declaraciones, selladas' : `Faltan ${plural(pending, 'declaración', 'declaraciones')} por sellar`}</div>
        {statusPins}
        <p className="small muted">
          Si se acaba el tiempo sin sellar: si ya habías elegido las tres horas, se sella tal cual; si no, la app pone una coartada automática y
          la marca como «automática».
        </p>
      </section>

      <ActionBar
        hint={
          locked
            ? 'Cuando todo el mundo selle, las coartadas se revelan a la vez.'
            : !complete
              ? 'Elige un sitio para cada una de las tres horas.'
              : 'Al sellar, ya no podrás cambiarla.'
        }
      >
        {!locked ? (
          <button className="btn btn-primary" disabled={!complete || busy} onClick={lock}>
            Sellar declaración
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
