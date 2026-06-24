import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { yamlToJson, jsonToYaml } from '../utils/yamlParser';
import { getLayoutedElements } from '../utils/layout';
import { DEFAULT_TEMPLATES } from '../utils/templates';

const INITIAL_TRIGGERS = {
  push: true,
  pull_request: false,
  schedule: false,
};

const INITIAL_NODES = [
  {
    id: 'trigger',
    type: 'trigger',
    position: { x: 100, y: 50 },
    data: { triggers: INITIAL_TRIGGERS },
  },
  {
    id: 'build',
    type: 'job',
    position: { x: 70, y: 220 },
    data: {
      id: 'build',
      runsOn: 'ubuntu-latest',
      steps: [
        { id: 'step-1', name: 'Checkout code', uses: 'actions/checkout@v4' },
        { id: 'step-2', name: 'Install dependencies', run: 'npm install' },
        { id: 'step-3', name: 'Run build', run: 'npm run build' },
      ],
    },
  },
];

const INITIAL_EDGES = [
  {
    id: 'trigger-build',
    source: 'trigger',
    target: 'build',
    animated: true,
    style: { stroke: '#58a6ff' },
  },
];

// Helper to construct a YAML string from current store properties depending on activeMode
function serializeStoreState(name, triggers, nodes, edges, metadata, activeMode) {
  if (activeMode === 'github-actions') {
    const jobNodes = nodes.filter(n => n.type === 'job');
    const jobs = jobNodes.map(node => {
      const jobId = node.data.id || node.id;
      const incomingEdges = edges.filter(e => e.target === node.id && e.source !== 'trigger');
      const needs = incomingEdges.map(e => {
        const sourceNode = nodes.find(n => n.id === e.source);
        return sourceNode?.data?.id || e.source;
      });
      return {
        id: jobId,
        runsOn: node.data.runsOn || 'ubuntu-latest',
        needs,
        steps: node.data.steps || [],
        metadata: node.data.metadata || {},
      };
    });
    return jsonToYaml({ name, triggers, jobs, metadata }, 'github-actions');

  } else if (activeMode === 'docker-compose') {
    const serviceNodes = nodes.filter(n => n.type === 'docker-service');
    const services = serviceNodes.map(node => {
      const serviceId = node.data.id || node.id;
      const incomingEdges = edges.filter(e => e.target === node.id);
      const depends_on = incomingEdges.map(e => {
        const sourceNode = nodes.find(n => n.id === e.source);
        return sourceNode?.data?.id || e.source;
      });
      return {
        id: serviceId,
        image: node.data.image || 'ubuntu:latest',
        ports: node.data.ports || [],
        volumes: node.data.volumes || [],
        depends_on,
        metadata: node.data.metadata || {},
      };
    });
    return jsonToYaml({ version: '3.8', services, metadata }, 'docker-compose');

  } else if (activeMode === 'kubernetes') {
    const k8sNodes = nodes.filter(n => n.type === 'k8s-node');
    const resources = k8sNodes.map(node => {
      // Map node changes back to the original documents structure
      return {
        ...node.data,
        name: node.data.name,
        replicas: node.data.replicas,
        image: node.data.image,
        serviceType: node.data.serviceType,
      };
    });
    return jsonToYaml({ resources }, 'kubernetes');
  }
  return '';
}

