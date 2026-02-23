import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, Trophy, Flame, Target, BookOpen, Crown, TrendingUp, ShieldCheck, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

// Definimos los umbrales de nivel igual que en el backend
const LEVEL_THRESHOLDS = [
  0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400, 
  6500, 7700, 9000, 10400, 11900, 13500, 15200, 17000, 18900, 20900
];

export default function Stats() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [completionCount, setCompletionCount] = useState(0);
  const [dexUnlockCount, setDexUnlockCount] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*, track:tracks(name)")
          .eq("user_id", session.user.id)
          .single();
        setProfile(profileData);

        // 2. Stats
        const { data: statsData } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        setStats(statsData);

        // 3. Counts
        const { count: compCount } = await supabase
          .from("completions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id);
        setCompletionCount(compCount || 0);

        const { count: dexCount } = await supabase
          .from("user_dex_unlocks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id);
        setDexUnlockCount(dexCount || 0);

        // 4. Skills Processing
        const { data: allSkills } = await supabase.from("skills").select("id, name");
        const { data: xpEvents } = await supabase
          .from("xp_events")
          .select("skill_id, xp, created_at")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: true });
        
        // Process Skills
        if (allSkills && xpEvents) {
          const skillsMap = allSkills.map(s => ({ ...s, xp: 0 }));
          xpEvents.forEach(evt => {
            if (evt.skill_id) {
              const skill = skillsMap.find(s => s.id === evt.skill_id);
              if (skill) skill.xp += evt.xp;
            }
          });
          skillsMap.sort((a, b) => b.xp - a.xp);
          setSkills(skillsMap);

          // Process Chart Data (Last 7 days XP)
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
          });

          const dailyXP = last7Days.map(date => {
            const dayXP = xpEvents
              .filter(e => e.created_at.startsWith(date))
              .reduce((sum, e) => sum + e.xp, 0);
            return {
              date: date.split('-')[2], // Just the day number
              xp: dayXP
            };
          });
          setChartData(dailyXP);
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
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || (currentThreshold + 1000);
  const xpInLevel = currentXP - currentThreshold;
  const xpRequiredForLevel = nextThreshold - currentThreshold;
  const progressPercent = Math.min(100, Math.max(0, (xpInLevel / xpRequiredForLevel) * 100));

  const avatarSrc = profile?.preferences?.avatar === 'female' 
    ? '/avatars/female.png' 
    : '/avatars/male.png';

  const trackName = profile?.track?.name || "Novato";

  // Helper component for Attribute Bars (Light Mode)
  const AttributeBar = ({ label, value, colorClass }: { label: string, value: number, colorClass: string }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5 items-end">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
        <span className="text-sm font-bold text-gray-900">{value} XP</span>
      </div>
      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        <div 
           className={`h-full ${colorClass} transition-all duration-1000`} 
           style={{ width: `${Math.min(100, (value / 500) * 100)}%` }} 
        />
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* HERO SECTION - LIGHT MODE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
          
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 relative z-10">
            
            {/* LEFT: Avatar with Holo Effect */}
            <div className="flex-shrink-0 flex justify-center md:justify-start">
               <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl transform scale-90 translate-y-4"></div>
                  <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl border-4 border-white shadow-xl bg-gray-50 overflow-hidden relative">
                     <img 
                        src={avatarSrc} 
                        alt="Character Avatar" 
                        className="w-full h-full object-cover rendering-pixelated"
                        style={{ imageRendering: 'pixelated' }}
                     />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                     <Badge className="bg-gray-900 text-white border-2 border-white px-3 py-1 text-xs shadow-md uppercase tracking-wider whitespace-nowrap">
                        Nivel {currentLevel}
                     </Badge>
                  </div>
               </div>
            </div>

            {/* RIGHT: Main Stats Info */}
            <div className="flex-1 flex flex-col justify-center space-y-6 text-center md:text-left">
               <div>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                     <Badge variant="outline" className="text-primary-700 bg-primary/10 border-primary/20">
                        {trackName}
                     </Badge>
                     <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Agente Activo
                     </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-1">
                     {profile?.display_name || "Jugador"}
                  </h1>
               </div>

               {/* XP Progress */}
               <div className="space-y-2 max-w-xl mx-auto md:mx-0">
                  <div className="flex justify-between text-sm font-medium">
                     <span className="text-gray-900 font-bold">{currentXP} XP <span className="text-gray-400 font-normal">Total</span></span>
                     <span className="text-gray-500">Próximo Nivel: {nextThreshold} XP</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                     <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out relative"
                        style={{ width: `${progressPercent}%` }}
                     >
                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                     </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-right pt-1">
                     Faltan {xpRequiredForLevel - xpInLevel} XP para subir de nivel
                  </p>
               </div>

               {/* Quick Stats Grid */}
               <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto md:mx-0 w-full pt-2">
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-center">
                     <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                     <div className="text-xl font-bold text-gray-900">{stats?.streak_current || 0}</div>
                     <div className="text-[10px] text-orange-600 font-bold uppercase">Racha Días</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                     <Target className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                     <div className="text-xl font-bold text-gray-900">{completionCount}</div>
                     <div className="text-[10px] text-blue-600 font-bold uppercase">Misiones</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 text-center">
                     <Crown className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                     <div className="text-xl font-bold text-gray-900">{dexUnlockCount}</div>
                     <div className="text-[10px] text-purple-600 font-bold uppercase">Items DEX</div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* BOTTOM GRID SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           
           {/* Column 1: Attributes (Skills) */}
           <div className="md:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                 <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Atributos de Personaje
              </h2>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                    {skills.slice(0, 6).map((skill, idx) => {
                        const colors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-orange-500"];
                        return (
                           <AttributeBar 
                              key={skill.id} 
                              label={skill.name} 
                              value={skill.xp} 
                              colorClass={colors[idx % colors.length]} 
                           />
                        );
                    })}
                 </div>
                 {skills.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                       Completa misiones para desarrollar tus atributos.
                    </div>
                 )}
              </div>

              {/* Chart Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Rendimiento Semanal</h3>
                       <p className="text-sm text-muted-foreground">Puntos de XP ganados en los últimos 7 días</p>
                    </div>
                    <div className="text-right">
                       <div className="text-2xl font-black text-gray-900 flex items-center justify-end gap-2">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          +{chartData.reduce((acc, curr) => acc + curr.xp, 0)}
                       </div>
                       <div className="text-xs font-bold text-gray-400 uppercase">XP Total Semana</div>
                    </div>
                 </div>
                 
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData}>
                          <defs>
                             <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d4e83a" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#d4e83a" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                             itemStyle={{ color: '#000', fontWeight: 'bold' }}
                             cursor={{ stroke: '#d4e83a', strokeWidth: 2 }}
                          />
                          <Area 
                             type="monotone" 
                             dataKey="xp" 
                             stroke="#a3b825" 
                             fillOpacity={1} 
                             fill="url(#colorXp)" 
                             strokeWidth={3}
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           {/* Column 2: Inventory & Badges */}
           <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                 <BookOpen className="w-5 h-5 text-purple-600" /> Estado de Cuenta
              </h2>

              {/* Best Streak Card */}
              <Card className="border-l-4 border-l-orange-500 overflow-hidden relative group">
                 <div className="absolute right-0 top-0 w-24 h-24 bg-orange-100 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                 <CardHeader className="pb-2 relative">
                    <CardTitle className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Mejor Racha Histórica</CardTitle>
                 </CardHeader>
                 <CardContent className="relative">
                    <div className="flex items-baseline gap-2">
                       <span className="text-4xl font-black text-gray-900">{stats?.streak_best || 0}</span>
                       <span className="text-sm font-medium text-gray-500">días seguidos</span>
                    </div>
                 </CardContent>
              </Card>

              {/* Inventory Summary */}
              <Card>
                 <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase text-gray-500">Resumen de Inventario</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex items-center gap-3">
                             <div className="bg-white p-2 rounded-md shadow-sm">
                                <BookOpen className="w-4 h-4 text-purple-600" />
                             </div>
                             <div>
                                <div className="font-bold text-gray-900">Recursos DEX</div>
                                <div className="text-xs text-purple-600 font-medium">{dexUnlockCount} desbloqueados</div>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-center gap-3">
                             <div className="bg-white p-2 rounded-md shadow-sm">
                                <Star className="w-4 h-4 text-blue-600" />
                             </div>
                             <div>
                                <div className="font-bold text-gray-900">Logros Totales</div>
                                <div className="text-xs text-blue-600 font-medium">{completionCount} completados</div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </Layout>
  );
}