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
