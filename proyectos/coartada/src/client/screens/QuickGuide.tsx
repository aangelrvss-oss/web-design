// Quick guide: the ONE explanation of the rules shown in the app (the "?" button, the menus,
// the home screen and the demo guide). Every number comes from the game's own constants
// (timers, points, testimonies, hours, when there is an accomplice), so it cannot drift from
// the engine. It never shows anything about the reader's own role or anyone else's.
import { useEffect, useState } from 'react';
import { rolesFor } from '../../shared/engine/generate';
import { MAX_PLAYERS, MAX_TESTIMONIES, MIN_PLAYERS, SCORE_POINTS, SLOT_COUNT, timingsFor, type Pace, type ScoreReason, type Variant } from '../../shared/types';
import { PACE_TEXT, ROLE_GOAL, ROLE_NAME } from '../lib/text';
import { useStore } from '../net/store';
import { Lineup, Suspect } from '../ui/illustrations';
import { Icon, Sheet, setGuideOpener, Stamp } from '../ui/kit';

export type Section = 'ronda' | 'papeles' | 'defensa' | 'puntos';
const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'ronda', label: 'La ronda', icon: 'folder' },
  { id: 'papeles', label: 'Papeles', icon: 'stamp' },
  { id: 'defensa', label: 'Defensa y voto', icon: 'target' },
  { id: 'puntos', label: 'Puntos', icon: 'crown' },
];

/** Smallest group size that has an accomplice, straight from the engine. */
const ACCOMPLICE_FROM = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i).find((n) => rolesFor(n).complices > 0)!;
/** The evidence covers every hour except the one of the incident. */
const EVIDENCE_COUNT = SLOT_COUNT - 1;

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Who scores, and when. The values come from SCORE_POINTS; every reason must be described. */
const POINTS: Record<ScoreReason, { who: string; when: string }> = {
  grupo_gana: { who: 'Cada inocente', when: 'El grupo acusa a la persona culpable.' },
  culpable_escapa: { who: 'La persona culpable', when: 'Se libra: el grupo acusa a otra persona o a nadie.' },
  complice_escapa: { who: 'Su cómplice', when: 'La persona culpable se libra.' },
  voto_certero: { who: 'Cada inocente que votó bien', when: 'Votó a la persona culpable en la primera votación, gane quien gane.' },
  cazador: { who: 'Quien testifica', when: 'Su testimonio es verdadero y contradice una coartada falsa. Una vez por ronda, sea cual sea su papel.' },
  encargo: { who: 'Quien cumple su objetivo secreto', when: 'Solo si los objetivos secretos están activados. No cambia quién gana.' },
};

// ───────────── small line drawings (same ink as the icons) ─────────────
function StepIcon({ n, icon }: { n: number; icon: string }) {
  return (
    <span className="qg-step-icon" aria-hidden>
      <Icon name={icon} />
      <b>{n}</b>
    </span>
  );
}

