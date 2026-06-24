import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import TriggerNode from './TriggerNode';
import JobNode from './JobNode';
import DockerServiceNode from './DockerServiceNode';
import K8sNode from './K8sNode';

export default function WorkflowCanvas() {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowStore((state) => state.onConnect);

  const { fitView } = useReactFlow();

  // Unique hash tracking positions and counts to fit the viewport smoothly upon structural updates.
  const layoutKey = useMemo(() => {
    return nodes
      .map((n) => `${n.id}:${Math.round(n.position?.x || 0)}:${Math.round(n.position?.y || 0)}`)
      .join(',');
  }, [nodes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ duration: 250, padding: 0.2 });
    }, 80);
    return () => clearTimeout(timer);
  }, [layoutKey, fitView]);

  // Register custom node types
  const nodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      job: JobNode,
      'docker-service': DockerServiceNode,
      'k8s-node': K8sNode,
    }),
    []
  );

  return (
    <div className="w-full h-full bg-github-dark relative select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={1.5}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <Controls position="bottom-left" showInteractive={false} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#30363d"
        />
      </ReactFlow>
    </div>
  );
}
