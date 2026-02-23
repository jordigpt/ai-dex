import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Trophy, Flame, Target, BookOpen, Shield, Crown, Activity, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  // Helper component for Attribute Bars
  const AttributeBar = ({ label, value, colorClass }: { label: string, value: number, colorClass: string }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
        <span className="text-xs font-bold text-white">{value} XP</span>
      </div>
      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
        <div 
           className={`h-full ${colorClass}`} 
           style={{ width: `${Math.min(100, (value / 500) * 100)}%` }} // Visual scaling
        />
      </div>
    </div>
  );

  return (
    <Layout>
      {/* Main Dashboard Container */}
      <div className="bg-[#0f1115] text-white rounded-3xl p-6 md:p-10 shadow-2xl min-h-[800px] relative overflow-hidden border border-gray-800">
        
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* LEFT COLUMN: Identity & Core Stats */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white mb-2 leading-none">
                {profile?.display_name || "Agente"}
              </h1>
              <Badge variant="outline" className="border-primary text-primary bg-primary/10 px-3 py-1 text-sm tracking-widest uppercase">
                {trackName}
              </Badge>
            </div>

            {/* Level Badge */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="relative flex items-center justify-center w-16 h-16">
                 <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                    <path className="text-gray-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-primary" strokeDasharray={`${progressPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                 </svg>
                 <span className="absolute text-2xl font-bold">{currentLevel}</span>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">XP Actual</div>
                <div className="text-2xl font-bold text-white">{currentXP}</div>
              </div>
            </div>

            {/* Top Attributes */}
            <div className="space-y-2">
               <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Top Skills
               </h3>
               {skills.slice(0, 4).map((skill, idx) => {
                  const colors = ["bg-emerald-400", "bg-blue-400", "bg-purple-400", "bg-orange-400"];
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

          {/* CENTER COLUMN: Avatar Showcase */}
          <div className="lg:col-span-5 flex flex-col justify-end items-center relative min-h-[400px]">
             {/* Character Glow */}
             <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-50 rounded-b-3xl" />
             
             <div className="relative z-10 w-full h-full flex items-center justify-center">
                 {/* Avatar Frame */}
                 <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 rounded-2xl" />
                    <img 
                       src={avatarSrc} 
                       alt="Avatar" 
                       className="w-64 h-64 md:w-80 md:h-80 object-cover rendering-pixelated drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-transform duration-500 group-hover:scale-105"
                       style={{ imageRendering: 'pixelated' }}
                    />
                 </div>
             </div>

             {/* Bottom Status Tickers */}
             <div className="w-full grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white/5 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
                   <div className="text-xs text-gray-400 uppercase">Salud del Negocio</div>
                   <div className="h-2 w-full bg-gray-700 mt-2 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[85%]" />
                   </div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
                   <div className="text-xs text-gray-400 uppercase">Energía Creativa</div>
                   <div className="h-2 w-full bg-gray-700 mt-2 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 w-[60%]" />
                   </div>
                </div>
             </div>
          </div>

          {/* RIGHT COLUMN: Progress & KPIs */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* KPI Cards Row */}
            <div className="flex justify-between items-center bg-white/5 rounded-xl p-4 border border-white/10">
               <div className="text-center px-4 border-r border-white/10 w-1/3">
                  <div className="flex justify-center mb-2">
                     <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-xl font-bold text-white">{stats?.streak_current || 0}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Racha</div>
               </div>
               <div className="text-center px-4 border-r border-white/10 w-1/3">
                  <div className="flex justify-center mb-2">
                     <Trophy className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="text-xl font-bold text-white">{completionCount}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Victorias</div>
               </div>
               <div className="text-center px-4 w-1/3">
                  <div className="flex justify-center mb-2">
                     <Crown className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-xl font-bold text-white">{dexUnlockCount}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Items</div>
               </div>
            </div>

            {/* Other Skills List */}
            <div className="flex-1 overflow-y-auto pr-2 max-h-[300px]">
               <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Desarrollo
               </h3>
               <div className="space-y-3">
                  {skills.slice(4).map((skill) => (
                    <div key={skill.id} className="group">
                       <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300 group-hover:text-white transition-colors">{skill.name}</span>
                          <span className="text-gray-500">{skill.xp}</span>
                       </div>
                       <Progress value={(skill.xp / 500) * 100} className="h-1 bg-gray-800" />
                    </div>
                  ))}
                  {skills.length < 5 && (
                     <div className="text-xs text-gray-600 italic">Completa más misiones para desbloquear skills.</div>
                  )}
               </div>
            </div>

            {/* Chart Area */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-auto">
               <div className="flex justify-between items-center mb-4">
                  <div>
                     <div className="text-xs text-gray-400 uppercase tracking-wider">Rendimiento (7 Días)</div>
                     <div className="text-xl font-bold flex items-center gap-2">
                        +{chartData.reduce((acc, curr) => acc + curr.xp, 0)} XP
                        <TrendingUp className="w-4 h-4 text-green-500" />
                     </div>
                  </div>
               </div>
               <div className="h-[100px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData}>
                        <defs>
                           <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#d4e83a" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#d4e83a" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                           itemStyle={{ color: '#fff' }}
                           cursor={{ stroke: '#ffffff20' }}
                        />
                        <Area 
                           type="monotone" 
                           dataKey="xp" 
                           stroke="#d4e83a" 
                           fillOpacity={1} 
                           fill="url(#colorXp)" 
                           strokeWidth={2}
                        />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}