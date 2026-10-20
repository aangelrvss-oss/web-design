// Turns a resolved round into a short, funny case summary and a few mentions.
// Template-based and deterministic: no AI, no network.
import type { PublicView } from '../../shared/engine/views';
import { atHour, listJoin, playerName, zoneName } from './text';

export interface Mention {
  title: string;
  who: string;
  why: string;
}

export function caseSummary(pub: PublicView): { story: string[]; mentions: Mention[] } {
  const r = pub.round!;
  const rv = r.reveal!;
  const o = rv.outcome;
  const name = (id: string | null) => playerName(pub, id);
  const roles = rv.roles;
  const culprit = Object.keys(roles).find((p) => roles[p] === 'culpable')!;
  const accomplice = Object.keys(roles).find((p) => roles[p] === 'complice') ?? null;
  const T = r.scene.slot;
  const slot = (s: number) => r.scenario.slots[s];
  const claim = r.declarations![culprit].zones[T];

  const story: string[] = [];
  story.push(
    `${name(culprit)} ${r.scenario.culpritAction} ${atHour(slot(T))} en ${zoneName(pub, r.scene.zone)}, pero juró que estaba en ${zoneName(pub, claim)}.`,
  );
  const extraLies = o.lies[culprit].filter((s) => s !== T);
  if (extraLies.length > 0) {
    story.push(`Para esquivar las pruebas también mintió ${extraLies.map((s) => atHour(slot(s))).join(' y ')}.`);
  } else {
    story.push('En lo demás dijo la verdad, que es la mejor manera de mentir.');
  }
  const correct = Object.entries(rv.votes).filter(([v, t]) => t === culprit && v !== accomplice).map(([v]) => name(v));
  if (o.culpritCaught) {
    story.push(
      correct.length === 0
        ? 'Al final, el grupo lo vio claro.'
        : `${listJoin(correct)} no se lo ${correct.length === 1 ? 'tragó' : 'tragaron'}.`,
    );
  } else if (o.accused) {
    story.push(`El grupo acusó a ${name(o.accused)}, que ${roles[o.accused] === 'complice' ? 'era cómplice, no culpable' : 'era inocente'}.`);
  } else {
    story.push('El grupo no se puso de acuerdo y nadie fue acusado.');
  }
  if (accomplice) {
    const vouched = r.testimonies.some((t) => t.by === accomplice && t.subject === culprit && t.status === 'coincide');
    story.push(
      vouched
        ? `${name(accomplice)}, su cómplice, le cubrió con un testimonio.`
        : `${name(accomplice)} era cómplice y ${o.culpritCaught ? 'no pudo salvarle' : 'disimuló como si nada'}.`,
    );
  }

  const mentions: Mention[] = [];
  const exposers = r.testimonies.filter((t) => o.exposing.includes(t.id));
  for (const by of new Set(exposers.map((t) => t.by))) {
    const t = exposers.find((x) => x.by === by)!;
    mentions.push({ title: 'Cazador de mentiras', who: name(by), why: `Pilló a ${name(t.subject)} mintiendo ${atHour(slot(t.slot))}.` });
  }
  const liars = Object.entries(o.lies)
    .filter(([id, l]) => l.length > 0 && id !== culprit)
    .sort((a, b) => b[1].length - a[1].length);
  if (liars.length) {
    const [id, l] = liars[0];
    mentions.push({
      title: 'Mentira gratuita',
      who: name(id),
      why: `${roles[id] === 'complice' ? 'Cómplice' : 'Inocente'}, y aun así mintió ${l.length === 1 ? 'una vez' : `${l.length} veces`}.`,
    });
  }
  const innocentsVoted = Object.entries(o.tally)
    .filter(([id, n]) => roles[id] === 'inocente' && n > 0)
    .sort((a, b) => b[1] - a[1]);
  if (innocentsVoted.length && innocentsVoted[0][1] >= 2) {
    mentions.push({ title: 'Cabeza de turco', who: name(innocentsVoted[0][0]), why: `Inocente con ${innocentsVoted[0][1]} votos en contra.` });
  }
  return { story, mentions };
}

export type FactKind = 'evidence' | 'lie' | 'defense' | 'testimony' | 'vote';

export interface Fact {
  kind: FactKind;
  text: string;
  /** People the fact is about, to show their portraits. */
  people: string[];
}

/**
 * The round's checked facts, for the case file at the verdict: only what the reveal data says
 * (evidence, lies, the defense, testimonies, votes), no motives and no "because". The jokey
 * chronicle above (caseSummary) is labelled as such on screen.
 */
