/**
 * Grevix Full-Page Mouse-Following & Cursor Physics System
 * Features:
 * - Normalized cursor tracking (-1 to 1) with 0.06 lerp damping for 3D universe synchronization
 * - Glowing Comet Cursor with trailing canvas particle stream
 * - Star & Particle Repulsion within 130px gravity radius
 * - Magnetic pull on buttons & navbar links within 60px radius
 * - Global CSS mouse spotlight (--mouse-x, --mouse-y) & 3D perspective card tilting
 * - Whole-page multi-depth parallax container (15px, -25px, 40px depth multipliers)
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
  damping: 0.06,
  repulsionRadius: 130,
  magneticRadius: 60
};

class CursorSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 65;
    this.magneticElements = [];
    this.parallaxElements = [];
    this.tiltCards = [];
    this.rafId = null;

    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  init() {
    this.createCanvas();
    this.initEventListeners();
    this.scanInteractiveElements();
    this.startLoop();
  }

  createCanvas() {
    // Canvas for comet particle tail & star repulsion visualization
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'grevix-cursor-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9998';
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // Custom Glowing Comet Head Element
    this.cometHead = document.createElement('div');
    this.cometHead.id = 'grevix-comet-head';
    this.cometHead.className = 'comet-head-element';
    this.cometHead.style.position = 'fixed';
    this.cometHead.style.top = '0';
    this.cometHead.style.left = '0';
    this.cometHead.style.width = '12px';
    this.cometHead.style.height = '12px';
    this.cometHead.style.borderRadius = '50%';
    this.cometHead.style.backgroundColor = '#ffffff';
    this.cometHead.style.boxShadow = '0 0 12px 3px #00e5ff, 0 0 24px 6px #ff4400';
    this.cometHead.style.pointerEvents = 'none';
    this.cometHead.style.zIndex = '9999';
    this.cometHead.style.transform = 'translate(-50%, -50%)';
    this.cometHead.style.transition = 'transform 0.04s ease-out, opacity 0.3s ease';
    this.cometHead.style.opacity = '0';
    document.body.appendChild(this.cometHead);
  }

  initEventListeners() {
    window.addEventListener('mousemove', (e) => {
      cursorState.screenX = e.clientX;
      cursorState.screenY = e.clientY;
      cursorState.rawX = (e.clientX / window.innerWidth) * 2 - 1;
      cursorState.rawY = -(e.clientY / window.innerHeight) * 2 + 1;
      cursorState.isMoving = true;
      if (this.cometHead) this.cometHead.style.opacity = '1';

      // Global Spotlight CSS variables for dark-glass border illumination
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);

      // Add comet particles while moving
      this.spawnCometParticles(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.scanInteractiveElements();
    });

    document.addEventListener('mouseleave', () => {
      if (this.cometHead) this.cometHead.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      if (this.cometHead) this.cometHead.style.opacity = '1';
    });
  }

  scanInteractiveElements() {
    this.magneticElements = Array.from(document.querySelectorAll('.magnetic-btn, .hud-nav-btn, button.btn-magnetic, a.btn-magnetic'));
    this.parallaxElements = Array.from(document.querySelectorAll('[data-parallax-depth]'));
    this.tiltCards = Array.from(document.querySelectorAll('.dark-glass-card, .tilt-glass-card'));
  }

  spawnCometParticles(x, y) {
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.8 + 0.4;
      const isOrange = Math.random() > 0.45;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 0.035 + 0.02,
        size: Math.random() * 3.5 + 1.2,
        color: isOrange ? '255, 68, 0' : (Math.random() > 0.5 ? '0, 229, 255' : '255, 255, 255')
      });
    }

    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  startLoop() {
    const tick = () => {
      this.updatePhysics();
      this.renderComet();
      this.updateMagneticButtons();
      this.updateTiltCards();
      this.updateMultiDepthParallax();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  updatePhysics() {
    // Continuous 0.06 lerp damping
    const d = cursorState.damping;
    cursorState.lerpedX += (cursorState.rawX - cursorState.lerpedX) * d;
    cursorState.lerpedY += (cursorState.rawY - cursorState.lerpedY) * d;
    cursorState.lerpedScreenX += (cursorState.screenX - cursorState.lerpedScreenX) * (d * 1.8);
    cursorState.lerpedScreenY += (cursorState.screenY - cursorState.lerpedScreenY) * (d * 1.8);

    // Update comet head position
    if (this.cometHead) {
      this.cometHead.style.transform = `translate3d(${cursorState.lerpedScreenX}px, ${cursorState.lerpedScreenY}px, 0) translate(-50%, -50%)`;
    }
  }

  renderComet() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      // Gravitational repulsion effect: particles pushed away from pointer
      const dx = p.x - cursorState.screenX;
      const dy = p.y - cursorState.screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < cursorState.repulsionRadius && dist > 1) {
        const force = (1 - dist / cursorState.repulsionRadius) * 2.2;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.fillStyle = `rgba(${p.color}, ${p.life * 0.8})`;
      this.ctx.shadowColor = `rgba(${p.color}, 0.8)`;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  updateMagneticButtons() {
    const mx = cursorState.screenX;
    const my = cursorState.screenY;
    const radius = cursorState.magneticRadius;

    for (let i = 0; i < this.magneticElements.length; i++) {
      const el = this.magneticElements[i];
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = mx - cx;
      const dy = my - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        const pull = (1 - dist / radius) * 0.38;
        const tx = dx * pull;
        const ty = dy * pull;
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        el.style.transition = 'transform 0.1s ease-out';
      } else {
        if (el.style.transform && el.style.transform !== 'translate3d(0px, 0px, 0px)') {
          el.style.transform = 'translate3d(0px, 0px, 0px)';
          el.style.transition = 'transform 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        }
      }
    }
  }

  updateTiltCards() {
    const mx = cursorState.screenX;
    const my = cursorState.screenY;

    for (let i = 0; i < this.tiltCards.length; i++) {
      const card = this.tiltCards[i];
      const rect = card.getBoundingClientRect();

      // Check if card is visible on screen
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

      // Update card-local coordinates for neon cyan/violet border illumination
      const localX = mx - rect.left;
      const localY = my - rect.top;
      card.style.setProperty('--card-mouse-x', `${localX}px`);
      card.style.setProperty('--card-mouse-y', `${localY}px`);

      // 3D perspective tilt when cursor is inside or near card
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (mx - cx) / (rect.width / 2);
      const dy = (my - cy) / (rect.height / 2);

      const isHovered = localX >= 0 && localX <= rect.width && localY >= 0 && localY <= rect.height;

      if (isHovered) {
        const tiltX = -dy * 9; // Max 9 deg
        const tiltY = dx * 9;
        card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(1.018, 1.018, 1.018)`;
        card.style.transition = 'transform 0.08s ease-out';
      } else {
        if (card.style.transform && card.style.transform !== 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)') {
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
          card.style.transition = 'transform 0.4s ease-out';
        }
      }
    }
  }

  updateMultiDepthParallax() {
    // Multi-depth parallax: 15px (foreground), -25px (midground), 40px (background Kanji/shards)
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
}

export const cursorSystem = new CursorSystem();
