import { useEffect } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Edge,
  MarkerType
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

    // 2. Create Edges
    const initialEdges: Edge[] = dependencies.map((dep) => ({
      id: `${dep.parent_skill_id}-${dep.child_skill_id}`,
      source: dep.parent_skill_id,
      target: dep.child_skill_id,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#cbd5e1', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#cbd5e1',
      },
    }));

    // 3. Apply Layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [skills, dependencies, getLayoutedElements, onSkillClick]);

  return (
    <div className="w-full h-[600px] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background gap={16} size={1} color="#e2e8f0" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}