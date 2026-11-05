import * as THREE from 'three';
import { cursorState } from './cursor-system.js';

function resolveAsset(path) {
  return path.replace(/^\.\/public\//, './');
}

/**
 * Programs & Tracks Section: 100,000 Particle 3D Spiral Galaxy (galaxythree-js)
 * Features:
 * - 100,000 stars with 3 spiral branches, logarithmic curl, Grevix 3-way color gradient
 * - Continuous 60fps rotational spin behind dark-glass cards
 * - Real-time camera & universe mouse-follow rig (0.06 damping)
 */
export class GalaxyBackgroundController {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isRunning = false;
    this.rafId = null;
    this.clock = new THREE.Clock();

    this.parameters = {
      count: 100000, // Exactly 100k particles as specified in Step 2.2
      size: 0.015,
      radius: 7.2,
      branches: 3,
      spin: 1.15,
      randomness: 0.24,
      randomnessPower: 3.3,
      insideColor: '#ff4400',  // Grevix Flame Orange
      midColor: '#e285a9',     // Grevix Neon Pink
      outsideColor: '#00a6ff'  // Cosmic Cyan/Blue
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

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

      // 3-way color gradient
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
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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

    // Continuous 60fps spin of all 100k stars
    if (this.galaxyPoints) {
      this.galaxyPoints.rotation.y = elapsed * 0.045;
      this.galaxyPoints.rotation.x = my * 0.14;
      this.galaxyPoints.rotation.z = mx * 0.1;
    }

    // Camera mouse follow
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
 * Pixel Planet Kepler-36b 3D Viewport (pixel-planet-kepler-36-b)
 * Rendered beside the Programs & Tracks section header.
 * Uses THREE.NearestFilter for authentic pixel-art exoplanet texture + celestial ring.
 */
export class KeplerPlanetController {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isRunning = false;
    this.rafId = null;
    this.clock = new THREE.Clock();

    this.initScene();
    this.loadKepler();
    this.initEvents();
    this.resume();
  }

  initScene() {
    const width = this.container.clientWidth || 280;
    const height = this.container.clientHeight || 240;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(0, 0.8, 4.6);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // Keep pixel edges crisp
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const canvas = this.renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    this.container.appendChild(canvas);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e6, 2.5);
    sun.position.set(5, 4, 4);
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight(0x00e5ff, 1.4);
    rim.position.set(-5, -2, -3);
    this.scene.add(rim);

    this.keplerGroup = new THREE.Group();
    this.scene.add(this.keplerGroup);
  }

  loadKepler() {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      resolveAsset('./assets/new_3D/pixel-planet-kepler-36-b/textures/SE-0005.png'),
      (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
      }
    );

    // Planet Sphere
    const geom = new THREE.SphereGeometry(1.0, 48, 48);
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.65,
      metalness: 0.15
    });
    this.keplerMesh = new THREE.Mesh(geom, mat);
    this.keplerMesh.rotation.z = -0.25; // Exoplanetary axial tilt
    this.keplerGroup.add(this.keplerMesh);

    // Celestial Planetary Ring
    const ringGeom = new THREE.RingGeometry(1.3, 1.9, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55
    });
    this.keplerRing = new THREE.Mesh(ringGeom, ringMat);
    this.keplerRing.rotation.x = Math.PI / 2.3;
    this.keplerMesh.add(this.keplerRing);
  }

  initEvents() {
    this.handleResize = () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth || 280;
      const height = this.container.clientHeight || 240;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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

    // Continuous axial spin + subtle bobbing
    if (this.keplerMesh) {
      this.keplerMesh.rotation.y = elapsed * 0.35;
    }

    if (this.keplerGroup) {
      this.keplerGroup.position.y = Math.sin(elapsed * 1.2) * 0.1;
      this.keplerGroup.rotation.x = my * 0.2;
      this.keplerGroup.rotation.y = mx * 0.3;
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
