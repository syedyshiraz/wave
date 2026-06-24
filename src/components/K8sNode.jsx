import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Layers, ShieldAlert, Cpu, Network, Key, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function K8sNode({ id, data }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const removeNode = useWorkflowStore((state) => state.removeNode);

  const { kind, apiVersion, name, replicas, image, ports, serviceType, configKeys } = data;

  const [localName, setLocalName] = useState(name || '');
  const [localReplicas, setLocalReplicas] = useState(replicas !== undefined ? replicas : 1);
  const [localImage, setLocalImage] = useState(image || '');

  useEffect(() => {
    setLocalName(name || '');
  }, [name]);

  useEffect(() => {
    setLocalReplicas(replicas !== undefined ? replicas : 1);
  }, [replicas]);

  useEffect(() => {
    setLocalImage(image || '');
  }, [image]);

  const handleNameBlur = () => {
    const cleanName = localName.trim().replace(/\s+/g, '-');
    if (!cleanName) {
      setLocalName(name);
      return;
    }
    updateNodeData(id, { name: cleanName });
  };

  const handleReplicasBlur = () => {
    const val = parseInt(String(localReplicas), 10);
    updateNodeData(id, { replicas: isNaN(val) ? 1 : val });
  };

  const handleImageBlur = () => {
    updateNodeData(id, { image: localImage });
  };

  const handleServiceTypeChange = (e) => {
    updateNodeData(id, { serviceType: e.target.value });
  };

  // Dynamic layout details depending on kind
  let headerClass = 'bg-[#3f3f46]'; // Default ConfigMap / Secret / Unknown
  let Icon = Cpu;
  let accentColor = '#71717a';

  if (kind === 'Deployment') {
    headerClass = 'bg-[#3c096c]'; // Purple
    Icon = Layers;
    accentColor = '#7b2cbf';
  } else if (kind === 'Service') {
    headerClass = 'bg-[#134e4a]'; // Teal/Green
    Icon = Network;
    accentColor = '#0d9488';
  } else if (kind === 'Ingress') {
    headerClass = 'bg-[#7c2d12]'; // Orange/Red
    Icon = ShieldAlert;
    accentColor = '#ea580c';
  } else if (kind === 'Secret' || kind === 'ConfigMap') {
    headerClass = 'bg-[#27272a]';
    Icon = Key;
    accentColor = '#a1a1aa';
  }

  return (
    <div className="bg-github-card border border-github-border rounded-lg shadow-2xl w-[280px] overflow-hidden text-github-text text-left">
      {/* Header */}
      <div className={`${headerClass} px-3 py-2 border-b border-github-border flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2 flex-1">
          <Icon size={15} className="text-github-textBright animate-pulse" />
          <div className="flex flex-col flex-1">
            <span className="text-[9px] uppercase font-bold text-github-muted leading-none">{kind}</span>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
              className="bg-transparent text-github-textBright font-semibold text-xs border-b border-transparent hover:border-github-border focus:border-github-accent focus:outline-none w-full px-0 py-0.5 leading-none mt-0.5"
            />
          </div>
        </div>
        <button
          onClick={() => removeNode(id)}
          className="text-github-muted hover:text-github-danger transition p-1 hover:bg-[#ffffff15] rounded self-center"
          title="Delete Resource"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-3.5 bg-github-card">
        {kind === 'Deployment' && (
          <>
            {/* Replicas */}
            <div>
              <label className="text-[9px] text-github-muted block font-semibold mb-1 uppercase tracking-wider">Replicas</label>
              <input
                type="number"
                min="0"
                max="100"
                value={localReplicas}
                onChange={(e) => setLocalReplicas(e.target.value)}
                onBlur={handleReplicasBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleReplicasBlur()}
                className="bg-github-bg border border-github-border rounded text-xs text-github-textBright px-2 py-1 w-full focus:border-github-accent focus:outline-none font-mono"
              />
            </div>

            {/* Container Image */}
            <div>
              <label className="text-[9px] text-github-muted block font-semibold mb-1 uppercase tracking-wider">Container Image</label>
              <input
                type="text"
                value={localImage}
                onChange={(e) => setLocalImage(e.target.value)}
                onBlur={handleImageBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleImageBlur()}
                className="bg-github-bg border border-github-border rounded text-xs text-github-textBright px-2 py-1 w-full focus:border-github-accent focus:outline-none font-mono"
              />
            </div>
          </>
        )}

        {kind === 'Service' && (
          <>
            {/* Service Type */}
            <div>
              <label className="text-[9px] text-github-muted block font-semibold mb-1 uppercase tracking-wider">Type</label>
              <select
                value={serviceType}
                onChange={handleServiceTypeChange}
                className="bg-github-bg border border-github-border rounded text-xs text-github-textBright px-2 py-1 w-full focus:border-github-accent focus:outline-none cursor-pointer"
              >
                <option value="ClusterIP">ClusterIP</option>
                <option value="NodePort">NodePort</option>
                <option value="LoadBalancer">LoadBalancer</option>
                <option value="ExternalName">ExternalName</option>
              </select>
            </div>

            {/* Service Ports */}
            {ports.length > 0 && (
              <div>
                <label className="text-[9px] text-github-muted block font-semibold mb-0.5 uppercase tracking-wider">Target Ports</label>
                <div className="flex flex-wrap gap-1">
                  {ports.map((port, idx) => (
                    <span key={idx} className="bg-github-bg border border-github-border px-1.5 py-0.5 rounded text-[10px] font-mono">
                      {port}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {(kind === 'ConfigMap' || kind === 'Secret') && (
          <div>
            <label className="text-[9px] text-github-muted block font-semibold mb-1 uppercase tracking-wider">
              Data Keys ({configKeys.length})
            </label>
            <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto pr-1">
              {configKeys.map((key, idx) => (
                <span key={idx} className="bg-github-bg border border-github-borderMuted px-1.5 py-0.5 rounded text-[10px] font-mono text-[#8892b0]">
                  {key}
                </span>
              ))}
              {configKeys.length === 0 && (
                <span className="text-[10px] text-github-muted italic">Empty data block</span>
              )}
            </div>
          </div>
        )}

        {kind === 'Ingress' && (
          <div>
            <label className="text-[9px] text-github-muted block font-semibold mb-0.5 uppercase tracking-wider">
              Routing Rules
            </label>
            <div className="text-[10px] italic text-[#8892b0] bg-github-bg p-1.5 rounded border border-github-borderMuted">
              Resolving routing links to services automatically.
            </div>
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-in`}
        style={{ background: accentColor, width: '10px', height: '10px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-out`}
        style={{ background: accentColor, width: '10px', height: '10px' }}
      />
    </div>
  );
}
