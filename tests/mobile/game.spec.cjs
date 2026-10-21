const { test, expect } = require('@playwright/test');

async function startSolo(page) {
  await page.goto('/');
  await page.locator('#btn-play-solo').click();
  await page.locator('#btn-char-to-map').click();
  await page.locator('#btn-start-expedition').click();
  await expect(page.locator('#hud')).toBeVisible();
}

test('solo can start without any external asset service', async ({ page, context }) => {
  await context.route('https://**', route => route.abort());
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  await startSolo(page);
  await expect(page.locator('#hud-timer')).not.toHaveText('00:00', { timeout: 10000 });
  expect(failures).toEqual([]);
});

test('backgrounding pauses a run and returning requires explicit resume', async ({ page }) => {
  await startSolo(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#pause-modal')).toBeVisible();
  const timer = await page.locator('#hud-timer').innerText();
  await page.waitForTimeout(1200);
  await expect(page.locator('#hud-timer')).toHaveText(timer);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#pause-modal')).toBeVisible();
  await page.locator('#btn-pause-resume').click();
  await expect(page.locator('#pause-modal')).toBeHidden();
});

test('main menu actions fit on a short landscape screen', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 360 });
  await page.goto('/');
  await expect(page.locator('#btn-play-solo')).toBeInViewport();
  await expect(page.locator('#btn-sound-toggle')).toBeInViewport({ ratio: 1 });
});

test('touch movement survives action fingers and cancels cleanly', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'Touch-only behavior');
  await startSolo(page);
  const joystick = await page.locator('#joystick-zone').boundingBox();
  const dodge = await page.locator('#btn-touch-dodge').boundingBox();
  const skill = await page.locator('#btn-touch-skill').boundingBox();
  const cdp = await context.newCDPSession(page);
  const move = { x: joystick.x + joystick.width / 2 + 40, y: joystick.y + joystick.height / 2, id: 1 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [move] });
  await expect(page.locator('#joystick-thumb')).not.toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [move, { x: dodge.x + dodge.width / 2, y: dodge.y + dodge.height / 2, id: 2 }] });
  await expect(page.locator('#btn-touch-dodge')).toHaveAttribute('aria-disabled', 'true');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [move] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [move, { x: skill.x + skill.width / 2, y: skill.y + skill.height / 2, id: 3 }] });
  await expect(page.locator('#btn-touch-skill')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#joystick-thumb')).not.toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(page.locator('#joystick-thumb')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
});

test('hero and map selection survive a reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-play-solo').click();
  await page.locator('.roster-card').filter({ hasText: 'Lyra' }).click();
  await page.locator('#btn-char-to-map').click();
  await page.locator('.map-card').filter({ hasText: 'Limbo' }).click();
  await page.locator('#btn-start-expedition').click();
  await page.reload();
  await page.locator('#btn-play-solo').click();
  await expect(page.locator('.roster-card.active')).toContainText('Lyra');
  await page.locator('#btn-char-to-map').click();
  await expect(page.locator('.map-card.active')).toContainText('Limbo');
});

test('keyboard pause works and returning to menu hides touch controls', async ({ page }) => {
  await startSolo(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-modal')).toBeVisible();
  await page.locator('#btn-pause-quit').click();
  await expect(page.locator('#menu-screen')).toBeVisible();
  await expect(page.locator('#touch-controls')).toBeHidden();
});
