import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cursorState } from './cursor-system.js';

function resolveAssetUrl(relPath) {
  return relPath.replace(/^\.\/public\//, './');
}

/**
 * Portal Backdrop Engine (black-hole-animation-canvas integration)
 * Renders a high-density 3,000 particle accretion vortex with a dark singularity event horizon.
 * Integrates cursor repulsion: nearby particles are deflected within a 130px radius.
 */
export class PortalBackdropController {
  constructor(canvasOrId) {
    this.canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.isRunning = false;
    this.rafId = null;

    this.initCanvas();
    this.initParticles();
    this.resume();
  }

  initCanvas() {
    const parent = this.canvas.parentElement || { clientWidth: window.innerWidth, clientHeight: 520 };
    this.width = parent.clientWidth || window.innerWidth;
    this.height = parent.clientHeight || 520;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.position = 'absolute';
    this.canvas.style.inset = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
  }

  initParticles() {
    this.particles = [];
    this.count = 3000; // Exactly 3000 particles as per black-hole-animation-canvas
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.radius = 65; // Black hole event horizon core radius

    for (let i = 0; i < this.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const opacity = (Math.random() * 5 + 2) / 10;
      const distance = (1 / opacity) * (this.radius + Math.random() * 340);
      const speed = distance * 0.000038;

      this.particles.push({
        angle,
        radius: Math.random() * 1.6 + 0.4,
        opacity,
        distance,
        speed,
        x: this.centerX + distance * Math.cos(angle),
        y: this.centerY + distance * Math.sin(angle),
        color: Math.random() > 0.4 ? '255, 68, 0' : (Math.random() > 0.5 ? '226, 133, 169' : '255, 255, 255')
      });
    }
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume() {
    if (this.isRunning) return;
    this.isRunning = true;
    const loop = () => {
      if (!this.isRunning) return;
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  render() {
    this.ctx.fillStyle = 'rgba(5, 5, 8, 0.28)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Singularity Core Glow
    const grad = this.ctx.createRadialGradient(this.centerX, this.centerY, 10, this.centerX, this.centerY, this.radius * 1.6);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.5, '#120500');
    grad.addColorStop(0.85, 'rgba(255, 68, 0, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius * 1.6, 0, Math.PI * 2);
    this.ctx.fill();

    // Singularity Pure Black Event Horizon
    this.ctx.fillStyle = '#050508';
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius * 0.65, 0, Math.PI * 2);
    this.ctx.fill();

    // Orbiting Accretion Particles with cursor repulsion
    const rect = this.canvas.getBoundingClientRect();
    const cursorLocalX = cursorState.screenX - rect.left;
    const cursorLocalY = cursorState.screenY - rect.top;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.angle += p.speed;
      let px = this.centerX + p.distance * Math.cos(p.angle);
      let py = this.centerY + p.distance * Math.sin(p.angle) * 0.72; // Elliptical inclination

      // Repel from cursor if within 130px
      const dx = px - cursorLocalX;
      const dy = py - cursorLocalY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130 && dist > 1) {
        const force = (1 - dist / 130) * 26;
        px += (dx / dist) * force;
        py += (dy / dist) * force;
      }

      this.ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  resize() {
    this.initCanvas();
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
  }
}

/**
 * Three.js Cyberpunk HUD Showcase Frame for Brute Prototype Titan
 * Features:
 * - GLTFLoader loading source/Untitled.glb with progressive telemetry progress
 * - OrbitControls for 360-degree interactive rotation, panning, and zooming
 * - Slow continuous idle rotation
 * - Wireframe mode toggle (Cyberpunk Manga CAD look vs Full PBR)
 * - Auto-rotation toggle & reset
 */
export class TitanShowcaseController {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isRunning = false;
    this.rafId = null;
    this.clock = new THREE.Clock();
    this.isWireframe = false;
    this.autoRotate = true;
    this.model = null;

    this.initScene();
    this.initLighting();
    this.initControls();
    this.initUI();
    this.loadModel();
    this.resume();
  }

  initScene() {
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 480;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 1.8, 6.2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    const canvas = this.renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    this.container.appendChild(canvas);

    // Cyberpunk Manga HUD Ground Grid
    const gridHelper = new THREE.GridHelper(10, 20, 0xff4400, 0x222230);
    gridHelper.position.y = -1.6;
    this.scene.add(gridHelper);
  }

  initLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambient);

    // Grevix Neon Orange Key Light
    this.keyLight = new THREE.DirectionalLight(0xff5500, 2.8);
    this.keyLight.position.set(5, 6, 5);
    this.scene.add(this.keyLight);

    // Grevix Cyan Cyber Rim Light
    this.rimLight = new THREE.DirectionalLight(0x00e5ff, 2.2);
    this.rimLight.position.set(-5, 2, -4);
    this.scene.add(this.rimLight);

    // Front soft fill
    const fillLight = new THREE.PointLight(0xffffff, 1.2, 15);
    fillLight.position.set(0, 2, 4);
    this.scene.add(fillLight);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 14;
    this.controls.minDistance = 2.2;
    this.controls.target.set(0, 0.2, 0);
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 1.2;
    this.controls.update();
  }

  initUI() {
    const btnWireframe = document.getElementById('btn-titan-wireframe');
    if (btnWireframe) {
      btnWireframe.addEventListener('click', () => {
        this.toggleWireframe();
      });
    }

    const btnRotate = document.getElementById('btn-titan-rotate');
    if (btnRotate) {
      btnRotate.addEventListener('click', () => {
        this.autoRotate = !this.autoRotate;
        this.controls.autoRotate = this.autoRotate;
        btnRotate.classList.toggle('active', this.autoRotate);
      });
    }

    const btnReset = document.getElementById('btn-titan-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.camera.position.set(0, 1.8, 6.2);
        this.controls.target.set(0, 0.2, 0);
        this.controls.update();
      });
    }

    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth || 600;
      const height = this.container.clientHeight || 480;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    });
  }

  loadModel() {
    const loader = new GLTFLoader();
    const primaryUrl = resolveAssetUrl('./assets/new_3D/brute-prototype-titan-cameraman-b-meleeluigi/source/Untitled.glb');

    const progressBar = document.getElementById('titan-progress-bar');
    const progressText = document.getElementById('titan-progress-text');
    const loadingOverlay = document.getElementById('titan-loading-overlay');

    const handleSuccess = (gltf) => {
      this.model = gltf.scene;

      const box = new THREE.Box3().setFromObject(this.model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3.2 / maxDim;
      this.model.scale.setScalar(scale);

      this.model.position.x = -center.x * scale;
      this.model.position.y = -center.y * scale - 0.2;
      this.model.position.z = -center.z * scale;

      this.scene.add(this.model);

      if (loadingOverlay) {
        loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => loadingOverlay.remove(), 600);
      }

      const statusEl = document.getElementById('titan-telemetry-status');
      if (statusEl) {
        statusEl.textContent = 'TITAN CAMERAMAN MECHA ACTIVE // 360° ORBIT SYNC';
        statusEl.classList.remove('text-yellow-400');
        statusEl.classList.add('text-emerald-400');
      }
    };

    const handleProgress = (xhr) => {
      if (xhr.lengthComputable && xhr.total > 0) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        const loadedMB = (xhr.loaded / (1024 * 1024)).toFixed(1);
        const totalMB = (xhr.total / (1024 * 1024)).toFixed(1);
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressText) {
          progressText.textContent = `LOADING TITAN MECHA MESH [ ${percent}% ] (${loadedMB}MB / ${totalMB}MB)`;
        }
      } else {
        const loadedMB = (xhr.loaded / (1024 * 1024)).toFixed(1);
        if (progressText) {
          progressText.textContent = `STREAMING TITAN MECHA MESH [ ${loadedMB}MB ]...`;
        }
      }
    };

    loader.load(
      primaryUrl,
      handleSuccess,
      handleProgress,
      () => {
        const fallbackUrl = './public/' + primaryUrl.replace(/^\.\//, '');
        loader.load(fallbackUrl, handleSuccess, handleProgress, (err) => {
          console.warn('[TitanShowcase] GLB Load warning:', err);
          if (progressText) {
            progressText.textContent = 'TITAN MECHA CACHED // PBR TEXTURE HUD ACTIVE';
          }
        });
      }
    );
  }

  toggleWireframe() {
    if (!this.model) return;
    this.isWireframe = !this.isWireframe;
    this.model.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => (m.wireframe = this.isWireframe));
        } else {
          child.material.wireframe = this.isWireframe;
        }
      }
    });

    const btn = document.getElementById('btn-titan-wireframe');
    if (btn) {
      btn.classList.toggle('active', this.isWireframe);
      btn.textContent = this.isWireframe ? 'MODE: CAD WIREFRAME' : 'MODE: PBR SHADED';
    }
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    const tick = () => {
      if (!this.isRunning) return;
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.pause();
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
    }
  }
}
