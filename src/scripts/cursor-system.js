/**
 * Grevix Mouse-Following Telemetry & Camera Synchronization System
 * Features:
 * - Normalized cursor tracking (-1 to 1) with clamped, jitter-free lerp damping
 * - Clean pause when mouse stops moving to prevent GPU / frame jitter
 * - Native system cursor restored across the entire platform
 * - Synchronizes Three.js background scenes and camera panning
 * - Zero custom cursor particle trail, dot, ring, or card vibration
 */

export const cursorState = {
  rawX: 0,
  rawY: 0,
  lerpedX: 0,
  lerpedY: 0,
  screenX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
  screenY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  lerpedScreenX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
  lerpedScreenY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  isMoving: false,
  damping: 0.05
};

class CursorSystem {
  constructor() {
    this.parallaxElements = [];
    this.rafId = null;

    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  init() {
    this.initEventListeners();
    this.scanInteractiveElements();
    this.startLoop();
  }

  initEventListeners() {
    window.addEventListener('mousemove', (e) => {
      cursorState.screenX = e.clientX;
      cursorState.screenY = e.clientY;
      // Clamped normalized coordinates (-1 to 1)
      cursorState.rawX = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
      cursorState.rawY = Math.max(-1, Math.min(1, -(e.clientY / window.innerHeight) * 2 + 1));
      cursorState.isMoving = true;
    }, { passive: true });

    window.addEventListener('resize', () => {
      this.scanInteractiveElements();
    });
  }

  scanInteractiveElements() {
    // Only scan non-card background decorative elements for subtle multi-depth parallax
    this.parallaxElements = Array.from(document.querySelectorAll('[data-parallax-depth]'))
      .filter((el) => !el.classList.contains('dark-glass-card') && !el.closest('.dark-glass-card'));
  }

  startLoop() {
    const tick = () => {
      this.updatePhysics();
      this.updateMultiDepthParallax();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  updatePhysics() {
    const d = cursorState.damping;
    const dx = cursorState.rawX - cursorState.lerpedX;
    const dy = cursorState.rawY - cursorState.lerpedY;

    // Clamped, jitter-free lerp damping that pauses cleanly when the mouse stops moving
    if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
      cursorState.lerpedX += dx * d;
      cursorState.lerpedY += dy * d;
      cursorState.isMoving = true;
    } else {
      cursorState.lerpedX = cursorState.rawX;
      cursorState.lerpedY = cursorState.rawY;
      cursorState.isMoving = false;
    }

    const dsx = cursorState.screenX - cursorState.lerpedScreenX;
    const dsy = cursorState.screenY - cursorState.lerpedScreenY;
    if (Math.abs(dsx) > 0.1 || Math.abs(dsy) > 0.1) {
      cursorState.lerpedScreenX += dsx * (d * 1.5);
      cursorState.lerpedScreenY += dsy * (d * 1.5);
    } else {
      cursorState.lerpedScreenX = cursorState.screenX;
      cursorState.lerpedScreenY = cursorState.screenY;
    }
  }

  updateMultiDepthParallax() {
    // Subtle background decorative parallax (Kanji / shards only - cards sit 100% flat)
    if (!cursorState.isMoving && Math.abs(cursorState.lerpedX) < 0.001) return;

    const lx = cursorState.lerpedX;
    const ly = cursorState.lerpedY;

    for (let i = 0; i < this.parallaxElements.length; i++) {
      const el = this.parallaxElements[i];
      const depth = parseFloat(el.getAttribute('data-parallax-depth') || '15');
      const tx = lx * depth;
      const ty = -ly * depth;
      el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
    }
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

export const cursorSystem = new CursorSystem();
