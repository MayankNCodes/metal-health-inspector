// indicesCalculator.ts
export interface Concentrations { [metal: string]: number | null | undefined; }
export interface Standards { [metal: string]: number | undefined; }
export interface IdealValues { [metal: string]: number | undefined; }

// Typical standards (WHO/BIS) in mg/L (same as your file; adjust as needed)
export const STANDARD_LIMITS: Standards = {
  Pb: 0.01,
  Cd: 0.003,
  Cr: 0.05,
  As: 0.01,
  Hg: 0.001,
  Co: 0.05,
  Cu: 0.05,
  Fe: 0.3,
  Mn: 0.1,
  Ni: 0.02,
  Zn: 5,
};

export const IDEAL_VALUES: IdealValues = {
  Pb: 0, Cd: 0, Cr: 0, As: 0, Hg: 0,
  Co: 0, Cu: 0, Fe: 0, Mn: 0, Ni: 0, Zn: 0,
};

// ---------- Helpers ----------
function metalsInScope(
  concentrations: Concentrations,
  standards: Standards
): string[] {
  return Object.keys(concentrations).filter(m => {
    const ci = concentrations[m];
    const si = standards[m];
    return ci !== undefined && ci !== null && typeof si === 'number' && si > 0;
  });
}

function normalizedWeightsFor(
  standards: Standards,
  metals: string[]
): Record<string, number> {
  const invs = metals
    .map(m => 1 / (standards[m] as number))
    .filter(v => isFinite(v) && v > 0);
  const sumInv = invs.reduce((s, v) => s + v, 0);
  if (sumInv <= 0) {
    // fallback: equal weights
    const w = 1 / metals.length || 0;
    return Object.fromEntries(metals.map(m => [m, w]));
  }
  return Object.fromEntries(
    metals.map(m => [(m), (1 / (standards[m] as number)) / sumInv])
  );
}

// ---------- Indices ----------

/**
 * HPI (weighted quality rating). Uses normalized weights W_i = (1/S_i)/Σ(1/S)
 * and Qi = |Ci - Ii| / (Si - Ii) * 100 (reduces to (Ci/Si)*100 if Ii=0).
 * Returns NaN if no valid metals found.
 */
export function calculateHPI(
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS,
  idealValues: IdealValues = IDEAL_VALUES
): number {
  const metals = metalsInScope(concentrations, standards)
    .filter(m => {
      const si = standards[m] as number;
      const ii = idealValues[m];
      return typeof si === 'number' && si !== ii && (si - (ii ?? 0)) > 0;
    });

  if (metals.length === 0) return NaN;

  const weights = normalizedWeightsFor(standards, metals);
  let hpi = 0;
  for (const m of metals) {
    const ci = concentrations[m] as number;
    const si = standards[m] as number;
    const ii = (idealValues[m] ?? 0) as number;
    const qi = (Math.abs(ci - ii) / (si - ii)) * 100;
    hpi += qi * (weights[m] ?? 0);
  }
  return hpi;
}

/**
 * HEI = sum(Ci / Si)
 */
export function calculateHEI(
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS
): number {
  let sum = 0;
  let count = 0;
  for (const [m, ciRaw] of Object.entries(concentrations)) {
    const ci = ciRaw as number | null | undefined;
    const si = standards[m];
    if (ci == null || si == null || si === 0) continue;
    sum += ci / si;
    count++;
  }
  return count === 0 ? NaN : sum;
}

/**
 * HMPI = geometric mean of (Ci/Si). Skip non-positive ratios.
 * Uses logs for numerical stability.
 */
export function calculateHMPI(
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS
): number {
  const ratios: number[] = [];
  for (const [m, ciRaw] of Object.entries(concentrations)) {
    const ci = ciRaw as number | null | undefined;
    const si = standards[m];
    if (!ci || !si) continue;
    const r = ci / si;
    if (r > 0) ratios.push(r);
  }
  if (ratios.length === 0) return NaN;
  // Arithmetic mean instead of geometric mean
  const am = ratios.reduce((s, r) => s + r, 0) / ratios.length;
  return am;
}

