import * as yaml from 'js-yaml';

export function yamlToJson(yamlText) {
  if (!yamlText || yamlText.trim() === '') {
    throw new Error('YAML content is empty');
  }

  const doc = yaml.load(yamlText);
  if (!doc || typeof doc !== 'object') {
    throw new Error('Invalid YAML format');
  }

  // Schema mismatch detection
  if ('apiVersion' in doc || 'kind' in doc) {
    throw new Error('This looks like a Kubernetes manifest. Please switch modes to visualize.');
  }
  if ('on' in doc || 'jobs' in doc) {
    throw new Error('This looks like a GitHub Actions workflow. Please switch modes to visualize.');
  }

  const version = doc.version || '3.8';
  const servicesList = [];
  const rawServices = doc.services || {};

  for (const [serviceId, serviceData] of Object.entries(rawServices)) {
    if (!serviceData || typeof serviceData !== 'object') {
      continue;
    }

    // Parse depends_on
    let depends_on = [];
    if (serviceData.depends_on) {
      if (Array.isArray(serviceData.depends_on)) {
        depends_on = [...serviceData.depends_on];
      } else if (typeof serviceData.depends_on === 'object') {
        depends_on = Object.keys(serviceData.depends_on);
      }
    }

    // Parse ports
    const ports = Array.isArray(serviceData.ports) 
      ? serviceData.ports.map(p => typeof p === 'object' ? JSON.stringify(p) : String(p))
      : [];

    // Parse volumes
    const volumes = Array.isArray(serviceData.volumes)
      ? serviceData.volumes.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v))
      : [];

    const metadata = Object.fromEntries(
      Object.entries(serviceData).filter(([key]) => !['image', 'ports', 'volumes', 'depends_on'].includes(key))
    );

    servicesList.push({
      id: serviceId,
      image: serviceData.image || 'ubuntu:latest',
      ports,
      volumes,
      depends_on,
      metadata,
    });
  }

  const rootMetadata = Object.fromEntries(
    Object.entries(doc).filter(([key]) => !['version', 'services'].includes(key))
  );

  return {
    version,
    services: servicesList,
    metadata: rootMetadata,
  };
}

export function jsonToYaml({ version, services, metadata }) {
  const doc = {
    version: version || '3.8',
    services: {},
  };

  if (metadata && typeof metadata === 'object') {
    Object.assign(doc, metadata);
  }

  services.forEach(service => {
    const serviceData = {};

    // Restore metadata properties
    if (service.metadata && typeof service.metadata === 'object') {
      Object.assign(serviceData, service.metadata);
    }

    serviceData.image = service.image || 'ubuntu:latest';

    if (service.ports && service.ports.length > 0) {
      serviceData.ports = service.ports;
    }

    if (service.volumes && service.volumes.length > 0) {
      serviceData.volumes = service.volumes;
    }

    if (service.depends_on && service.depends_on.length > 0) {
      serviceData.depends_on = service.depends_on;
    }

    doc.services[service.id] = serviceData;
  });

  return yaml.dump(doc, {
    noRefs: true,
    quotingType: '"',
    lineWidth: 120,
    noCompatMode: true,
  });
}
