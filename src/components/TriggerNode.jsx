import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, GitPullRequest, Calendar } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function TriggerNode({ data }) {
  const triggers = data.triggers || { push: false, pull_request: false, schedule: false };
  const updateTriggers = useWorkflowStore((state) => state.updateTriggers);

  const handleToggle = (key) => {
    const nextTriggers = {
      ...triggers,
      [key]: !triggers[key],
    };
    updateTriggers(nextTriggers);
  };

  return (
    <div className="bg-github-card border border-github-border rounded-lg shadow-xl w-[240px] overflow-hidden text-github-text">
      {/* Header */}
      <div className="bg-github-bg px-3 py-2 border-b border-github-border flex items-center gap-2">
        <Play size={15} className="text-github-success" />
        <span className="font-semibold text-xs text-github-textBright">on: (Workflow Triggers)</span>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2 bg-github-card">
        {/* push */}
        <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-github-borderMuted p-1.5 rounded transition">
          <div className="flex items-center gap-2">
            <Play size={13} className="rotate-90 text-github-success" />
            <span>push</span>
          </div>
          <input
            type="checkbox"
            checked={!!triggers.push}
            onChange={() => handleToggle('push')}
            className="w-3.5 h-3.5 accent-github-success cursor-pointer rounded border-github-border"
          />
        </label>

        {/* pull_request */}
        <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-github-borderMuted p-1.5 rounded transition">
          <div className="flex items-center gap-2">
            <GitPullRequest size={13} className="text-[#a371f7]" />
            <span>pull_request</span>
          </div>
          <input
            type="checkbox"
            checked={!!triggers.pull_request}
            onChange={() => handleToggle('pull_request')}
            className="w-3.5 h-3.5 accent-[#a371f7] cursor-pointer rounded border-github-border"
          />
        </label>

        {/* schedule */}
        <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-github-borderMuted p-1.5 rounded transition">
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-github-warning" />
            <span>schedule (cron)</span>
          </div>
          <input
            type="checkbox"
            checked={!!triggers.schedule}
            onChange={() => handleToggle('schedule')}
            className="w-3.5 h-3.5 accent-github-warning cursor-pointer rounded border-github-border"
          />
        </label>
      </div>

      {/* Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="trigger-out"
        style={{ background: '#58a6ff', width: '10px', height: '10px' }}
      />
    </div>
  );
}
