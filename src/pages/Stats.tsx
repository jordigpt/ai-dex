import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, Trophy, Flame, Target, BookOpen, Crown, TrendingUp, ShieldCheck, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

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
        
        {/* HERO SECTION - REIMAGINED FOR FULL BODY AVATAR */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[400px]">
          
          {/* LEFT: AVATAR SHOWCASE (PROTAGONIST) */}
          <div className="w-full md:w-5/12 lg:w-1/3 bg-gray-50 relative flex items-end justify-center border-b md:border-b-0 md:border-r border-gray-200 overflow-hidden group">
             {/* Background Grid Pattern */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
             
             {/* Decorative Elements */}
             <div className="absolute top-6 left-6">
                <Badge variant="outline" className="bg-white/80 backdrop-blur border-gray-300 text-gray-600 font-mono text-xs">
                   ID: {profile?.user_id?.slice(0, 8).toUpperCase()}
                </Badge>
             </div>
             
             {/* Center Glow */}
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[60px]" />

             {/* THE AVATAR - FULL BODY */}
             <div className="relative z-10 h-[380px] w-full flex items-end justify-center pb-0 transition-transform duration-700 md:group-hover:scale-105">
                <img 
                   src={avatarSrc} 
                   alt="Character Avatar" 
                   className="h-full w-auto object-contain drop-shadow-2xl"
                   style={{ imageRendering: 'pixelated' }}
                />
             </div>
          </div>

          {/* RIGHT: STATS & INFO */}
          <div className="flex-1 p-6 md:p-10 flex flex-col justify-center">
             
             {/* Header */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-primary text-black hover:bg-primary/90 font-bold border-none">
                         Nivel {currentLevel}
                      </Badge>
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                         {trackName}
                      </span>
                   </div>
                   <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                      {profile?.display_name || "Agente"}
                   </h1>
                </div>

                {/* Main Stats Row */}
                <div className="flex gap-4">
                   <div className="text-center">
                      <div className="bg-orange-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-1 border border-orange-100">
                         <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
                      </div>
                      <div className="font-bold text-gray-900">{stats?.streak_current || 0}</div>
                      <div className="text-[10px] uppercase text-gray-400 font-bold">Racha</div>
                   </div>
                   <div className="text-center">
                      <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-1 border border-blue-100">
                         <Target className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="font-bold text-gray-900">{completionCount}</div>
                      <div className="text-[10px] uppercase text-gray-400 font-bold">Misiones</div>
                   </div>
                </div>
             </div>

             {/* XP Progress Bar */}
             <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between items-end mb-2">
                   <div>
                      <span className="text-sm font-medium text-gray-500">Progreso de Nivel</span>
                      <div className="text-2xl font-bold text-gray-900 leading-none mt-1">
                         {xpInLevel} <span className="text-sm text-gray-400 font-normal">/ {xpRequiredForLevel} XP</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-xs font-bold text-primary-700 bg-primary/20 px-2 py-1 rounded">
                         {Math.round(progressPercent)}%
                      </div>
                   </div>
                </div>
                <div className="h-4 bg-white rounded-full overflow-hidden border border-gray-200 shadow-inner">
                   <div 
                      className="h-full bg-gradient-to-r from-primary to-lime-400 transition-all duration-1000 ease-out relative"
                      style={{ width: `${progressPercent}%` }}
                   >
                      <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                   </div>
                </div>
             </div>

             {/* Attributes Grid (Mini) */}
             <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Atributos Principales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                   {skills.slice(0, 4).map((skill, idx) => {
                      const colors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-orange-500"];
                      return (
                         <div key={skill.id} className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`} />
                            <div className="flex-1 flex justify-between text-sm">
                               <span className="font-medium text-gray-700 truncate">{skill.name}</span>
                               <span className="font-bold text-gray-900">{skill.xp}</span>
                            </div>
                         </div>
                      );
                   })}
                   {skills.length === 0 && (
                      <span className="text-sm text-gray-400 italic">Sin atributos desarrollados aún.</span>
                   )}
                </div>
             </div>

          </div>
        </div>

        {/* BOTTOM GRID SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           
           {/* Column 1: Performance Chart */}
           <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          Rendimiento Semanal
                       </h3>
                       <p className="text-sm text-muted-foreground mt-1">Tu actividad de los últimos 7 días</p>
                    </div>
                    <div className="text-right">
                       <div className="text-2xl font-black text-gray-900">
                          +{chartData.reduce((acc, curr) => acc + curr.xp, 0)}
                       </div>
                       <div className="text-xs font-bold text-gray-400 uppercase">XP Ganada</div>
                    </div>
                 </div>
                 
                 <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData}>
                          <defs>
                             <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d4e83a" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#d4e83a" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <XAxis 
                             dataKey="date" 
                             axisLine={false} 
                             tickLine={false} 
                             tick={{ fill: '#9ca3af', fontSize: 12 }} 
                             dy={10}
                          />
                          <YAxis 
                             hide={true} 
                          />
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                             itemStyle={{ color: '#000', fontWeight: 'bold' }}
                             cursor={{ stroke: '#d4e83a', strokeWidth: 2, strokeDasharray: '5 5' }}
                          />
                          <Area 
                             type="monotone" 
                             dataKey="xp" 
                             stroke="#a3b825" 
                             fillOpacity={1} 
                             fill="url(#colorXp)" 
                             strokeWidth={3}
                             activeDot={{ r: 6, strokeWidth: 0, fill: '#a3b825' }}
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Attributes Detailed */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" /> Desglose de Habilidades
                 </h3>
                 <div className="space-y-4">
                    {skills.map((skill, idx) => {
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
              </div>
           </div>

           {/* Column 2: Inventory & Badges */}
           <div className="space-y-6">
              {/* Best Streak Card */}
              <Card className="border-l-4 border-l-orange-500 overflow-hidden relative group shadow-sm hover:shadow-md transition-all">
                 <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                 <CardHeader className="pb-2 relative">
                    <CardTitle className="text-sm text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-2">
                       <Crown className="w-4 h-4 text-orange-500" /> Mejor Racha
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="relative">
                    <div className="flex items-baseline gap-2">
                       <span className="text-4xl font-black text-gray-900">{stats?.streak_best || 0}</span>
                       <span className="text-sm font-medium text-gray-500">días seguidos</span>
                    </div>
                 </CardContent>
              </Card>

              {/* Inventory Summary */}
              <Card className="shadow-sm border-t-4 border-t-purple-500">
                 <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase text-gray-500 flex items-center gap-2">
                       <BookOpen className="w-4 h-4 text-purple-600" /> Inventario DEX
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="text-center py-4">
                       <div className="text-5xl font-black text-gray-900 mb-2">{dexUnlockCount}</div>
                       <p className="text-sm text-muted-foreground">Recursos Desbloqueados</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-xs text-purple-700 mt-2 text-center font-medium">
                       Sigue subiendo de nivel para acceder a más herramientas.
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </Layout>
  );
}