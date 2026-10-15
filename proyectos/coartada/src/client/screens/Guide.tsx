// Illustrated quick guide. Every picture is made of the real game components and
// shows the worked example from docs/RULES.md §11 (the wedding cake, 5 players).
import { Pin, Stamp, ActionBar } from '../ui/kit';

const P = {
  ana: { name: 'Ana', color: 0 },
  bruno: { name: 'Bruno', color: 1 },
  carla: { name: 'Carla', color: 2 },
  dani: { name: 'Dani', color: 3 },
  eva: { name: 'Eva', color: 4 },
};
const HOURS = ['22:00', '23:00', '00:00'];
const ZONES = ['La cocina', 'El jardín', 'La barra libre', 'La capilla'];
// What each person declared (Ana lied at 00:00: she was in the chapel).
const DECL: [keyof typeof P, number[]][] = [
  ['ana', [1, 1, 2]],
  ['bruno', [0, 1, 2]],
  ['carla', [2, 1, 2]],
  ['dani', [2, 0, 2]],
  ['eva', [1, 1, 2]],
];

function Ring() {
  return (
    <svg className="trace-ring" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
      <path
        d="M8 32 C 6 12, 40 4, 62 6 C 88 8, 98 22, 94 38 C 90 54, 50 58, 28 54 C 10 50, 4 40, 12 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function MiniBoard() {
  const traces: Record<string, string> = { '1|1': 'P1', '1|0': 'P2' };
  return (
    <div className="paper kraft board" aria-label="Ejemplo de tablero">
      <div className="board-grid" role="table">
        <div role="row" style={{ display: 'contents' }}>
          <div className="hcell" role="columnheader">
            <span className="sr-only">Lugar</span>
          </div>
          {HOURS.map((h, i) => (
            <div key={h} className={`hcell ${i === 2 ? 'crime' : ''}`} role="columnheader">
              {h}
            </div>
          ))}
        </div>
        {ZONES.map((z, zi) => (
          <div role="row" key={z} style={{ display: 'contents' }}>
            <div className="zcell" role="rowheader">
              {z}
            </div>
            {HOURS.map((h, hi) => {
              const here = DECL.filter(([, d]) => d[hi] === zi);
              const scene = zi === 3 && hi === 2;
              const t = traces[`${zi}|${hi}`];
              return (
                <div key={h} role="cell" className={`cell ${scene ? 'scene' : ''}`}>
                  {scene && <span className="scene-tag">Escena</span>}
                  {t && (
                    <>
                      <Ring />
                      <span className="trace-num">{t}</span>
                    </>
                  )}
                  {here.map(([k]) => (
                    <Pin key={k} player={P[k]} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="board-legend">
        <span>Rayado rojo: dónde y cuándo pasó</span>
        <span>Círculo azul: prueba</span>
      </div>
    </div>
  );
}

function Step({ n, title, children, visual }: { n: number; title: string; children: React.ReactNode; visual: React.ReactNode }) {
  return (
    <li className="stack" style={{ gap: 'var(--s-3)' }}>
      <div className="row" style={{ alignItems: 'baseline', gap: 'var(--s-3)' }}>
        <span className="guide-num" aria-hidden>
          {n}
        </span>
        <h3 style={{ fontSize: 'var(--t-xl)' }}>{title}</h3>
      </div>
      <p className="guide-text">{children}</p>
      {visual}
    </li>
  );
}

export function Guide({ onPlay, onBack }: { onPlay: () => void; onBack: () => void }) {
  return (
    <main className="screen guide">
      <header className="stack" style={{ gap: 'var(--s-3)', paddingTop: 'var(--s-4)' }}>
        <button className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
          Volver
        </button>
        <span className="wordmark" style={{ fontSize: 'clamp(2.8rem, 14vw, 4.4rem)' }}>
          Coartada
          <span className="bar" aria-hidden />
        </span>
        <h1 style={{ fontSize: 'var(--t-2xl)' }}>Guía rápida</h1>
        <p className="guide-text muted">Dos minutos de lectura. Los ejemplos son de una ronda real: la tarta de la boda, con Ana, Bruno, Carla, Dani y Eva.</p>
      </header>

      <section className="paper tabbed" data-tab="En 60 segundos">
        <p className="doc-text">
          Anoche pasó algo absurdo y una persona del grupo fue. Todo el mundo dice en secreto dónde estuvo a tres horas y las
          coartadas se destapan a la vez. Si dices «estuve con Marta», el tablero comprueba si Marta dijo lo mismo. Salen dos pruebas
          que nunca mienten. Al final votáis quién fue.
        </p>
      </section>

      <section className="stack" aria-labelledby="g-ronda">
        <h2 id="g-ronda">Una ronda, paso a paso</h2>
        <ol className="list-plain stack" style={{ gap: 'var(--s-6)' }}>
          <Step
            n={1}
            title="Lee el caso y tu expediente"
            visual={
              <div className="paper tabbed" data-tab="Expediente confidencial (el de Eva)">
                <div className="label">Tu papel</div>
                <Stamp tone="blue">Inocente</Stamp>
                <p style={{ marginTop: 10, fontWeight: 600 }}>Tú no fuiste. Ayuda al grupo a acusar a quien sí.</p>
                <hr className="rule" />
                <div className="label">Tu noche real</div>
                <div className="night-table doc-text">
                  <span className="hour">22:00</span>
                  <span>El jardín</span>
                  <span className="hour">23:00</span>
                  <span>El jardín</span>
                  <span className="hour">00:00</span>
                  <span>La barra libre</span>
                </div>
                <hr className="rule" />
                <div className="label">Lo que recuerdas</div>
                <ul className="list-plain doc-text">
                  <li>00:00, estuviste con Bruno en La barra libre.</li>
                  <li>00:00, estuviste con Carla en La barra libre.</li>
                </ul>
              </div>
            }
          >
            Todo el mundo ve el caso: qué pasó, dónde y a qué hora («La capilla a las 00:00»). En tu móvil, y solo en el tuyo, ves tu
            papel, dónde estuviste de verdad y a quién recuerdas haber visto. Los recuerdos son ciertos, pero no recuerdas a todo el mundo.
          </Step>

          <Step
            n={2}
            title="Sella tu coartada"
            visual={
              <div className="paper" aria-label="Ejemplo de declaración">
                <div className="hour-block" style={{ borderBottom: 0, paddingTop: 0 }}>
                  <div className="spread">
                    <span className="hour">00:00</span>
                    <span className="tag red">Hora del crimen</span>
                  </div>
                  <div className="choices">
                    <span className="choice">La cocina</span>
                    <span className="choice">El jardín</span>
                    <span className="choice" aria-pressed="true">
                      La barra libre<span className="truth-mark">Aquí estabas</span>
                    </span>
                    <span className="choice scene">
                      La capilla<span className="truth-mark">Escena del crimen</span>
                    </span>
                  </div>
                </div>
              </div>
            }
          >
            Elige un sitio para cada hora y pulsa «Sellar». Nadie ve lo que pones hasta que todo el mundo ha sellado. Si eres inocente,
            lo normal es decir la verdad (viene marcada). Si eres culpable, a la hora del crimen estabas en la escena: ahí tienes que
            inventarte algo.
          </Step>

          <Step n={3} title="Destapad el tablero" visual={<MiniBoard />}>
            Todas las coartadas aparecen a la vez. Cada bola es una persona en el sitio que dijo. Aquí, a las 00:00 todo el mundo dice
            que estaba en la barra libre y la capilla está vacía. Alguien miente.
          </Step>

          <Step
            n={4}
            title="Testificad y mirad las pruebas"
            visual={
              <div className="stack">
                <div className="paper trace-card">
                  <div className="label">Prueba 2. Las pruebas nunca mienten.</div>
                  <p className="doc-text">Pétalos de buganvilla enredados en el pelo.</p>
                  <p className="conclusion">El culpable estuvo en El jardín a las 22:00.</p>
                </div>
                <ul className="paper list-plain">
                  <li className="testimony">
                    <Pin player={P.ana} />
                    <div>
                      <div className="small" style={{ fontWeight: 700 }}>
                        Ana
                      </div>
                      <q>Estuve con Eva en La barra libre a las 00:00.</q>
                      <div className="verdict-line ok">✓ Cuadra con lo que declaró Eva</div>
                    </div>
                  </li>
                  <li className="testimony">
                    <Pin player={P.bruno} />
                    <div>
                      <div className="small" style={{ fontWeight: 700 }}>
                        Bruno (en otra versión de la ronda)
                      </div>
                      <q>Estuve con Ana en El jardín a las 23:00.</q>
                      <div className="verdict-line bad">✗ No cuadra: Ana dijo La cocina</div>
                    </div>
                  </li>
                </ul>
              </div>
            }
          >
            Hablad en voz alta. Puedes publicar hasta 3 testimonios del tipo «estuve con X a tal hora» y el tablero marca si cuadra con
            lo que X declaró. Las pruebas salen en dos tandas y dicen dónde estuvo el culpable en las otras horas. En el ejemplo, solo Ana
            y Eva dijeron «jardín a las 22:00»: quedan dos sospechosas.
          </Step>

          <Step
            n={5}
            title="Votad en secreto"
            visual={
              <div className="paper center stack" style={{ alignItems: 'center' }}>
                <p className="doc-text">El grupo acusa a</p>
                <Pin player={P.ana} size="xl" />
                <h2>Ana</h2>
                <Stamp big>Culpable</Stamp>
              </div>
            }
          >
            Cada cual vota a una persona. Si la más votada es la culpable, gana el grupo; si no, el culpable se sale con la suya. Si hay
            empate, se vuelve a votar solo entre los empatados. Después se ve toda la verdad: quién mintió, dónde y cuántos puntos se
            lleva cada uno.
          </Step>
        </ol>
      </section>

      <section className="stack" aria-labelledby="g-papeles">
        <h2 id="g-papeles">Los tres papeles</h2>
        <div className="guide-roles">
          <div className="paper stack">
            <Stamp tone="blue">Inocente</Stamp>
            <p>No fuiste. Dices la verdad (casi siempre), cuentas lo que recuerdas y buscas al que miente.</p>
          </div>
          <div className="paper stack">
            <Stamp>Culpable</Stamp>
            <p>Fuiste tú. Mientes donde haga falta y que acusen a otra persona.</p>
          </div>
          <div className="paper stack">
            <Stamp>Cómplice</Stamp>
            <p>Solo a partir de 6 personas. Sabes quién fue y le cubres. Ganas si no le pillan.</p>
          </div>
        </div>
      </section>

      <section className="paper tabbed" data-tab="El dilema del culpable">
        <div className="guide-two">
          <div>
            <h3>Mentir poco</h3>
            <p className="guide-text">
              Solo cambias la hora del crimen. Nadie te podrá contradecir, pero las pruebas te pondrán donde estuviste de verdad, junto a
              algún inocente.
            </p>
          </div>
          <div>
            <h3>Mentir mucho</h3>
            <p className="guide-text">
              Cambias más horas para esquivar las pruebas. Pero si alguien estuvo contigo y lo recuerda, su testimonio saldrá en rojo.
            </p>
          </div>
        </div>
      </section>

      <section className="stack" aria-labelledby="g-puntos">
        <h2 id="g-puntos">Puntos</h2>
        <div className="paper">
          <table className="truth-table">
            <tbody>
              {[
                ['El grupo pilla al culpable', '+2 cada inocente'],
                ['El culpable se libra', '+4 culpable, +3 cómplice'],
                ['Votaste al culpable (inocentes)', '+1, aunque se libre'],
                ['Tu testimonio verdadero destapa una mentira', '+1'],
                ['Cumples tu encargo secreto (opcional)', '+1'],
              ].map(([a, b]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td style={{ fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right' }}>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stack" aria-labelledby="g-trucos">
        <h2 id="g-trucos">Trucos</h2>
        <ul className="guide-text stack" style={{ paddingLeft: '1.1em', margin: 0 }}>
          <li>Publica tus recuerdos pronto: un testimonio cierto que sale en rojo deja en evidencia a alguien.</li>
          <li>Mira quién está en las casillas de las pruebas y quién no tiene a nadie que le respalde a la hora del crimen.</li>
          <li>Que no recuerdes a alguien no prueba nada. Que alguien diga que estuvo contigo y tú no lo recuerdes, tampoco… pero da que pensar.</li>
          <li>Culpable: una mentira concurrida (donde estaba todo el mundo) se defiende mejor que una solitaria.</li>
        </ul>
      </section>

      <section className="paper tabbed stack" data-tab="Cómo funciona esta página">
        <h3>Un solo móvil para todos</h3>
        <ol className="guide-text stack" style={{ paddingLeft: '1.2em', margin: 0 }}>
          <li>Escribe los nombres (de 4 a 10) y pulsa «Empezar».</li>
          <li>Pasa el móvil: cada persona pulsa «Soy…», lee su expediente, sella su coartada y pulsa «Ocultar y pasar».</li>
          <li>Con el móvil en el centro, destapad las coartadas, hablad, testificad y sacad la segunda prueba.</li>
          <li>Para votar, el móvil vuelve a dar la vuelta. Al final, todos veis el veredicto.</li>
        </ol>
        <hr className="rule" />
        <h3>Un móvil por persona</h3>
        <p className="guide-text">
          Es la versión principal del juego, con salas, código y QR. Necesita el servidor del proyecto: en un ordenador con Node.js
          ejecuta, dentro de <code>proyectos/coartada</code>:
        </p>
        <pre className="guide-code">npm install{'\n'}npm run build{'\n'}npm start</pre>
        <p className="guide-text">
          Después, con todos los móviles en la misma Wi-Fi, abrid <code>http://IP-del-ordenador:3000</code>, crea una sala y que el resto
          escanee el QR.
        </p>
      </section>

      <section className="stack" aria-labelledby="g-faq">
        <h2 id="g-faq">Preguntas rápidas</h2>
        {[
          ['¿Puedo mentir siendo inocente?', 'Sí. A veces un encargo secreto te obliga. Pero si alguien te pilla con un testimonio verdadero, gana un punto y tú quedas fatal.'],
          ['¿Las pruebas pueden equivocarse?', 'No. Siempre dicen dónde estuvo de verdad el culpable. Las personas son las que pueden mentir.'],
          ['¿Qué pasa si se acaba el tiempo?', 'Quien no haya sellado recibe una coartada automática (marcada «auto»). Quien no vote, no cuenta.'],
          ['¿Y si hay empate en la votación?', 'Se repite solo entre los empatados. Si vuelve a haber empate, nadie es acusado y el culpable se libra.'],
          ['¿Hay que registrarse?', 'No. Ni cuentas, ni correos. Esta página no envía nada a ningún sitio.'],
        ].map(([q, a]) => (
          <details key={q} className="paper guide-faq">
            <summary>{q}</summary>
            <p className="guide-text">{a}</p>
          </details>
        ))}
      </section>

      <ActionBar>
        <button className="btn btn-ghost" style={{ flex: 'none' }} onClick={onBack}>
          Inicio
        </button>
        <button className="btn btn-primary" onClick={onPlay}>
          Jugar ahora
        </button>
      </ActionBar>
    </main>
  );
}
