import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Skill } from "@/types/skills";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lock, Unlock, Zap, Target, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SkillDetailSheetProps {
  skill: Skill | null;
  isOpen: boolean;
  onClose: () => void;
  missions: any[];
}

export function SkillDetailSheet({ skill, isOpen, onClose, missions }: SkillDetailSheetProps) {
  const navigate = useNavigate();

  if (!skill) return null;

  const isLocked = skill.status === 'locked';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-full ${isLocked ? 'bg-gray-100 text-gray-500' : 'bg-primary/20 text-primary-700'}`}>
              {isLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
            </div>
            <div>
              <SheetTitle className="text-xl">{skill.name}</SheetTitle>
              <Badge variant={isLocked ? "secondary" : "default"} className="mt-1">
                {isLocked ? "Bloqueado" : `${skill.xp} XP Acumulada`}
              </Badge>
            </div>
          </div>
          <SheetDescription>
            {skill.description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {skill.impact_description && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-blue-900 text-sm mb-1 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Impacto en tu Negocio
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                {skill.impact_description}
              </p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" /> Misiones Disponibles
            </h3>
            {missions.length > 0 ? (
              <div className="space-y-3">
                {missions.map((mission) => (
                  <Card key={mission.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/missions/${mission.id}`)}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm line-clamp-1">{mission.title}</span>
                        <Badge variant="outline" className="text-[10px]">{mission.xp_reward} XP</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {mission.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed text-gray-500 text-sm">
                No hay misiones activas para esta skill en este momento.
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Recursos Relacionados
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-muted-foreground">
               Próximamente: Recursos del DEX vinculados a esta skill.
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}