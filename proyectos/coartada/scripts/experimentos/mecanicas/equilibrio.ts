// Fase 7 · experimento aislado: equilibrio de un juego de suma cero entre el grupo (filas, quiere
// subir la tasa de acierto) y el bando culpable (columnas, quiere bajarla), por juego ficticio.
// Sirve para saber si una decisión tiene una respuesta dominante o si a los dos bandos les conviene
// mezclar (farol), y cuánto pesa cada decisión. No sustituye a partidas con personas.

export interface Equilibrium {
  /** Probabilidad de cada estrategia del grupo y del bando culpable. */
  rows: number[];
  cols: number[];
  /** Cota inferior y superior del valor del juego (se acercan con las iteraciones). */
  lower: number;
  upper: number;
}

export function solveZeroSum(m: number[][], iterations = 20_000): Equilibrium {
  const R = m.length;
  const C = m[0].length;
  const rowCount = new Array(R).fill(0);
  const colCount = new Array(C).fill(0);
  const rowPayoff = new Array(R).fill(0); // contra la mezcla acumulada de columnas
  const colPayoff = new Array(C).fill(0); // contra la mezcla acumulada de filas
  let r = 0;
  for (let t = 0; t < iterations; t++) {
    rowCount[r]++;
    for (let j = 0; j < C; j++) colPayoff[j] += m[r][j];
    let c = 0;
    for (let j = 1; j < C; j++) if (colPayoff[j] < colPayoff[c] - 1e-12) c = j;
    colCount[c]++;
    for (let i = 0; i < R; i++) rowPayoff[i] += m[i][c];
    r = 0;
    for (let i = 1; i < R; i++) if (rowPayoff[i] > rowPayoff[r] + 1e-12) r = i;
  }
  const rows = rowCount.map((x) => x / iterations);
  const cols = colCount.map((x) => x / iterations);
  const vsCols = (i: number) => cols.reduce((s, q, j) => s + q * m[i][j], 0);
  const vsRows = (j: number) => rows.reduce((s, p, i) => s + p * m[i][j], 0);
  return {
    rows,
    cols,
    lower: Math.min(...m[0].map((_, j) => vsRows(j))),
    upper: Math.max(...m.map((_, i) => vsCols(i))),
  };
}

/** Peso de una decisión: diferencia entre la mejor y la peor opción contra la mezcla del rival. */
export function decisionWeight(m: number[][], eq: Equilibrium): { group: number; evil: number } {
  const vsCols = m.map((row) => row.reduce((s, x, j) => s + eq.cols[j] * x, 0));
  const vsRows = m[0].map((_, j) => m.reduce((s, row, i) => s + eq.rows[i] * row[j], 0));
  return { group: Math.max(...vsCols) - Math.min(...vsCols), evil: Math.max(...vsRows) - Math.min(...vsRows) };
}
