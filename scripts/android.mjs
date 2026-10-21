import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const environment = { ...process.env };
environment.DEBUG = '';
const java = join(environment.ProgramFiles || 'C:/Program Files', 'Android/Android Studio/jbr');
const sdk = join(environment.LOCALAPPDATA || '', 'Android/Sdk');
if (!environment.JAVA_HOME && existsSync(java)) environment.JAVA_HOME = java;
if (!environment.ANDROID_HOME && existsSync(sdk)) environment.ANDROID_HOME = sdk;
if (environment.JAVA_HOME) environment.PATH = `${join(environment.JAVA_HOME, 'bin')}${process.platform === 'win32' ? ';' : ':'}${environment.PATH || ''}`;

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, env: environment, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

const action = process.argv[2] || 'sync';
if (!['sync', 'apk', 'open'].includes(action)) throw new Error('Use sync, apk or open.');
if (action === 'open') {
  run(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'open', 'android']);
} else {
  run(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', 'dist-android']);
  run(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'sync', 'android']);
  if (action === 'apk') {
    if (!environment.JAVA_HOME || !environment.ANDROID_HOME) {
      throw new Error('Install Android Studio and its Android SDK, or set JAVA_HOME and ANDROID_HOME. See docs/ANDROID.md.');
    }
    if (process.platform === 'win32') {
      run(environment.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'gradlew.bat assembleDebug --console=plain'], join(root, 'android'));
    } else {
      run('./gradlew', ['assembleDebug', '--console=plain'], join(root, 'android'));
    }
    const output = join(root, 'artifacts/android');
    mkdirSync(output, { recursive: true });
    const apk = join(output, 'dante-quest-debug.apk');
    copyFileSync(join(root, 'android/app/build/outputs/apk/debug/app-debug.apk'), apk);
    console.log(`\nAPK: ${apk}`);
  }
}
