// Illustrated quick guide. The pictures are made of real game components and show the
// example round in src/shared/content/example.ts, which tests/guide-example.test.ts
// regenerates from its seed to make sure the guide matches the real rules.
import { GUIDE_EXAMPLE as G } from '../../shared/content/example';
import { getScenario } from '../../shared/content/scenarios';
import { DEFAULT_SETTINGS, PACE_TIMINGS } from '../../shared/types';
import { TraceRing } from '../ui/game';
import type { AvatarId } from '../../shared/characters';
import { ActionBar, Icon, Pin, Stamp, Token } from '../ui/kit';
import { QuickGuide } from './QuickGuide';

const CASE = getScenario(G.scenarioId);
const zoneName = (id: string) => CASE.zones.find((z) => z.id === id)!.name;
const HOURS = CASE.slots;
const COLORS: Record<string, number> = { Ana: 0, Bruno: 1, Carla: 2, Dani: 3, Eva: 4 };
const AVATAR: Record<string, AvatarId> = { Ana: 'periodista', Bruno: 'mecanico', Carla: 'profesora', Dani: 'cocinero', Eva: 'medica' };
const P = (name: string) => ({ name, color: COLORS[name], avatar: AVATAR[name] });
const DEFENSE = PACE_TIMINGS.normal.defense;