export function roundFacts(pub: PublicView): Fact[] {
  const r = pub.round!;
  const rv = r.reveal!;
  const o = rv.outcome;
  const name = (id: string | null) => playerName(pub, id);
  const culprit = Object.keys(rv.roles).find((p) => rv.roles[p] === 'culpable')!;
  const accomplice = Object.keys(rv.roles).find((p) => rv.roles[p] === 'complice') ?? null;
  const hour = (s: number) => atHour(r.scenario.slots[s]);
  const facts: Fact[] = [];

  rv.traces.forEach((t, i) => {
    const fits = r.participants.filter((id) => r.declarations?.[id]?.zones[t.slot] === t.zone);
    const culpritFits = fits.includes(culprit);
    facts.push({
      kind: 'evidence',
      text: `Prueba ${i + 1}: la persona culpable estuvo en ${zoneName(pub, t.zone)} ${hour(t.slot)}. ${
        fits.length === 0 ? 'Ninguna coartada encajaba' : `${fits.length === 1 ? 'Encajaba la coartada de' : 'Encajaban las de'} ${listJoin(fits.map(name))}`
      }${culpritFits ? '' : `; ${name(culprit)} había declarado otro sitio a esa hora`}.`,
      people: fits,
    });
  });

  const lies = o.lies[culprit] ?? [];
  facts.push({
    kind: 'lie',
    text: `${name(culprit)} mintió ${lies.length === 1 ? 'en 1 hora' : `en ${lies.length} horas`}: ${lies.map(hour).join(' y ')}.`,
    people: [culprit],
  });

  const d = r.defense;
  if (d) {
    const text =
      d.reason === 'senalado'
        ? `${name(d.defender)} fue la persona más señalada (${d.pointerCount}) y tuvo la última defensa.`
        : d.reason === 'sorteo'
          ? `Empate a ${d.pointerCount} señalamientos entre ${d.tiedCount} personas: el sorteo dio la última defensa a ${name(d.defender)}.`
          : d.reason === 'nadie_senalado'
            ? 'Nadie señaló a nadie: no hubo última defensa.'
            : `${name(d.defender)} era la más señalada, pero no estaba conectada: no hubo última defensa.`;
    facts.push({ kind: 'defense', text, people: d.defender ? [d.defender] : [] });
  }

  const ts = r.testimonies;
  if (ts.length === 0) facts.push({ kind: 'testimony', text: 'Nadie publicó ningún testimonio.', people: [] });
  else {
    const contra = ts.filter((t) => t.status === 'contradice').length;
    facts.push({
      kind: 'testimony',
      text: `${ts.length === 1 ? 'Se publicó 1 testimonio' : `Se publicaron ${ts.length} testimonios`}; ${
        contra === 0 ? 'ninguno contradecía una coartada' : contra === 1 ? '1 contradecía una coartada' : `${contra} contradecían alguna coartada`
      }.`,
      people: [],
    });
    for (const t of ts.filter((x) => o.exposing.includes(x.id)))
      facts.push({ kind: 'testimony', text: `${name(t.by)} desmontó con un testimonio cierto la coartada de ${name(t.subject)} ${hour(t.slot)}.`, people: [t.by, t.subject] });
    if (accomplice)
      for (const t of ts.filter((x) => x.by === accomplice && x.subject === culprit))
        facts.push({ kind: 'testimony', text: `${name(accomplice)}, cómplice, dio un testimonio sobre ${name(culprit)} ${hour(t.slot)}.`, people: [accomplice, culprit] });
  }

  const voters = Object.keys(rv.votes).length;
  const missing = r.participants.length - voters;
  if (o.runoffTally) {
    facts.push({ kind: 'vote', text: `Hubo empate en la votación: desempate entre ${listJoin(Object.keys(o.runoffTally).map(name))}.`, people: Object.keys(o.runoffTally) });
  }
  facts.push({
    kind: 'vote',
    text: o.accused
      ? `${name(o.accused)} recibió ${(o.runoffTally ?? o.tally)[o.accused]} ${(o.runoffTally ?? o.tally)[o.accused] === 1 ? 'voto' : 'votos'} y fue la persona acusada${missing > 0 ? `; ${missing === 1 ? '1 persona no votó' : `${missing} personas no votaron`} a tiempo` : ''}.`
      : `Nadie fue acusado${missing > 0 ? `; ${missing === 1 ? '1 persona no votó' : `${missing} personas no votaron`} a tiempo` : ''}.`,
    people: o.accused ? [o.accused] : [],
  });
  return facts;
}
