import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";
import { SkillNodeData } from '@/types/skills';

const CustomSkillNode = ({ data }: NodeProps<SkillNodeData>) => {
  const isLocked = data.status === 'locked';
  const isCompleted = data.status === 'completed';
  const isAvailable = data.status === 'available';

  return (
    <div 
      className={cn(
        "relative w-[200px] rounded-xl border-2 bg-white shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer group",
        isLocked && "border-gray-200 bg-gray-50 opacity-80 grayscale",
        isAvailable && "border-primary ring-2 ring-primary/20 ring-offset-2",
        isCompleted && "border-green-500 bg-green-50/30"
      )}
      onClick={() => data.onNodeClick(data)}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-300 !w-3 !h-3" />
      
      <div className="p-4 flex flex-col items-center text-center gap-2">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
          isLocked ? "bg-gray-100 border-gray-200 text-gray-400" :
          isCompleted ? "bg-green-100 border-green-200 text-green-600" :
          "bg-primary/10 border-primary/30 text-primary-700"
        )}>
          {isLocked ? <Lock className="w-5 h-5" /> :
           isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
           <Zap className="w-5 h-5" />}
        </div>

        <div className="space-y-1">
          <h3 className={cn(
            "font-bold text-sm leading-tight",
            isLocked ? "text-gray-500" : "text-gray-900"
          )}>
            {data.name}
          </h3>
          
          <div className="text-xs font-medium text-gray-500">
             {data.xp} XP
          </div>
        </div>

        {isAvailable && (
          <Badge variant="outline" className="mt-1 bg-primary/10 text-primary-700 border-primary/20 text-[10px] animate-pulse">
            Disponible
          </Badge>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-300 !w-3 !h-3" />
    </div>
  );
};

export default memo(CustomSkillNode);