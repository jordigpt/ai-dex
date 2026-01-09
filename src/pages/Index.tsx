import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Circle, RefreshCw, Flame, Star, Trophy } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { MissionCompletionDialog } from "@/components/MissionCompletionDialog";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Data State
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  // Modal State
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUserStats = async (userId: string) => {
    const { data } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) setStats(data);
  };

  const fetchData = async () => {
    try {
      // Don't set full loading on refresh to avoid flickering entire screen if possible,
      // but for simplicity keep it for now or move to separate loaders.
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth/login");
        return;
      }

      // 1. Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profileError) throw profileError;

      if (!profileData.onboarding_completed) {
        navigate("/onboarding");
        return;
      }
      setProfile(profileData);

      // 2. Stats
      await fetchUserStats(session.user.id);

      // 3. Assignments (Today)
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("user_mission_assignments")
        .select(`
          id,
          status,
          mission:missions (
            id,
            title,
            description,
            type,
            xp_reward,
            difficulty,
            skill:skills(name)
          )
        `)
        .eq("user_id", session.user.id)
        .gte("assigned_at", today.toISOString())
        .order("assigned_at", { ascending: true });

      if (assignmentsError) throw assignmentsError;
      
      setAssignments(assignmentsData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-plan');
      if (error) throw error;
      
      toast({ title: "Plan Generado", description: "¡A trabajar!" });
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Falló la generación del plan",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const openCompleteModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleCompleteMission = async (evidence: string, reflection: string) => {
    if (!selectedAssignment) return;

    try {
      const { data, error } = await supabase.functions.invoke('complete-mission', {
        body: {
          assignment_id: selectedAssignment.id,
          evidence_url: evidence,
          reflection: reflection
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Success
      toast({
        title: "¡Misión Completada!",
        description: `Ganaste ${data.xp_gained} XP.${data.level_up ? " ¡SUBISTE DE NIVEL!" : ""}`,
        className: "bg-green-50 border-green-200"
      });

      // Refresh data
      await fetchData();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo completar la misión.",
        variant: "destructive"
      });
    }
  };

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
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Vamos a construir, {profile?.display_name || 'Constructor'}.</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} size="sm">Cerrar Sesión</Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <Card className="border-l-4 border-l-blue-500">
             <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Nivel Actual</div>
                  <div className="text-3xl font-bold text-gray-900">{stats?.level || 1}</div>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
             </CardContent>
           </Card>
           
           <Card className="border-l-4 border-l-purple-500">
             <CardContent className="pt-6 flex items-center justify-between">
                <div>
                   <div className="text-sm font-medium text-muted-foreground mb-1">XP Total</div>
                   <div className="text-3xl font-bold text-gray-900">{stats?.xp_total || 0}</div>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                   <Trophy className="h-6 w-6 text-purple-600" />
                </div>
             </CardContent>
           </Card>

           <Card className="border-l-4 border-l-orange-500">
             <CardContent className="pt-6 flex items-center justify-between">
                <div>
                   <div className="text-sm font-medium text-muted-foreground mb-1">Racha (Streak)</div>
                   <div className="text-3xl font-bold text-gray-900">{stats?.streak_current || 0} <span className="text-sm font-normal text-muted-foreground">días</span></div>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                   <Flame className="h-6 w-6 text-orange-600" />
                </div>
             </CardContent>
           </Card>
        </div>

        {/* Daily Plan Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tu Plan de Hoy</h2>
            {assignments.length > 0 && (
               <Button variant="ghost" size="sm" onClick={fetchData} title="Refrescar">
                  <RefreshCw className="h-4 w-4" />
               </Button>
            )}
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Tu plan diario está vacío</h3>
              <p className="text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">
                El sistema generará misiones personalizadas basadas en tu track ({profile?.track_id ? 'Configurado' : 'General'}) y tiempo disponible.
              </p>
              <Button onClick={handleGeneratePlan} disabled={generating} size="lg">
                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generar Plan Ahora
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className={`transition-all hover:shadow-md ${assignment.status === 'completed' ? 'bg-gray-50 border-gray-200' : 'bg-white'}`}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                     <div className="space-y-1">
                        <Badge variant={assignment.mission.type === 'daily' ? 'secondary' : 'default'} className="mb-2">
                           {assignment.mission.type === 'daily' ? 'DAILY QUEST' : 'SIDE QUEST'}
                        </Badge>
                        <CardTitle className={`text-lg leading-none ${assignment.status === 'completed' ? 'text-gray-500 line-through decoration-gray-400' : ''}`}>
                           {assignment.mission.title}
                        </CardTitle>
                     </div>
                     <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                           {assignment.mission.xp_reward} XP
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-gray-50">
                           {assignment.mission.skill?.name || 'General'}
                        </Badge>
                     </div>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-sm text-muted-foreground mb-4 ${assignment.status === 'completed' ? 'text-gray-400' : ''}`}>
                      {assignment.mission.description}
                    </p>
                    <div className="flex justify-end">
                       <Button 
                        variant={assignment.status === 'completed' ? 'outline' : 'default'} 
                        disabled={assignment.status === 'completed'}
                        onClick={() => openCompleteModal(assignment)}
                       >
                          {assignment.status === 'completed' ? (
                             <>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                Completada
                             </>
                          ) : (
                             <>
                                <Circle className="mr-2 h-4 w-4" />
                                Completar Misión
                             </>
                          )}
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-8 pt-8 border-t">
           <MadeWithDyad />
        </div>

        {selectedAssignment && (
          <MissionCompletionDialog
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleCompleteMission}
            missionTitle={selectedAssignment.mission.title}
            xpReward={selectedAssignment.mission.xp_reward}
          />
        )}
      </div>
    </div>
  );
};

export default Index;