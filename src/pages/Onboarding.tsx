import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, Target, Clock, Zap } from "lucide-react";

interface Track {
  id: string;
  name: string;
  description: string;
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
      
      if (error) {
        toast({
          title: "Error cargando datos",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setTracks(tracksData || []);
      }
      setLoading(false);
    };

    init();
  }, [navigate, toast]);

  const handleNext = () => {
    if (step === 1 && !selectedTrack) {
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
        description: "Tu plan de acción está listo.",
      });

      // Redirigir al dashboard y forzar recarga para actualizar estado
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Paso {step} de 3</span>
            <div className="flex space-x-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full ${
                    i <= step ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 && "Elige tu Objetivo Principal"}
            {step === 2 && "Define tu Nivel Actual"}
            {step === 3 && "¿Cuánto tiempo tienes?"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Selecciona el 'Track' que mejor describe lo que quieres lograr."}
            {step === 2 && "Esto nos ayuda a calibrar la dificultad de tus misiones."}
            {step === 3 && "Sé honesto. La consistencia gana a la intensidad."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 && (
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
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-lg">{track.name}</span>
                    </div>
                    <span className="text-muted-foreground">{track.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {step === 2 && (
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

          {step === 3 && (
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

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || saving}
          >
            Atrás
          </Button>
          
          {step < 3 ? (
            <Button onClick={handleNext} disabled={!selectedTrack && step === 1}>
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
  );
}