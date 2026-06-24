import * as githubActions from './parsers/githubActions';
import * as dockerCompose from './parsers/dockerCompose';
import * as kubernetes from './parsers/kubernetes';

/**
 * Parses raw YAML to intermediate JSON representation based on the selected active schema mode.
 */
export function yamlToJson(yamlText, mode = 'github-actions') {
  if (mode === 'github-actions') {
    return githubActions.yamlToJson(yamlText);
  } else if (mode === 'docker-compose') {
    return dockerCompose.yamlToJson(yamlText);
  } else if (mode === 'kubernetes') {
    return kubernetes.yamlToJson(yamlText);
  }
  throw new Error(`Unsupported visualizer mode: ${mode}`);
}

/**
 * Serializes intermediate JSON representation back to a clean YAML string.
 */
export function jsonToYaml(data, mode = 'github-actions') {
  if (mode === 'github-actions') {
    return githubActions.jsonToYaml(data);
  } else if (mode === 'docker-compose') {
    return dockerCompose.jsonToYaml(data);
  } else if (mode === 'kubernetes') {
    return kubernetes.jsonToYaml(data);
  }
  throw new Error(`Unsupported visualizer mode: ${mode}`);
}
