import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetalConcentration {
  [metal: string]: number;
}

interface CalculationRequest {
  sampleId: string;
  metalConcentrations: MetalConcentration;
  weightingSchemeId?: string;
  indicesTypes: string[];
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Water Quality Index Calculation Functions
function calculateHPI(concentrations: MetalConcentration, standards: any, weights: any): any {
  let hpi = 0;
  let totalWeight = 0;
  const subIndices: any = {};

  for (const [metal, concentration] of Object.entries(concentrations)) {
    const standard = standards[metal];
    const weight = weights[metal];
    if (standard && weight) {
      const qi = (concentration / standard.permissible_limit) * 100;
      const wi = weight;
      subIndices[metal] = { qi, wi, concentration, standard: standard.permissible_limit };
      hpi += qi * wi;
      totalWeight += wi;
    }
  }

  const finalHPI = totalWeight > 0 ? hpi / totalWeight : 0;
  
  return {
    value: finalHPI,
    subIndices,
    classification: getHPIClassification(finalHPI),
    formula: "HPI = Σ(Qi × Wi) / ΣWi"
  };
}

function calculateMetalIndex(concentrations: MetalConcentration, standards: any): any {
  let sum = 0;
  let count = 0;
  const ratios: any = {};

  for (const [metal, concentration] of Object.entries(concentrations)) {
    const standard = standards[metal];
    if (standard) {
      const ratio = concentration / standard.permissible_limit;
      ratios[metal] = { ratio, concentration, standard: standard.permissible_limit };
      sum += ratio;
      count++;
    }
  }

  const mi = count > 0 ? sum / count : 0;
  
  return {
    value: mi,
    ratios,
    classification: getMIClassification(mi),
    formula: "MI = (1/n) × Σ(Ci/Si)"
  };
}

function calculateHMI(concentrations: MetalConcentration, standards: any): any {
  let product = 1;
  let count = 0;
  const ratios: any = {};

  for (const [metal, concentration] of Object.entries(concentrations)) {
    const standard = standards[metal];
    if (standard) {
      const ratio = concentration / standard.permissible_limit;
      ratios[metal] = { ratio, concentration, standard: standard.permissible_limit };
      product *= ratio;
      count++;
    }
  }

  const hmi = count > 0 ? Math.pow(product, 1/count) : 0;
  
  return {
    value: hmi,
    ratios,
    classification: getHMIClassification(hmi),
    formula: "HMI = (Π(Ci/Si))^(1/n)"
  };
}

function calculatePLI(concentrations: MetalConcentration, standards: any): any {
  let product = 1;
  let count = 0;
  const contaminationFactors: any = {};

  for (const [metal, concentration] of Object.entries(concentrations)) {
    const standard = standards[metal];
    if (standard) {
      const cf = concentration / standard.permissible_limit;
      contaminationFactors[metal] = { cf, concentration, standard: standard.permissible_limit };
      product *= cf;
      count++;
    }
  }

  const pli = count > 0 ? Math.pow(product, 1/count) : 0;
  
  return {
    value: pli,
    contaminationFactors,
    classification: getPLIClassification(pli),
    formula: "PLI = (CF1 × CF2 × ... × CFn)^(1/n)"
  };
}

// Classification functions
function getHPIClassification(hpi: number): string {
  if (hpi < 25) return 'Good';
  if (hpi < 50) return 'Acceptable';
  if (hpi < 100) return 'Poor';
  return 'Critical';
}

function getMIClassification(mi: number): string {
  if (mi < 0.3) return 'Good';
  if (mi < 1) return 'Acceptable';
  if (mi < 2) return 'Poor';
  return 'Critical';
}

function getHMIClassification(hmi: number): string {
  if (hmi < 0.3) return 'Good';
  if (hmi < 1) return 'Acceptable';
  if (hmi < 2) return 'Poor';
  return 'Critical';
}

function getPLIClassification(pli: number): string {
  if (pli < 1) return 'Good';
  if (pli < 2) return 'Acceptable';
  if (pli < 3) return 'Poor';
  return 'Critical';
}

function getOverallClassification(results: any): string {
  const classifications = Object.values(results).map((r: any) => r.classification);
  if (classifications.includes('Critical')) return 'Critical';
  if (classifications.includes('Poor')) return 'Poor';
  if (classifications.includes('Acceptable')) return 'Acceptable';
  return 'Good';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sampleId, metalConcentrations, weightingSchemeId, indicesTypes }: CalculationRequest = await req.json();

