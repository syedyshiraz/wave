import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Terminal, Trash2, Plus, ArrowUp, ArrowDown, Settings, Code, Layers } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function JobNode({ id, data }) {
  const updateJob = useWorkflowStore((state) => state.updateJob);
  const removeNode = useWorkflowStore((state) => state.removeNode);

  // Local state to avoid losing focus during keystrokes
  const [localJobId, setLocalJobId] = useState(data.id || id);
  const [localRunsOn, setLocalRunsOn] = useState(data.runsOn || 'ubuntu-latest');

  useEffect(() => {
    setLocalJobId(data.id || id);
  }, [data.id, id]);

  useEffect(() => {
    setLocalRunsOn(data.runsOn || 'ubuntu-latest');
  }, [data.runsOn]);

  const handleIdBlur = () => {
    const cleanId = localJobId.trim().replace(/\s+/g, '-');
    if (!cleanId) {
      setLocalJobId(data.id);
      return;
    }
    updateJob(id, { id: cleanId });
  };

  const handleRunsOnBlur = () => {
    updateJob(id, { runsOn: localRunsOn });
  };

  const handleStepChange = (stepIndex, field, value) => {
    const updatedSteps = [...(data.steps || [])];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      [field]: value,
    };
    // Ensure if we set "run", we remove "uses" and vice-versa
    if (field === 'run') {
      delete updatedSteps[stepIndex].uses;
    } else if (field === 'uses') {
      delete updatedSteps[stepIndex].run;
    }
    updateJob(id, { steps: updatedSteps });
  };

  const addStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      name: 'New step',
      run: 'echo "Hello"',
    };
    updateJob(id, { steps: [...(data.steps || []), newStep] });
  };

  const deleteStep = (stepIndex) => {
    const updatedSteps = (data.steps || []).filter((_, idx) => idx !== stepIndex);
    updateJob(id, { steps: updatedSteps });
  };

  const moveStep = (stepIndex, direction) => {
    const steps = [...(data.steps || [])];
    if (direction === 'up' && stepIndex > 0) {
      const temp = steps[stepIndex];
      steps[stepIndex] = steps[stepIndex - 1];
      steps[stepIndex - 1] = temp;
    } else if (direction === 'down' && stepIndex < steps.length - 1) {
      const temp = steps[stepIndex];
      steps[stepIndex] = steps[stepIndex + 1];
      steps[stepIndex + 1] = temp;
    }
    updateJob(id, { steps });
  };

  const steps = data.steps || [];

  return (
    <div className="bg-github-card border border-github-border rounded-lg shadow-2xl w-[320px] overflow-hidden text-github-text text-left">
      {/* Header */}
      <div className="bg-github-bg px-3 py-2 border-b border-github-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Terminal size={15} className="text-github-accent" />
          <input
            type="text"
            value={localJobId}
            onChange={(e) => setLocalJobId(e.target.value)}
            onBlur={handleIdBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleIdBlur()}
            placeholder="job-id"
            className="bg-transparent text-github-textBright font-semibold text-xs border-b border-transparent hover:border-github-border focus:border-github-accent focus:outline-none w-full px-1"
          />
        </div>
        <button
          onClick={() => removeNode(id)}
          className="text-github-muted hover:text-github-danger transition p-1 hover:bg-github-borderMuted rounded"
          title="Delete Job"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-3 bg-github-card max-h-[350px] overflow-y-auto">
        {/* Environment Setting */}
        <div>
          <label className="text-[10px] text-github-muted block font-semibold mb-1 uppercase tracking-wider">Runs On</label>
          <input
            type="text"
            value={localRunsOn}
            onChange={(e) => setLocalRunsOn(e.target.value)}
            onBlur={handleRunsOnBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleRunsOnBlur()}
            placeholder="ubuntu-latest"
            className="bg-github-bg border border-github-border rounded text-xs text-github-textBright px-2 py-1 w-full focus:border-github-accent focus:outline-none"
          />
        </div>

        {/* Steps List */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[10px] text-github-muted font-semibold uppercase tracking-wider">Steps ({steps.length})</label>
            <button
              onClick={addStep}
              className="text-[10px] bg-[#21262d] hover:bg-[#30363d] border border-github-border text-github-textBright px-2 py-0.5 rounded flex items-center gap-1 transition"
            >
              <Plus size={10} /> Add Step
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {steps.map((step, idx) => {
              const isUses = 'uses' in step;
              return (
                <div key={step.id || idx} className="bg-github-bg border border-github-borderMuted rounded p-2 flex flex-col gap-1.5 relative group">
                  {/* Step Title / Name */}
                  <div className="flex items-center justify-between gap-1">
                    <input
                      type="text"
                      value={step.name || ''}
                      onChange={(e) => handleStepChange(idx, 'name', e.target.value)}
                      placeholder="Step Name"
                      className="bg-transparent text-xs text-github-textBright font-medium border-b border-transparent hover:border-github-borderMuted focus:border-github-accent focus:outline-none w-[70%]"
                    />
                    
                    {/* Control buttons */}
                    <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition">
                      <button
                        onClick={() => moveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-0.5 hover:bg-github-border rounded disabled:opacity-20 text-github-text"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        onClick={() => moveStep(idx, 'down')}
                        disabled={idx === steps.length - 1}
                        className="p-0.5 hover:bg-github-border rounded disabled:opacity-20 text-github-text"
                      >
                        <ArrowDown size={11} />
                      </button>
                      <button
                        onClick={() => deleteStep(idx)}
                        className="p-0.5 hover:bg-github-border rounded text-github-danger"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Step Action (Run / Uses toggle and Input) */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <button
                      onClick={() => {
                        if (isUses) {
                          handleStepChange(idx, 'run', 'echo "Hello"');
                        } else {
                          handleStepChange(idx, 'uses', 'actions/checkout@v4');
                        }
                      }}
                      className={`text-[9px] px-1 py-0.5 rounded font-mono border ${
                        isUses 
                          ? 'bg-[#1f6feb22] text-github-accent border-[#1f6feb44]' 
                          : 'bg-[#2ea44f22] text-github-successAccent border-[#2ea44f44]'
                      }`}
                      title={isUses ? "Switched to USES. Click to switch to RUN." : "Switched to RUN. Click to switch to USES."}
                    >
                      {isUses ? 'uses' : 'run'}
                    </button>
                    <input
                      type="text"
                      value={isUses ? (step.uses || '') : (step.run || '')}
                      onChange={(e) => handleStepChange(idx, isUses ? 'uses' : 'run', e.target.value)}
                      placeholder={isUses ? "actions/checkout@v4" : "npm run build"}
                      className="bg-[#010409] text-[10px] text-github-text font-mono border border-github-borderMuted rounded px-1.5 py-0.5 w-full focus:border-github-accent focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}

            {steps.length === 0 && (
              <div className="text-[10px] text-github-muted italic text-center py-2 border border-dashed border-github-border rounded">
                No steps defined. Workflow requires at least one step.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-in`}
        style={{ background: '#8b949e', width: '10px', height: '10px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-out`}
        style={{ background: '#8b949e', width: '10px', height: '10px' }}
      />
    </div>
  );
}
