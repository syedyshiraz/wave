import { describe, it, expect } from 'vitest';
import * as dockerCompose from '../utils/parsers/dockerCompose';
import * as kubernetes from '../utils/parsers/kubernetes';

describe('Docker Compose Parser', () => {
  it('should parse services and depends_on correctly', () => {
    const yamlStr = `
version: "3"
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - api
  api:
    image: node:18
    depends_on:
      - db
  db:
    image: postgres:15
`;
    const parsed = dockerCompose.yamlToJson(yamlStr);
    expect(parsed.version).toBe('3');
    expect(parsed.services).toHaveLength(3);
    
    const web = parsed.services.find(s => s.id === 'web');
    expect(web.image).toBe('nginx:alpine');
    expect(web.ports).toContain('80:80');
    expect(web.depends_on).toContain('api');

    const api = parsed.services.find(s => s.id === 'api');
    expect(api.depends_on).toContain('db');
  });

  it('should serialize services back to compose YAML', () => {
    const data = {
      version: '3.8',
      services: [
        {
          id: 'web',
          image: 'nginx:alpine',
          ports: ['80:80'],
          volumes: [],
          depends_on: ['db'],
          metadata: {}
        },
        {
          id: 'db',
          image: 'postgres:15',
          ports: [],
          volumes: [],
          depends_on: [],
          metadata: {}
        }
      ]
    };
    const yamlStr = dockerCompose.jsonToYaml(data);
    expect(yamlStr).toContain("version: '3.8'");
    expect(yamlStr).toContain('web:');
    expect(yamlStr).toContain('db:');
    expect(yamlStr).toContain('depends_on:');
  });

  it('should throw an error if a Kubernetes manifest is loaded', () => {
    const k8sYaml = `
apiVersion: v1
kind: Service
metadata:
  name: test-svc
`;
    expect(() => dockerCompose.yamlToJson(k8sYaml)).toThrow('This looks like a Kubernetes manifest. Please switch modes to visualize.');
  });
});

describe('Kubernetes Parser', () => {
  it('should parse multi-document manifests', () => {
    const yamlStr = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deploy
spec:
  replicas: 2
  template:
    metadata:
      labels:
        app: app-labels
    spec:
      containers:
        - name: web
          image: nginx
---
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: app-labels
`;
    const parsed = kubernetes.yamlToJson(yamlStr);
    expect(parsed.resources).toHaveLength(2);
    
    const deploy = parsed.resources.find(r => r.kind === 'Deployment');
    expect(deploy.name).toBe('app-deploy');
    expect(deploy.replicas).toBe(2);
    expect(deploy.image).toBe('nginx');

    const svc = parsed.resources.find(r => r.kind === 'Service');
    expect(svc.name).toBe('app-service');
    expect(svc.selector.app).toBe('app-labels');
  });

  it('should throw an error if a Docker Compose manifest is loaded', () => {
    const composeYaml = `
version: "3.8"
services:
  web:
    image: nginx
`;
    expect(() => kubernetes.yamlToJson(composeYaml)).toThrow('This looks like a Docker Compose file. Please switch modes to visualize.');
  });
});
