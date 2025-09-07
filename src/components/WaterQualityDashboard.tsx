import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HMPICalculator } from './HMPICalculator';
import { LocationService } from './LocationService';
import { WaterQualityClassification } from './WaterQualityClassification';
import { IndexChart } from './IndexChart';
import { UserRoleDisplay } from './UserRoleDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { 
  LogOut, 
  Plus, 
  Calculator, 
  Download, 
  MapPin, 
  AlertTriangle,
  Settings,
  Database,
  TrendingUp,
  FileText,
  Users
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  role: string;
  organization: string;
}

interface WaterSample {
  id: string;
  sample_name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  metal_concentrations: any;
  ph_value?: number;
  temperature_celsius?: number;
  sampling_date: string;
  collected_by: string;
}

interface WaterQualityDashboardProps {
  user: SupabaseUser;
  session: Session;
}

export const WaterQualityDashboard: React.FC<WaterQualityDashboardProps> = ({ user, session }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [samples, setSamples] = useState<WaterSample[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [newSample, setNewSample] = useState({
    sample_name: '',
    location_name: '',
    metal_concentrations: {} as Record<string, number>,
    ph_value: '',
    temperature_celsius: '',
    notes: ''
  });
  const [showNewSampleForm, setShowNewSampleForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchSamples();
  }, [user.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSamples = async () => {
    try {
      const { data, error } = await supabase
        .from('water_samples')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSamples(data || []);
    } catch (error: any) {
      console.error('Error fetching samples:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "Thank you for using Jal Sewa",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLocationUpdate = (latitude: number, longitude: number) => {
    setCurrentLocation({ lat: latitude, lng: longitude });
    setNewSample(prev => ({
      ...prev,
      latitude,
      longitude
    }));
  };

  const handleCreateSample = async () => {
    if (!profile || (profile.role !== 'Admin' && profile.role !== 'Researcher')) {
      toast({
        title: "Access Denied",
        description: "Only Admins and Researchers can create samples",
        variant: "destructive",
      });
      return;
    }

    try {
      const sampleData = {
        sample_name: newSample.sample_name,
        location_name: newSample.location_name,
        latitude: currentLocation?.lat,
        longitude: currentLocation?.lng,
        metal_concentrations: newSample.metal_concentrations,
        ph_value: newSample.ph_value ? parseFloat(newSample.ph_value) : null,
        temperature_celsius: newSample.temperature_celsius ? parseFloat(newSample.temperature_celsius) : null,
        notes: newSample.notes,
        collected_by: user.id
      };

      const { data, error } = await supabase
        .from('water_samples')
        .insert(sampleData)
        .select()
        .single();

      if (error) throw error;

      setSamples(prev => [data, ...prev]);
      setShowNewSampleForm(false);
      setNewSample({
        sample_name: '',
        location_name: '',
        metal_concentrations: {},
        ph_value: '',
        temperature_celsius: '',
        notes: ''
      });

      toast({
        title: "Sample created successfully",
        description: `Water sample "${data.sample_name}" has been added`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating sample",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const canCreateSamples = profile?.role === 'Admin' || profile?.role === 'Researcher';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between max-sm:justify-center items-center h-16">
            <div className="flex items-center space-x-4 max-sm:hidden">
              <h1 className="text-2xl font-bold text-primary max-sm:hidden">Jal Sewa</h1>
              <span className="text-sm text-muted-foreground max-md:hidden">Water Quality Management</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {profile && (
                <UserRoleDisplay 
                  role={profile.role as 'Admin' | 'Researcher' | 'Viewer'} 
                  username={profile.username || profile.full_name} 
                />
              )}
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="calculator" className="space-y-6 max-lg:">
          <TabsList className="grid w-full grid-cols-6 max-lg:grid-cols-3 max-lg:h-24 ">
            <TabsTrigger value="calculator" className="flex items-center gap-2 mb-1">
              <Calculator className="h-4 w-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="samples" className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4" />
              Samples
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2 mb-1">
              <Settings className="h-4 w-4" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <HMPICalculator />
              </div>
              
              {/* <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      GPS Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LocationService
                      onLocationUpdate={handleLocationUpdate}
                      isLoading={isLocationLoading}
                      setIsLoading={setIsLocationLoading}
                    />
                    {currentLocation && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Coordinates:</strong><br />
                          Lat: {currentLocation.lat.toFixed(6)}<br />
                          Lng: {currentLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div> */}
            </div>
          </TabsContent>

          <TabsContent value="samples" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Water Samples</h2>
              {canCreateSamples && (
                <Button onClick={() => setShowNewSampleForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sample
                </Button>
              )}
            </div>

            {showNewSampleForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Water Sample</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sample_name">Sample Name</Label>
                      <Input
                        id="sample_name"
                        value={newSample.sample_name}
                        onChange={(e) => setNewSample(prev => ({ ...prev, sample_name: e.target.value }))}
                        placeholder="Enter sample name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location_name">Location Name</Label>
                      <Input
                        id="location_name"
                        value={newSample.location_name}
                        onChange={(e) => setNewSample(prev => ({ ...prev, location_name: e.target.value }))}
                        placeholder="Enter location name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ph_value">pH Value</Label>
                      <Input
                        id="ph_value"
                        type="number"
                        step="0.1"
                        value={newSample.ph_value}
                        onChange={(e) => setNewSample(prev => ({ ...prev, ph_value: e.target.value }))}
                        placeholder="pH value"
                      />
                    </div>
                    <div>
                      <Label htmlFor="temperature">Temperature (°C)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        value={newSample.temperature_celsius}
                        onChange={(e) => setNewSample(prev => ({ ...prev, temperature_celsius: e.target.value }))}
                        placeholder="Temperature in Celsius"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newSample.notes}
                      onChange={(e) => setNewSample(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about the sample"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewSampleForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateSample}>
                      Create Sample
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {samples.map((sample) => (
                <Card key={sample.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{sample.sample_name}</h3>
                        <p className="text-muted-foreground">{sample.location_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sample.sampling_date).toLocaleString()}
                        </p>
                        {sample.latitude && sample.longitude && (
                          <p className="text-sm text-muted-foreground">
                            📍 {sample.latitude.toFixed(6)}, {sample.longitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Calculator className="h-4 w-4 mr-2" />
                          Analyze
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground">Advanced analytics and visualizations coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Report Generator</h3>
              <p className="text-muted-foreground">PDF and Excel report generation coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Alert Management</h3>
              <p className="text-muted-foreground">Water quality alerts and notifications coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="admin">
            {profile?.role === 'Admin' ? (
              <div className="text-center py-12">
                <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Admin Panel</h3>
                <p className="text-muted-foreground">User management and system configuration coming soon...</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
                <p className="text-muted-foreground">Admin access required to view this section.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};