    // Fetch metal standards
    const { data: standards, error: standardsError } = await supabase
      .from('metal_standards')
      .select('*')
      .eq('is_active', true);

    if (standardsError) throw standardsError;

    // Fetch weighting scheme
    let weights: any = {};
    if (weightingSchemeId) {
      const { data: scheme, error: schemeError } = await supabase
        .from('weighting_schemes')
        .select('*')
        .eq('id', weightingSchemeId)
        .single();

      if (schemeError) throw schemeError;
      weights = scheme.weights;
    } else {
      // Use default weights
      const { data: defaultScheme, error: defaultError } = await supabase
        .from('weighting_schemes')
        .select('*')
        .eq('is_default', true)
        .single();

      if (defaultError) throw defaultError;
      weights = defaultScheme.weights;
    }

    // Convert standards array to object for easy lookup
    const standardsObj = standards.reduce((acc: any, std: any) => {
      acc[std.symbol] = std;
      return acc;
    }, {});

    // Calculate indices
    const results: any = {};
    const intermediateValues: any = {};

    if (indicesTypes.includes('HPI')) {
      results.HPI = calculateHPI(metalConcentrations, standardsObj, weights);
      intermediateValues.HPI = results.HPI;
    }

    if (indicesTypes.includes('MI')) {
      results.MI = calculateMetalIndex(metalConcentrations, standardsObj);
      intermediateValues.MI = results.MI;
    }

    if (indicesTypes.includes('HMI')) {
      results.HMI = calculateHMI(metalConcentrations, standardsObj);
      intermediateValues.HMI = results.HMI;
    }

    if (indicesTypes.includes('PLI')) {
      results.PLI = calculatePLI(metalConcentrations, standardsObj);
      intermediateValues.PLI = results.PLI;
    }

    // Determine overall classification
    const overallClassification = getOverallClassification(results);

    // Check for threshold violations
    const thresholdViolations: string[] = [];
    for (const [metal, concentration] of Object.entries(metalConcentrations)) {
      const standard = standardsObj[metal];
      if (standard && concentration > standard.permissible_limit) {
        thresholdViolations.push(`${metal}: ${concentration} ${standard.unit} (limit: ${standard.permissible_limit} ${standard.unit})`);
      }
    }

    // Store calculation run in database
    const { data: calculationRun, error: saveError } = await supabase
      .from('calculation_runs')
      .insert({
        sample_id: sampleId,
        indices_calculated: indicesTypes,
        weighting_scheme_id: weightingSchemeId,
        metal_standard_version: standardsObj,
        results,
        intermediate_values: intermediateValues,
        quality_classification: overallClassification,
        threshold_violations: thresholdViolations,
        calculated_by: req.headers.get('user-id') // You'll need to pass this from the frontend
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Create alerts for critical levels
    if (overallClassification === 'Critical' || thresholdViolations.length > 0) {
      await supabase
        .from('alerts')
        .insert({
          sample_id: sampleId,
          calculation_run_id: calculationRun.id,
          alert_type: overallClassification === 'Critical' ? 'CRITICAL_LEVEL' : 'THRESHOLD_VIOLATION',
          severity: overallClassification === 'Critical' ? 'Critical' : 'High',
          message: `Water quality assessment shows ${overallClassification.toLowerCase()} levels. ${thresholdViolations.length} violations detected.`
        });
    }

    // Create audit log
    await supabase.rpc('create_audit_log', {
      p_action: 'CALCULATE',
      p_table_name: 'calculation_runs',
      p_record_id: calculationRun.id,
      p_new_values: { indices: indicesTypes, classification: overallClassification }
    });

    return new Response(
      JSON.stringify({
        calculationRunId: calculationRun.id,
        results,
        overallClassification,
        thresholdViolations,
        intermediateValues
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in water-quality-calculations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};

serve(handler);