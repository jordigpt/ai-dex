import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Zap, Map, LayoutGrid } from "lucide-react";
import { SkillTree } from "@/components/skill-tree/SkillTree";
import { SkillDetailSheet } from "@/components/skill-tree/SkillDetailSheet";
import { Skill, SkillDependency } from "@/types/skills";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

export default function Skills() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [dependencies, setDependencies] = useState<SkillDependency[]>([]);
  
  // Sheet State
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [skillMissions, setSkillMissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Get All Skills
        const { data: allSkills, error: skillsError } = await supabase
          .from("skills")
          .select("*")
          .order("name");
        
        if (skillsError) throw skillsError;

        // 2. Get User XP Events
        const { data: xpEvents, error: xpError } = await supabase
          .from("xp_events")
          .select("skill_id, xp")
          .eq("user_id", session.user.id);

        if (xpError) throw xpError;

        // 3. Get Dependencies
        const { data: depsData, error: depsError } = await supabase
          .from("skill_dependencies")
          .select("*");
        
        // Ignore specific error if table doesn't exist yet (42P01 is Postgres code for undefined table)
        if (depsError && depsError.code !== '42P01') { 
           console.error("Error fetching dependencies", depsError);
        }
        setDependencies(depsData || []);

        // Process Skills Data
        if (allSkills) {
          const skillsMap = allSkills.map(s => {
            const currentXp = xpEvents?.filter(e => e.skill_id === s.id).reduce((sum, e) => sum + e.xp, 0) || 0;
            return {
              ...s,
              xp: currentXp,
              status: currentXp > 0 ? 'available' : 'locked'
            } as Skill;
          });

          // Enhanced Status Logic (Client Side)
          // Unlock a skill if it has no parents OR if all parents have sufficient XP
          const enhancedSkills = skillsMap.map(skill => {
             const parents = (depsData || []).filter((d: any) => d.child_skill_id === skill.id);
             let isLocked = false;
             
             if (parents.length > 0) {
                const parentIds = parents.map((p: any) => p.parent_skill_id);
                const parentSkills = skillsMap.filter(s => parentIds.includes(s.id));
                const allParentsReady = parentSkills.every(p => p.xp >= 50); 
                if (!allParentsReady) isLocked = true;
             }

             // Override if already has XP
             if (skill.xp > 0) isLocked = false;

             const status: 'locked' | 'available' | 'completed' = isLocked ? 'locked' : (skill.xp > 500 ? 'completed' : 'available');

             return {
                ...skill,
                status
             };
          });

          // Sort by XP for list view
          enhancedSkills.sort((a, b) => b.xp - a.xp);

          setSkills(enhancedSkills);
        }

      } catch (error: any) {
        console.error("Error fetching skills", error);
        toast({ title: "Error", description: "No se pudieron cargar las skills.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSkillClick = async (skill: Skill) => {
    setSelectedSkill(skill);
    setIsSheetOpen(true);
    
    // Fetch missions for this skill
    try {
      const { data } = await supabase
        .from("missions")
        .select("*")
        .eq("skill_id", skill.id)
        .eq("is_active", true);
      setSkillMissions(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const MAX_VISUAL_XP = 2000; 

  return (
    <Layout>
      <div className="space-y-6 h-full flex flex-col">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Skill Tree</h1>
          <p className="text-muted-foreground">Tu mapa estratégico de crecimiento.</p>
        </div>

        <Tabs defaultValue="tree" className="flex-1 flex flex-col">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="tree" className="gap-2">
               <Map className="w-4 h-4" /> Mapa
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
               <LayoutGrid className="w-4 h-4" /> Lista
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tree" className="flex-1 min-h-[500px]">
             {skills.length > 0 ? (
               <SkillTree 
                 skills={skills} 
                 dependencies={dependencies} 
                 onSkillClick={handleSkillClick} 
               />
             ) : (
               <div className="text-center p-8 border border-dashed rounded-xl bg-gray-50">
                 No se encontraron skills configuradas.
               </div>
             )}
          </TabsContent>

          <TabsContent value="list">
            <div className="grid gap-6 md:grid-cols-2">
              {skills.map((skill) => (
                <Card 
                   key={skill.id} 
                   className={`overflow-hidden cursor-pointer hover:shadow-md transition-all ${skill.status === 'locked' ? 'opacity-60 grayscale' : ''}`}
                   onClick={() => handleSkillClick(skill)}
                >
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
                    <p className="text-sm text-muted-foreground mb-4 min-h-[40px] line-clamp-2">
                      {skill.description}
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
          </TabsContent>
        </Tabs>

        <SkillDetailSheet 
          skill={selectedSkill} 
          isOpen={isSheetOpen} 
          onClose={() => setIsSheetOpen(false)}
          missions={skillMissions}
        />
      </div>
    </Layout>
  );
}