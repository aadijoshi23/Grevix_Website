import * as THREE from 'three';

/**
 * Universal Asset URL Resolver
 * Resolves both root-relative './assets/...' and './public/assets/...' paths
 */
function resolveAssetUrl(relPath) {
  return relPath.replace(/^\.\/public\//, './');
}

/**
 * Procedural High-Resolution Exoplanet Surface Generator
 * Generates rich 2048x1024 planetary bands with crisp micro-features
 */
function createProceduralExoTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  const baseGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  baseGrad.addColorStop(0.0, '#0c1a2e');
  baseGrad.addColorStop(0.18, '#1e3a5f');
  baseGrad.addColorStop(0.36, '#0284c7');
  baseGrad.addColorStop(0.50, '#f97316'); // Grevix Warm Flame
  baseGrad.addColorStop(0.64, '#e285a9'); // Grevix Pink
  baseGrad.addColorStop(0.82, '#0369a1');
  baseGrad.addColorStop(1.0, '#020617');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Micro-harmonic atmospheric bands
  for (let y = 0; y < 1024; y += 2) {
    const normY = y / 1024;
    const bandSine = Math.sin(normY * 36.0) * 0.5 + 0.5;
    const microSine = Math.sin(normY * 140.0 + Math.cos(normY * 20.0) * 3.5) * 0.5 + 0.5;
    const alpha = (bandSine * 0.35 + microSine * 0.3) * 0.45;

    ctx.fillStyle = (normY > 0.42 && normY < 0.60)
      ? `rgba(255, 120, 50, ${alpha})`
      : `rgba(0, 229, 255, ${alpha})`;
    ctx.fillRect(0, y, 2048, 2);
  }

  // Atmospheric storms and vortices
  for (let i = 0; i < 32; i++) {
    const cx = (i * 153.7) % 2048;
    const cy = 190 + ((i * 73.1) % 640);
    const rw = 40 + (i % 5) * 20;
    const rh = 12 + (i % 4) * 7;
    const stormGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rw);
    stormGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    stormGrad.addColorStop(0.4, 'rgba(0, 229, 255, 0.28)');
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

function createProceduralExoRingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 64);

  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.07, 'rgba(0, 229, 255, 0.3)');
  grad.addColorStop(0.26, 'rgba(255, 255, 255, 0.88)');
  grad.addColorStop(0.45, 'rgba(255, 120, 40, 0.75)');
  grad.addColorStop(0.50, 'rgba(0, 0, 0, 0.05)'); // Cassini Division
  grad.addColorStop(0.56, 'rgba(0, 229, 255, 0.7)');
  grad.addColorStop(0.78, 'rgba(226, 133, 169, 0.75)');
  grad.addColorStop(0.92, 'rgba(0, 229, 255, 0.4)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 64);

  for (let x = 70; x < 950; x += 3) {
    const alpha = Math.sin(x * 0.4) * 0.16 + 0.1;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(x, 0, 1.5, 64);
  }

  return new THREE.CanvasTexture(canvas);
}

/**
 * About Section: Miller's Planet & Procedural Ringed Celestial Engine
 * Features:
 * - Miller's Planet: High-res ocean world texture + Atmospheric Fresnel Rim Lighting (128x128 segments)
 * - Procedural Ringed Planet: High-res shader sphere + 128x64 Cassini ring (replaces low-res Kepler-36b)
 * - Native Retina / 4K resolution (devicePixelRatio up to 3)
 * - Max texture anisotropy & LinearMipmapLinearFilter
 * - Slow orbital rotation + interactive mouse parallax tilt
 * - Multi-view camera focus switching (Dual Orbit, Miller's World, Exoplanet World)
 */
export class AboutPlanetsController {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isRunning = false;
    this.rafId = null;
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.activeFocus = 'dual'; // 'dual', 'millers', 'kepler'

