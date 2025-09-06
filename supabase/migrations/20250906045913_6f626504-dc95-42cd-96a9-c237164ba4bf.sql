-- Create user profiles table with roles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'Viewer' CHECK (role IN ('Admin', 'Researcher', 'Viewer')),
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create metal standards table for configurable limits
CREATE TABLE public.metal_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  permissible_limit DECIMAL(10,4) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'mg/L',
  standard_type TEXT NOT NULL DEFAULT 'WHO', -- WHO, EPA, Local
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weighting schemes table
CREATE TABLE public.weighting_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  weights JSONB NOT NULL, -- Store metal weights as JSON
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create water samples table
CREATE TABLE public.water_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_name TEXT NOT NULL,
  location_name TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  sampling_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metal_concentrations JSONB NOT NULL, -- Store metal values as JSON
  collection_method TEXT,
  depth_meters DECIMAL(6,2),
  temperature_celsius DECIMAL(5,2),
  ph_value DECIMAL(4,2),
  notes TEXT,
  collected_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calculation runs table
CREATE TABLE public.calculation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID NOT NULL REFERENCES public.water_samples(id) ON DELETE CASCADE,
  indices_calculated TEXT[] NOT NULL, -- Array of index types calculated
  weighting_scheme_id UUID REFERENCES public.weighting_schemes(id),
  metal_standard_version JSONB NOT NULL, -- Snapshot of standards used
  results JSONB NOT NULL, -- Store all calculation results
  intermediate_values JSONB, -- Store intermediate calculation steps
  quality_classification TEXT CHECK (quality_classification IN ('Good', 'Acceptable', 'Poor', 'Critical')),
  threshold_violations TEXT[], -- Array of violated thresholds
  calculated_by UUID REFERENCES auth.users(id),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, CALCULATE, EXPORT
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID REFERENCES public.water_samples(id),
  calculation_run_id UUID REFERENCES public.calculation_runs(id),
  alert_type TEXT NOT NULL, -- THRESHOLD_VIOLATION, CRITICAL_LEVEL
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data exports table
CREATE TABLE public.data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type TEXT NOT NULL, -- PDF_REPORT, CSV_DATA, EXCEL_DATA
  file_path TEXT,
  file_size_bytes BIGINT,
  filters_applied JSONB,
  exported_by UUID REFERENCES auth.users(id),
  export_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metal_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weighting_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'Admin')
);

-- Create RLS policies for metal standards
CREATE POLICY "All can view active standards" ON public.metal_standards FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage standards" ON public.metal_standards FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'Admin')
);

-- Create RLS policies for weighting schemes
CREATE POLICY "All can view weighting schemes" ON public.weighting_schemes FOR SELECT USING (true);
CREATE POLICY "Admins and Researchers can create schemes" ON public.weighting_schemes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('Admin', 'Researcher'))
);

-- Create RLS policies for water samples
CREATE POLICY "All can view samples" ON public.water_samples FOR SELECT USING (true);
CREATE POLICY "Admins and Researchers can create samples" ON public.water_samples FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('Admin', 'Researcher'))
);
CREATE POLICY "Sample creators can update their samples" ON public.water_samples FOR UPDATE USING (
  collected_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'Admin')
);

-- Create RLS policies for calculation runs
CREATE POLICY "All can view calculations" ON public.calculation_runs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create calculations" ON public.calculation_runs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for audit logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT USING (user_id = auth.uid());

-- Create RLS policies for alerts
CREATE POLICY "All can view alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Admins can manage alerts" ON public.alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'Admin')
);

-- Create RLS policies for data exports
CREATE POLICY "Users can view their exports" ON public.data_exports FOR SELECT USING (exported_by = auth.uid());
CREATE POLICY "Admins can view all exports" ON public.data_exports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'Admin')
);

-- Create functions for automated triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_metal_standards_updated_at BEFORE UPDATE ON public.metal_standards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_water_samples_updated_at BEFORE UPDATE ON public.water_samples FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'Viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values)
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default metal standards
INSERT INTO public.metal_standards (metal_name, symbol, permissible_limit, unit, standard_type) VALUES
('Arsenic', 'As', 0.01, 'mg/L', 'WHO'),
('Cadmium', 'Cd', 0.003, 'mg/L', 'WHO'),
('Chromium', 'Cr', 0.05, 'mg/L', 'WHO'),
('Copper', 'Cu', 2.0, 'mg/L', 'WHO'),
('Iron', 'Fe', 0.3, 'mg/L', 'WHO'),
('Lead', 'Pb', 0.01, 'mg/L', 'WHO'),
('Manganese', 'Mn', 0.4, 'mg/L', 'WHO'),
('Mercury', 'Hg', 0.006, 'mg/L', 'WHO'),
('Nickel', 'Ni', 0.07, 'mg/L', 'WHO'),
('Zinc', 'Zn', 3.0, 'mg/L', 'WHO');

-- Insert default weighting scheme
INSERT INTO public.weighting_schemes (name, description, weights, is_default) VALUES
('WHO Standard Weights', 'Default weighting scheme based on WHO guidelines', 
 '{"As": 5, "Cd": 5, "Cr": 3, "Cu": 2, "Fe": 1, "Pb": 5, "Mn": 1, "Hg": 5, "Ni": 3, "Zn": 1}', 
 true);