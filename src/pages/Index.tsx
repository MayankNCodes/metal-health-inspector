import React, { useState, useEffect } from 'react';
import { AuthPage } from '@/components/AuthPage';
import { WaterQualityDashboard } from '@/components/WaterQualityDashboard';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = (user: SupabaseUser, session: Session) => {
    setUser(user);
    setSession(session);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Jal Sarathi...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return <WaterQualityDashboard user={user} session={session} />;
};

export default Index;