/**
 * HCI (Rajkumar et al., 2019): MI_i = W_i * (Ci/Si*100); HCI = sum(MI_i)
 */
export function calculateHCI(
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS
): number {
  const ratios: number[] = [];

  for (const [metal, ciRaw] of Object.entries(concentrations)) {
    const ci = ciRaw as number | null | undefined;
    const si = standards[metal];
    if (ci === undefined || ci === null || ci <= 0 || !si) continue;

    ratios.push((ci / si) * 100);
  }

  if (ratios.length === 0) return NaN;

  const sum = ratios.reduce((acc, r) => acc + r, 0);
  return sum / ratios.length;
}
/**
 * Single-factor sub-index for one metal: Pi = Ci / Si
 * returns NaN if data missing.
 */
export function calculateSubIndex(
  metal: string,
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS
): number {
  const ci = concentrations[metal];
  const si = standards[metal];
  if (ci == null || si == null || si === 0) return NaN;
  return ci / si;
}

/**
 * Composite PI (average of Pi_i). If you want per-metal PI, call calculateSingleFactorPI.
 */
export function calculatePI(
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS
): number {
  const ratios: number[] = [];

  for (const [metal, ciRaw] of Object.entries(concentrations)) {
    const ci = ciRaw as number | null | undefined;
    const si = standards[metal];
    if (ci === undefined || ci === null || ci <= 0 || !si) continue;

    ratios.push(ci / si);
  }

  if (ratios.length === 0) return NaN;

  const sum = ratios.reduce((acc, r) => acc + r, 0);
  return sum / ratios.length; // arithmetic mean
}
/**
 * Pollution Load Index (PLI) — Tomlinson style: geometric mean of CF_i (CF_i = Ci / Cref_i)
 * If reference is omitted, standards are used (but ideally you should pass background/reference).
 */
export function calculatePLI(
  concentrations: Concentrations,
  reference: Standards = STANDARD_LIMITS
): number {
  const ratios: number[] = [];
  for (const [m, ciRaw] of Object.entries(concentrations)) {
    const ci = ciRaw as number | null | undefined;
    const ref = reference[m];
    if (!ci || !ref) continue;
    const cf = ci / ref;
    if (cf > 0) ratios.push(cf);
  }
  if (ratios.length === 0) return NaN;
  const logSum = ratios.reduce((s, r) => s + Math.log(r), 0);
  return Math.exp(logSum / ratios.length);
}

// ---------- helpers for interpretation ----------
export function getHPIClassification(hpi: number): string {
  if (isNaN(hpi)) return 'Insufficient data';
  if (hpi < 25) return 'Excellent (<25)';
  if (hpi < 50) return 'Good (25–50)';
  if (hpi < 75) return 'Moderate (50–75)';
  if (hpi < 100) return 'Poor (75–100)';
  // literature: HPI >= 100 is considered polluted / critical threshold
  return 'Very Poor / Polluted (>=100)';
}

export function calculateCd(
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS
): number {
  let sum = 0;

  for (const [metal, ciRaw] of Object.entries(concentrations)) {
    const ci = ciRaw as number | null | undefined;
    const si = standards[metal];
    if (ci === undefined || ci === null || ci <= 0 || !si) continue;

    const cf = ci / si - 1; // contamination factor
    if (cf > 0) sum += cf; // only positive contamination
  }

  return sum; // sum of positive CFs
}
// ---------- Bundled calc ----------
export function calculateAllIndices(concentrations: Concentrations, standards: Standards = STANDARD_LIMITS, idealValues: IdealValues = IDEAL_VALUES) {
  const hpi = calculateHPI(concentrations, standards, idealValues);
  const hei = calculateHEI(concentrations, standards);
  const hmpi = calculateHMPI(concentrations, standards);
  const hci = calculateHCI(concentrations, standards);
  const pi = calculatePI(concentrations, standards);
  const pli = calculatePLI(concentrations, standards);
  const cd = calculateCd(concentrations, standards);

  return {
    HPI: hpi,
    classification: getHPIClassification(hpi),
    HEI: hei,
    Cd: cd,
    HMPI: hmpi,
    HCI: hci,
    PI: pi,
    PLI: pli,
  };
}
