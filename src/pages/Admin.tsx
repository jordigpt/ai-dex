import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TracksManager } from "@/components/admin/TracksManager";
import { MissionsManager } from "@/components/admin/MissionsManager";
import { CreateMissionDialog } from "@/components/admin/CreateMissionDialog";

export default function Admin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [consolidating, setConsolidating] = useState(false);
  
  // Data State
  const [missions, setMissions] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check admin table
      const { data: adminData } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      // Also allow if email matches hardcoded admin (fallback)
      const isEmailAdmin = session.user.email === "jordithecreative@gmail.com";

      if (adminData || isEmailAdmin) {
        setIsAdmin(true);
        fetchData();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Not admin");
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch missions with relations
      const { data: mData } = await supabase
        .from("missions")
        .select("*, skill:skills(name), track:tracks(name)")
        .order("created_at", { ascending: false });
      
      // Fetch skills
      const { data: sData } = await supabase
        .from("skills")
        .select("*")
        .order("name");

      // Fetch tracks
      const { data: tData } = await supabase
        .from("tracks")
        .select("*")
        .order("name");
        
      setMissions(mData || []);
      setSkills(sData || []);
      setTracks(tData || []);
    } catch (error: any) {
      toast({ title: "Error loading data", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMission = async (newMission: any) => {
    try {
      const { error } = await supabase.from("missions").insert({
        title: newMission.title,
        description: newMission.description,
        type: newMission.type,
        difficulty: parseInt(newMission.difficulty),
        xp_reward: parseInt(newMission.xp_reward),
        skill_id: newMission.skill_id === "none" ? null : newMission.skill_id,
        track_id: newMission.track_id === "none" ? null : newMission.track_id,
        is_active: true
      });

      if (error) throw error;

      toast({ title: "Misión creada" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error; // Re-throw to handle state in child component
    }
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-db');
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ 
        title: "Base de datos restaurada", 
        description: "Tracks unificados y nuevas misiones generadas.",
        className: "bg-green-50 border-green-200"
      });
      
      await fetchData();
    } catch (error: any) {
      toast({ 
        title: "Error al restaurar", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleConsolidateTracks = async () => {
    setConsolidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('consolidate-tracks');
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ 
        title: "Tracks Consolidados", 
        description: `Se han unificado los duplicados. (${data.results.length} operaciones)`,
        className: "bg-blue-50 border-blue-200"
      });
      
      await fetchData();
    } catch (error: any) {
      toast({ 
        title: "Error al consolidar", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setConsolidating(false);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm("¿Estás seguro de eliminar este track? Esto puede fallar si hay misiones o usuarios asignados.")) return;

    try {
      const { error } = await supabase.from("tracks").delete().eq("id", trackId);
      if (error) throw error;
      
      toast({ title: "Track eliminado correctamente" });
      fetchData();
    } catch (error: any) {
      toast({ 
        title: "Error eliminando track", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-muted-foreground">No tienes permisos de administrador.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <AdminHeader 
          consolidating={consolidating}
          seeding={seeding}
          onConsolidate={handleConsolidateTracks}
          onSeed={handleSeedDatabase}
          onOpenCreateDialog={() => setIsDialogOpen(true)}
        />

        <TracksManager 
          tracks={tracks}
          onDeleteTrack={handleDeleteTrack}
        />

        <MissionsManager 
          missions={missions}
          tracks={tracks}
        />

        <CreateMissionDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          tracks={tracks}
          skills={skills}
          onCreate={handleCreateMission}
        />
      </div>
    </Layout>
  );
}