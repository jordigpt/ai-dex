import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      }

      if (profile && !profile.onboarding_completed) {
        navigate("/onboarding");
      } else {
        setProfile(profile);
      }
      setLoading(false);
    };

    checkProfile();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Bienvenido, {profile?.display_name || 'Constructor'}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>Cerrar Sesión</Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado Actual</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-500">Nivel</div>
                <div className="text-2xl font-bold text-blue-700">1</div>
             </div>
             <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-500">XP Total</div>
                <div className="text-2xl font-bold text-purple-700">0</div>
             </div>
             <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-500">Racha</div>
                <div className="text-2xl font-bold text-green-700">0 días</div>
             </div>
          </div>
        </div>

        <div className="text-center py-12 bg-white rounded-lg shadow border-dashed border-2 border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tu plan diario está vacío</h3>
          <p className="text-gray-500 mt-2 mb-6">Genera tus misiones para comenzar el día.</p>
          <Button>Generar Plan Diario</Button>
        </div>
        
        <div className="mt-8">
           <MadeWithDyad />
        </div>
      </div>
    </div>
  );
};

export default Index;