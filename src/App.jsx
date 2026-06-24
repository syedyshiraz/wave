import React, { useEffect } from 'react';
import Header from './components/Header';
import WorkflowCanvas from './components/WorkflowCanvas';
import YamlEditor from './components/YamlEditor';
import { useWorkflowStore } from './store/useWorkflowStore';
import { ReactFlowProvider } from '@xyflow/react';

export default function App() {
  const initYaml = useWorkflowStore((state) => state.initYaml);

  useEffect(() => {
    initYaml();
  }, [initYaml]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[#010409]">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        {/* Canvas visualizer */}
        <div className="flex-1 h-full relative">
          <ReactFlowProvider>
            <WorkflowCanvas />
          </ReactFlowProvider>
        </div>
        {/* YAML code pane */}
        <div className="w-[380px] lg:w-[450px] xl:w-[500px] h-full shrink-0">
          <YamlEditor />
        </div>
      </main>
    </div>
  );
}
