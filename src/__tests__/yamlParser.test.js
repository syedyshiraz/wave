import { describe, it, expect } from 'vitest';
import { yamlToJson, jsonToYaml } from '../utils/yamlParser';

describe('YAML Parser Engine', () => {
  it('should parse simple triggers and properties correctly', () => {
    const yamlStr = `
name: Simple Workflow
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run test
        run: npm test
`;
    const parsed = yamlToJson(yamlStr);
    expect(parsed.name).toBe('Simple Workflow');
    expect(parsed.triggers.push).toBe(true);
    expect(parsed.triggers.pull_request).toBe(false);
    expect(parsed.jobs).toHaveLength(1);
    
    const testJob = parsed.jobs[0];
    expect(testJob.id).toBe('test');
    expect(testJob.runsOn).toBe('ubuntu-latest');
    expect(testJob.steps).toHaveLength(1);
    expect(testJob.steps[0].name).toBe('Run test');
    expect(testJob.steps[0].run).toBe('npm test');
  });

  it('should serialize JSON state back to YAML successfully', () => {
    const data = {
      name: 'Custom Workflow',
      triggers: { push: true, pull_request: true, schedule: false },
      jobs: [
        {
          id: 'build',
          runsOn: 'ubuntu-latest',
          needs: [],
          steps: [
            { id: '1', name: 'Checkout', uses: 'actions/checkout@v4' }
          ]
        },
        {
          id: 'deploy',
          runsOn: 'ubuntu-latest',
          needs: ['build'],
          steps: [
            { id: '2', name: 'Deploy app', run: 'npm run deploy' }
          ]
        }
      ]
    };
    const yamlStr = jsonToYaml(data);
    expect(yamlStr).toContain('name: Custom Workflow');
    expect(yamlStr).toContain('build:');
    expect(yamlStr).toContain('deploy:');
    expect(yamlStr).toContain('needs: build');
  });

  it('should extract complex multiple needs dependencies', () => {
    const yamlStr = `
name: Complex Workflow
on: [push, pull_request]
jobs:
  build_a:
    runs-on: ubuntu-latest
    steps:
      - run: echo "A"
  build_b:
    runs-on: ubuntu-latest
    steps:
      - run: echo "B"
  deploy:
    runs-on: ubuntu-latest
    needs: [build_a, build_b]
    steps:
      - run: echo "Deploy"
`;
    const parsed = yamlToJson(yamlStr);
    expect(parsed.triggers.push).toBe(true);
    expect(parsed.triggers.pull_request).toBe(true);
    
    const deployJob = parsed.jobs.find(j => j.id === 'deploy');
    expect(deployJob).toBeDefined();
    expect(deployJob.needs).toHaveLength(2);
    expect(deployJob.needs).toContain('build_a');
    expect(deployJob.needs).toContain('build_b');
  });

  it('should throw errors when parsing malformed YAML syntax', () => {
    const invalidYaml = `
name: Malformed
on: [push
jobs:
  test:
    runs-on: ubuntu-latest
`;
    expect(() => yamlToJson(invalidYaml)).toThrow();
  });

  it('should preserve custom step properties during round-trip', () => {
    const yamlStr = `
name: Preserved Workflow
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Advanced Step
        uses: azure/login@v1
        with:
          creds: \${{ secrets.AZURE_CREDENTIALS }}
        env:
          KEY: VALUE
`;
    const parsed = yamlToJson(yamlStr);
    expect(parsed.jobs[0].steps[0].with).toBeDefined();
    expect(parsed.jobs[0].steps[0].with.creds).toBe('${{ secrets.AZURE_CREDENTIALS }}');
    expect(parsed.jobs[0].steps[0].env.KEY).toBe('VALUE');

    const backToYaml = jsonToYaml(parsed);
    expect(backToYaml).toContain('creds: ${{ secrets.AZURE_CREDENTIALS }}');
    expect(backToYaml).toContain('KEY: VALUE');
  });
});

import { getLayoutedElements } from '../utils/layout';

describe('Layout Engine', () => {
  it('should layout nodes using Dagre without errors', () => {
    const nodes = [
      { id: 'trigger', type: 'trigger', position: { x: 0, y: 0 } },
      { id: 'build', type: 'job', position: { x: 0, y: 0 }, data: { steps: [] } }
    ];
    const edges = [
      { id: 'trigger-build', source: 'trigger', target: 'build' }
    ];
    const result = getLayoutedElements(nodes, edges);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].position.x).toBeDefined();
    expect(result.nodes[1].position.y).toBeDefined();
  });
});
