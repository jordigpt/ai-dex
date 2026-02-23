import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { Lock, Check, Zap, Star } from 'lucide-react';
import { cn } from "@/lib/utils";
import { SkillNodeData } from '@/types/skills';
import { Progress } from "@/components/ui/progress";

const CustomSkillNode = ({ data }: NodeProps<SkillNodeData>) => {
  const isLocked = data.status === 'locked';
  const isCompleted = data.status === 'completed'; // XP > threshold (e.g. 500)
  const isAvailable = data.status === 'available';

  // Calculate generic level based on XP (simplified logic for UI)
  const level = Math.floor(data.xp / 100) + 1;
  const progressToNext = (data.xp % 100); 

  return (
    <div 
      className={cn(
        "relative w-[220px] rounded-xl border transition-all duration-500 cursor-pointer group overflow-hidden",
        // Styles based on status
        isLocked && "bg-gray-100 border-gray-200 opacity-70 grayscale hover:grayscale-0",
        isAvailable && "bg-white border-primary/50 shadow-sm hover:shadow-md hover:border-primary hover:scale-105",
        isCompleted && "bg-gradient-to-br from-white to-yellow-50 border-yellow-400 shadow-md ring-1 ring-yellow-200"
      )}
      onClick={() => data.onNodeClick(data)}
    >
      {/* Handles hidden but functional */}
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-1 !h-1" />
      
      {/* Top Banner / Status Indicator */}
      <div className={cn(
        "h-1.5 w-full absolute top-0 left-0",
        isLocked && "bg-gray-300",
        isAvailable && "bg-primary animate-pulse",
        isCompleted && "bg-yellow-400"
      )} />

      <div className="p-4 flex flex-col gap-3">
        {/* Header: Icon + Name */}
        <div className="flex items-start justify-between gap-2">
           <div className={cn(
             "w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm shrink-0 transition-colors",
             isLocked ? "bg-gray-200 border-gray-300 text-gray-500" :
             isCompleted ? "bg-yellow-100 border-yellow-300 text-yellow-600" :
             "bg-primary/10 border-primary/20 text-primary-700"
           )}>
             {isLocked ? <Lock className="w-5 h-5" /> :
              isCompleted ? <Star className="w-5 h-5 fill-yellow-600" /> :
              <Zap className="w-5 h-5" />}
           </div>
           
           <div className="flex-1 text-right">
              {isAvailable && !isCompleted && (
                 <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-primary/5 border-primary/30 text-primary-700">
                    Lvl {level}
                 </Badge>
              )}
              {isCompleted && (
                 <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-yellow-100 border-yellow-300 text-yellow-700">
                    Master
                 </Badge>
              )}
           </div>
        </div>

        {/* Content */}
        <div className="space-y-1">
           <h3 className={cn(
             "font-bold text-sm leading-tight line-clamp-2",
             isLocked ? "text-gray-500" : "text-gray-900"
           )}>
             {data.name}
           </h3>
           <p className="text-[10px] text-muted-foreground line-clamp-1">
              {data.category || "General"}
           </p>
        </div>

        {/* Progress Bar (Only if unlocked) */}
        {!isLocked && (
          <div className="space-y-1">
             <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                <span>XP</span>
                <span>{data.xp}</span>
             </div>
             <Progress value={Math.min(100, isCompleted ? 100 : progressToNext)} className="h-1.5 bg-gray-100" />
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-1 !h-1" />
    </div>
  );
};

export default memo(CustomSkillNode);