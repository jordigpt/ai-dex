import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, User } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form State
  const [profile, setProfile] = useState<any>({});
  const [tracks, setTracks] = useState<any[]>([]);
  const [avatar, setAvatar] = useState<string>("male");

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
        
        // Load Avatar preference
        if (profileData.preferences && profileData.preferences.avatar) {
          setAvatar(profileData.preferences.avatar);
        }

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
      // Update local state for preferences merging
      const updatedPreferences = {
        ...(profile.preferences || {}),
        avatar: avatar
      };

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          track_id: profile.track_id,
          time_daily: parseInt(profile.time_daily),
          preferences: updatedPreferences,
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">Personaliza tu experiencia y tu identidad.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avatar Selection Column */}
          <div className="md:col-span-1 space-y-4">
             <Card className="h-full">
                <CardHeader>
                   <CardTitle>Tu Avatar</CardTitle>
                   <CardDescription>Esta es tu representación en el mundo de AI-DEX.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                   <div className="relative group cursor-pointer" onClick={() => setAvatar(avatar === 'male' ? 'female' : 'male')}>
                      <div className="w-48 h-48 rounded-lg overflow-hidden border-4 border-primary/20 bg-gray-50 flex items-center justify-center relative">
                         <img 
                            src={avatar === 'male' ? '/avatars/male.png' : '/avatars/female.png'} 
                            alt="Avatar" 
                            className="w-full h-full object-cover rendering-pixelated"
                            style={{ imageRendering: 'pixelated' }}
                         />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 bg-white/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                               Cambiar
                            </span>
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-2 w-full">
                      <div 
                        className={`flex-1 p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${avatar === 'male' ? 'border-primary bg-primary/10 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setAvatar('male')}
                      >
                         Agente M
                      </div>
                      <div 
                        className={`flex-1 p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${avatar === 'female' ? 'border-primary bg-primary/10 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setAvatar('female')}
                      >
                         Agente F
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>

          {/* Settings Form Column */}
          <div className="md:col-span-2">
            <Card className="h-full">
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
                  <Label htmlFor="track">Track Principal (Clase)</Label>
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
                  <p className="text-xs text-muted-foreground">Tu "clase" define qué tipo de misiones recibirás.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Tiempo Diario (Dificultad)</Label>
                  <Select 
                    value={profile.time_daily?.toString() || '60'} 
                    onValueChange={(v) => setProfile({...profile, time_daily: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tiempo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min (Casual / Side Hustle)</SelectItem>
                      <SelectItem value="60">60 min (Normal / Builder)</SelectItem>
                      <SelectItem value="120">120+ min (Hardcore / Founder)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}