import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sword, Scroll, Map, CheckCircle2, ChevronRight, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export default function Missions() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [startingId, setStartingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Fetch Assignments (Active & Completed)
      const { data: assignData, error: assignError } = await supabase
        .from("user_mission_assignments")
        .select("mission_id, status")
        .eq("user_id", session.user.id);

      if (assignError) throw assignError;
      setAssignments(assignData || []);

      // 2. Fetch All Active Missions
      const { data: missionData, error: missionError } = await supabase
        .from("missions")
        .select("*, skill:skills(name)")
        .eq("is_active", true)
        .order("difficulty", { ascending: true });

      if (missionError) throw missionError;
      setMissions(missionData || []);

    } catch (error: any) {
      toast({
        title: "Error cargando misiones",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartMission = async (e: React.MouseEvent, missionId: string) => {
    e.stopPropagation(); // Evitar navegar al detalle al hacer clic en el botón
    setStartingId(missionId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("user_mission_assignments")
        .insert({
          user_id: session.user.id,
          mission_id: missionId,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "¡Misión Iniciada!",
        description: "Se ha añadido a tu lista de tareas activas.",
      });

      await fetchData(); // Recargar para actualizar estados
    } catch (error: any) {
      toast({
        title: "Error al iniciar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setStartingId(null);
    }
  };

  // Helpers to filter missions
  const getMissionStatus = (missionId: string) => {
    const assignment = assignments.find(a => a.mission_id === missionId);
    return assignment ? assignment.status : "unassigned";
  };

  const filterMissions = (type: string) => {
    return missions.filter(m => m.type === type);
  };

  const MissionList = ({ type }: { type: string }) => {
    const filtered = filterMissions(type);
    
    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No hay misiones de este tipo disponibles aún.
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mission) => {
          const status = getMissionStatus(mission.id);
          const isCompleted = status === "completed";
          const isAssigned = status === "assigned";
          const isStarting = startingId === mission.id;

          return (
            <Card 
              key={mission.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${isCompleted ? "opacity-75 bg-gray-50" : "hover:border-primary/50"}`}
              onClick={() => navigate(`/missions/${mission.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="mb-2">
                    {mission.skill?.name || "General"}
                  </Badge>
                  <Badge variant={isCompleted ? "default" : isAssigned ? "secondary" : "outline"}>
                    {isCompleted ? "Completada" : isAssigned ? "En Curso" : "Disponible"}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{mission.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span>Dificultad {mission.difficulty}</span>
                  <span>•</span>
                  <span className="font-semibold text-gray-900">{mission.xp_reward} XP</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {mission.description}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-0 pb-4">
                 {isCompleted ? (
                    <div className="flex items-center text-green-600 text-sm font-medium">
                       <CheckCircle2 className="w-4 h-4 mr-2" />
                       Misión cumplida
                    </div>
                 ) : isAssigned ? (
                    <div className="flex items-center text-primary-foreground/70 text-sm font-medium">
                       <Play className="w-4 h-4 mr-2" />
                       En progreso
                    </div>
                 ) : (
                    <Button 
                      size="sm" 
                      onClick={(e) => handleStartMission(e, mission.id)}
                      disabled={isStarting}
                      className="w-full sm:w-auto"
                    >
                      {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {!isStarting && <Play className="mr-2 h-4 w-4" />}
                      Empezar
                    </Button>
                 )}
                 
                 {(isCompleted || isAssigned) && <ChevronRight className="w-4 h-4 text-gray-400" />}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Misiones</h1>
          <p className="text-muted-foreground">Tu mapa de ruta hacia el éxito. Elige y conquista.</p>
        </div>

        <Tabs defaultValue="main" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100">
            <TabsTrigger value="daily" className="data-[state=active]:bg-white data-[state=active]:text-black">
              <Sword className="w-4 h-4 mr-2" /> Daily Quests
            </TabsTrigger>
            <TabsTrigger value="main" className="data-[state=active]:bg-white data-[state=active]:text-black">
              <Map className="w-4 h-4 mr-2" /> Main Quest
            </TabsTrigger>
            <TabsTrigger value="side" className="data-[state=active]:bg-white data-[state=active]:text-black">
              <Scroll className="w-4 h-4 mr-2" /> Side Quests
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="mt-6">
            <div className="mb-4 text-sm text-muted-foreground bg-primary/10 p-3 rounded-md border border-primary/20">
               Estas misiones suelen ser rotativas, pero puedes iniciar manualmente las que te interesen hoy.
            </div>
            <MissionList type="daily" />
          </TabsContent>
          
          <TabsContent value="main" className="mt-6">
            <MissionList type="main" />
          </TabsContent>
          
          <TabsContent value="side" className="mt-6">
            <MissionList type="side" />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}