import React, { useState, useEffect } from 'react';
import { GitFork, Plus, LayoutGrid } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { getLayoutedElements } from '../utils/layout';

export default function Header() {
  const name = useWorkflowStore((state) => state.name);
  const updateName = useWorkflowStore((state) => state.updateName);
  const addNode = useWorkflowStore((state) => state.addNode);
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const setGraph = useWorkflowStore((state) => state.setGraph);
  const yamlText = useWorkflowStore((state) => state.yamlText);
  const activeMode = useWorkflowStore((state) => state.activeMode);
  const setMode = useWorkflowStore((state) => state.setMode);

  const [localName, setLocalName] = useState(name);

  useEffect(() => {
    setLocalName(name);
  }, [name]);

  const handleNameBlur = () => {
    const cleanName = localName.trim();
    if (!cleanName) {
      setLocalName(name);
      return;
    }
    updateName(cleanName);
  };

  const handleAutoLayout = () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setGraph(layoutedNodes, layoutedEdges, yamlText);
  };

  const getAddButtonText = () => {
    if (activeMode === 'github-actions') return 'Add Job';
    if (activeMode === 'docker-compose') return 'Add Service';
    if (activeMode === 'kubernetes') return 'Add Deploy';
    return 'Add Node';
  };

  return (
    <header className="bg-[#161b22] border-b border-github-border flex items-center justify-between px-6 py-3 h-[60px] text-github-text select-none">
      {/* Brand & Name */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <div className="bg-github-accent/15 p-1.5 rounded-lg border border-github-accent/30 text-github-accent">
            <GitFork size={18} />
          </div>
          <span className="font-bold text-sm tracking-wider text-github-textBright font-mono">WAVE</span>
        </div>

        {/* Vertical divider */}
        <div className="w-[1px] h-5 bg-github-border"></div>

        {/* Editable Workflow Name */}
        <div className="flex items-center gap-1 max-w-[250px]">
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
            placeholder="Workflow Name"
            className="bg-transparent text-xs text-github-text font-medium border-b border-transparent hover:border-github-border focus:border-github-accent focus:outline-none w-full px-1 py-0.5"
            title="Edit Workflow Name"
          />
        </div>
      </div>

      {/* Switcher & Actions */}
      <div className="flex items-center gap-4">
        {/* Mode Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-github-muted tracking-wider">Engine:</span>
          <select
            value={activeMode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-github-bg border border-github-border text-xs text-github-textBright px-2 py-1 rounded focus:border-github-accent focus:outline-none cursor-pointer font-medium"
          >
            <option value="github-actions">GitHub Actions</option>
            <option value="docker-compose">Docker Compose</option>
            <option value="kubernetes">Kubernetes</option>
          </select>
        </div>

        <button
          onClick={handleAutoLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#21262d] hover:bg-[#30363d] border border-github-border text-github-textBright rounded-md transition"
          title="Recalculate layout using Dagre"
        >
          <LayoutGrid size={13} />
          <span>Auto Layout</span>
        </button>

        <button
          onClick={addNode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-github-success hover:bg-github-successAccent text-white border border-[#2ea44f] rounded-md transition"
          title="Add a resource/node"
        >
          <Plus size={13} />
          <span>{getAddButtonText()}</span>
        </button>
      </div>
    </header>
  );
}
