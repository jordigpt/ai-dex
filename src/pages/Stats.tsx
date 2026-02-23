import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Trophy, Flame, Target, BookOpen, Shield, Crown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Definimos los umbrales de nivel igual que en el backend para calcular progreso visual
const LEVEL_THRESHOLDS = [
  0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400, 
  6500, 7700, 9000, 10400, 11900, 13500, 15200, 17000, 18900, 20900
];

export default function Stats() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Data
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [completionCount, setCompletionCount] = useState(0);
  const [dexUnlockCount, setDexUnlockCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Profile (Avatar, Track)
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*, track:tracks(name)")
          .eq("user_id", session.user.id)
          .single();
        setProfile(profileData);

        // 2. Stats (XP, Level, Streak)
        const { data: statsData } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        setStats(statsData);

        // 3. Completions Count
        const { count: compCount } = await supabase
          .from("completions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id);
        setCompletionCount(compCount || 0);

        // 4. DEX Unlocks Count
        const { count: dexCount } = await supabase
          .from("user_dex_unlocks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id);
        setDexUnlockCount(dexCount || 0);

        // 5. Skills (Top 3)
        // Need to aggregate XP events manually or fetch if we had a view. 
        // For now, doing the same logic as Skills page but lighter.
        const { data: allSkills } = await supabase.from("skills").select("id, name");
        const { data: xpEvents } = await supabase
          .from("xp_events")
          .select("skill_id, xp")
          .eq("user_id", session.user.id);
        
        if (allSkills && xpEvents) {
          const skillsMap = allSkills.map(s => ({ ...s, xp: 0 }));
          xpEvents.forEach(evt => {
            if (evt.skill_id) {
              const skill = skillsMap.find(s => s.id === evt.skill_id);
              if (skill) skill.xp += evt.xp;
            }
          });
          // Sort top 5
          skillsMap.sort((a, b) => b.xp - a.xp);
          setSkills(skillsMap.slice(0, 5));
        }

      } catch (error: any) {
        toast({ title: "Error cargando stats", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  // Visual Calculations
  const currentLevel = stats?.level || 1;
  const currentXP = stats?.xp_total || 0;
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || (currentThreshold + 1000); // Fallback for max level
  
  const xpInLevel = currentXP - currentThreshold;
  const xpRequiredForLevel = nextThreshold - currentThreshold;
  const progressPercent = Math.min(100, Math.max(0, (xpInLevel / xpRequiredForLevel) * 100));

  const avatarSrc = profile?.preferences?.avatar === 'female' 
    ? '/avatars/female.png' 
    : '/avatars/male.png';

  const trackName = profile?.track?.name || "Novato Sin Clase";

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* HERO SECTION - Character Sheet */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 h-32 relative">
             <div className="absolute bottom-4 right-4">
                <Badge className="bg-primary text-black text-md px-3 py-1 font-bold border-2 border-black/10">
                   {trackName}
                </Badge>
             </div>
          </div>
          
          <div className="px-6 pb-6 relative">
            {/* Avatar Circle */}
            <div className="absolute -top-16 left-6 w-32 h-32 rounded-xl border-4 border-white bg-white shadow-lg overflow-hidden z-10">
               <img 
                  src={avatarSrc} 
                  alt="Character Avatar" 
                  className="w-full h-full object-cover"
                  style={{ imageRendering: 'pixelated' }}
               />
            </div>

            {/* Header Info */}
            <div className="ml-36 pt-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{profile?.display_name || "Jugador"}</h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                     <Shield className="w-4 h-4" /> Nivel {currentLevel}
                  </p>
               </div>
               
               {/* Main KPI badges */}
               <div className="flex gap-3">
                  <div className="flex flex-col items-center bg-gray-50 px-4 py-2 rounded-lg border">
                     <span className="text-xs text-muted-foreground uppercase font-bold">Racha</span>
                     <div className="flex items-center font-bold text-lg text-orange-600">
                        <Flame className="w-4 h-4 mr-1 fill-orange-600" />
                        {stats?.streak_current || 0}
                     </div>
                  </div>
                  <div className="flex flex-col items-center bg-gray-50 px-4 py-2 rounded-lg border">
                     <span className="text-xs text-muted-foreground uppercase font-bold">Misiones</span>
                     <div className="flex items-center font-bold text-lg text-blue-600">
                        <Target className="w-4 h-4 mr-1" />
                        {completionCount}
                     </div>
                  </div>
               </div>
            </div>

            {/* XP Bar */}
            <div className="mt-8 space-y-2">
               <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-600">XP {currentXP}</span>
                  <span className="text-gray-400">Próximo Nivel: {nextThreshold}</span>
               </div>
               <div className="h-4 bg-gray-100 rounded-full overflow-hidden border">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                     <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* GRID SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           
           {/* Column 1: Skills (Attributes) */}
           <div className="md:col-span-2 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                 <Zap className="w-5 h-5 text-yellow-500" /> Atributos de Personaje
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {skills.map((skill, idx) => (
                    <Card key={skill.id} className="border-l-4 border-l-yellow-400 hover:shadow-md transition-shadow">
                       <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-base font-semibold flex justify-between">
                             {skill.name}
                             <span className="text-xs font-normal text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                                Rank #{idx + 1}
                             </span>
                          </CardTitle>
                       </CardHeader>
                       <CardContent className="px-4 pb-4">
                          <div className="flex items-end gap-2">
                             <span className="text-2xl font-bold text-gray-900">{skill.xp}</span>
                             <span className="text-xs text-muted-foreground mb-1">puntos de XP</span>
                          </div>
                          {/* Mini bar per skill */}
                          <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-yellow-400" 
                                style={{ width: `${Math.min(100, (skill.xp / 1000) * 100)}%` }} // Visual cap
                             />
                          </div>
                       </CardContent>
                    </Card>
                 ))}
                 
                 {skills.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-muted-foreground bg-white rounded-lg border border-dashed">
                       Aún no has desarrollado habilidades. ¡Completa misiones!
                    </div>
                 )}
              </div>
           </div>

           {/* Column 2: Inventory / Badges */}
           <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                 <BookOpen className="w-5 h-5 text-purple-500" /> Inventario
              </h2>
              
              <Card>
                 <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                       <div className="mx-auto bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center">
                          <Crown className="w-8 h-8 text-purple-600" />
                       </div>
                       <div>
                          <div className="text-3xl font-black text-gray-900">{dexUnlockCount}</div>
                          <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                             Items Desbloqueados
                          </div>
                       </div>
                       <div className="text-xs text-gray-400 px-4">
                          Sigue subiendo de nivel para desbloquear más recursos en el DEX.
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none">
                 <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                       <Trophy className="w-5 h-5" /> Mejor Racha
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="text-4xl font-black text-white mb-1">
                       {stats?.streak_best || 0} <span className="text-lg font-normal text-gray-400">días</span>
                    </div>
                    <p className="text-xs text-gray-400">
                       La consistencia es el atributo más importante de un Builder.
                    </p>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </Layout>
  );
}