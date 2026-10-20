// Experimental rules «Prueba falsificable» (docs/PRUEBA-FALSA.md): everything the player sees of
// them lives here, and the screens only mount it when the round is played with them
// (`round.variant === 'prueba_falsa'`). A normal round never renders any of this.
import { useState } from 'react';
import type { PrivateView, PublicTrace, PublicView } from '../../shared/engine/views';
import { atHour, errorText, zoneName } from '../lib/text';
import { store } from '../net/store';
import { Stamp, useAction } from './kit';

export const isForgeryRound = (pub: PublicView) => pub.round?.variant === 'prueba_falsa';

/** The chance of an opportunity to forge this round, when it is not every round. */
const chanceOf = (pub: PublicView): number | null => {
  const c = pub.round?.forgeryChance ?? 100;
  return c < 100 ? c : null;
};

/** One line that says the round is played with experimental rules. */
export function ExperimentalTag({ pub }: { pub?: PublicView }) {
  const chance = pub ? chanceOf(pub) : null;
  return (
    <span className="tag blue on-ink experimental-tag" role="note">
      Reglas experimentales: prueba falsificable{chance ? ` (oportunidad ${chance} %)` : ''}
    </span>
  );
}

/** Status of a piece of evidence, in words (never «comprobado» while it may be false). */
export function TraceStatusTag({ t }: { t: PublicTrace }) {
  if (t.status === 'falsa') return <span className="tag red">Falsa</span>;
  if (t.status === 'autentica') return <span className="tag blue">Auténtica</span>;
  return <span className="tag">Sin revisar: puede ser falsa</span>;
}

/** Culprit only, while the declaration lasts, inside the confidential file. */
export function ForgeryChooser({ pub, priv }: { pub: PublicView; priv: PrivateView }) {
  const round = pub.round!;
  const { slots, zones } = round.scenario;
  const hours = [0, 1, 2].filter((s) => s !== round.scene.slot);
  const current = priv.forgery;
  const [hour, setHour] = useState<number | null>(current?.slot ?? null);
  const { busy, run } = useAction();
  const send = (forgery: { slot: number; zone: string } | null) => void run(() => store.send('game:forge', { forgery }), undefined, errorText);
  if (priv.canForge === false) {
    // Only the culprit reads this: nobody else learns whether the opportunity came up.
    return (
      <div className="forgery" role="group" aria-labelledby="forgery-title">
        <hr className="rule" />
        <div className="label" id="forgery-title">
          Reglas experimentales: esta ronda no puedes falsificar
        </div>
        <p className="small">
          El sorteo ({pub.round!.forgeryChance ?? 100} % de oportunidad) no te la ha dado: las dos pruebas dirán dónde estuviste de verdad. Nadie más sabe si la tuviste;
          se dirá en el veredicto.
        </p>
      </div>
    );
  }
  return (
    <div className="forgery" role="group" aria-labelledby="forgery-title">
      <hr className="rule" />
      <div className="label" id="forgery-title">
        Reglas experimentales: puedes falsificar una prueba
      </div>
      <p className="small">
        {chanceOf(pub) ? `Esta ronda el sorteo (${chanceOf(pub)} %) te da la oportunidad; usarla es decisión tuya. ` : ''}Las dos pruebas dirán dónde estuviste
        de verdad {atHour(slots[hours[0]])} y {atHour(slots[hours[1]])}. Puedes hacer que una diga otro lugar. Puedes cambiarlo hasta que termine la declaración.
      </p>
      <div className="choices" role="radiogroup" aria-label="Qué prueba falsificas">
        <button
          type="button"
          role="radio"
          className="choice"
          aria-checked={hour === null}
          disabled={busy}
          onClick={() => {
            setHour(null);
            if (current) send(null);
          }}
        >
          No falsifico
        </button>
        {hours.map((s) => (
          <button key={s} type="button" role="radio" className="choice" aria-checked={hour === s} disabled={busy} onClick={() => setHour(s)}>
            La de {slots[s]}
          </button>
        ))}
      </div>
      {hour !== null && <p className="small forgery-question">¿Qué lugar dirá la prueba {atHour(slots[hour])}?</p>}
      {hour !== null && (
        <div className="choices" role="radiogroup" aria-label={`Qué lugar dirá la prueba ${atHour(slots[hour])}`}>
          {zones
            .filter((z) => z.id !== priv.truth![hour])
            .map((z) => (
              <button
                key={z.id}
                type="button"
                role="radio"
                className="choice"
                aria-checked={current?.slot === hour && current.zone === z.id}
                disabled={busy}
                onClick={() => send({ slot: hour, zone: z.id })}
              >
                {z.name}
              </button>
            ))}
        </div>
      )}
      <p className="small forgery-status" role="status">
        {current
          ? `Elegido: la prueba ${atHour(slots[current.slot])} dirá ${zoneName(pub, current.zone)} (de verdad estabas en ${zoneName(pub, priv.truth![current.slot])}).`
          : hour !== null
            ? 'Elige el lugar que dirá esa prueba.'
            : 'Ahora mismo no falsificas ninguna prueba.'}
      </p>
    </div>
  );
}

