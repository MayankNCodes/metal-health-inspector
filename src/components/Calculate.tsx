// indicesCalculator.ts

export interface Concentrations {
  [metal: string]: number;
}

export interface Standards {
  [metal: string]: number;
}

export interface IdealValues {
  [metal: string]: number;
}

// Typical standards (WHO/BIS) in mg/L
const STANDARD_LIMITS: Standards = {
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

// Ideal values (usually 0)
const IDEAL_VALUES: IdealValues = {
  Pb: 0, Cd: 0, Cr: 0, As: 0, Hg: 0,
  Co: 0, Cu: 0, Fe: 0, Mn: 0, Ni: 0, Zn: 0,
};

// ------------------------ Calculations ------------------------ //

export function calculateHPI(
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS,
  idealValues: IdealValues = IDEAL_VALUES
): number {
  let sumQw = 0;
  let sumW = 0;

  for (const [metal, ci] of Object.entries(concentrations)) {
    if (ci === undefined || ci === null) continue;

    const si = standards[metal];
    const ii = idealValues[metal];

    // Skip this metal if no standard or ideal value is defined
    if (si === undefined || ii === undefined || si === ii) continue;

    const wi = 1 / si; // unit weight
    const qi = ((ci - ii) / (si - ii)) * 100; // quality rating (can be negative if ci < ii)

    sumQw += qi * wi;
    sumW += wi;
  }

  // Return weighted average, or NaN if no metals were processed
  return sumW > 0 ? sumQw / sumW : NaN;

}

export function calculateHEI(
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS
): number {
  let sum = 0;
  for (const [metal, ci] of Object.entries(concentrations)) {
    if (ci === undefined || ci === null) continue;
    const si = standards[metal];
    if (!si) continue;
    sum += ci / si;
  }
  return sum;
}

export function calculateHMPI(
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS
): number {
  const ratios: number[] = [];

  for (const [metal, ci] of Object.entries(concentrations)) {
    if (ci === undefined || ci === null || ci <= 0) continue;
    const si = standards[metal];
    if (!si) continue;
    ratios.push(ci / si);
  }

  if (ratios.length === 0) return 0;

  const product = ratios.reduce((acc, r) => acc * r, 1);
  return Math.pow(product, 1 / ratios.length);
}

export function calculateHCI(
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS
): number {
  return calculateHEI(concentrations, standards); // same as HEI
}

export function calculateSubIndex(
  metal: string,
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS
): number {
  const ci = concentrations[metal];
  const si = standards[metal];
  if (!ci || !si) return 0;
  return ci / si;
}

export function calculatePI(
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS
): number {
  const ratios = Object.entries(concentrations)
    .filter(([_, ci]) => ci !== undefined && ci !== null && ci > 0)
    .map(([metal, ci]) => ci / (standards[metal] ?? 1));

  if (ratios.length === 0) return 0;
  const sum = ratios.reduce((a, b) => a + b, 0);
  return sum / ratios.length; // average of ratios
}

export function calculatePLI(
  concentrations: Concentrations,
  standards: Standards = STANDARD_LIMITS
): number {
  const ratios = Object.entries(concentrations)
    .filter(([_, ci]) => ci !== undefined && ci !== null && ci > 0)
    .map(([metal, ci]) => ci / (standards[metal] ?? 1));

  if (ratios.length === 0) return 0;
  const product = ratios.reduce((a, b) => a * b, 1);
  return Math.pow(product, 1 / ratios.length); // geometric mean
}

export function getClassification(hpi: number): string {
  if (hpi < 25) return 'Excellent';
  if (hpi <= 50) return 'Good';
  if (hpi <= 75) return 'Poor';
  if (hpi <= 100) return 'Very Poor';
  return 'Unsuitable';
}
// ------------------------ Full Calculation ------------------------ //

export function calculateAllIndices(concentrations: Concentrations) {
    const hpi = calculateHPI(concentrations)
  return {
    HPI: hpi,
    HEI: calculateHEI(concentrations),
    HMPI: calculateHMPI(concentrations),
    HCI: calculateHCI(concentrations),
    Cd: calculateSubIndex("Cd", concentrations),
    PI: calculatePI(concentrations),
    PLI: calculatePLI(concentrations),
    classification: getClassification(hpi)
  };
}

// ------------------------ Example Usage ------------------------ //

const sampleConcentrations: Concentrations = {
  As: 0.01,
  Cd: 0.003,
  Co: 0.05,
  Cr: 0.05,
  Cu: 2,
  Fe: 0.3,
  Hg: 0.001,
  Mn: 0.1,
  Ni: 0,
  Pb: 0.01,
  Zn: 3,
};

console.log("Calculated Indices:", calculateAllIndices(sampleConcentrations));
