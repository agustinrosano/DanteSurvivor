const { chromium, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const { existsSync, mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sdk = process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA || '', 'Android/Sdk');
const adb = path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
const serial = process.env.ANDROID_SERIAL || execFileSync(adb, ['devices'], { encoding: 'utf8' }).split(/\r?\n/).find(line => /^emulator-\d+\s+device$/.test(line))?.split(/\s/)[0];
if (!serial) throw new Error('Start an emulator or explicitly set ANDROID_SERIAL for the target device.');
const appId = 'com.agustinrosano.dantequest';
const output = path.join(root, 'artifacts/android');
const apk = path.join(output, 'dante-quest-debug.apk');
if (!existsSync(apk)) throw new Error('Run npm run android:apk first.');
mkdirSync(output, { recursive: true });
function device(...args) {
  return execFileSync(adb, ['-s', serial, ...args], { encoding: 'utf8', timeout: 60000 }).trim();
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function dismissFullscreenHint() {
  // This is Android's first-use tutorial, outside the WebView.
  if (device('shell', 'dumpsys', 'window').includes('ImmersiveModeConfirmation')) {
    device('shell', 'uiautomator', 'dump', '/sdcard/dante-port-smoke-ui.xml');
    const hierarchy = device('shell', 'cat', '/sdcard/dante-port-smoke-ui.xml');
    const button = hierarchy.match(/<node[^>]*resource-id="com.android.systemui:id\/ok"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (button) {
      device('shell', 'input', 'tap', String(Math.round((+button[1] + +button[3]) / 2)), String(Math.round((+button[2] + +button[4]) / 2)));
      await delay(500);
    }
  }
}

(async () => {
  console.log(device('install', '-r', apk));
  console.log(device('shell', 'am', 'start', '-W', '-n', `${appId}/.MainActivity`));
  let socket;
  for (let i = 0; i < 60; i++) {
    const pid = device('shell', 'pidof', appId).split(' ')[0];
    socket = device('shell', 'cat', '/proc/net/unix').split('\n').find(line => line.includes(`webview_devtools_remote_${pid}`))?.split('@')[1].trim();
    if (socket) break;
    await delay(500);
  }
  if (!socket) throw new Error('Debug WebView was not available. Use a debug APK.');
  const port = device('forward', 'tcp:0', `localabstract:${socket}`);
  let browser;
  try {
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { noDefaults: true });
    const page = browser.contexts()[0].pages()[0];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.context().route('**/*', route => {
      const url = new URL(route.request().url());
      return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    });
    await page.reload();
    await expect(page.locator('#menu-screen')).toBeVisible();
    await dismissFullscreenHint();
    expect(await page.evaluate(() => innerWidth > innerHeight)).toBe(true);
    await page.screenshot({ path: path.join(output, 'android-menu.png') });
    await page.locator('#btn-play-solo').click();
    await page.locator('.roster-card').filter({ hasText: 'Lyra' }).click();
    await page.locator('#btn-char-to-map').click();
    await page.locator('#btn-start-expedition').click();
    await expect(page.locator('#hud')).toBeVisible();
    await expect(page.locator('#hud-timer')).not.toHaveText('00:00', { timeout: 15000 });
    await page.screenshot({ path: path.join(output, 'android-game.png') });
    writeFileSync(path.join(output, 'android-device-game.png'), execFileSync(adb, ['-s', serial, 'exec-out', 'screencap', '-p']));
    await dismissFullscreenHint();
    device('shell', 'input', 'keyevent', '4');
    await expect(page.locator('#pause-modal')).toBeVisible();
    await page.locator('#btn-pause-resume').click();
    device('shell', 'input', 'keyevent', '3');
    await delay(1500);
    device('shell', 'am', 'start', '-W', '-n', `${appId}/.MainActivity`);
    await expect(page.locator('#pause-modal')).toBeVisible();
    const pausedTime = await page.locator('#hud-timer').innerText();
    await delay(1200);
    await expect(page.locator('#hud-timer')).toHaveText(pausedTime);
    await page.locator('#btn-pause-resume').click();
    await expect(page.locator('#pause-modal')).toBeHidden();
    await page.locator('#btn-hud-pause').click();
    await page.locator('#btn-pause-quit').click();
    await page.reload();
    await page.locator('#btn-play-solo').click();
    await expect(page.locator('.roster-card.active')).toContainText('Lyra');
    expect(errors).toEqual([]);
    console.log(`Android smoke passed on ${serial}: OS ${device('shell', 'getprop', 'ro.build.version.release')}; landscape, local assets, solo, Back, Home/resume, selection persistence.`);
  } finally {
    await browser?.close();
    device('forward', '--remove', `tcp:${port}`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
