import React, { useState } from 'react';
import { Copy, Check, Download, AlertCircle } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

// Keep track of the active object URL to clean it up on subsequent downloads
let activeDownloadUrl = null;

export default function YamlEditor() {
  const yamlText = useWorkflowStore((state) => state.yamlText);
  const parserError = useWorkflowStore((state) => state.parserError);
  const setYamlText = useWorkflowStore((state) => state.setYamlText);
  const activeMode = useWorkflowStore((state) => state.activeMode);

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const getEditorTitle = () => {
    if (activeMode === 'docker-compose') return 'docker-compose.yml';
    if (activeMode === 'kubernetes') return 'kubernetes.yml';
    return '.github/workflows/workflow.yml';
  };

  const getDownloadFilename = () => {
    if (activeMode === 'docker-compose') return 'docker-compose.yml';
    if (activeMode === 'kubernetes') return 'kubernetes.yml';
    return 'workflow.yml';
  };

  const handleDownload = () => {
    const filename = getDownloadFilename();
    
    // Revoke previous URL if any to prevent memory leaks
    if (activeDownloadUrl) {
      URL.revokeObjectURL(activeDownloadUrl);
    }

    const blob = new Blob([yamlText], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    activeDownloadUrl = url;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Defer removal to prevent DOM click race condition
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-l border-github-border">
      {/* Panel Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-[#161b22] border-b border-github-border">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-github-accent animate-pulse"></span>
          <span className="text-sm font-semibold text-github-textBright font-mono">{getEditorTitle()}</span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#21262d] hover:bg-[#30363d] border border-github-border text-github-textBright rounded transition"
            title="Copy to Clipboard"
          >
            {copied ? (
              <>
                <Check size={13} className="text-github-success" />
                <span className="text-github-success">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <textarea
          value={yamlText}
          onChange={(e) => setYamlText(e.target.value)}
          spellCheck="false"
          className="flex-1 w-full bg-[#080c10] text-[#c9d1d9] font-mono text-xs p-4 focus:outline-none resize-none overflow-y-auto leading-relaxed border-0 select-text"
          placeholder="# Paste or type GitHub Actions YAML here..."
        />

        {/* Error Banner */}
        {parserError && (
          <div className="absolute bottom-0 left-0 right-0 m-4 p-3 bg-[#241517] border border-[#f851493f] rounded-md shadow-2xl flex items-start gap-2.5 transition-all duration-300">
            <AlertCircle className="text-github-danger shrink-0 mt-0.5" size={16} />
            <div className="flex-1 text-left">
              <div className="text-xs font-bold text-github-danger uppercase tracking-wider mb-0.5">YAML Lint Warning</div>
              <div className="text-[11px] text-[#f85149ee] font-mono leading-normal break-words max-h-[80px] overflow-y-auto select-text">
                {parserError}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