/** What the culprit chose (after the declaration) and what the accomplice is told. */
export function ForgeryNote({ pub, priv }: { pub: PublicView; priv: PrivateView }) {
  const slots = pub.round!.scenario.slots;
  const f = priv.forgery;
  let text: string;
  const chance = chanceOf(pub);
  if (priv.role === 'culpable') {
    text =
      priv.canForge === false
        ? 'Esta ronda no tuviste oportunidad de falsificar: las dos pruebas son auténticas.'
        : f
          ? `Falsificaste la prueba ${atHour(slots[f.slot])}: dirá ${zoneName(pub, f.zone)}.`
          : 'No falsificaste ninguna prueba.';
  } else if (pub.phase === 'declare') {
    text = chance
      ? `Tu pareja puede tener la oportunidad de falsificar una de las pruebas (${chance} % de las rondas). Al empezar la investigación sabrás si falsificó alguna.`
      : 'Tu pareja puede falsificar una de las pruebas. Sabrás cuál al empezar la investigación.';
  } else {
    text = f ? `Tu pareja falsificó la prueba ${atHour(slots[f.slot])}: dirá ${zoneName(pub, f.zone)}, y es falso.` : 'Tu pareja no falsificó ninguna prueba.';
  }
  return (
    <>
      <hr className="rule" />
      <div className="label">Reglas experimentales</div>
      <p className="small">{text}</p>
    </>
  );
}

/** Investigation: mark which published piece of evidence should be examined. */
export function ExaminePanel({ pub, priv }: { pub: PublicView; priv: PrivateView }) {
  const round = pub.round!;
  const counts = round.examination?.counts ?? [];
  const mine = priv.examineMark;
  const { busy, run } = useAction();
  const send = (index: number | null) => void run(() => store.send('game:examine', { index }), undefined, errorText);
  return (
    <section id="examine-panel" className="paper tabbed examine-panel" data-tab="Revisar prueba" aria-labelledby="examine-title">
      <h2 id="examine-title" className="point-title">
        ¿Qué prueba queréis revisar?
      </h2>
      <p className="small">
        Una de las pruebas puede ser falsa. Marca la que quieres que se revise: es secreto y puedes cambiarlo hasta que acabe la investigación.
        Entonces se revisa la más marcada (si hay empate, decide un sorteo; si nadie marca, ninguna).
      </p>
      <div className="point-options" role="group" aria-label="Qué prueba marcas para revisar">
        {round.traces.map((t, i) => (
          <button key={i} type="button" className="point-option" aria-pressed={mine === i} disabled={busy} onClick={() => mine !== i && send(i)}>
            <span className="point-name">
              Prueba {i + 1}: {zoneName(pub, t.zone)} {atHour(round.scenario.slots[t.slot])}
            </span>
            <span className="tag">{counts[i] === 1 ? '1 marca' : `${counts[i] ?? 0} marcas`}</span>
          </button>
        ))}
      </div>
      <p className={`point-status ${mine !== null ? 'done' : ''}`} role="status">
        {mine !== null ? (
          <span>
            <b>Registrado:</b> marcas la prueba {mine + 1}.
          </span>
        ) : (
          <span>Aún no has marcado ninguna. Es opcional.</span>
        )}
      </p>
      {round.traces.length < 2 && <p className="small muted">La prueba 2 sale en la segunda parte y también se podrá marcar.</p>}
      {mine !== null && (
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} disabled={busy} onClick={() => send(null)}>
          Quitar mi marca
        </button>
      )}
    </section>
  );
}

