const apiUrl = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
const webUrl = (process.env.WEB_URL || 'http://localhost:3000').replace(/\/$/, '');

const email = `assessment-role-${Date.now()}@avora.dev`;
const password = 'AssessmentRole123!';

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
  await assertOkPage('/assessment');
  await json('/health');

  const registration = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Assessment Role User',
      email,
      password,
    }),
  });
  if (!registration.token) throw new Error('Register did not return a token');

  const auth = { Authorization: `Bearer ${registration.token}` };
  const created = await json('/api/assessments', {
    method: 'POST',
    headers: auth,
  });
  const assessmentId = created.assessment?.id;
  if (!assessmentId) throw new Error('Assessment creation did not return an id');

  const result = await json(`/api/assessments/${assessmentId}/message`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ message: 'phân tích job Back - end developer' }),
  });

  const selectedJob = result.orchestration?.selectedJob || '';
  const responseText = result.response || '';
  if (!/backend developer/i.test(selectedJob)) {
    throw new Error(`Expected Backend Developer selection, got "${selectedJob}"`);
  }
  if (/junior frontend|inclusive web studio/i.test(responseText)) {
    throw new Error(`Assessment reused the wrong frontend demo job: ${responseText.slice(0, 240)}`);
  }
  if (!/node|express|rest api|sql/i.test(responseText)) {
    throw new Error(`Expected backend analysis with backend skills, got: ${responseText.slice(0, 240)}`);
  }
  if (/paste JD|dán JD|ứng tuyển vị trí cụ thể/i.test(responseText)) {
    throw new Error(`Assessment still asked for a JD instead of analyzing the role: ${responseText.slice(0, 240)}`);
  }

  console.log(`Assessment role smoke passed for ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
