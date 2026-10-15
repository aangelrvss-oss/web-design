// Scenario registry. To add a case: create scenarios/<id>.ts and list it here.
// `npm run validate` checks every scenario for consistency and playability.
import type { ScenarioDef } from './types';
import bodaTarta from './scenarios/boda-tarta';
import pisoGato from './scenarios/piso-gato';
import oficinaAspirador from './scenarios/oficina-aspirador';
import abuelaViral from './scenarios/abuela-viral';
import navidadAmigoInvisible from './scenarios/navidad-amigo-invisible';
import cruceroGorra from './scenarios/crucero-gorra';
import trenVaho from './scenarios/tren-vaho';
import casaRuralFantasma from './scenarios/casa-rural-fantasma';
import campingChanclas from './scenarios/camping-chanclas';
import albergueSello from './scenarios/albergue-sello';
import vecinosAudio from './scenarios/vecinos-audio';
import verbenaGigante from './scenarios/verbena-gigante';
import escapeCandado from './scenarios/escape-candado';
import karaokeCancion from './scenarios/karaoke-cancion';
import gimnasioBallenas from './scenarios/gimnasio-ballenas';
import padelRed from './scenarios/padel-red';
import festivalBocata from './scenarios/festival-bocata';
import museoJabali from './scenarios/museo-jabali';
import rodajeTrufa from './scenarios/rodaje-trufa';
import teatroCorona from './scenarios/teatro-corona';
import bibliotecaArcoiris from './scenarios/biblioteca-arcoiris';
import excursionJirafa from './scenarios/excursion-jirafa';
import calabazaSelfie from './scenarios/calabaza-selfie';
import observatorioOvni from './scenarios/observatorio-ovni';
import despedidaVideo from './scenarios/despedida-video';

export const SCENARIOS: ScenarioDef[] = [
  bodaTarta,
  pisoGato,
  oficinaAspirador,
  abuelaViral,
  navidadAmigoInvisible,
  cruceroGorra,
  trenVaho,
  casaRuralFantasma,
  campingChanclas,
  albergueSello,
  vecinosAudio,
  verbenaGigante,
  escapeCandado,
  karaokeCancion,
  gimnasioBallenas,
  padelRed,
  festivalBocata,
  museoJabali,
  rodajeTrufa,
  teatroCorona,
  bibliotecaArcoiris,
  excursionJirafa,
  calabazaSelfie,
  observatorioOvni,
  despedidaVideo,
];

export function getScenario(id: string): ScenarioDef {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown scenario ${id}`);
  return s;
}