function MiniBoard() {
  return (
    <div className="paper kraft board" aria-label="Tablero de ejemplo">
      <div className="board-grid" role="table">
        <div role="row" style={{ display: 'contents' }}>
          <div className="hcell" role="columnheader">
            <span className="sr-only">Lugar</span>
          </div>
          {HOURS.map((h, i) => (
            <div key={h} className={`hcell ${i === G.scene.slot ? 'crime' : ''}`} role="columnheader">
              {h}
            </div>
          ))}
        </div>
        {G.zones.map((z) => (
          <div role="row" key={z} style={{ display: 'contents' }}>
            <div className="zcell" role="rowheader">
              {zoneName(z)}
            </div>
            {HOURS.map((h, slot) => {
              const here = G.players.filter((p) => G.declarations[p][slot] === z);
              const scene = z === G.scene.zone && slot === G.scene.slot;
              const ti = G.traces.findIndex((t) => t.zone === z && t.slot === slot);
              return (
                <div key={h} role="cell" className={`cell ${scene ? 'scene' : ''}`}>
                  {scene && <span className="scene-tag">Escena</span>}
                  {ti >= 0 && <TraceRing index={ti} />}
                  {here.map((p) => (
                    <Token key={p} player={P(p)} label={p} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="board-legend">
        <span>Rayado rojo: lugar y hora del incidente</span>
        <span>Contorno azul: prueba</span>
      </div>
    </div>
  );
}

function Step({ n, title, children, visual }: { n: number; title: string; children: React.ReactNode; visual?: React.ReactNode }) {
  return (
    <li className="stack" style={{ gap: 'var(--s-3)' }}>
      <div className="row" style={{ alignItems: 'baseline', gap: 'var(--s-3)' }}>
        <span className="guide-num" aria-hidden>
          {n}
        </span>
        <h3 style={{ fontSize: 'var(--t-xl)' }}>{title}</h3>
      </div>
      <div className="guide-text stack" style={{ gap: 'var(--s-2)' }}>
        {children}
      </div>
      {visual}
    </li>
  );
}

function StatusLine({ tone, icon, children }: { tone: 'ok' | 'bad' | 'neutral'; icon: string; children: React.ReactNode }) {
  return (
    <div className={`verdict-line ${tone}`}>
      <span className="verdict-icon" aria-hidden>
        <Icon name={icon} />
      </span>
      <span>{children}</span>
    </div>
  );
}

export function Guide({ onPlay, onBack }: { onPlay: () => void; onBack: () => void }) {
  const t1 = G.traces[0];
  const t2 = G.traces[1];
  return (
    <main className="screen guide">
      <header className="stack" style={{ gap: 'var(--s-3)', paddingTop: 'var(--s-4)' }}>
        <button className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
          Volver al inicio
        </button>
        <span className="wordmark" style={{ fontSize: 'clamp(2.8rem, 14vw, 4.4rem)' }}>
          Coartada
          <span className="bar" aria-hidden />
        </span>
        <h1 style={{ fontSize: 'var(--t-2xl)' }}>Guía rápida</h1>
        <p className="guide-text muted">
          Unos tres minutos de lectura. Los ejemplos salen de una ronda de ejemplo generada con las reglas reales del juego (el caso «
          {CASE.title}», con cinco personas inventadas: {G.players.join(', ')}). No es una partida jugada por personas.
        </p>
      </header>

      <section className="paper tabbed" data-tab="En 60 segundos">
        <p className="doc-text">
          Ha ocurrido un incidente absurdo y una persona del grupo es la culpable. Todo el mundo declara en secreto dónde estuvo a tres horas
          y las coartadas se revelan a la vez. Podéis testificar «estuve con Marta a tal hora» y la app compara ese testimonio con lo que
          declaró Marta. Salen dos pruebas que siempre dicen la verdad sobre la persona culpable. La persona más señalada tiene una última
          defensa y, al final, votáis en secreto.
        </p>
      </section>

      <section className="stack" aria-labelledby="g-ronda">
        <h2 id="g-ronda">Una ronda, paso a paso</h2>
        <ol className="list-plain stack" style={{ gap: 'var(--s-6)' }}>
          <Step
            n={1}
            title="Lee el caso y tu expediente"
            visual={
              <div className="paper tabbed" data-tab="Expediente confidencial de Eva (ejemplo)">
                <div className="label">Tu papel</div>
                <Stamp tone="blue">Inocente</Stamp>
                <p style={{ marginTop: 10, fontWeight: 600 }}>No lo hiciste. Ganas si el grupo acusa a la persona culpable.</p>
                <hr className="rule" />
                <div className="label">Tu noche real</div>
                <div className="night-table doc-text">
                  {HOURS.map((h, s) => (
                    <div key={h} style={{ display: 'contents' }}>
                      <span className="hour">{h}</span>
                      <span>{zoneName(G.truth.Eva[s])}</span>
                    </div>
                  ))}
                </div>
                <hr className="rule" />
                <div className="label">Tus recuerdos</div>
                <ul className="list-plain doc-text">
                  {G.evaMemories.map((m) => (
                    <li key={m.with}>
                      {HOURS[m.slot]}: estuviste con <b>{m.with}</b> en {zoneName(m.zone)}.
                    </li>
                  ))}
                </ul>
              </div>
            }
          >
            <p>
              Todo el mundo ve el caso: qué pasó, dónde y a qué hora (en el ejemplo, {zoneName(G.scene.zone)} a las {HOURS[G.scene.slot]}).
              Cada persona ve, solo ella, su papel, dónde estuvo de verdad a cada hora y sus recuerdos.
            </p>
            <p>
              Los recuerdos son ciertos, pero no incluyen a todo el mundo: a las 22:00 Eva estuvo en el jardín con Ana y no tiene ese recuerdo.{' '}
              <b>No recordar a alguien no demuestra que esa persona mienta.</b>
            </p>
          </Step>

          <Step
            n={2}
            title="Sella tu declaración"
            visual={
              <div className="paper" aria-label="Ejemplo de declaración">
                <div className="hour-block" style={{ borderBottom: 0, paddingTop: 0 }}>
                  <div className="spread">
                    <span className="hour">{HOURS[G.scene.slot]}</span>
                    <span className="tag red">Hora del incidente</span>
                  </div>
                  <div className="choices">
                    {G.zones.map((z) => (
                      <span key={z} className={`choice ${z === G.scene.zone ? 'scene' : ''}`} data-selected={z === G.truth.Eva[G.scene.slot]}>
                        {zoneName(z)}
                        {z === G.truth.Eva[G.scene.slot] && <span className="truth-mark">Aquí estabas</span>}
                        {z === G.scene.zone && <span className="truth-mark">Lugar del incidente</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            }
          >
            <p>
              Para cada una de las tres horas eliges un sitio: esa es tu <b>coartada</b> para esa hora. Las tres juntas forman tu{' '}
              <b>declaración</b>. Al sellarla ya no se puede cambiar, y nadie la ve hasta que todo el mundo ha sellado.
            </p>
            <p>
              Si eres inocente, lo habitual es decir la verdad. La persona culpable estaba en el lugar del incidente a esa hora, así que ahí
              tiene que mentir. En el ejemplo, Ana estaba en {zoneName(G.scene.zone)} y declara {zoneName(G.declarations.Ana[G.scene.slot])}.
            </p>
            <p>
              Si se acaba el tiempo sin sellar: si habías elegido las tres horas, se sella tal cual; si no, la app pone una{' '}
              <b>coartada automática</b> y la marca como «automática».
            </p>
          </Step>

          <Step n={3} title="Revelad las coartadas" visual={<MiniBoard />}>
            <p>
              Todas las coartadas aparecen a la vez en el tablero. Cada bola es una persona en el sitio que declaró. En el ejemplo, a las{' '}
              {HOURS[G.scene.slot]} todo el mundo dice que estaba en {zoneName('barra')} y el lugar del incidente está vacío: alguien miente.
            </p>
          </Step>

          <Step
            n={4}
            title="Primera prueba y testimonios"
            visual={
              <div className="stack">
                <div className="paper trace-card">
                  <div className="label">Prueba 1 de 2</div>
                  <p className="doc-text">{CASE.zones.find((z) => z.id === t1.zone)!.trace}</p>
                  <p className="conclusion">
                    Hecho comprobado: la persona culpable estuvo en {zoneName(t1.zone)} a las {HOURS[t1.slot]}.
                  </p>
                  <p className="small" style={{ marginTop: 6 }}>
                    Coartadas que encajan con esta prueba: <b>{G.players.filter((p) => G.declarations[p][t1.slot] === t1.zone).join(', ')}</b>.
                  </p>
                </div>
                <ul className="paper list-plain">
                  <li className="testimony">
                    <Pin player={P('Bruno')} />
                    <div>
                      <div className="small" style={{ fontWeight: 700 }}>
                        Bruno
                      </div>
                      <q>Estuve con Carla en {zoneName('barra')} a las 00:00.</q>
                      <StatusLine tone="ok" icon="check">
                        Coincide con la coartada de Carla.
                      </StatusLine>
                    </div>
                  </li>
                  <li className="testimony">
                    <Pin player={P('Ana')} />
                    <div>
                      <div className="small" style={{ fontWeight: 700 }}>
                        Ana
                      </div>
                      <q>Estuve con Eva en {zoneName('barra')} a las 00:00.</q>
                      <StatusLine tone="ok" icon="check">
                        Coincide con la coartada de Eva.
                      </StatusLine>
                    </div>
                  </li>
                </ul>
              </div>
            }
          >
            <p>
              La primera prueba sale al empezar la investigación. Las pruebas siempre dicen la verdad: dónde estuvo la persona culpable en otra
              hora. Las coartadas y los testimonios, en cambio, pueden ser falsos.
            </p>
            <p>
              Cada persona puede publicar hasta 3 testimonios del tipo «estuve con X a tal hora». El sitio sale de su propia coartada. La app
              lo compara con la coartada de X para esa hora y lo marca así:
            </p>
            <ul className="stack" style={{ paddingLeft: '1.1em', margin: 0, gap: 4 }}>
              <li>
                <b>Coincide</b>: X declaró lo mismo. Solo significa que las dos versiones encajan, <b>no que sean verdad</b>. El testimonio de
                Ana coincide con Eva… y es falso: Ana estaba en {zoneName(G.scene.zone)}.
              </li>
              <li>
                <b>Contradice</b>: X declaró otro sitio. Al menos una de las dos personas miente.
              </li>
              <li>
                <b>Sin contraste</b>: X no selló su declaración y su coartada es automática, así que no hay nada suyo con qué comparar.
              </li>
            </ul>
          </Step>

          <Step
            n={5}
            title="Segunda prueba"
            visual={
              <div className="paper trace-card">
                <div className="label">Prueba 2 de 2</div>
                <p className="doc-text">{CASE.zones.find((z) => z.id === t2.zone)!.trace}</p>
                <p className="conclusion">
                  Hecho comprobado: la persona culpable estuvo en {zoneName(t2.zone)} a las {HOURS[t2.slot]}.
                </p>
                <p className="small" style={{ marginTop: 6 }}>
                  Coartadas que encajan con esta prueba: <b>{G.players.filter((p) => G.declarations[p][t2.slot] === t2.zone).join(' y ')}</b>.
                </p>
              </div>
            }
          >
            <p>
              Sale cuando se acaba el tiempo de la primera parte de la investigación, o antes si todo el mundo pulsa «Pedir prueba 2». En el ejemplo solo encajan Ana y Eva con
              las dos pruebas: quedan dos sospechosas. Ojo: una persona culpable puede mentir justo en esas horas para no aparecer.
            </p>
          </Step>

          <Step
            n={6}
            title="Última defensa"
            visual={
              <div className="paper center stack" style={{ alignItems: 'center' }}>
                <Pin player={P('Ana')} size="xl" />
                <div className="defense-name">Ana</div>
                <div className="defense-clock" aria-hidden>
                  {DEFENSE}
                </div>
                <p className="small">La persona más señalada habla; nadie puede cambiar ya nada.</p>
              </div>
            }
          >
            <p>
              Durante la investigación, cada persona puede <b>señalar en secreto</b> a quien quiere oír, y cambiarlo cuando quiera. Al
              terminar la investigación, la más señalada tiene {DEFENSE} segundos ({PACE_TIMINGS.rapido.defense} en ritmo rápido, {PACE_TIMINGS.relajado.defense} en relajado) para defenderse en voz
              alta.
            </p>
            <p>
              Si hay empate, la app sortea entre las personas empatadas. Si nadie señala a nadie, o la persona elegida no está conectada, no
              hay defensa y se vota directamente. La defensa no revela el papel de nadie.
            </p>
          </Step>

          <Step
            n={7}
            title="Votad en secreto"
            visual={
              <div className="paper center stack" style={{ alignItems: 'center' }}>
                <p className="doc-text">El grupo acusa a</p>
                <Pin player={P('Ana')} size="xl" />
                <h2>Ana</h2>
                <Stamp big>Culpable</Stamp>
              </div>
            }
          >
            <p>
              Cada persona vota a otra. Si la más votada es la culpable, gana el grupo de inocentes. Si es otra persona, o nadie, ganan la
              persona culpable y su cómplice.
            </p>
            <p>
              Si hay empate, se vota otra vez solo entre las personas empatadas. Si vuelve a haber empate, nadie es acusado. Quien no vota a
              tiempo no cuenta; si nadie vota, nadie es acusado.
            </p>
          </Step>

          <Step n={8} title="Veredicto y puntos">
            <p>
              Se revela todo: los papeles, dónde estuvo de verdad cada persona (las mentiras aparecen tachadas), qué testimonios eran ciertos y
              los puntos de la ronda. Los puntos se suman a los de las rondas anteriores.
            </p>
          </Step>
        </ol>
      </section>

      <section className="stack" aria-labelledby="g-glosario">
        <h2 id="g-glosario">Qué es cada cosa</h2>
        <dl className="paper guide-glossary">
          <dt>Ronda</dt>
          <dd>Una investigación completa: desde el reparto de papeles hasta el veredicto y los puntos.</dd>
          <dt>Partida</dt>
          <dd>El conjunto de rondas que se juegan seguidas ({DEFAULT_SETTINGS.rounds} por defecto). Los puntos se acumulan durante toda la partida.</dd>
          <dt>Coartada</dt>
          <dd>El sitio que una persona declara para una hora. Cada declaración tiene tres coartadas, una por hora.</dd>
          <dt>Recuerdo</dt>
          <dd>Información privada y cierta: con quién estuviste en algún momento. No incluye a todo el mundo.</dd>
          <dt>Prueba</dt>
          <dd>Información fiable sobre dónde estuvo de verdad la persona culpable. Hay dos por ronda.</dd>
          <dt>Testimonio</dt>
          <dd>Lo que alguien afirma en público («estuve con X a tal hora»). La app lo compara con la coartada de X, pero no sabe si es verdad.</dd>
          <dt>Objetivo secreto</dt>
          <dd>Misión opcional de +1 punto. Solo se reparte si quien dirige la sala lo activa.</dd>
        </dl>
      </section>

      <section className="stack" aria-labelledby="g-resumen">
        <h2 id="g-resumen">Papeles, defensa y puntos</h2>
        <p className="guide-text muted">Es la misma guía rápida que se abre en el juego con el botón de ayuda de la barra superior.</p>
        <QuickGuide all={['papeles', 'defensa', 'puntos']} untimedTurns />
      </section>

      <section className="paper tabbed stack" data-tab="Objetivos secretos (opcionales)">
        <p className="guide-text">
          Si quien dirige la sala los activa, cada persona recibe una misión extra de +1 punto, por ejemplo «que nadie te vote» o «que tu
          coartada diga que estuviste en el jardín». Esta última obliga a mentir aunque seas inocente.
        </p>
        <p className="guide-text">
          Consecuencias: mentir no está prohibido, pero si alguien te contradice con un testimonio verdadero, esa persona gana un punto y tú
          pareces sospechoso. Los objetivos nunca cambian quién gana la ronda; solo suman un punto.
        </p>
      </section>

      <section className="paper tabbed stack" data-tab="Al empezar una ronda nueva">
        <p className="guide-text">
          Caso nuevo, papeles nuevos, recuerdos, pruebas y objetivos repartidos otra vez; testimonios, señalamientos y votos a cero; el
          temporizador empieza de nuevo. Solo se conservan los puntos. Una partida nueva pone también los puntos a cero.
        </p>
      </section>

      <ActionBar>
        <button className="btn btn-ghost" style={{ flex: 'none' }} onClick={onBack}>
          Inicio
        </button>
        <button className="btn btn-primary" onClick={onPlay}>
          Jugar en este móvil
        </button>
      </ActionBar>
    </main>
  );
}
