import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  calculationRunId: string;
  reportType: 'PDF' | 'CSV' | 'EXCEL';
  includeMap?: boolean;
  includeCharts?: boolean;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

function generateCSV(data: any): string {
  const { sample, calculationRun, results } = data;
  
  let csv = 'Water Quality Analysis Report\n\n';
  csv += 'Sample Information\n';
  csv += `Sample Name,${sample.sample_name}\n`;
  csv += `Location,${sample.location_name || 'N/A'}\n`;
  csv += `Latitude,${sample.latitude || 'N/A'}\n`;
  csv += `Longitude,${sample.longitude || 'N/A'}\n`;
  csv += `Sampling Date,${sample.sampling_date}\n`;
  csv += `pH,${sample.ph_value || 'N/A'}\n`;
  csv += `Temperature,${sample.temperature_celsius || 'N/A'}°C\n\n`;
  
  csv += 'Metal Concentrations\n';
  csv += 'Metal,Concentration (mg/L),Standard Limit,Status\n';
  
  for (const [metal, concentration] of Object.entries(sample.metal_concentrations)) {
    const standard = calculationRun.metal_standard_version[metal];
    const status = concentration > standard?.permissible_limit ? 'EXCEEDED' : 'WITHIN LIMIT';
    csv += `${metal},${concentration},${standard?.permissible_limit || 'N/A'},${status}\n`;
  }
  
  csv += '\nWater Quality Indices\n';
  csv += 'Index,Value,Classification,Formula\n';
  
  for (const [indexName, indexData] of Object.entries(results)) {
    csv += `${indexName},${indexData.value.toFixed(3)},${indexData.classification},${indexData.formula}\n`;
  }
  
  csv += '\nThreshold Violations\n';
  if (calculationRun.threshold_violations.length > 0) {
    calculationRun.threshold_violations.forEach((violation: string) => {
      csv += `${violation}\n`;
    });
  } else {
    csv += 'No violations detected\n';
  }
  
  return csv;
}

function generateHTML(data: any): string {
  const { sample, calculationRun, results } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Water Quality Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-exceeded { color: #d32f2f; font-weight: bold; }
        .status-ok { color: #388e3c; }
        .classification-critical { color: #d32f2f; font-weight: bold; }
        .classification-poor { color: #f57c00; font-weight: bold; }
        .classification-acceptable { color: #1976d2; }
        .classification-good { color: #388e3c; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Water Quality Analysis Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>Sample Information</h2>
        <div class="grid">
            <div>
                <p><strong>Sample Name:</strong> ${sample.sample_name}</p>
                <p><strong>Location:</strong> ${sample.location_name || 'N/A'}</p>
                <p><strong>Coordinates:</strong> ${sample.latitude || 'N/A'}, ${sample.longitude || 'N/A'}</p>
                <p><strong>Sampling Date:</strong> ${new Date(sample.sampling_date).toLocaleString()}</p>
            </div>
            <div>
                <p><strong>pH Value:</strong> ${sample.ph_value || 'N/A'}</p>
                <p><strong>Temperature:</strong> ${sample.temperature_celsius || 'N/A'}°C</p>
                <p><strong>Collection Method:</strong> ${sample.collection_method || 'N/A'}</p>
                <p><strong>Depth:</strong> ${sample.depth_meters || 'N/A'} meters</p>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Metal Concentrations</h2>
        <table>
            <thead>
                <tr>
                    <th>Metal</th>
                    <th>Concentration (mg/L)</th>
                    <th>Standard Limit (mg/L)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(sample.metal_concentrations).map(([metal, concentration]) => {
                    const standard = calculationRun.metal_standard_version[metal];
                    const exceeded = concentration > standard?.permissible_limit;
                    return `
                        <tr>
                            <td>${metal}</td>
                            <td>${concentration}</td>
                            <td>${standard?.permissible_limit || 'N/A'}</td>
                            <td class="${exceeded ? 'status-exceeded' : 'status-ok'}">
                                ${exceeded ? 'EXCEEDED' : 'WITHIN LIMIT'}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Water Quality Indices</h2>
        <table>
            <thead>
                <tr>
                    <th>Index</th>
                    <th>Value</th>
                    <th>Classification</th>
                    <th>Formula</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(results).map(([indexName, indexData]) => `
                    <tr>
                        <td><strong>${indexName}</strong></td>
                        <td>${indexData.value.toFixed(3)}</td>
                        <td class="classification-${indexData.classification.toLowerCase()}">${indexData.classification}</td>
                        <td>${indexData.formula}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Overall Assessment</h2>
        <p><strong>Quality Classification:</strong> 
            <span class="classification-${calculationRun.quality_classification.toLowerCase()}">
                ${calculationRun.quality_classification}
            </span>
        </p>
        
        <h3>Threshold Violations</h3>
        ${calculationRun.threshold_violations.length > 0 
            ? `<ul>${calculationRun.threshold_violations.map((v: string) => `<li class="status-exceeded">${v}</li>`).join('')}</ul>`
            : '<p class="status-ok">No violations detected</p>'
        }
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            ${calculationRun.quality_classification === 'Critical' 
                ? '<li>Immediate action required - water is not safe for consumption</li><li>Identify and eliminate contamination sources</li><li>Implement advanced treatment methods</li>'
                : calculationRun.quality_classification === 'Poor'
                ? '<li>Water treatment recommended before consumption</li><li>Monitor contamination sources</li><li>Regular testing advised</li>'
                : calculationRun.quality_classification === 'Acceptable'
                ? '<li>Basic treatment may be beneficial</li><li>Continue regular monitoring</li>'
                : '<li>Water quality is within acceptable limits</li><li>Maintain current protection measures</li>'
            }
        </ul>
    </div>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calculationRunId, reportType }: ReportRequest = await req.json();

    // Fetch calculation run with sample data
    const { data: calculationRun, error: calcError } = await supabase
      .from('calculation_runs')
      .select(`
        *,
        water_samples (*)
      `)
      .eq('id', calculationRunId)
      .single();

    if (calcError) throw calcError;

    const sample = calculationRun.water_samples;
    const results = calculationRun.results;

    let content: string;
    let mimeType: string;
    let filename: string;

    switch (reportType) {
      case 'CSV':
        content = generateCSV({ sample, calculationRun, results });
        mimeType = 'text/csv';
        filename = `water_quality_report_${sample.sample_name}_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'PDF':
      case 'EXCEL':
        // For now, return HTML that can be converted to PDF client-side
        content = generateHTML({ sample, calculationRun, results });
        mimeType = 'text/html';
        filename = `water_quality_report_${sample.sample_name}_${new Date().toISOString().split('T')[0]}.html`;
        break;
      
      default:
        throw new Error('Unsupported report type');
    }

    // Store export record
    await supabase
      .from('data_exports')
      .insert({
        export_type: reportType,
        file_size_bytes: new Blob([content]).size,
        filters_applied: { calculationRunId },
        exported_by: req.headers.get('user-id')
      });

    // Create audit log
    await supabase.rpc('create_audit_log', {
      p_action: 'EXPORT',
      p_table_name: 'data_exports',
      p_new_values: { type: reportType, calculationRunId }
    });

    return new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in generate-report:', error);
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