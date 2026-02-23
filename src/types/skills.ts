export interface Skill {
  id: string;
  name: string;
  description: string | null;
  impact_description?: string | null;
  category?: string;
  created_at: string;
  // Campos calculados para la UI
  xp: number;
  level?: number;
  status?: 'locked' | 'available' | 'completed';
}

export interface SkillDependency {
  id: string;
  parent_skill_id: string;
  child_skill_id: string;
}

export interface SkillNodeData extends Skill {
  onNodeClick: (skill: Skill) => void;
}