/** The examination, once the investigation has ended (defense, vote and verdict). */
export function ExaminationResult({ pub }: { pub: PublicView }) {
  const round = pub.round!;
  const done = round.examination?.done;
  if (!done) return null;
  const slots = round.scenario.slots;
  if (done.index === null) {
    return (
      <section className="paper examination" aria-label="Revisión de la prueba" role="status">
        <div className="label">Revisión de la prueba</div>
        <p className="small">No se ha seleccionado ninguna prueba para revisar. Las dos siguen sin revisar: cualquiera de ellas puede ser falsa.</p>
      </section>
    );
  }
  const t = round.traces[done.index];
  const hour = atHour(slots[t.slot]);
  return (
    <section className="paper examination" aria-label="Revisión de la prueba" role="status">
      <div className="spread">
        <div className="label" style={{ margin: 0 }}>
          Prueba {done.index + 1} revisada
        </div>
        <Stamp tone={done.result === 'falsa' ? 'red' : 'blue'}>{done.result === 'falsa' ? 'Falsa' : 'Auténtica'}</Stamp>
      </div>
      {done.result === 'falsa' ? (
        <p>
          La prueba revisada ({hour}) era falsa: decía {zoneName(pub, t.forgedZone)}. La verdadera dice que la persona culpable estuvo en <b>{zoneName(pub, t.zone)}</b>.
          Como solo puede haber una falsa, la otra prueba es auténtica.
        </p>
      ) : (
        <p>
          La prueba revisada ({hour}) era auténtica: la persona culpable estuvo en <b>{zoneName(pub, t.zone)}</b>. La otra sigue sin revisar: puede ser falsa.
        </p>
      )}
      {done.tied && <p className="small muted">Las dos pruebas tenían las mismas marcas: decidió un sorteo.</p>}
    </section>
  );
}

/** Verdict: what was forged, if anything. */
export function ForgeryReveal({ pub }: { pub: PublicView }) {
  const round = pub.round!;
  const f = round.reveal?.forgery ?? null;
  const allowed = round.reveal?.forgeryAllowed ?? true;
  const done = round.examination?.done ?? null;
  const slots = round.scenario.slots;
  const truth = f ? round.reveal!.traces.find((t) => t.slot === f.slot) : null;
  let examined = '';
  if (f && done) {
    examined =
      done.index === null
        ? ' Nadie pidió revisar ninguna prueba.'
        : done.result === 'falsa'
          ? ' La revisión la descubrió.'
          : ' Se revisó la otra prueba, que era auténtica.';
  }
  return (
    <section className="paper tabbed" data-tab="Reglas experimentales" aria-label="Qué se falsificó">
      <p>
        {f && truth
          ? `La persona culpable falsificó la prueba ${atHour(slots[f.slot])}: puso ${zoneName(pub, f.zone)}; la verdadera era ${zoneName(pub, truth.zone)}.${examined}`
          : !allowed
            ? `Esta ronda la persona culpable no tuvo oportunidad de falsificar (sorteo con ${round.forgeryChance ?? 100} %): las dos pruebas eran auténticas.`
            : chanceOf(pub)
              ? 'La persona culpable tuvo la oportunidad, pero no falsificó ninguna prueba: las dos eran auténticas.'
              : 'La persona culpable no falsificó ninguna prueba: las dos eran auténticas.'}
      </p>
    </section>
  );
}