export const useWorkflowStore = create((set, get) => ({
  name: 'WAVE Workflow',
  activeMode: 'github-actions', // github-actions, docker-compose, kubernetes
  triggers: INITIAL_TRIGGERS,
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  metadata: {},
  parserError: null,
  yamlText: '',

  initYaml: () => {
    const { name, triggers, nodes, edges, metadata, activeMode } = get();
    const yamlStr = serializeStoreState(name, triggers, nodes, edges, metadata, activeMode);
    set({ yamlText: yamlStr });
  },

  setMode: (mode) => {
    set({ activeMode: mode, parserError: null });
    const defaultTemplate = DEFAULT_TEMPLATES[mode] || '';
    get().setYamlText(defaultTemplate);
  },

  updateTriggers: (newTriggers) => {
    set((state) => {
      const updatedNodes = state.nodes.map(node => {
        if (node.id === 'trigger') {
          return { ...node, data: { ...node.data, triggers: newTriggers } };
        }
        return node;
      });

      const yamlStr = serializeStoreState(state.name, newTriggers, updatedNodes, state.edges, state.metadata, state.activeMode);
      return {
        triggers: newTriggers,
        nodes: updatedNodes,
        yamlText: yamlStr,
        parserError: null,
      };
    });
  },

  updateName: (newName) => {
    set((state) => {
      const yamlStr = serializeStoreState(newName, state.triggers, state.nodes, state.edges, state.metadata, state.activeMode);
      return {
        name: newName,
        yamlText: yamlStr,
        parserError: null,
      };
    });
  },

  addNode: () => {
    const { activeMode } = get();

    set((state) => {
      let newNodes = [...state.nodes];
      let newEdges = [...state.edges];

      if (activeMode === 'github-actions') {
        let counter = 1;
        let newJobId = `job_${counter}`;
        while (state.nodes.some(n => n.id === newJobId)) {
          counter++;
          newJobId = `job_${counter}`;
        }
        const newJobNode = {
          id: newJobId,
          type: 'job',
          position: { x: 150, y: 300 },
          data: {
            id: newJobId,
            runsOn: 'ubuntu-latest',
            steps: [{ id: 'step-1', name: 'Hello World', run: 'echo "Hello"' }],
          },
        };
        newNodes.push(newJobNode);
        newEdges.push({
          id: `trigger-${newJobId}`,
          source: 'trigger',
          target: newJobId,
          animated: true,
          style: { stroke: '#58a6ff' },
        });

      } else if (activeMode === 'docker-compose') {
        let counter = 1;
        let newSvcId = `service_${counter}`;
        while (state.nodes.some(n => n.id === newSvcId)) {
          counter++;
          newSvcId = `service_${counter}`;
        }
        const newSvcNode = {
          id: newSvcId,
          type: 'docker-service',
          position: { x: 150, y: 300 },
          data: {
            id: newSvcId,
            image: 'nginx:alpine',
            ports: [],
            volumes: [],
            depends_on: [],
          },
        };
        newNodes.push(newSvcNode);

      } else if (activeMode === 'kubernetes') {
        let counter = 1;
        let newK8sName = `deploy-${counter}`;
        while (state.nodes.some(n => n.id === `deployment-${newK8sName}`)) {
          counter++;
          newK8sName = `deploy-${counter}`;
        }
        
        // Boilerplate deployment structure
        const deployDoc = {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: { name: newK8sName },
          spec: {
            replicas: 1,
            selector: { matchLabels: { app: newK8sName } },
            template: {
              metadata: { labels: { app: newK8sName } },
              spec: {
                containers: [{ name: 'nginx', image: 'nginx:alpine', ports: [{ containerPort: 80 }] }]
              }
            }
          }
        };

        const newK8sNode = {
          id: `deployment-${newK8sName}`,
          type: 'k8s-node',
          position: { x: 150, y: 300 },
          data: {
            id: `deployment-${newK8sName}`,
            kind: 'Deployment',
            apiVersion: 'apps/v1',
            name: newK8sName,
            replicas: 1,
            selector: { app: newK8sName },
            labels: { app: newK8sName },
            image: 'nginx:alpine',
            ports: [80],
            rawDoc: deployDoc,
          },
        };
        newNodes.push(newK8sNode);
      }

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
      const yamlStr = serializeStoreState(state.name, state.triggers, layoutedNodes, layoutedEdges, state.metadata, state.activeMode);

      return {
        nodes: layoutedNodes,
        edges: layoutedEdges,
        yamlText: yamlStr,
        parserError: null,
      };
    });
  },

  // Legacy wrapper mapping to updateNodeData
  updateJob: (nodeId, updatedData) => {
    get().updateNodeData(nodeId, updatedData);
  },

  updateNodeData: (nodeId, updatedData) => {
    set((state) => {
      const oldNode = state.nodes.find(n => n.id === nodeId);
      if (!oldNode) return {};

      let updatedNodes = state.nodes;
      let updatedEdges = state.edges;

      // Handle ID renaming updates
      const oldId = nodeId;
      const newId = updatedData.id || updatedData.name;
      
      let nextNodeId = oldId;

      if (newId && oldId !== newId && state.activeMode !== 'kubernetes') {
        // Enforce uniqueness
        if (state.nodes.some(n => n.id === newId)) {
          if (updatedData.id) updatedData.id = oldId;
          if (updatedData.name) updatedData.name = oldId;
        } else {
          nextNodeId = newId;
          updatedNodes = state.nodes.map(node => {
            if (node.id === oldId) {
              return {
                ...node,
                id: newId,
                data: { ...node.data, ...updatedData },
              };
            }
            return node;
          });

          updatedEdges = state.edges.map(edge => {
            let nextEdge = { ...edge };
            if (edge.source === oldId) {
              nextEdge.source = newId;
              nextEdge.id = edge.id.replace(oldId, newId);
            }
            if (edge.target === oldId) {
              nextEdge.target = newId;
              nextEdge.id = edge.id.replace(oldId, newId);
            }
            return nextEdge;
          });
        }
      } else {
        // Simple data property update
        updatedNodes = state.nodes.map(node => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, ...updatedData },
            };
          }
          return node;
        });
      }

      const yamlStr = serializeStoreState(state.name, state.triggers, updatedNodes, updatedEdges, state.metadata, state.activeMode);
      return {
        nodes: updatedNodes,
        edges: updatedEdges,
        yamlText: yamlStr,
        parserError: null,
      };
    });
  },

  removeNode: (nodeId) => {
    if (nodeId === 'trigger') return;

    set((state) => {
      const updatedNodes = state.nodes.filter(n => n.id !== nodeId);
      const updatedEdges = state.edges.filter(e => e.source !== nodeId && e.target !== nodeId);

      const yamlStr = serializeStoreState(state.name, state.triggers, updatedNodes, updatedEdges, state.metadata, state.activeMode);
      return {
        nodes: updatedNodes,
        edges: updatedEdges,
        yamlText: yamlStr,
        parserError: null,
      };
    });
  },

  onNodesChange: (changes) => {
    set((state) => {
      const updatedNodes = applyNodeChanges(changes, state.nodes);
      const hasStructuralChanges = changes.some(
        c => c.type === 'remove' || c.type === 'reset' || c.type === 'add'
      );

      let yamlStr = state.yamlText;
      if (hasStructuralChanges) {
        const deletedNodeIds = changes.filter(c => c.type === 'remove').map(c => c.id);
        let nextEdges = state.edges;
        if (deletedNodeIds.length > 0) {
          nextEdges = state.edges.filter(
            e => !deletedNodeIds.includes(e.source) && !deletedNodeIds.includes(e.target)
          );
        }
        yamlStr = serializeStoreState(state.name, state.triggers, updatedNodes, nextEdges, state.metadata, state.activeMode);
        return {
          nodes: updatedNodes,
          edges: nextEdges,
          yamlText: yamlStr,
          parserError: null,
        };
      }

      return { nodes: updatedNodes };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => {
      const updatedEdges = applyEdgeChanges(changes, state.edges);
      const hasStructuralChanges = changes.some(c => c.type === 'remove');
      let yamlStr = state.yamlText;
      
      if (hasStructuralChanges && state.activeMode === 'github-actions') {
        let nextEdges = [...updatedEdges];
        const jobNodes = state.nodes.filter(n => n.type === 'job');
        jobNodes.forEach(job => {
          const incoming = nextEdges.filter(e => e.target === job.id);
          if (incoming.length === 0) {
            nextEdges.push({
              id: `trigger-${job.id}`,
              source: 'trigger',
              target: job.id,
              animated: true,
              style: { stroke: '#58a6ff' },
            });
          }
        });

        yamlStr = serializeStoreState(state.name, state.triggers, state.nodes, nextEdges, state.metadata, state.activeMode);
        return {
          edges: nextEdges,
          yamlText: yamlStr,
          parserError: null,
        };
      }

      // Re-serialize edge removals for docker-compose dependencies
      if (hasStructuralChanges && state.activeMode === 'docker-compose') {
        yamlStr = serializeStoreState(state.name, state.triggers, state.nodes, updatedEdges, state.metadata, state.activeMode);
        return {
          edges: updatedEdges,
          yamlText: yamlStr,
          parserError: null,
        };
      }

      return { edges: updatedEdges };
    });
  },

  onConnect: (connection) => {
    set((state) => {
      const edgeParams = {
        ...connection,
        animated: true,
        style: connection.source === 'trigger' 
          ? { stroke: '#58a6ff' } 
          : { stroke: '#8b949e', strokeDasharray: '5,5' },
      };

      let updatedEdges = addEdge(edgeParams, state.edges);

      if (state.activeMode === 'github-actions') {
        if (connection.source !== 'trigger' && connection.target !== 'trigger') {
          updatedEdges = updatedEdges.filter(
            e => !(e.source === 'trigger' && e.target === connection.target)
          );
        }
      }

      const yamlStr = serializeStoreState(state.name, state.triggers, state.nodes, updatedEdges, state.metadata, state.activeMode);
      return {
        edges: updatedEdges,
        yamlText: yamlStr,
        parserError: null,
      };
    });
  },

  setGraph: (nodes, edges, yamlText) => {
    set({
      nodes,
      edges,
      yamlText,
      parserError: null,
    });
  },

  setYamlText: (yamlText) => {
    set({ yamlText });
    try {
      if (!yamlText || yamlText.trim() === '') {
        set({ parserError: 'YAML is empty' });
        return;
      }

      const activeMode = get().activeMode;
      const parsed = yamlToJson(yamlText, activeMode);
      
      const newNodes = [];
      const newEdges = [];

      if (activeMode === 'github-actions') {
        const { name, triggers, jobs, metadata } = parsed;

        newNodes.push({
          id: 'trigger',
          type: 'trigger',
          position: { x: 100, y: 50 },
          data: { triggers },
        });

        jobs.forEach((job) => {
          newNodes.push({
            id: job.id,
            type: 'job',
            position: { x: 100, y: 200 },
            data: {
              id: job.id,
              runsOn: job.runsOn,
              steps: job.steps,
              metadata: job.metadata,
            },
          });
        });

        jobs.forEach((job) => {
          if (job.needs && job.needs.length > 0) {
            job.needs.forEach((dep) => {
              if (jobs.some(j => j.id === dep)) {
                newEdges.push({
                  id: `${dep}-${job.id}`,
                  source: dep,
                  target: job.id,
                  animated: true,
                  style: { stroke: '#8b949e', strokeDasharray: '5,5' },
                });
              }
            });
          }

          const hasDependencies = job.needs && job.needs.filter(dep => jobs.some(j => j.id === dep)).length > 0;
          if (!hasDependencies) {
            newEdges.push({
              id: `trigger-${job.id}`,
              source: 'trigger',
              target: job.id,
              animated: true,
              style: { stroke: '#58a6ff' },
            });
          }
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);

        set({
          name,
          triggers,
          nodes: layoutedNodes,
          edges: layoutedEdges,
          metadata,
          parserError: null,
        });

      } else if (activeMode === 'docker-compose') {
        const { version, services, metadata } = parsed;

        services.forEach((service) => {
          newNodes.push({
            id: service.id,
            type: 'docker-service',
            position: { x: 100, y: 100 },
            data: {
              id: service.id,
              image: service.image,
              ports: service.ports,
              volumes: service.volumes,
              depends_on: service.depends_on,
              metadata: service.metadata,
            },
          });
        });

        services.forEach((service) => {
          if (service.depends_on && service.depends_on.length > 0) {
            service.depends_on.forEach((dep) => {
              if (services.some(s => s.id === dep)) {
                newEdges.push({
                  id: `${dep}-${service.id}`,
                  source: dep,
                  target: service.id,
                  animated: true,
                  style: { stroke: '#58a6ff', strokeDasharray: '5,5' },
                });
              }
            });
          }
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);

        set({
          name: `Docker Compose (${version})`,
          nodes: layoutedNodes,
          edges: layoutedEdges,
          metadata,
          parserError: null,
        });

      } else if (activeMode === 'kubernetes') {
        const { resources } = parsed;

        resources.forEach((res) => {
          newNodes.push({
            id: res.id,
            type: 'k8s-node',
            position: { x: 100, y: 100 },
            data: res,
          });
        });

        const services = resources.filter(r => r.kind === 'Service');
        const deployments = resources.filter(r => r.kind === 'Deployment');

        services.forEach(svc => {
          deployments.forEach(deploy => {
            const svcSelector = svc.selector || {};
            const deployLabels = deploy.labels || {};
            const selectorKeys = Object.keys(svcSelector);
            
            if (selectorKeys.length > 0) {
              const isMatch = selectorKeys.every(key => deployLabels[key] === svcSelector[key]);
              if (isMatch) {
                newEdges.push({
                  id: `${svc.id}-${deploy.id}`,
                  source: svc.id,
                  target: deploy.id,
                  animated: true,
                  style: { stroke: '#2ea44f' },
                });
              }
            }
          });
        });

        const ingresses = resources.filter(r => r.kind === 'Ingress');
        ingresses.forEach(ing => {
          const rawDoc = ing.rawDoc || {};
          const rules = rawDoc.spec?.rules || [];
          const referencedServices = new Set();

          rules.forEach(rule => {
            const paths = rule.http?.paths || [];
            paths.forEach(p => {
              const svcName = p.backend?.service?.name || p.backend?.serviceName;
              if (svcName) referencedServices.add(svcName);
            });
          });

          const defaultSvcName = rawDoc.spec?.defaultBackend?.service?.name || rawDoc.spec?.defaultBackend?.serviceName;
          if (defaultSvcName) referencedServices.add(defaultSvcName);

          referencedServices.forEach(svcName => {
            const targetSvc = services.find(s => s.name === svcName);
            if (targetSvc) {
              newEdges.push({
                id: `${ing.id}-${targetSvc.id}`,
                source: ing.id,
                target: targetSvc.id,
                animated: true,
                style: { stroke: '#db6d28' },
              });
            }
          });
        });

        const configMapsAndSecrets = resources.filter(r => r.kind === 'ConfigMap' || r.kind === 'Secret');
        deployments.forEach(deploy => {
          const rawDoc = deploy.rawDoc || {};
          const containers = rawDoc.spec?.template?.spec?.containers || [];
          const referencedNames = new Set();

          containers.forEach(container => {
            const envFrom = container.envFrom || [];
            envFrom.forEach(ef => {
              if (ef.configMapRef?.name) referencedNames.add(ef.configMapRef.name);
              if (ef.secretRef?.name) referencedNames.add(ef.secretRef.name);
            });

            const env = container.env || [];
            env.forEach(ev => {
              const cmName = ev.valueFrom?.configMapKeyRef?.name;
              if (cmName) referencedNames.add(cmName);
              const secName = ev.valueFrom?.secretKeyRef?.name;
              if (secName) referencedNames.add(secName);
            });
          });

          referencedNames.forEach(refName => {
            const sourceNode = configMapsAndSecrets.find(r => r.name === refName);
            if (sourceNode) {
              newEdges.push({
                id: `${sourceNode.id}-${deploy.id}`,
                source: sourceNode.id,
                target: deploy.id,
                animated: false,
                style: { stroke: '#8b949e', strokeDasharray: '3,3' },
              });
            }
          });
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);

        set({
          name: 'Kubernetes Manifest',
          nodes: layoutedNodes,
          edges: layoutedEdges,
          metadata: { resources },
          parserError: null,
        });
      }
    } catch (err) {
      set({ parserError: err.message || 'Error parsing YAML' });
    }
  },
}));
