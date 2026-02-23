import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Target, Clock, Zap, Construction, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Track {
  id: string;
  name: string;
  description: string;
  mission_count?: number;
}

const LEVELS = [
  { value: 1, label: "Principiante (Nivel 1)", description: "Estoy empezando desde cero." },
  { value: 2, label: "Intermedio (Nivel 2)", description: "Ya he hecho algunas cosas, busco consistencia." },
  { value: 3, label: "Avanzado (Nivel 3)", description: "Ya tengo resultados, quiero escalar." },
];

const TIMES = [
  { value: 30, label: "30 min/día", description: "Modo supervivencia / Side hustle limitado." },
  { value: 60, label: "60 min/día", description: "Ritmo constante." },
  { value: 120, label: "120+ min/día", description: "Modo monje / Full focus." },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  
  // Form State
  const [displayName, setDisplayName] = useState<string>("");
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [level, setLevel] = useState<number>(1);
  const [time, setTime] = useState<number>(60);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // 1. Get User
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth/login");
        return;
      }
      setUserId(session.user.id);

      // 2. Fetch Tracks
      const { data: tracksData, error } = await supabase
        .from("tracks")
        .select("id, name, description");
      
      // 3. Fetch Mission Counts
      const { data: missionsData } = await supabase
        .from("missions")
        .select("track_id")
        .eq("is_active", true);

      if (error) {
        toast({
          title: "Error cargando datos",
          description: error.message,
          variant: "destructive",
        });
      } else {
        const counts: Record<string, number> = {};
        missionsData?.forEach(m => {
          if (m.track_id) {
            counts[m.track_id] = (counts[m.track_id] || 0) + 1;
          }
        });

        const tracksWithCount = (tracksData || []).map(t => ({
          ...t,
          mission_count: counts[t.id] || 0
        }));

        setTracks(tracksWithCount);
      }
      setLoading(false);
    };

    init();
  }, [navigate, toast]);

  const handleNext = () => {
    // Validation Logic
    if (step === 1 && !displayName.trim()) {
      toast({ title: "Por favor escribe tu nombre", variant: "destructive" });
      return;
    }
    if (step === 2 && !selectedTrack) {
      toast({ title: "Selecciona un objetivo", variant: "destructive" });
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleFinish = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          track_id: selectedTrack,
          level_initial: level,
          time_daily: time,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "¡Perfil configurado!",
        description: `Bienvenido, ${displayName}. Tu plan está listo.`,
      });

      window.location.href = "/"; 
    } catch (error: any) {
      toast({
        title: "Error guardando perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Total steps now 4
  const TOTAL_STEPS = 4;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Paso {step} de {TOTAL_STEPS}</span>
              <div className="flex space-x-1">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-8 rounded-full transition-colors duration-300 ${
                      i + 1 <= step ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
            <CardTitle className="text-2xl">
              {step === 1 && "Identidad del Agente"}
              {step === 2 && "Elige tu Objetivo Principal"}
              {step === 3 && "Define tu Nivel Actual"}
              {step === 4 && "¿Cuánto tiempo tienes?"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "¿Cómo quieres que te llamemos en esta misión?"}
              {step === 2 && "Selecciona el 'Track' que mejor describe lo que quieres lograr."}
              {step === 3 && "Esto nos ayuda a calibrar la dificultad de tus misiones."}
              {step === 4 && "Sé honesto. La consistencia gana a la intensidad."}
            </CardDescription>
          </CardHeader>

          <CardContent className="min-h-[300px] flex flex-col justify-center">
            {step === 1 && (
               <div className="space-y-6">
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                       <User className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-md mx-auto">
                     <Label htmlFor="name" className="text-base">Nombre o Alias</Label>
                     <Input 
                        id="name" 
                        placeholder="Ej. CyberPunk2077, Jordi, Agente Smith..." 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="text-lg h-12"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && displayName.trim() && handleNext()}
                     />
                     <p className="text-xs text-muted-foreground pt-2">
                        Este nombre será visible en futuras funcionalidades sociales y rankings.
                     </p>
                  </div>
               </div>
            )}

            {step === 2 && (
              <RadioGroup value={selectedTrack} onValueChange={setSelectedTrack} className="space-y-3">
                {tracks.map((track) => (
                  <div key={track.id} className="relative">
                    <RadioGroupItem
                      value={track.id}
                      id={track.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={track.id}
                      className="flex flex-col p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-lg">{track.name}</span>
                        </div>
                        {(track.mission_count || 0) === 0 && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Construction className="w-3 h-3 mr-1" />
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground">{track.description}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {step === 3 && (
              <div className="space-y-6 py-4">
                <RadioGroup value={level.toString()} onValueChange={(v) => setLevel(parseInt(v))} className="space-y-4">
                   {LEVELS.map((lvl) => (
                      <div key={lvl.value} className="relative">
                        <RadioGroupItem value={lvl.value.toString()} id={`lvl-${lvl.value}`} className="peer sr-only" />
                         <Label
                          htmlFor={`lvl-${lvl.value}`}
                          className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                        >
                          <div className="bg-primary/10 p-2 rounded-full mr-4">
                             <Zap className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                             <div className="font-semibold text-lg">{lvl.label}</div>
                             <div className="text-muted-foreground">{lvl.description}</div>
                          </div>
                        </Label>
                      </div>
                   ))}
                </RadioGroup>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 py-8 px-2">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {TIMES.map((t) => (
                       <div 
                          key={t.value} 
                          onClick={() => setTime(t.value)}
                          className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${
                             time === t.value 
                             ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                             : "border-gray-200 hover:border-gray-300"
                          }`}
                       >
                          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                             <Clock className="h-6 w-6 text-primary" />
                          </div>
                          <div className="font-bold text-xl mb-1">{t.label}</div>
                          <div className="text-sm text-muted-foreground">{t.description}</div>
                       </div>
                    ))}
                 </div>
                 
                 <div className="pt-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                       <span>Tiempo seleccionado:</span>
                       <span className="font-bold text-foreground">{time} minutos diarios</span>
                    </div>
                    <Slider
                       value={[time]}
                       onValueChange={(v) => setTime(v[0])}
                       min={15}
                       max={240}
                       step={15}
                       className="w-full"
                    />
                 </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || saving}
            >
              Atrás
            </Button>
            
            {step < TOTAL_STEPS ? (
              <Button onClick={handleNext} disabled={(step === 1 && !displayName) || (step === 2 && !selectedTrack)}>
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Comenzar Aventura
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      <footer className="py-6 text-center text-sm text-gray-400">
        By JordiGPT
      </footer>
    </div>
  );
}