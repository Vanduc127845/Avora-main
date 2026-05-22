const apiUrl = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
const webUrl = (process.env.WEB_URL || 'http://localhost:3000').replace(/\/$/, '');

const email = `smoke-${Date.now()}@avora.dev`;
const password = 'SmokeTest123!';
const newPassword = 'SmokeTest456!';

async function assertOkPage(path) {
  const response = await fetch(`${webUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Expected ${webUrl}${path} to load, got ${response.status}`);
  }
}

async function json(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed: ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function main() {
  await assertOkPage('/login');
  await assertOkPage('/register');
  await json('/health');

  const registration = await json('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Smoke Test User',
      email,
      password,
    }),
  });

  if (!registration.token) throw new Error('Register did not return a token');

  await json('/api/users/profile', {
    headers: { Authorization: `Bearer ${registration.token}` },
  });

  const login = await json('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!login.token) throw new Error('Login did not return a token');

  const forgot = await json('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  if (forgot.resetToken) {
    await json('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: forgot.resetToken,
        password: newPassword,
      }),
    });

    const relogin = await json('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: newPassword }),
    });
    if (!relogin.token) throw new Error('Login after password reset did not return a token');
  }

  console.log(`Auth smoke passed for ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
