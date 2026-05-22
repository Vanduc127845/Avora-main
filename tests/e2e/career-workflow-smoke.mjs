const apiUrl = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
const webUrl = (process.env.WEB_URL || 'http://localhost:3000').replace(/\/$/, '');

const email = `workflow-${Date.now()}@avora.dev`;
const password = 'WorkflowTest123!';

async function assertOkPage(path) {
  const response = await fetch(`${webUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Expected ${webUrl}${path} to load, got ${response.status}`);
  }
}

async function json(path, options = {}) {
  const { headers: extraHeaders, ...fetchOptions } = options;
  const response = await fetch(`${apiUrl}${path}`, {
    ...fetchOptions,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed: ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function main() {
  await assertOkPage('/jobs');
  await json('/health');

  const registration = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Career Workflow User',
      email,
      password,
    }),
  });
  if (!registration.token) throw new Error('Register did not return a token');

  const auth = { Authorization: `Bearer ${registration.token}` };
  const profile = await json('/api/users/profile', { headers: auth });
  const jobs = await json('/api/jobs?limit=1', { headers: auth });
  const job = jobs.jobs?.[0];
  if (!job?.id) throw new Error('Expected at least one job for workflow test');

  const plan = await json(`/api/jobs/${job.id}/action-plan`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ userProfile: profile.user }),
  });

  if (!plan.analysis?.fit) throw new Error('Action plan did not include job fit analysis');
  if (!plan.roadmap?.id || !plan.roadmap?.phases?.length) throw new Error('Action plan did not create a roadmap');
  if (!plan.interview?.id || !plan.interview?.questions?.length) throw new Error('Action plan did not create an interview');

  await json(`/api/roadmaps/${plan.roadmap.id}`, { headers: auth });
  await json(`/api/interviews/${plan.interview.id}`, { headers: auth });

  console.log(`Career workflow smoke passed for ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
