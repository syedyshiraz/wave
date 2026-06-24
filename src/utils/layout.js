import dagre from 'dagre';

// Resolves issues where bundlers/test runner environments warp the default CJS export.
const dagreEngine = dagre.default || dagre;

/**
 * Automatically calculates visual node coordinates using the dagre DAG engine.
 * Supports both vertical (TB) and horizontal (LR) layouts.
 */
export function getLayoutedElements(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagreEngine.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ 
    rankdir: direction, 
    nodesep: 80, // Horizontal space between siblings
    ranksep: 110, // Vertical space between levels
  });

  nodes.forEach((node) => {
    // Assign sizes dynamically for Dagre calculation
    let width = 280;
    let height = 140;

    if (node.type === 'trigger') {
      width = 220;
      height = 90;
    } else if (node.type === 'job') {
      const stepsCount = node.data?.steps?.length || 0;
      height = 150 + (stepsCount * 44);
    } else if (node.type === 'docker-service') {
      width = 300;
      height = 205;
    } else if (node.type === 'k8s-node') {
      width = 280;
      if (node.data?.kind === 'Deployment') {
        height = 175;
      } else if (node.data?.kind === 'Service') {
        height = 130 + (node.data?.ports?.length || 0) * 15;
      } else if (node.data?.kind === 'ConfigMap' || node.data?.kind === 'Secret') {
        height = 110 + Math.min(5, node.data?.configKeys?.length || 0) * 20;
      } else {
        height = 120;
      }
    }

    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagreEngine.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    let width = 280;
    let height = 140;
    if (node.type === 'trigger') {
      width = 220;
      height = 90;
    } else if (node.type === 'job') {
      const stepsCount = node.data?.steps?.length || 0;
      height = 150 + (stepsCount * 44);
    } else if (node.type === 'docker-service') {
      width = 300;
      height = 205;
    } else if (node.type === 'k8s-node') {
      width = 280;
      if (node.data?.kind === 'Deployment') {
        height = 175;
      } else if (node.data?.kind === 'Service') {
        height = 130 + (node.data?.ports?.length || 0) * 15;
      } else if (node.data?.kind === 'ConfigMap' || node.data?.kind === 'Secret') {
        height = 110 + Math.min(5, node.data?.configKeys?.length || 0) * 20;
      } else {
        height = 120;
      }
    }

    // Offset position to convert from center-anchored (dagre) to top-left (xyflow)
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
}
