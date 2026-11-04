import * as THREE from 'three';

/**
 * Universal Asset URL Resolver
 * Resolves both root-relative './assets/...' and './public/assets/...' paths
 */
function resolveAssetUrl(relPath) {
  const clean = relPath.replace(/^\.\/public\//, './');
  return clean;
}

/**
 * About Section: Miller's Planet & Kepler-36b Celestial Engine
 * Features:
 * - Miller's Planet: High-res ocean world texture + Atmospheric Fresnel Rim Lighting
 * - Kepler-36b: Pixel-art exoplanet texture with NearestFilter + Celestial Ring
 * - Slow orbital rotation + interactive mouse parallax tilt
 * - Multi-view camera focus switching (Dual Orbit, Miller's World, Kepler-36b)
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Primary Solar Keylight
    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.4);
    keyLight.position.set(8, 4, 6);
    this.scene.add(keyLight);

    // Grevix Secondary Rim Light (Cyan/Blue oceanic backlight)
    const rimLight = new THREE.DirectionalLight(0x00d2ff, 1.8);
    rimLight.position.set(-8, -2, -6);
    this.scene.add(rimLight);

    // Grevix Accent Warm Light
    const orangeLight = new THREE.PointLight(0xff4400, 1.2, 20);
    orangeLight.position.set(2, 3, -2);
    this.scene.add(orangeLight);
  }

  loadTextures() {
    const textureLoader = new THREE.TextureLoader();

    const loadTextureWithFallback = (path, onLoaded) => {
      const primaryUrl = resolveAssetUrl(path);
      return textureLoader.load(
        primaryUrl,
        (tex) => {
          if (onLoaded) onLoaded(tex);
        },
        undefined,
        () => {
          // Fallback with ./public/ prefix if primary fails
          const fallbackUrl = './public/' + primaryUrl.replace(/^\.\//, '');
          textureLoader.load(fallbackUrl, (tex) => {
            if (onLoaded) onLoaded(tex);
          });
        }
      );
    };

    // 1. Miller's Planet (Interstellar)
    const millersDiffuse = loadTextureWithFallback(
      './assets/new_3D/millers-planet-interstellar/textures/ef362dae-eeee-4ed8-8810-42ee5ea61847.png'
    );
    const millersNormal = loadTextureWithFallback(
      './assets/new_3D/millers-planet-interstellar/textures/41f4fbb5-94c5-47de-a910-1310b02f8337.png'
    );
    const millersRoughness = loadTextureWithFallback(
      './assets/new_3D/millers-planet-interstellar/textures/b00d38e4-2feb-466f-a79a-6467b926f3cf.png'
    );

    // Miller's Planet Mesh
    const millersGeom = new THREE.SphereGeometry(1.6, 64, 64);
    const millersMat = new THREE.MeshStandardMaterial({
      map: millersDiffuse,
      normalMap: millersNormal,
      roughnessMap: millersRoughness,
      roughness: 0.35,
      metalness: 0.1
    });

    this.millersMesh = new THREE.Mesh(millersGeom, millersMat);
    this.millersMesh.position.set(-1.4, 0.1, 0);
    this.millersMesh.rotation.z = 0.15; // Realistic axial tilt
    this.orbitGroup.add(this.millersMesh);

    // Atmospheric Rim Lighting Fresnel Glow
    const atmosphereGeom = new THREE.SphereGeometry(1.68, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x38bdf8) }, // Light Cyan Ocean Atmosphere
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
          gl_FragColor = vec4(glowColor * 1.4, intensity * 0.85);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    this.millersAtmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMat);
    this.millersMesh.add(this.millersAtmosphere);

    // 2. Kepler-36b (Pixel Exoplanet)
    const keplerTexture = loadTextureWithFallback(
      './assets/new_3D/pixel-planet-kepler-36-b/textures/SE-0005.png',
      (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
      }
    );

    const keplerGeom = new THREE.SphereGeometry(0.85, 48, 48);
    const keplerMat = new THREE.MeshStandardMaterial({
      map: keplerTexture,
      roughness: 0.7,
      metalness: 0.15
    });

    this.keplerMesh = new THREE.Mesh(keplerGeom, keplerMat);
    this.keplerMesh.position.set(2.2, -0.4, 0.4);
    this.keplerMesh.rotation.z = -0.22;
    this.orbitGroup.add(this.keplerMesh);

    // Kepler-36b Celestial Planetary Ring
    const ringGeom = new THREE.RingGeometry(1.1, 1.65, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    this.keplerRing = new THREE.Mesh(ringGeom, ringMat);
    this.keplerRing.rotation.x = Math.PI / 2.3;
    this.keplerMesh.add(this.keplerRing);

    // Orbital Path Trajectory Ring (Stylized HUD telemetry ring)
    const orbitPathGeom = new THREE.BufferGeometry();
    const orbitPoints = [];
    const radiusX = 2.4;
    const radiusZ = 1.6;
    for (let i = 0; i <= 100; i++) {
      const theta = (i / 100) * Math.PI * 2;
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
      opacity: 0.25
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
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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

    // Kepler-36b: Axial spin + slow orbital revolution around common barycenter
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
