// ============================================================================
// DANTE QUEST — Unified Input System (Keyboard, Mouse, Touch Virtual Joystick)
// ============================================================================

export class InputSystem {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false };
    this.joystick = { x: 0, y: 0, active: false };
    this.dodgeRequested = false;
    this.skillRequested = false;
    this.pauseRequested = false;

    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    this.initKeyboard();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        this.dodgeRequested = true;
        e.preventDefault();
      }
      if (e.code === 'KeyQ' || e.code === 'KeyE') {
        this.skillRequested = true;
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.pauseRequested = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', () => {
      this.mouse.isDown = true;
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });
  }

  initTouch() {
    // Show touch UI if touch device detected
    const touchControls = document.getElementById('touch-controls');
    if (this.isTouchDevice && touchControls) {
      touchControls.classList.remove('hidden');
    }

    const joystickZone = document.getElementById('joystick-zone');
    const joystickThumb = document.getElementById('joystick-thumb');

    if (joystickZone && joystickThumb) {
      let touchId = null;
      let startX = 0;
      let startY = 0;
      const maxRadius = 45;

      const handleTouchStart = (e) => {
        if (touchId !== null) return;
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const rect = joystickZone.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
        this.joystick.active = true;
        handleTouchMove(e);
      };

      const handleTouchMove = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === touchId) {
            let dx = touch.clientX - startX;
            let dy = touch.clientY - startY;
            const dist = Math.hypot(dx, dy);

            if (dist > maxRadius) {
              dx = (dx / dist) * maxRadius;
              dy = (dy / dist) * maxRadius;
            }

            joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;
            this.joystick.x = dx / maxRadius;
            this.joystick.y = dy / maxRadius;
            break;
          }
        }
      };

      const handleTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            touchId = null;
            this.joystick.active = false;
            this.joystick.x = 0;
            this.joystick.y = 0;
            joystickThumb.style.transform = `translate(0px, 0px)`;
            break;
          }
        }
      };

      joystickZone.addEventListener('touchstart', handleTouchStart, { passive: false });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: false });
      window.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }

    // Touch Action Buttons
    const btnDodge = document.getElementById('btn-touch-dodge');
    const btnSkill = document.getElementById('btn-touch-skill');

    if (btnDodge) {
      btnDodge.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.dodgeRequested = true;
      });
    }

    if (btnSkill) {
      btnSkill.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.skillRequested = true;
      });
    }
  }

  getMovementVector() {
    let mx = 0;
    let my = 0;

    // Keyboard WASD or Arrow Keys
    if (this.keys['KeyW'] || this.keys['ArrowUp']) my -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;

    // If keyboard is pressed, normalize
    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      return { x: mx / len, y: my / len };
    }

    // Otherwise use joystick
    if (this.joystick.active) {
      return { x: this.joystick.x, y: this.joystick.y };
    }

    return { x: 0, y: 0 };
  }

  consumeDodge() {
    const requested = this.dodgeRequested;
    this.dodgeRequested = false;
    return requested;
  }

  consumeSkill() {
    const requested = this.skillRequested;
    this.skillRequested = false;
    return requested;
  }

  consumePause() {
    const requested = this.pauseRequested;
    this.pauseRequested = false;
    return requested;
  }
}
