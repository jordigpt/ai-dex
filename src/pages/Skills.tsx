import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Zap } from "lucide-react";

interface SkillData {
  id: string;
  name: string;
  description: string;
  xp: number;
}

export default function Skills() {
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [totalXp, setTotalXp] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Get All Skills
        const { data: allSkills } = await supabase
          .from("skills")
          .select("*")
          .order("name");
        
        // 2. Get User XP Events grouped/summed (Client side aggregation for MVP)
        const { data: xpEvents } = await supabase
          .from("xp_events")
          .select("skill_id, xp")
          .eq("user_id", session.user.id);

        if (allSkills) {
          const skillsMap = allSkills.map(s => ({ ...s, xp: 0 }));
          let total = 0;

          xpEvents?.forEach(evt => {
            if (evt.skill_id) {
              const skill = skillsMap.find(s => s.id === evt.skill_id);
              if (skill) skill.xp += evt.xp;
            }
            total += evt.xp;
          });

          // Sort by XP (highest first)
          skillsMap.sort((a, b) => b.xp - a.xp);
          
          setSkills(skillsMap);
          setTotalXp(total);
        }

      } catch (error) {
        console.error("Error fetching skills", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Helper to calculate a visual "level" or progress percentage for the bar
  // Arbitrary cap for MVP visualization: e.g., 1000 XP = "Max Bar" just for visuals
  const MAX_VISUAL_XP = 2000; 

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Skills</h1>
          <p className="text-muted-foreground">Tu desarrollo profesional gamificado.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {skills.map((skill) => (
            <Card key={skill.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50/50">
                <CardTitle className="text-lg font-semibold">
                  {skill.name}
                </CardTitle>
                <div className="flex items-center gap-1 text-primary font-bold">
                   <Zap className="w-4 h-4 fill-primary" />
                   {skill.xp} XP
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                  {skill.description || "Mejora esta habilidad completando misiones relacionadas."}
                </p>
                
                <div className="space-y-1">
                   <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progreso</span>
                      <span>{Math.min(100, Math.round((skill.xp / MAX_VISUAL_XP) * 100))}%</span>
                   </div>
                   <Progress value={Math.min(100, (skill.xp / MAX_VISUAL_XP) * 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}