    this.initScene();
    this.initLighting();
    this.loadTextures();
    this.initEvents();
    this.resume();
  }

  initScene() {
    const width = this.container.clientWidth || 380;
    const height = this.container.clientHeight || 420;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.2, 7.8);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 3));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    const canvas = this.renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    this.container.appendChild(canvas);

    // Root group for mouse parallax
    this.orbitGroup = new THREE.Group();
    this.scene.add(this.orbitGroup);
  }

  initLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Primary Solar Keylight
    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.6);
    keyLight.position.set(8, 4, 6);
    this.scene.add(keyLight);

    // Grevix Secondary Rim Light (Cyan/Blue oceanic backlight)
    const rimLight = new THREE.DirectionalLight(0x00d2ff, 2.0);
    rimLight.position.set(-8, -2, -6);
    this.scene.add(rimLight);

    // Grevix Accent Warm Light
    const orangeLight = new THREE.PointLight(0xff4400, 1.4, 20);
    orangeLight.position.set(2, 3, -2);
    this.scene.add(orangeLight);
  }

  loadTextures() {
    const textureLoader = new THREE.TextureLoader();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    const configureTexture = (tex) => {
      if (!tex) return;
      tex.anisotropy = maxAniso;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
    };

    const loadTextureWithFallback = (path, onLoaded) => {
      const primaryUrl = resolveAssetUrl(path);
      return textureLoader.load(
        primaryUrl,
        (tex) => {
          configureTexture(tex);
          if (onLoaded) onLoaded(tex);
        },
        undefined,
        () => {
          const fallbackUrl = './public/' + primaryUrl.replace(/^\.\//, '');
          textureLoader.load(fallbackUrl, (tex) => {
            configureTexture(tex);
            if (onLoaded) onLoaded(tex);
          });
        }
      );
    };

    // 1. Miller's Planet (Interstellar Ocean Planet)
    const millersDiffuse = loadTextureWithFallback(
      './assets/new_3D/millers-planet-interstellar/textures/ef362dae-eeee-4ed8-8810-42ee5ea61847.png'
    );
    const millersNormal = loadTextureWithFallback(
      './assets/new_3D/millers-planet-interstellar/textures/41f4fbb5-94c5-47de-a910-1310b02f8337.png'
    );
    const millersRoughness = loadTextureWithFallback(
      './assets/new_3D/millers-planet-interstellar/textures/b00d38e4-2feb-466f-a79a-6467b926f3cf.png'
    );

    // Miller's Planet Mesh with 128x128 Segments
    const millersGeom = new THREE.SphereGeometry(1.6, 128, 128);
    const millersMat = new THREE.MeshStandardMaterial({
      map: millersDiffuse,
      normalMap: millersNormal,
      roughnessMap: millersRoughness,
      roughness: 0.32,
      metalness: 0.1
    });

    this.millersMesh = new THREE.Mesh(millersGeom, millersMat);
    this.millersMesh.position.set(-1.4, 0.1, 0);
    this.millersMesh.rotation.z = 0.15;
    this.orbitGroup.add(this.millersMesh);

    // Atmospheric Rim Lighting Fresnel Glow (128x128 segments)
    const atmosphereGeom = new THREE.SphereGeometry(1.68, 128, 128);
    const atmosphereMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x38bdf8) },
        viewVector: { value: this.camera.position }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec3 vCam = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
          intensity = pow(1.0 - abs(dot(vNormal, vCam)), 2.8);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          gl_FragColor = vec4(glowColor * 1.5, intensity * 0.88);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    this.millersAtmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMat);
    this.millersMesh.add(this.millersAtmosphere);

    // 2. High-Segment Procedural Ringed Planet (Replaces low-res Kepler-36b)
    const exoTexture = createProceduralExoTexture();
    configureTexture(exoTexture);

    const keplerGeom = new THREE.SphereGeometry(0.95, 128, 128);
    const keplerMat = new THREE.MeshStandardMaterial({
      map: exoTexture,
      roughness: 0.38,
      metalness: 0.12
    });

    this.keplerMesh = new THREE.Mesh(keplerGeom, keplerMat);
    this.keplerMesh.position.set(2.2, -0.4, 0.4);
    this.keplerMesh.rotation.z = -0.26;
    this.orbitGroup.add(this.keplerMesh);

    // High-Segment Planetary Ring with (128, 64) segments
    const exoRingTexture = createProceduralExoRingTexture();
    configureTexture(exoRingTexture);

    const ringGeom = new THREE.RingGeometry(1.25, 2.05, 128, 64);
    const ringPos = ringGeom.attributes.position;
    const ringUvs = ringGeom.attributes.uv;
    for (let i = 0; i < ringPos.count; i++) {
      const rx = ringPos.getX(i);
      const ry = ringPos.getY(i);
      const rad = Math.sqrt(rx * rx + ry * ry);
      const u = (rad - 1.25) / (2.05 - 1.25);
      ringUvs.setXY(i, u, 0.5);
    }
    ringUvs.needsUpdate = true;

    const ringMat = new THREE.MeshStandardMaterial({
      map: exoRingTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      roughness: 0.5,
      metalness: 0.1
    });
    this.keplerRing = new THREE.Mesh(ringGeom, ringMat);
    this.keplerRing.rotation.x = Math.PI / 2.3;
    this.keplerMesh.add(this.keplerRing);

    // Cyan Atmospheric Fresnel Rim Glow (128x128 segments)
    const exoAtmoGeom = new THREE.SphereGeometry(1.01, 128, 128);
    const exoAtmoMat = new THREE.ShaderMaterial({
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
          gl_FragColor = vec4(glowColor * 1.5, intensity * 0.88);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    const exoAtmoMesh = new THREE.Mesh(exoAtmoGeom, exoAtmoMat);
    this.keplerMesh.add(exoAtmoMesh);

    // Orbital Path Trajectory Ring (Stylized HUD telemetry ring)
    const orbitPathGeom = new THREE.BufferGeometry();
    const orbitPoints = [];
    const radiusX = 2.4;
    const radiusZ = 1.6;
    for (let i = 0; i <= 128; i++) {
      const theta = (i / 128) * Math.PI * 2;
      orbitPoints.push(
        Math.cos(theta) * radiusX,
        Math.sin(theta) * 0.15,
        Math.sin(theta) * radiusZ
      );
    }
    orbitPathGeom.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
    const orbitPathMat = new THREE.LineBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.3
    });
    this.orbitLine = new THREE.Line(orbitPathGeom, orbitPathMat);
    this.orbitLine.position.set(0.4, -0.2, 0);
    this.orbitGroup.add(this.orbitLine);
  }

  initEvents() {
    this.handleResize = () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth || 380;
      const height = this.container.clientHeight || 420;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 3));
    };
    window.addEventListener('resize', this.handleResize);

    const aboutSection = document.getElementById('section-about') || this.container;
    aboutSection.addEventListener('mousemove', (e) => {
      const rect = aboutSection.getBoundingClientRect();
      this.mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      this.mouse.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });
  }

  setFocus(mode) {
    this.activeFocus = mode;
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

    // Mouse parallax lerping
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Slow orbital rotation of Miller's Planet
    if (this.millersMesh) {
      this.millersMesh.rotation.y = elapsed * 0.12;
    }

    // Exoplanet: Axial spin + slow orbital revolution around common barycenter
    if (this.keplerMesh) {
      this.keplerMesh.rotation.y = elapsed * 0.28;
      const orbitSpeed = elapsed * 0.18;
      this.keplerMesh.position.x = 0.4 + Math.cos(orbitSpeed) * 2.2;
      this.keplerMesh.position.z = Math.sin(orbitSpeed) * 1.5;
      this.keplerMesh.position.y = -0.2 + Math.sin(orbitSpeed * 1.5) * 0.25;
    }

    // Camera targets based on active focus mode
    let targetCamPos = { x: 0, y: 1.0, z: 7.2 };
    let targetLook = { x: 0, y: 0, z: 0 };

    if (this.activeFocus === 'millers' && this.millersMesh) {
      targetCamPos = {
        x: this.millersMesh.position.x + 0.3,
        y: this.millersMesh.position.y + 0.4,
        z: 4.6
      };
      targetLook = {
        x: this.millersMesh.position.x,
        y: this.millersMesh.position.y,
        z: this.millersMesh.position.z
      };
    } else if (this.activeFocus === 'kepler' && this.keplerMesh) {
      targetCamPos = {
        x: this.keplerMesh.position.x + 0.2,
        y: this.keplerMesh.position.y + 0.3,
        z: this.keplerMesh.position.z + 3.2
      };
      targetLook = {
        x: this.keplerMesh.position.x,
        y: this.keplerMesh.position.y,
        z: this.keplerMesh.position.z
      };
    }

    // Parallax tilt applied to camera
    this.camera.position.x += (targetCamPos.x + this.mouse.x * 0.6 - this.camera.position.x) * 0.04;
    this.camera.position.y += (targetCamPos.y - this.mouse.y * 0.4 - this.camera.position.y) * 0.04;
    this.camera.position.z += (targetCamPos.z - this.camera.position.z) * 0.04;

    this.cameraTarget.x += (targetLook.x - this.cameraTarget.x) * 0.04;
    this.cameraTarget.y += (targetLook.y - this.cameraTarget.y) * 0.04;
    this.cameraTarget.z += (targetLook.z - this.cameraTarget.z) * 0.04;
    this.camera.lookAt(this.cameraTarget);

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
