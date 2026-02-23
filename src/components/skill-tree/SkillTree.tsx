import { useEffect } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Edge,
  MarkerType,
  ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomSkillNode from './CustomSkillNode';
import { useTreeLayout } from './useTreeLayout';
import { Skill, SkillDependency } from '@/types/skills';

const nodeTypes = {
  customSkill: CustomSkillNode,
};

interface SkillTreeProps {
  skills: Skill[];
  dependencies: SkillDependency[];
  onSkillClick: (skill: Skill) => void;
}

export function SkillTree({ skills, dependencies, onSkillClick }: SkillTreeProps) {
  const { getLayoutedElements } = useTreeLayout();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (skills.length === 0) return;

    // 1. Create Nodes
    const initialNodes = skills.map((skill) => ({
      id: skill.id,
      type: 'customSkill',
      data: { ...skill, onNodeClick: onSkillClick },
      position: { x: 0, y: 0 },
    }));

    // 2. Create Edges with dynamic styling
    const initialEdges: Edge[] = dependencies.map((dep) => {
      // Find parent status to determine edge style
      const parent = skills.find(s => s.id === dep.parent_skill_id);
      const isParentUnlocked = parent && parent.status !== 'locked';
      const isParentCompleted = parent && parent.status === 'completed';

      return {
        id: `${dep.parent_skill_id}-${dep.child_skill_id}`,
        source: dep.parent_skill_id,
        target: dep.child_skill_id,
        type: 'smoothstep', // Curvy lines
        animated: isParentUnlocked, // Animate if path is active
        style: { 
           stroke: isParentCompleted ? '#eab308' : (isParentUnlocked ? '#d4e83a' : '#e2e8f0'), 
           strokeWidth: isParentUnlocked ? 3 : 2,
           opacity: isParentUnlocked ? 1 : 0.5
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isParentCompleted ? '#eab308' : (isParentUnlocked ? '#d4e83a' : '#e2e8f0'),
        },
      };
    });

    // 3. Apply Layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      'TB' // Top to Bottom direction
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [skills, dependencies, getLayoutedElements, onSkillClick]);

  return (
    <div className="w-full h-[700px] bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden shadow-inner relative">
      {/* Decorative background overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background gap={24} size={2} color="#e2e8f0" />
        <Controls showInteractive={false} className="bg-white border-gray-200 shadow-sm" />
      </ReactFlow>
    </div>
  );
}