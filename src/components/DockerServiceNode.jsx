import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Container, Trash2, ShieldAlert } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function DockerServiceNode({ id, data }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const removeNode = useWorkflowStore((state) => state.removeNode);

  const [localId, setLocalId] = useState(data.id || id);
  const [localImage, setLocalImage] = useState(data.image || 'nginx:alpine');
  const [localPorts, setLocalPorts] = useState((data.ports || []).join(', '));
  const [localVolumes, setLocalVolumes] = useState((data.volumes || []).join(', '));

  useEffect(() => {
    setLocalId(data.id || id);
  }, [data.id, id]);

  useEffect(() => {
    setLocalImage(data.image || 'nginx:alpine');
  }, [data.image]);

  useEffect(() => {
    setLocalPorts((data.ports || []).join(', '));
  }, [data.ports]);

  useEffect(() => {
    setLocalVolumes((data.volumes || []).join(', '));
  }, [data.volumes]);

  const handleIdBlur = () => {
    const cleanId = localId.trim().replace(/\s+/g, '-');
    if (!cleanId) {
      setLocalId(data.id);
      return;
    }
    updateNodeData(id, { id: cleanId });
  };

  const handleImageBlur = () => {
    updateNodeData(id, { image: localImage });
  };

  const handlePortsBlur = () => {
    const portsArr = localPorts
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);
    updateNodeData(id, { ports: portsArr });
  };

  const handleVolumesBlur = () => {
    const volsArr = localVolumes
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    updateNodeData(id, { volumes: volsArr });
  };

  return (
    <div className="bg-github-card border border-github-border rounded-lg shadow-2xl w-[300px] overflow-hidden text-github-text text-left">
      {/* Header */}
      <div className="bg-[#1f3557] px-3 py-2 border-b border-github-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Container size={15} className="text-github-accent animate-pulse" />
          <input
            type="text"
            value={localId}
            onChange={(e) => setLocalId(e.target.value)}
            onBlur={handleIdBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleIdBlur()}
            className="bg-transparent text-github-textBright font-semibold text-xs border-b border-transparent hover:border-github-border focus:border-github-accent focus:outline-none w-full px-1"
          />
        </div>
        <button
          onClick={() => removeNode(id)}
          className="text-github-muted hover:text-github-danger transition p-1 hover:bg-github-borderMuted rounded"
          title="Delete Service"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-3 bg-github-card">
        {/* Image */}
        <div>
          <label className="text-[10px] text-github-muted block font-semibold mb-1 uppercase tracking-wider">Image</label>
          <input
            type="text"
            value={localImage}
            onChange={(e) => setLocalImage(e.target.value)}
            onBlur={handleImageBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleImageBlur()}
            className="bg-github-bg border border-github-border rounded text-xs text-github-textBright px-2 py-1 w-full focus:border-github-accent focus:outline-none font-mono"
          />
        </div>

        {/* Exposed Ports */}
        <div>
          <label className="text-[10px] text-github-muted block font-semibold mb-1 uppercase tracking-wider">Ports (comma-separated)</label>
          <input
            type="text"
            value={localPorts}
            onChange={(e) => setLocalPorts(e.target.value)}
            onBlur={handlePortsBlur}
            onKeyDown={(e) => e.key === 'Enter' && handlePortsBlur()}
            placeholder="e.g. 80:80, 443:443"
            className="bg-github-bg border border-github-border rounded text-xs text-github-textBright px-2 py-1 w-full focus:border-github-accent focus:outline-none font-mono"
          />
        </div>

        {/* Volume Mounts */}
        <div>
          <label className="text-[10px] text-github-muted block font-semibold mb-1 uppercase tracking-wider">Volumes (comma-separated)</label>
          <input
            type="text"
            value={localVolumes}
            onChange={(e) => setLocalVolumes(e.target.value)}
            onBlur={handleVolumesBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleVolumesBlur()}
            placeholder="e.g. ./data:/var/lib"
            className="bg-github-bg border border-github-border rounded text-xs text-[#8892b0] px-2 py-1 w-full focus:border-github-accent focus:outline-none font-mono text-[10px]"
          />
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-in`}
        style={{ background: '#58a6ff', width: '10px', height: '10px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-out`}
        style={{ background: '#58a6ff', width: '10px', height: '10px' }}
      />
    </div>
  );
}
