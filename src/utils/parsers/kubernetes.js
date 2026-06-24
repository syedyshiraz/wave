import * as yaml from 'js-yaml';

export function yamlToJson(yamlText) {
  if (!yamlText || yamlText.trim() === '') {
    throw new Error('YAML content is empty');
  }

  // Use loadAll to support multi-document manifests separated by ---
  const docs = yaml.loadAll(yamlText).filter(doc => doc && typeof doc === 'object');
  
  if (docs.length === 0) {
    throw new Error('No valid Kubernetes resources found');
  }

  // Schema mismatch detection
  docs.forEach(doc => {
    if ('services' in doc) {
      throw new Error('This looks like a Docker Compose file. Please switch modes to visualize.');
    }
    if ('on' in doc || 'jobs' in doc) {
      throw new Error('This looks like a GitHub Actions workflow. Please switch modes to visualize.');
    }
    if (!('apiVersion' in doc) || !('kind' in doc)) {
      throw new Error('Missing apiVersion or kind. This does not look like a valid Kubernetes manifest.');
    }
  });

  const parsedResources = docs.map((doc, idx) => {
    const kind = doc.kind;
    const apiVersion = doc.apiVersion;
    const name = doc.metadata?.name || `resource-${idx + 1}`;
    
    // Extract info based on kind
    let replicas = undefined;
    let selector = {};
    let labels = {};
    let image = '';
    let ports = [];
    let serviceType = '';
    let configKeys = [];

    if (kind === 'Deployment') {
      replicas = doc.spec?.replicas;
      selector = doc.spec?.selector?.matchLabels || {};
      labels = doc.spec?.template?.metadata?.labels || {};
      
      const container = doc.spec?.template?.spec?.containers?.[0];
      image = container?.image || '';
      if (Array.isArray(container?.ports)) {
        ports = container.ports.map(p => p.containerPort);
      }
    } else if (kind === 'Service') {
      serviceType = doc.spec?.type || 'ClusterIP';
      selector = doc.spec?.selector || {};
      if (Array.isArray(doc.spec?.ports)) {
        ports = doc.spec.ports.map(p => `${p.port}:${p.targetPort || p.port}`);
      }
    } else if (kind === 'ConfigMap' || kind === 'Secret') {
      const dataKeys = doc.data ? Object.keys(doc.data) : [];
      const stringDataKeys = doc.stringData ? Object.keys(doc.stringData) : [];
      configKeys = [...dataKeys, ...stringDataKeys];
    }

    return {
      id: `${kind.toLowerCase()}-${name}`,
      kind,
      apiVersion,
      name,
      replicas,
      selector,
      labels,
      image,
      ports,
      serviceType,
      configKeys,
      rawDoc: doc, // preserve the entire original document for high fidelity serialization
    };
  });

  return {
    resources: parsedResources,
  };
}

export function jsonToYaml({ resources }) {
  const documents = resources.map(res => {
    // Clone rawDoc to preserve all metadata/formatting
    const doc = JSON.parse(JSON.stringify(res.rawDoc));
    
    // Update basic properties in rawDoc from visual adjustments
    if (!doc.metadata) doc.metadata = {};
    doc.metadata.name = res.name;

    if (res.kind === 'Deployment') {
      if (!doc.spec) doc.spec = {};
      if (res.replicas !== undefined) {
        doc.spec.replicas = Number(res.replicas);
      }
      // Sync containers
      if (res.image) {
        if (!doc.spec.template) doc.spec.template = {};
        if (!doc.spec.template.spec) doc.spec.template.spec = {};
        if (!doc.spec.template.spec.containers) doc.spec.template.spec.containers = [{}];
        doc.spec.template.spec.containers[0].image = res.image;
      }
    } else if (res.kind === 'Service') {
      if (!doc.spec) doc.spec = {};
      doc.spec.type = res.serviceType;
    }

    return doc;
  });

  return documents
    .map(doc => yaml.dump(doc, { noRefs: true, quotingType: '"', lineWidth: 120 }))
    .join('---\n');
}
