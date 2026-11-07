import * as THREE from 'three';
import { cursorState } from './cursor-system.js';

/**
 * Programs & Tracks Section: 100,000 Particle 3D Spiral Galaxy (galaxythree-js)
 * Features:
 * - 100,000 stars with 3 spiral branches, logarithmic curl, Grevix 3-way color gradient
 * - Continuous 60fps rotational spin behind dark-glass cards
 * - Real-time camera & universe mouse-follow rig (0.05 damping)
 * - Native Retina / 4K resolution (devicePixelRatio up to 3)
 */
export class GalaxyBackgroundController {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isRunning = false;
    this.rafId = null;
    this.clock = new THREE.Clock();

    this.parameters = {
      count: 100000,
      size: 0.015,
      radius: 7.2,
      branches: 3,
      spin: 1.15,
      randomness: 0.24,
      randomnessPower: 3.3,
      insideColor: '#ff4400',
      midColor: '#e285a9',
      outsideColor: '#00a6ff'
    };

    this.initScene();
    this.generateGalaxy();
    this.initEvents();
    this.resume();
  }

  initScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    this.baseCamPos = new THREE.Vector3(-4.8, 3.4, 4.2);
    this.camera.position.copy(this.baseCamPos);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 3));

    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    this.container.appendChild(canvas);
  }

  generateGalaxy() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.parameters.count * 3);
    const colors = new Float32Array(this.parameters.count * 3);

    const colorInside = new THREE.Color(this.parameters.insideColor);
    const colorMid = new THREE.Color(this.parameters.midColor);
    const colorOutside = new THREE.Color(this.parameters.outsideColor);

    for (let i = 0; i < this.parameters.count; i++) {
      const i3 = i * 3;
      const radius = Math.random() * this.parameters.radius;
      const spinAngle = radius * this.parameters.spin;
      const branchAngle = ((i % this.parameters.branches) / this.parameters.branches) * Math.PI * 2;

      const randomX =
        Math.pow(Math.random(), this.parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        this.parameters.randomness *
        radius;
      const randomY =
        Math.pow(Math.random(), this.parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        this.parameters.randomness *
        radius;
      const randomZ =
        Math.pow(Math.random(), this.parameters.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        this.parameters.randomness *
        radius;

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      positions[i3 + 1] = randomY;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      const normalizedR = radius / this.parameters.radius;
      const mixedColor = colorInside.clone();
      if (normalizedR < 0.42) {
        mixedColor.lerp(colorMid, normalizedR / 0.42);
      } else {
        mixedColor.copy(colorMid).lerp(colorOutside, (normalizedR - 0.42) / 0.58);
      }

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.parameters.size,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    this.galaxyPoints = new THREE.Points(geometry, material);
    this.scene.add(this.galaxyPoints);
  }

  initEvents() {
    this.handleResize = () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 3));
    };
    window.addEventListener('resize', this.handleResize);
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
    const elapsed = this.clock.getElapsedTime();
    const mx = cursorState.lerpedX;
    const my = cursorState.lerpedY;

    if (this.galaxyPoints) {
      this.galaxyPoints.rotation.y = elapsed * 0.045;
      this.galaxyPoints.rotation.x = my * 0.14;
      this.galaxyPoints.rotation.z = mx * 0.1;
    }

    this.camera.position.x = this.baseCamPos.x + mx * 0.8;
    this.camera.position.y = this.baseCamPos.y - my * 0.6;
    this.camera.lookAt(mx * 0.2, -my * 0.15, 0);

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.pause();
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
    }
  }
}

/**
 * High-Resolution Procedural Texture Generators
 * Generates crisp 2048x1024 PBR textures with zero pixelation or stair-stepping.
 */
function createProceduralPlanetTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Deep planetary base gradient
  const baseGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  baseGrad.addColorStop(0.0, '#040b17');
  baseGrad.addColorStop(0.12, '#0f2744');
  baseGrad.addColorStop(0.28, '#0284c7');
  baseGrad.addColorStop(0.42, '#38bdf8');
  baseGrad.addColorStop(0.50, '#f97316'); // Grevix High-Energy Orange Accent
  baseGrad.addColorStop(0.58, '#e285a9'); // Grevix Neon Pink
  baseGrad.addColorStop(0.72, '#0369a1');
  baseGrad.addColorStop(0.88, '#0c1a2e');
  baseGrad.addColorStop(1.0, '#030712');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Micro-harmonic atmospheric bands
  for (let y = 0; y < 1024; y += 2) {
    const normY = y / 1024;
    const bandSine = Math.sin(normY * 42.0) * 0.5 + 0.5;
    const microSine = Math.sin(normY * 160.0 + Math.cos(normY * 24.0) * 4.0) * 0.5 + 0.5;
    const alpha = (bandSine * 0.35 + microSine * 0.3) * 0.45;

    ctx.fillStyle = (normY > 0.42 && normY < 0.62)
      ? `rgba(255, 120, 60, ${alpha})`
      : `rgba(0, 229, 255, ${alpha})`;
    ctx.fillRect(0, y, 2048, 2);
  }

  // Atmospheric storms and vortices
  for (let i = 0; i < 36; i++) {
    const cx = (i * 147.3) % 2048;
    const cy = 180 + ((i * 79.4) % 660);
    const rw = 45 + (i % 6) * 22;
    const rh = 14 + (i % 4) * 8;
    const stormGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rw);
    stormGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    stormGrad.addColorStop(0.4, 'rgba(0, 229, 255, 0.3)');
    stormGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = stormGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw, rh, (i % 3) * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createProceduralRingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 64);

  // Radial band gradient across width (inner to outer radius)
  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.06, 'rgba(0, 229, 255, 0.3)');
  grad.addColorStop(0.24, 'rgba(255, 255, 255, 0.88)');
  grad.addColorStop(0.44, 'rgba(255, 110, 30, 0.75)');
  grad.addColorStop(0.49, 'rgba(0, 0, 0, 0.05)'); // Cassini Division
  grad.addColorStop(0.55, 'rgba(0, 229, 255, 0.7)');
  grad.addColorStop(0.76, 'rgba(226, 133, 169, 0.75)');
  grad.addColorStop(0.92, 'rgba(0, 229, 255, 0.4)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 64);

  // Micro-ringlet fine divisions
  for (let x = 60; x < 960; x += 3) {
    const alpha = Math.sin(x * 0.45) * 0.18 + 0.12;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(x, 0, 1.5, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * High-Segment Procedural Ringed Planet 3D Viewport
 * Replaces low-resolution pixel-planet-kepler-36-b model.
 * Features:
 * - SphereGeometry(1.0, 128, 128)
 * - RingGeometry(1.3, 2.25, 128, 64)
 * - Max Anisotropy & LinearMipmapLinearFilter on textures
 * - Native Retina / 4K resolution (devicePixelRatio up to 3)
 * - Antialias: true, high-performance
 */
export class KeplerPlanetController {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isRunning = false;
    this.rafId = null;
    this.clock = new THREE.Clock();

    this.initScene();
    this.buildProceduralPlanet();
    this.initEvents();
    this.resume();
  }

  initScene() {
    const width = this.container.clientWidth || 280;
    const height = this.container.clientHeight || 240;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0.7, 4.5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 3));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    const canvas = this.renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    this.container.appendChild(canvas);

    // Dynamic Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e6, 3.2);
    sun.position.set(5, 4, 4);
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight(0x00e5ff, 2.2);
    rim.position.set(-5, -2, -3);
    this.scene.add(rim);

    this.planetGroup = new THREE.Group();
    this.scene.add(this.planetGroup);
  }

  buildProceduralPlanet() {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    // 1. Planet Sphere with (128, 128) segments
    const texture = createProceduralPlanetTexture();
    texture.anisotropy = maxAniso;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;

    const geom = new THREE.SphereGeometry(1.0, 128, 128);
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.32,
      metalness: 0.12
    });
    this.planetMesh = new THREE.Mesh(geom, mat);
    this.planetMesh.rotation.z = -0.28; // Axial tilt
    this.planetGroup.add(this.planetMesh);

    // 2. High-Segment Ring with (128, 64) segments
    const ringTexture = createProceduralRingTexture();
    ringTexture.anisotropy = maxAniso;
    ringTexture.minFilter = THREE.LinearMipmapLinearFilter;
    ringTexture.magFilter = THREE.LinearFilter;
    ringTexture.generateMipmaps = true;
    ringTexture.needsUpdate = true;

    const ringGeom = new THREE.RingGeometry(1.3, 2.25, 128, 64);
    // Align ring UV coordinates radially for smooth gradient mapping
    const pos = ringGeom.attributes.position;
    const uvs = ringGeom.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      const u = (r - 1.3) / (2.25 - 1.3);
      uvs.setXY(i, u, 0.5);
    }
    uvs.needsUpdate = true;

    const ringMat = new THREE.MeshStandardMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
      roughness: 0.45,
      metalness: 0.1
    });
    this.planetRing = new THREE.Mesh(ringGeom, ringMat);
    this.planetRing.rotation.x = Math.PI / 2.3;
    this.planetMesh.add(this.planetRing);

    // 3. Cyan Atmospheric Fresnel Rim Glow (128, 128 segments)
    const atmoGeom = new THREE.SphereGeometry(1.06, 128, 128);
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x00e5ff) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.6);
          gl_FragColor = vec4(glowColor * 1.6, intensity * 0.9);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    const atmoMesh = new THREE.Mesh(atmoGeom, atmoMat);
    this.planetMesh.add(atmoMesh);
  }

  initEvents() {
    this.handleResize = () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth || 280;
      const height = this.container.clientHeight || 240;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 3));
    };
    window.addEventListener('resize', this.handleResize);
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
    const elapsed = this.clock.getElapsedTime();
    const mx = cursorState.lerpedX;
    const my = cursorState.lerpedY;

    if (this.planetMesh) {
      this.planetMesh.rotation.y = elapsed * 0.28;
    }

    if (this.planetGroup) {
      this.planetGroup.position.y = Math.sin(elapsed * 1.1) * 0.08;
      this.planetGroup.rotation.x = my * 0.16;
      this.planetGroup.rotation.y = mx * 0.22;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.pause();
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
    }
  }
}

// Alias export for backwards compatibility
export const ExoplanetShowcaseController = KeplerPlanetController;
