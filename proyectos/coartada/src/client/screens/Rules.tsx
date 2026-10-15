// The 60-second explanation. It is a real sequence, so it is numbered.
export function RulesContent() {
  return (
    <div className="stack">
      <h2>Cómo se juega</h2>
      <p>Anoche pasó algo absurdo. Una persona del grupo es culpable; el resto, inocentes. A partir de 6, la persona culpable tiene cómplice.</p>
      <ol className="stack" style={{ paddingLeft: '1.2em', margin: 0 }}>
        <li>
          <b>Lee tu expediente.</b> Dice tu papel, dónde estuviste de verdad a cada hora y con quién recuerdas haber estado.
        </li>
        <li>
          <b>Declara tu coartada en secreto.</b> Dónde estuviste a cada hora. El culpable estaba en la escena del crimen, así que tiene que
          mentir al menos ahí.
        </li>
        <li>
          <b>Todas las coartadas se destapan a la vez</b> en el tablero. Podéis testificar «estuve con Marta a las 23:00» y el tablero
          marca si cuadra con lo que Marta declaró.
        </li>
        <li>
          <b>Salen dos pruebas que nunca mienten:</b> dónde estuvo el culpable en las otras dos horas. ¿Quién mintió para esquivarlas?
        </li>
        <li>
          <b>Votad en secreto.</b> Si la persona más votada es la culpable, gana el grupo. Si no, el culpable (y su cómplice) se salen con la
          suya. Empate: desempate entre los empatados; si sigue empatado, nadie es acusado.
        </li>
      </ol>
      <div className="label">Puntos</div>
      <ul className="small" style={{ margin: 0, paddingLeft: '1.2em' }}>
        <li>Grupo acierta: +2 cada inocente.</li>
        <li>Culpable escapa: +4 culpable, +3 cómplice.</li>
        <li>Votar al culpable: +1. Destapar una mentira con un testimonio cierto: +1. Encargo secreto cumplido: +1.</li>
      </ul>
      <p className="small muted">Las pruebas nunca mienten. Tus amigos, a lo mejor sí.</p>
    </div>
  );
}
