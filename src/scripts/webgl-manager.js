/**
 * WebGL Performance Coordinator & Lifecycle Manager
 * Uses IntersectionObserver to pause off-screen 3D/canvas render loops,
 * ensuring rock-solid 60 FPS and preventing GPU context exhaustion.
 */
class WebGLManager {
  constructor() {
    this.controllers = new Map();
    this.observer = null;
    this.initObserver();
    this.initVisibilityHandler();
  }

  initObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const controller = this.controllers.get(entry.target);
          if (!controller) return;

          if (entry.isIntersecting) {
            if (typeof controller.resume === 'function') {
              controller.resume();
            }
          } else {
            if (typeof controller.pause === 'function') {
              controller.pause();
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '100px 0px 100px 0px', // Pre-warm when within 100px of viewport
        threshold: [0, 0.05]
      }
    );
  }

  initVisibilityHandler() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      const isHidden = document.hidden;
      this.controllers.forEach((controller, element) => {
        if (isHidden) {
          if (typeof controller.pause === 'function') controller.pause();
        } else {
          // Only resume if element is currently in viewport
          const rect = element.getBoundingClientRect();
          const inView = rect.top < window.innerHeight && rect.bottom > 0;
          if (inView && typeof controller.resume === 'function') {
            controller.resume();
          }
        }
      });
    });
  }

  register(elementOrId, controller) {
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!el) {
      console.warn(`[WebGLManager] Element not found: ${elementOrId}`);
      return;
    }

    this.controllers.set(el, controller);
    if (this.observer) {
      this.observer.observe(el);
    } else {
      // Fallback if IntersectionObserver unavailable
      if (typeof controller.resume === 'function') controller.resume();
    }
  }

  unregister(elementOrId) {
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return;

    if (this.observer) {
      this.observer.unobserve(el);
    }
    const controller = this.controllers.get(el);
    if (controller && typeof controller.pause === 'function') {
      controller.pause();
    }
    this.controllers.delete(el);
  }
}

export const webGLManager = new WebGLManager();
