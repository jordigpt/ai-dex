import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form State
  const [profile, setProfile] = useState<any>({});
  const [tracks, setTracks] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);

        // Fetch Profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        
        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch Tracks
        const { data: tracksData } = await supabase.from("tracks").select("*");
        setTracks(tracksData || []);

      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          track_id: profile.track_id,
          time_daily: parseInt(profile.time_daily),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;
      toast({ title: "Perfil actualizado correctamente." });
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">Administra tu perfil y preferencias de la aventura.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Perfil de Jugador</CardTitle>
            <CardDescription>Estos ajustes afectan cómo se genera tu plan diario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre / Alias</Label>
              <Input 
                id="name" 
                value={profile.display_name || ''} 
                onChange={(e) => setProfile({...profile, display_name: e.target.value})} 
                placeholder="Tu nombre de guerrero"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="track">Track Principal (Objetivo)</Label>
              <Select 
                value={profile.track_id || ''} 
                onValueChange={(v) => setProfile({...profile, track_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un track" />
                </SelectTrigger>
                <SelectContent>
                  {tracks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Tiempo Diario Disponible</Label>
              <Select 
                value={profile.time_daily?.toString() || '60'} 
                onValueChange={(v) => setProfile({...profile, time_daily: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos (Modo Supervivencia)</SelectItem>
                  <SelectItem value="60">60 minutos (Ritmo Constante)</SelectItem>
                  <SelectItem value="120">120+ minutos (Modo Monje)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Guardar Cambios
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}