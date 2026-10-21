import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { sound } from './Audio.js';
import { saveData } from '../systems/SaveData.js';

export function initMobileRuntime(engine, menus) {
  const suspend = () => {
    engine.input.reset();
    if (engine.isPlaying && !engine.isPaused) engine.togglePause();
    sound.suspend();
    saveData.save();
  };
  const foreground = () => {
    engine.lastTime = performance.now();
    engine.resizeCanvas();
  };

  document.addEventListener('visibilitychange', () => document.hidden ? suspend() : foreground());
  window.addEventListener('pagehide', suspend);
  window.addEventListener('blur', suspend);
  window.addEventListener('pageshow', foreground);
  window.visualViewport?.addEventListener('resize', foreground);
  // Retry a blocked audio context only from an actual player gesture.
  document.addEventListener('pointerdown', () => {
    if (!document.hidden && engine.isPlaying && !engine.isPaused) sound.resume();
  }, { passive: true });

  if (Capacitor.isNativePlatform()) {
    document.documentElement.classList.add('native-android');
    // Android can deliver onPause well before onStop/appStateChange(false),
    // especially during a quick Home-and-return transition.
    App.addListener('pause', suspend);
    App.addListener('appStateChange', ({ isActive }) => isActive ? foreground() : suspend());
    App.addListener('backButton', () => {
      if (engine.isPlaying) {
        engine.togglePause();
        return;
      }
      if (!menus.endGameModal.classList.contains('hidden')) {
        document.getElementById('btn-end-menu').click();
      } else if (!menus.screenCharacter.classList.contains('hidden')) {
        if (!menus.stepPanelMap.classList.contains('hidden')) menus.setSetupStep('hero');
        else menus.showScreen(menus.screenMenu);
      } else if (menus.screenMenu.classList.contains('hidden')) {
        menus.showScreen(menus.screenMenu);
      } else {
        App.minimizeApp();
      }
    });
  }
}
