import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, Trophy, Calendar, CheckCircle2, Circle, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { MissionCompletionDialog } from "@/components/MissionCompletionDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function MissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [mission, setMission] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [assignment, setAssignment] = useState<any>(null);
  const [starting, setStarting] = useState(false);
  
  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchMissionDetails();
  }, [id]);

  const fetchMissionDetails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Fetch Mission Info
      const { data: mData, error: mError } = await supabase
        .from("missions")
        .select("*, skill:skills(name), track:tracks(name)")
        .eq("id", id)
        .single();
      
      if (mError) throw mError;
      setMission(mData);

      // 2. Fetch Steps
      const { data: sData, error: sError } = await supabase
        .from("mission_steps")
        .select("*")
        .eq("mission_id", id)
        .order("step_order", { ascending: true });
      
      if (sError) throw sError;
      setSteps(sData || []);

      // 3. Fetch User Assignment/Status
      const { data: aData } = await supabase
        .from("user_mission_assignments")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("mission_id", id)
        .maybeSingle(); // Use maybeSingle as it might not be assigned yet
      
      setAssignment(aData);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cargar la misión.",
        variant: "destructive"
      });
      navigate("/missions");
    } finally {
      setLoading(false);
    }
  };

  const handleStartMission = async () => {
    setStarting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("user_mission_assignments")
        .insert({
          user_id: session.user.id,
          mission_id: mission.id,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "¡Misión Iniciada!",
        description: "Ahora puedes registrar tu progreso.",
      });

      await fetchMissionDetails(); // Recargar datos
    } catch (error: any) {
      toast({
        title: "Error al iniciar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setStarting(false);
    }
  };

  const handleCompleteMission = async (evidence: string, reflection: string) => {
    if (!assignment) {
      toast({ title: "Error", description: "Debes iniciar la misión primero.", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('complete-mission', {
        body: {
          assignment_id: assignment.id,
          evidence_url: evidence,
          reflection: reflection
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "¡Misión Completada!",
        description: `Ganaste ${data.xp_gained} XP.`,
        className: "bg-green-50 border-green-200"
      });

      fetchMissionDetails(); // Refresh state

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error completando misión",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  if (!mission) return null;

  const isCompleted = assignment?.status === "completed";
  const isAssigned = assignment?.status === "assigned";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={mission.type === 'daily' ? 'secondary' : 'default'}>
              {mission.type.toUpperCase()}
            </Badge>
            <Badge variant="outline">{mission.skill?.name || "General"}</Badge>
            <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
              {mission.xp_reward} XP
            </Badge>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">{mission.title}</h1>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 whitespace-pre-wrap">{mission.description}</p>
            </CardContent>
          </Card>

          {/* Steps Checklist */}
          {steps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pasos a seguir</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50">
                    <Checkbox id={step.id} disabled={isCompleted} />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={step.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {step.title}
                      </label>
                      {step.is_required && (
                        <span className="text-xs text-muted-foreground text-red-400">Requerido</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Area */}
          <Card className={`${isCompleted ? "bg-green-50 border-green-200" : isAssigned ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
            <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {isCompleted ? "¡Misión Cumplida!" : isAssigned ? "En Progreso" : "Disponible"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isCompleted 
                    ? `Completada el ${format(new Date(assignment.completed_at), "d MMMM yyyy", { locale: es })}`
                    : isAssigned 
                      ? "Tienes esta misión activa. ¡Complétala para ganar XP!" 
                      : "Esta misión está disponible para ser iniciada."
                  }
                </p>
              </div>
              
              {!assignment && (
                 <Button size="lg" onClick={handleStartMission} disabled={starting}>
                    {starting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Play className="mr-2 h-4 w-4" /> Iniciar Misión
                 </Button>
              )}

              {isAssigned && !isCompleted && (
                <Button size="lg" onClick={() => setIsModalOpen(true)}>
                  <Circle className="mr-2 h-4 w-4" /> Completar
                </Button>
              )}
              
              {isCompleted && (
                 <CheckCircle2 className="h-8 w-8 text-green-600" />
              )}
            </CardContent>
          </Card>
        </div>

        <MissionCompletionDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleCompleteMission}
          missionTitle={mission.title}
          xpReward={mission.xp_reward}
        />
      </div>
    </Layout>
  );
}