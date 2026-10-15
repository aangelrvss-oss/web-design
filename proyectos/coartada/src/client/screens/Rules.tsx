// In-game rules: what the menu's "Cómo se juega" shows. Same wording as docs/RULES.md.
import { PACE_TIMINGS } from '../../shared/types';

export function RulesContent() {
  const def = PACE_TIMINGS.normal.defense;
  return (
    <div className="stack">
      <h2>Cómo se juega</h2>
      <p>
        Ha ocurrido un incidente absurdo y una persona del grupo es la culpable. Las demás son inocentes. A partir de 6 personas, la culpable
        tiene un cómplice que sabe quién es.
      </p>
      <ol className="stack" style={{ paddingLeft: '1.2em', margin: 0 }}>
        <li>
          <b>Lee tu expediente en privado.</b> Dice tu papel, dónde estuviste de verdad a cada una de las tres horas y tus recuerdos: personas
          con las que estuviste. Tus recuerdos son ciertos, pero no incluyen a todo el mundo.
        </li>
        <li>
          <b>Sella tu declaración.</b> Para cada hora eliges un sitio: esa es tu coartada para esa hora. Nadie ve las coartadas hasta que todo
          el mundo ha sellado. La persona culpable estaba en el lugar del incidente a la hora del incidente, así que ahí tiene que mentir.
        </li>
        <li>
          <b>Las coartadas se revelan a la vez</b> en el tablero. Cualquiera puede publicar hasta 3 testimonios del tipo «estuve con Marta a
          las 23:00». La app los compara con la coartada de Marta: <i>coincide</i>, <i>contradice</i> o <i>sin contraste</i> (si Marta no
          selló y su coartada es automática). Que coincidan no demuestra que sea verdad.
        </li>
        <li>
          <b>Salen dos pruebas</b>: la primera al empezar la investigación y la segunda cuando acaba su primera parte (o antes, si todo el
          mundo la pide). Las pruebas siempre dicen la verdad: dónde estuvo la persona culpable en las otras dos horas. Las coartadas y los
          testimonios pueden ser falsos.
        </li>
        <li>
          <b>Última defensa.</b> Durante la investigación, cada persona puede señalar en secreto a quien quiere oír. La más señalada tiene{' '}
          {def} segundos para defenderse en voz alta (si hay empate, decide un sorteo; si nadie señala, no hay defensa).
        </li>
        <li>
          <b>Votad en secreto.</b> Si la persona más votada es la culpable, gana el grupo de inocentes. Si es otra persona, o nadie, ganan la
          persona culpable y su cómplice.
        </li>
      </ol>

      <div className="label">Empates y tiempo</div>
      <ul className="small" style={{ margin: 0, paddingLeft: '1.2em' }}>
        <li>Empate en la votación: se repite solo entre las personas empatadas. Si vuelve a haber empate, nadie es acusado.</li>
        <li>Quien no vota a tiempo no cuenta. Si nadie vota, nadie es acusado.</li>
        <li>
          Si se acaba el tiempo de la declaración sin sellar, la app sella lo que tengas elegido o, si no elegiste las tres horas, una
          coartada automática marcada como tal.
        </li>
        <li>
          La declaración, cada parte de la investigación y la votación terminan antes si todo el mundo ha hecho lo suyo. La última defensa
          la puede terminar antes quien se defiende.
        </li>
        <li>En el modo de un solo móvil no hay tiempo límite para declarar ni para votar.</li>
      </ul>

      <div className="label">Puntos (se suman de ronda en ronda)</div>
      <ul className="small" style={{ margin: 0, paddingLeft: '1.2em' }}>
        <li>El grupo acusa a la persona culpable: +2 para cada inocente.</li>
        <li>La persona culpable se libra: +4 para ella y +3 para su cómplice.</li>
        <li>Votar a la persona culpable en la primera votación: +1 para cada inocente que lo hizo, gane quien gane.</li>
        <li>Publicar un testimonio verdadero que contradice una coartada falsa: +1 (una vez por ronda), sea cual sea tu papel.</li>
        <li>Objetivo secreto cumplido (solo si están activados): +1. No cambia quién gana la ronda.</li>
      </ul>

      <div className="label">Nueva ronda</div>
      <p className="small">
        Cada ronda empieza de cero: caso nuevo, papeles, recuerdos, pruebas y objetivos repartidos de nuevo; testimonios, señalamientos y
        votos vacíos. Solo se conservan los puntos, hasta que empieza una partida nueva.
      </p>
      <p className="small muted">Las pruebas nunca mienten. Las personas, a veces sí.</p>
    </div>
  );
}
