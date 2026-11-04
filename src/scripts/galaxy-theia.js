import * as THREE from 'three';

function resolveAssetUrl(relPath) {
  return relPath.replace(/^\.\/public\//, './');
}

/**
 * Galaxy Background Controller (galaxythree-js integration)
 * Renders a massive 75,000-particle spiral galaxy behind the Hackathons section.
 * Uses Grevix Orange (#FF4400), Pink (#E285A9), and Cosmic Cyan/Blue (#00E5FF).
 */
export class GalaxyBackgroundController {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isRunning = false;
    this.rafId = null;
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    this.parameters = {
      count: 75000,
      size: 0.016,
      radius: 6.5,
      branches: 3,
      spin: 1.1,
      randomness: 0.22,
      randomnessPower: 3.2,
      insideColor: '#ff4400',  // Grevix Orange
      midColor: '#e285a9',     // Grevix Pink
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
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this.camera.position.set(-4.5, 3.2, 3.8);
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

      // 3-way color gradient along spiral radius
      const normalizedR = radius / this.parameters.radius;
      const mixedColor = colorInside.clone();
      if (normalizedR < 0.45) {
        mixedColor.lerp(colorMid, normalizedR / 0.45);
      } else {
        mixedColor.copy(colorMid).lerp(colorOutside, (normalizedR - 0.45) / 0.55);
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

    const hackathonSection = document.getElementById('section-hackathons');
    if (hackathonSection) {
      hackathonSection.addEventListener('mousemove', (e) => {
        const rect = hackathonSection.getBoundingClientRect();
        this.mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        this.mouse.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      }, { passive: true });
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
    const elapsed = this.clock.getElapsedTime();

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    if (this.galaxyPoints) {
      this.galaxyPoints.rotation.y = elapsed * 0.04;
      this.galaxyPoints.rotation.x = this.mouse.y * 0.12;
      this.galaxyPoints.rotation.z = this.mouse.x * 0.08;
    }

    this.camera.position.x = -4.5 + this.mouse.x * 0.5;
    this.camera.position.y = 3.2 - this.mouse.y * 0.4;
    this.camera.lookAt(0, 0, 0);

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
 * Floating 3D Celestial Accent: Theia Prime (Frozen Ice Giant) & 3 Orbiting Moons
 * Features:
 * - High-res ice planet texture map
 * - 3 Distinct Orbiting Moons (Eris, Moon 2, Moon 3)
 * - Atmospheric ice rim lighting
 * - Interactive mouse tilt & orbital trajectory rings
 */
export class TheiaPrimeCelestialAccent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isRunning = false;
    this.rafId = null;
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    this.initScene();
    this.initLighting();
    this.loadBodies();
    this.initEvents();
    this.resume();
  }

  initScene() {
    const width = this.container.clientWidth || 300;
    const height = this.container.clientHeight || 260;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 1.2, 5.8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
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

    this.systemGroup = new THREE.Group();
    this.scene.add(this.systemGroup);
  }

  initLighting() {
    const ambientLight = new THREE.AmbientLight(0xddeeff, 0.55);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 4, 5);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.5);
    rimLight.position.set(-6, -2, -4);
    this.scene.add(rimLight);
  }

  loadBodies() {
    const loader = new THREE.TextureLoader();

    const loadWithFallback = (path) => {
      const primaryUrl = resolveAssetUrl(path);
      return loader.load(
        primaryUrl,
        undefined,
        undefined,
        () => {
          const fallbackUrl = './public/' + primaryUrl.replace(/^\.\//, '');
          loader.load(fallbackUrl);
        }
      );
    };

    // Theia Prime - Frozen Ice Giant
    const iceTexture = loadWithFallback(
      './assets/new_3D/theia-prime-g-frozen-ice-giant-moons/textures/ice_planet_textur.jpeg'
    );
    const theiaGeom = new THREE.SphereGeometry(1.2, 48, 48);
    const theiaMat = new THREE.MeshStandardMaterial({
      map: iceTexture,
      roughness: 0.4,
      metalness: 0.1
    });
    this.theiaMesh = new THREE.Mesh(theiaGeom, theiaMat);
    this.theiaMesh.rotation.z = 0.28;
    this.systemGroup.add(this.theiaMesh);

    // Icy Atmospheric Rim Lighting
    const glowGeom = new THREE.SphereGeometry(1.26, 48, 48);
    const glowMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x67e8f9) }
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
          float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_FragColor = vec4(glowColor, intensity * 0.7);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    this.theiaGlow = new THREE.Mesh(glowGeom, glowMat);
    this.theiaMesh.add(this.theiaGlow);

    // Moons Definitions
    this.moons = [];

    // Moon 1: Eris (Frozen Ice Moon)
    const erisTexture = loadWithFallback(
      './assets/new_3D/theia-prime-g-frozen-ice-giant-moons/textures/4k_eris_fictional.jpeg'
    );
    const moon1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 32, 32),
      new THREE.MeshStandardMaterial({ map: erisTexture, roughness: 0.8 })
    );
    this.moons.push({ mesh: moon1, radius: 1.95, speed: 0.45, tilt: 0.15, phase: 0 });
    this.systemGroup.add(moon1);

    // Moon 2: Inner Moon
    const moon2Texture = loadWithFallback(
      './assets/new_3D/theia-prime-g-frozen-ice-giant-moons/textures/moon_2.jpeg'
    );
    const moon2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 24, 24),
      new THREE.MeshStandardMaterial({ map: moon2Texture, roughness: 0.9 })
    );
    this.moons.push({ mesh: moon2, radius: 2.5, speed: -0.32, tilt: -0.25, phase: 2.1 });
    this.systemGroup.add(moon2);

    // Moon 3: Outer Distant Moon
    const moon3Texture = loadWithFallback(
      './assets/new_3D/theia-prime-g-frozen-ice-giant-moons/textures/moon_3.jpeg'
    );
    const moon3 = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 24, 24),
      new THREE.MeshStandardMaterial({ map: moon3Texture, roughness: 0.7 })
    );
    this.moons.push({ mesh: moon3, radius: 3.1, speed: 0.22, tilt: 0.35, phase: 4.2 });
    this.systemGroup.add(moon3);

    // Orbital path rings
    this.moons.forEach((m) => {
      const ringGeom = new THREE.BufferGeometry();
      const points = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        points.push(Math.cos(theta) * m.radius, Math.sin(theta) * m.tilt, Math.sin(theta) * m.radius);
      }
      ringGeom.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      const ringMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.18
      });
      const orbitRing = new THREE.Line(ringGeom, ringMat);
      this.systemGroup.add(orbitRing);
    });
  }

  initEvents() {
    this.handleResize = () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth || 300;
      const height = this.container.clientHeight || 260;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };
    window.addEventListener('resize', this.handleResize);

    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      this.mouse.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });
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

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Theia Prime rotation
    if (this.theiaMesh) {
      this.theiaMesh.rotation.y = elapsed * 0.15;
    }

    // Moons orbital mechanics
    this.moons.forEach((m) => {
      const angle = elapsed * m.speed + m.phase;
      m.mesh.position.x = Math.cos(angle) * m.radius;
      m.mesh.position.z = Math.sin(angle) * m.radius;
      m.mesh.position.y = Math.sin(angle) * m.tilt;
      m.mesh.rotation.y = elapsed * 0.4;
    });

    // Subtle system tilt responding to mouse
    this.systemGroup.rotation.x = this.mouse.y * 0.25;
    this.systemGroup.rotation.y = this.mouse.x * 0.35;

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