// ───────────── sections ─────────────
function Ronda({ pace, players, untimedTurns, variant, forgeryChance = 100 }: { pace: Pace; players: number; untimedTurns: boolean; variant: Variant | null; forgeryChance?: number }) {
  const t = timingsFor(pace, players);
  const steps: { icon: string; title: string; text: string; time?: string }[] = [
    { icon: 'folder', title: 'Expediente', text: 'Léelo a solas: tu papel, dónde estuviste de verdad y con quién coincidiste.' },
    {
      icon: 'pen',
      title: 'Declaración',
      text: `Elige un sitio para cada una de las ${SLOT_COUNT} horas y sella: es tu coartada. Si no sellas a tiempo, se pone una automática.`,
      time: untimedTurns ? undefined : mmss(t.declare),
    },
    { icon: 'eye', title: 'Revelación', text: 'Todas las coartadas aparecen a la vez en el tablero.' },
    {
      icon: 'mic',
      title: 'Investigación',
      text: `Hablad. Puedes publicar hasta ${MAX_TESTIMONIES} testimonios («estuve con X a tal hora»), también desde la ficha de X en el tablero. La app dice si coincide con lo que declaró X, no si es verdad.`,
      time: `${mmss(t.investigate1)} + ${mmss(t.investigate2)}`,
    },
    variant === 'prueba_falsa'
      ? {
          icon: 'search',
          title: 'Pruebas (reglas experimentales)',
          text: `Durante la investigación salen ${EVIDENCE_COUNT}: dónde estuvo la persona culpable a otra hora. En esta partida una puede ser falsa: al declarar, la persona culpable puede hacer que diga otro lugar${forgeryChance < 100 ? ` si un sorteo le da la oportunidad (en el ${forgeryChance} % de las rondas; nadie más sabe si la tuvo hasta el veredicto)` : ''}. Mientras no se revise, ninguna es segura.`,
        }
      : {
          icon: 'search',
          title: 'Pruebas',
          text: `Durante la investigación salen ${EVIDENCE_COUNT} y nunca mienten: dónde estuvo la persona culpable a otra hora. Un contorno azul rodea en el tablero a quienes dicen haber estado allí.`,
        },
    ...(variant === 'prueba_falsa'
      ? [
          {
            icon: 'target',
            title: 'Revisar prueba',
            text: untimedTurns
              ? 'Al acabar la investigación, el móvil pasa por cada persona y cada una marca en secreto qué prueba quiere revisar. Se revisa la más marcada (empate: sorteo; sin marcas: ninguna). Si era falsa, se ve la verdadera y la otra queda confirmada. Los puntos no cambian.'
              : 'Cada persona marca en secreto qué prueba quiere revisar y puede cambiarla. Al acabar la investigación se revisa la más marcada (empate: sorteo; sin marcas: ninguna). Si era falsa, se ve la verdadera y la otra queda confirmada. Los puntos no cambian.',
          },
        ]
      : []),
    { icon: 'vote', title: 'Defensa, voto y veredicto', text: 'La persona más señalada se defiende, votáis en secreto y se revela la verdad.' },
  ];
  return (
    <div className="stack">
      <p className="qg-lead">
        Ha ocurrido algo absurdo y <b>una persona del grupo es la culpable</b>: miente sobre dónde estaba.
      </p>
      <ol className="qg-steps">
        {steps.map((s, i) => (
          <li key={s.title}>
            <StepIcon n={i + 1} icon={s.icon} />
            <div>
              <div className="qg-step-title">
                {s.title}
                {s.time && <span className="qg-time">{s.time}</span>}
              </div>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="small muted">
        Tiempos {untimedTurns ? 'de la investigación' : 'máximos'} con ritmo {PACE_TEXT[pace]} y {players} personas. Cada fase termina antes si todo el mundo ha
        acabado.
      </p>
    </div>
  );
}

function Papeles() {
  const roles = [
    { role: 'inocente' as const, tone: 'blue' as const, note: 'Todas las demás personas.' },
    { role: 'culpable' as const, tone: 'red' as const, note: 'Siempre hay exactamente una.' },
    { role: 'complice' as const, tone: 'red' as const, note: `Solo con ${ACCOMPLICE_FROM} personas o más. Se conoce con la persona culpable.`, pair: true },
  ];
  return (
    <div className="stack">
      <p className="qg-lead">Tu papel solo aparece en tu expediente. Nadie más lo ve hasta el veredicto.</p>
      <div className="qg-roles">
        {roles.map((r) => (
          <div key={r.role} className="qg-role">
            <Suspect tone={r.tone} mark={r.pair ? 'pair' : undefined} className="qg-suspect" />
            <Stamp tone={r.tone === 'blue' ? 'blue' : 'red'}>{ROLE_NAME[r.role]}</Stamp>
            <p>{ROLE_GOAL[r.role]}</p>
            <p className="small muted">{r.note}</p>
          </div>
        ))}
      </div>
      <p className="small muted">Cualquiera puede mentir, pero un testimonio verdadero puede dejar al descubierto una coartada falsa.</p>
    </div>
  );
}

function Defensa({ pace, players, untimedTurns }: { pace: Pace; players: number; untimedTurns: boolean }) {
  const t = timingsFor(pace, players);
  return (
    <div className="stack">
      <Lineup className="ill-lineup qg-lineup" />
      <ol className="qg-steps">
        <li>
          <StepIcon n={1} icon="target" />
          <div>
            <div className="qg-step-title">Señala en secreto</div>
            <p>
              Durante la investigación, en el panel <b>Señala a quien crees culpable</b>, toca a la persona que quieres oír. Puedes cambiarlo o
              quitarlo hasta que acabe la investigación. Nadie ve a quién señalas.
            </p>
          </div>
        </li>
        <li>
          <StepIcon n={2} icon="mic" />
          <div>
            <div className="qg-step-title">
              Última defensa<span className="qg-time">{t.defense} s</span>
            </div>
            <p>
              La persona más señalada se defiende en voz alta. Si hay empate, decide un sorteo. Si nadie señala, no hay defensa. Ya no se puede
              cambiar ninguna declaración ni testimonio.
            </p>
          </div>
        </li>
        <li>
          <StepIcon n={3} icon="vote" />
          <div>
            <div className="qg-step-title">
              Votación secreta{!untimedTurns && <span className="qg-time">{t.vote} s</span>}
            </div>
            <p>
              Si la persona más votada es la culpable, gana el grupo de inocentes. Si es otra persona, o nadie, ganan la persona culpable y su
              cómplice.
            </p>
          </div>
        </li>
      </ol>
      <div className="qg-note">
        <b>Empates.</b> Si hay empate en la votación, se repite solo entre las personas empatadas{untimedTurns ? '' : ` (${t.runoff} s)`}. Si vuelve a haber empate, nadie es
        acusado. Quien no vota a tiempo no cuenta.
      </div>
    </div>
  );
}

function Puntos() {
  return (
    <div className="stack">
      <ul className="qg-points">
        {(Object.keys(POINTS) as ScoreReason[]).map((k) => (
          <li key={k}>
            <span className="qg-chip">+{SCORE_POINTS[k]}</span>
            <div>
              <div className="qg-step-title">{POINTS[k].who}</div>
              <p>{POINTS[k].when}</p>
            </div>
          </li>
        ))}
      </ul>
      <details className="qg-more">
        <summary>Detalles</summary>
        <ul className="small">
          <li>Si la persona culpable es acusada, su cómplice no puntúa.</li>
          <li>El voto del desempate no da el punto por votar bien: solo cuenta la primera votación.</li>
          <li>Los puntos se suman de ronda en ronda. Una ronda interrumpida no puntúa y una partida nueva empieza de cero.</li>
        </ul>
      </details>
    </div>
  );
}

/** The guide itself. `pace`/`players` are the room's when known, so the times are the real ones. */
export function QuickGuide({
  pace,
  players,
  untimedTurns = false,
  all,
  variant = null,
  forgeryChance = 100,
}: {
  pace?: Pace;
  players?: number;
  /** Declaring and voting have no timer (single phone): their times are not shown. */
  untimedTurns?: boolean;
  /** Show these sections one after the other instead of tabs (the long demo guide). */
  all?: Section[];
  /** Experimental rules of the room or of the round being played, if any. */
  variant?: Variant | null;
  /** Prueba falsificable: chance (%) of an opportunity to forge. */
  forgeryChance?: number;
}) {
  const [tab, setTab] = useState<Section>('ronda');
  const p = pace ?? 'normal';
  const n = players && players >= MIN_PLAYERS ? players : 6;
  const body = (s: Section) =>
    s === 'ronda' ? <Ronda pace={p} players={n} untimedTurns={untimedTurns} variant={variant} forgeryChance={forgeryChance} /> : s === 'papeles' ? <Papeles /> : s === 'defensa' ? <Defensa pace={p} players={n} untimedTurns={untimedTurns} /> : <Puntos />;
  if (all) {
    // Everything one after the other (the long demo guide embeds it like this).
    return (
      <div className="qg stack">
        {SECTIONS.filter((s) => all.includes(s.id)).map((s) => (
          <section key={s.id} className="paper tabbed" data-tab={s.label} aria-label={s.label}>
            {body(s.id)}
          </section>
        ))}
      </div>
    );
  }
  return (
    <div className="qg stack">
      <h2 className="qg-title">Guía rápida</h2>
      <div className="qg-tabs" role="tablist" aria-label="Secciones de la guía">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`qg-tab-${s.id}`}
            aria-selected={tab === s.id}
            aria-controls={`qg-panel-${s.id}`}
            className={tab === s.id ? 'on' : ''}
            onClick={() => setTab(s.id)}
          >
            <Icon name={s.icon} />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`qg-panel-${tab}`} aria-labelledby={`qg-tab-${tab}`}>
        {body(tab)}
      </div>
    </div>
  );
}

// ───────────── host: one overlay for the whole app, opened by openGuide() from kit ─────────────
export function GuideHost() {
  const [open, setOpen] = useState(false);
  const snap = useStore();
  useEffect(() => {
    setGuideOpener(() => setOpen(true));
    return () => setGuideOpener(null);
  }, []);
  const pub = snap.pub;
  const players = pub?.round?.participants.length ?? pub?.players.length;
  return (
    <Sheet open={open} onClose={() => setOpen(false)} label="Guía rápida">
      <QuickGuide
        pace={pub?.settings.pace}
        players={players}
        untimedTurns={snap.mode === 'local'}
        variant={pub?.round?.variant ?? pub?.settings.variant ?? null}
        forgeryChance={pub?.round?.forgeryChance ?? pub?.settings.forgeryChance ?? 100}
      />
      <button className="btn btn-primary btn-block" style={{ marginTop: 'var(--s-4)' }} onClick={() => setOpen(false)}>
        {pub ? 'Volver a la partida' : 'Cerrar'}
      </button>
    </Sheet>
  );
}
