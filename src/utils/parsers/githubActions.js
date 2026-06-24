import * as yaml from 'js-yaml';

function parseTriggers(onValue) {
  const triggers = {
    push: false,
    pull_request: false,
    schedule: false,
  };

  if (!onValue) return triggers;

  if (typeof onValue === 'string') {
    if (onValue === 'push') triggers.push = true;
    if (onValue === 'pull_request') triggers.pull_request = true;
    if (onValue === 'schedule') triggers.schedule = true;
  } else if (Array.isArray(onValue)) {
    onValue.forEach(event => {
      if (event === 'push') triggers.push = true;
      if (event === 'pull_request') triggers.pull_request = true;
      if (event === 'schedule') triggers.schedule = true;
    });
  } else if (typeof onValue === 'object') {
    if ('push' in onValue) triggers.push = true;
    if ('pull_request' in onValue) triggers.pull_request = true;
    if ('schedule' in onValue) triggers.schedule = true;
  }

  return triggers;
}

function serializeTriggers(triggers) {
  const active = Object.keys(triggers).filter(k => triggers[k]);
  if (active.length === 0) return 'push';
  
  const onObj = {};
  let hasSchedule = false;

  active.forEach(trigger => {
    if (trigger === 'schedule') {
      hasSchedule = true;
      onObj.schedule = [{ cron: '0 0 * * *' }];
    } else {
      onObj[trigger] = {};
    }
  });

  if (hasSchedule) {
    return onObj;
  }
  
  if (active.length === 1) {
    return active[0];
  }
  
  return active;
}

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
  if ('services' in doc) {
    throw new Error('This looks like a Docker Compose file. Please switch modes to visualize.');
  }

  const name = doc.name || 'WAVE Workflow';
  const triggers = parseTriggers(doc.on);
  const jobsList = [];

  const rawJobs = doc.jobs || {};
  
  for (const [jobId, jobData] of Object.entries(rawJobs)) {
    if (!jobData || typeof jobData !== 'object') {
      continue;
    }

    let needs = [];
    if (jobData.needs) {
      if (typeof jobData.needs === 'string') {
        needs = [jobData.needs];
      } else if (Array.isArray(jobData.needs)) {
        needs = [...jobData.needs];
      }
    }

    const steps = [];
    if (Array.isArray(jobData.steps)) {
      jobData.steps.forEach((step, index) => {
        steps.push({
          id: step.id || `step-${index + 1}`,
          name: step.name || '',
          run: step.run || '',
          uses: step.uses || '',
          ...Object.fromEntries(
            Object.entries(step).filter(([key]) => !['id', 'name', 'run', 'uses'].includes(key))
          )
        });
      });
    }

    const metadata = Object.fromEntries(
      Object.entries(jobData).filter(([key]) => !['runs-on', 'needs', 'steps'].includes(key))
    );

    jobsList.push({
      id: jobId,
      runsOn: jobData['runs-on'] || 'ubuntu-latest',
      needs,
      steps,
      metadata,
    });
  }

  const rootMetadata = Object.fromEntries(
    Object.entries(doc).filter(([key]) => !['name', 'on', 'jobs'].includes(key))
  );

  return {
    name,
    triggers,
    jobs: jobsList,
    metadata: rootMetadata,
  };
}

export function jsonToYaml({ name, triggers, jobs, metadata }) {
  const doc = {
    name: name || 'WAVE Workflow',
    on: serializeTriggers(triggers),
  };

  if (metadata && typeof metadata === 'object') {
    Object.assign(doc, metadata);
  }

  doc.jobs = {};

  jobs.forEach(job => {
    const jobData = {};

    if (job.metadata && typeof job.metadata === 'object') {
      Object.assign(jobData, job.metadata);
    }

    jobData['runs-on'] = job.runsOn || 'ubuntu-latest';

    if (job.needs && job.needs.length > 0) {
      jobData.needs = job.needs.length === 1 ? job.needs[0] : job.needs;
    }

    if (job.steps && job.steps.length > 0) {
      jobData.steps = job.steps.map(step => {
        const stepData = {};
        if (step.name) stepData.name = step.name;
        if (step.uses) {
          stepData.uses = step.uses;
        } else if (step.run) {
          stepData.run = step.run;
        } else {
          stepData.run = '# Define action here';
        }
        
        Object.keys(step).forEach(key => {
          if (!['id', 'name', 'run', 'uses'].includes(key)) {
            stepData[key] = step[key];
          }
        });

        return stepData;
      });
    }

    doc.jobs[job.id] = jobData;
  });

  return yaml.dump(doc, {
    noRefs: true,
    quotingType: '"',
    lineWidth: 120,
    noCompatMode: true,
  });
}
