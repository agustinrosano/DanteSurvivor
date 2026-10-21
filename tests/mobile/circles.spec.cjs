const { test, expect } = require('@playwright/test');

for (const [mapId, name, boss] of [
  ['lujuria', 'Lujuria', 'SEÑOR DE LA TEMPESTAD'],
  ['gula', 'Gula', 'CERBERO, GUARDIÁN DE LA GULA']
]) {
test(`${name} is selectable, playable offline and remembered`, async ({ page, context }) => {
  await context.route('https://**', route => route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('#btn-play-solo').click();
  await page.locator('#btn-char-to-map').click();
  const card = page.locator(`.map-card[data-map="${mapId}"]`);
  await expect(card).toBeVisible();
  await card.click();
  await expect(card).toHaveClass(/active/);
  await expect.poll(() => card.locator('img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  await page.locator('#btn-start-expedition').click();
  await expect(page.locator('#hud-biome-name')).toContainText(name);
  await expect(page.locator('#hud-timer')).not.toHaveText('00:00');
  await page.reload();
  await page.locator('#btn-play-solo').click();
  await page.locator('#btn-char-to-map').click();
  await expect(page.locator('.map-card.active')).toHaveAttribute('data-map', mapId);
  expect(errors).toEqual([]);
});

test(`${name} awakens its own boss by approaching the altar`, async ({ page }) => {
  await page.addInitScript(() => {
    let seed = 42;
    Math.random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  });
  await page.clock.install();
  await page.goto('/');
  await page.locator('#btn-play-solo').click();
  await page.locator('#btn-char-to-map').click();
  await page.locator(`.map-card[data-map="${mapId}"]`).click();
  await page.locator('#btn-start-expedition').click();
  await page.keyboard.down('a');
  await page.keyboard.down('s');
  await page.clock.runFor(3400);
  await page.keyboard.up('a');
  await page.keyboard.up('s');
  await expect(page.locator('#boss-bar-container')).toBeVisible();
  await expect(page.locator('#boss-name')).toHaveText(boss);
  await expect(page.locator('#boss-phase-badge')).toHaveText('FASE 1');
  await expect(page.locator('#minimap-label')).toHaveText('Boss activo');
  await page.screenshot({ path: `artifacts/android/${mapId}-boss-web.png` });
});
}

test('Gula weather pauses with the run and the altar guide appears after two minutes', async ({ page }) => {
  test.setTimeout(180000);
  await page.addInitScript(() => {
    let seed = 42;
    Math.random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    localStorage.setItem('DANTE_QUEST_SAVE_DATA_V1', JSON.stringify({
      selectedCharacter: 'kael', metaUpgrades: { health: 5, attack: 5, speed: 5, magnet: 0 }
    }));
  });
  await page.clock.install();
  await page.goto('/');
  await page.locator('#btn-play-solo').click();
  await page.locator('.roster-card').filter({ hasText: 'Kael' }).click();
  await page.locator('#btn-char-to-map').click();
  await page.locator('.map-card[data-map="gula"]').click();
  await page.locator('#btn-start-expedition').click();
  await expect(page.locator('#map-event-status')).toBeHidden();
  await expect(page.locator('#minimap-canvas')).toHaveAttribute('aria-label', 'Minimapa de superficie');
  await page.keyboard.down('d');
  // Run real simulation frames, rather than changing the engine clock/state.
  for (let i = 0; i < 12; i++) {
    await page.clock.runFor(5000);
    if (await page.locator('#level-up-modal').isVisible()) {
      await page.locator('.upgrade-card').first().click();
      await page.keyboard.down('d');
      i--;
    }
    await expect(page.locator('#end-game-modal')).toBeHidden();
  }
  await page.clock.runFor(1200);
  await expect(page.locator('#map-event-status')).toContainText('LLUVIA HELADA');
  await page.keyboard.press('Escape');
  const time = await page.locator('#hud-timer').innerText();
  await page.clock.runFor(3000);
  await expect(page.locator('#hud-timer')).toHaveText(time);
  await expect(page.locator('#map-event-status')).toContainText('LLUVIA HELADA');
  await page.locator('#btn-pause-resume').click();
  await page.keyboard.down('d');
  await page.clock.runFor(15000);
  await expect(page.locator('#map-event-status')).toBeHidden();
  for (let i = 0; i < 11; i++) {
    await page.clock.runFor(5000);
    if (await page.locator('#level-up-modal').isVisible()) {
      await page.locator('.upgrade-card').first().click();
      await page.keyboard.down('d');
      i--;
    }
    await expect(page.locator('#end-game-modal')).toBeHidden();
  }
  await page.keyboard.up('d');
  await expect(page.locator('#minimap-label')).toHaveText('➤ Altar');
  await expect(page.locator('#minimap-canvas')).toHaveAttribute('aria-label', 'Flecha hacia el altar');
  await page.screenshot({ path: 'artifacts/android/gula-altar-guide-web.png' });
});
