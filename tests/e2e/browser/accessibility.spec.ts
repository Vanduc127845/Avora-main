import { expect, test } from '@playwright/test';

const authenticatedPages = [
  '/dashboard',
  '/profile',
  '/assessment',
  '/jobs',
  '/roadmaps',
  '/interviews',
  '/confidence',
  '/simulation',
];

const password = 'BrowserTest123!';

async function createUser(apiUrl: string, email: string) {
  const response = await fetch(`${apiUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Browser E2E User', email, password }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.token) {
    throw new Error(`Could not create browser E2E user: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload.token as string;
}

test.beforeEach(async ({ context }, testInfo) => {
  const apiUrl = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
  const runId = `${Date.now().toString(36)}-${testInfo.workerIndex}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `browser-${runId}@avora.local`;
  const token = await createUser(apiUrl, email);

  await context.addInitScript(
    ({ authToken, userEmail }) => {
      localStorage.setItem(
        'ai4a-auth',
        JSON.stringify({
          state: {
            token: authToken,
            user: { id: userEmail, email: userEmail, name: 'Browser E2E User' },
            isAuthenticated: true,
          },
          version: 0,
        })
      );
    },
    { authToken: token, userEmail: email }
  );
});

for (const path of authenticatedPages) {
  test(`main page is keyboard and label safe: ${path}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();

    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    expect(focusedTag).toBeTruthy();

    const unlabeledIconButtons = await page.locator('button').evaluateAll((buttons) =>
      buttons
        .filter((button) => {
          const hasVisibleText = Boolean(button.textContent?.trim());
          const hasAccessibleName =
            Boolean(button.getAttribute('aria-label')?.trim()) ||
            Boolean(button.getAttribute('title')?.trim()) ||
            Boolean(button.getAttribute('aria-labelledby')?.trim());
          return !hasVisibleText && !hasAccessibleName;
        })
        .map((button) => button.outerHTML.slice(0, 160))
    );

    const imagesWithoutAlt = await page.locator('img').evaluateAll((images) =>
      images
        .filter((image) => !image.hasAttribute('alt'))
        .map((image) => image.outerHTML.slice(0, 160))
    );

    expect(unlabeledIconButtons).toEqual([]);
    expect(imagesWithoutAlt).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
