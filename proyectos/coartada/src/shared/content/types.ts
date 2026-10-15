// Content schema. Scenarios are plain data: adding one never touches engine or UI code.

export interface ZoneDef {
  /** Stable id, lowercase ascii, unique within the scenario. */
  id: string;
  /** Display name, e.g. "La cocina". Keep it short (≤ 18 chars) for the board. */
  name: string;
  /**
   * Physical evidence that someone was in this zone. Written as a finding, without
   * naming the zone or the hour: the app appends "El culpable estuvo en {zona} a las {hora}".
   */
  trace: string;
}

export interface ScenarioDef {
  id: string;
  /** Case title, e.g. "La tarta de la boda". */
  title: string;
  /** Where and when, one line: "Boda de Lucía y Andrés en una masía del Empordà". */
  venue: string;
  /** The public incident, 1–2 sentences, present-perfect, no culprit named. */
  incident: string;
  /** Third-person past action for summaries: "le dio un mordisco a la tarta". */
  culpritAction: string;
  /** Three hour labels in chronological order, e.g. ["22:00", "23:00", "00:00"]. */
  slots: [string, string, string];
  /** Exactly five zones. Groups of ≤ 6 play with four of them. */
  zones: ZoneDef[];
  /** Zone ids where the incident can plausibly happen (≥ 2). */
  sceneZones: string[];
  /** Optional short line per scene zone explaining why the incident happened there. */
  sceneNotes?: Record<string, string>;
  /** Free tags used for variety (e.g. "boda", "trabajo"). */
  tags: string[];
}
