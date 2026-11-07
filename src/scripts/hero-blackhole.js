import * as THREE from 'three';
import { cursorState } from './cursor-system.js';

function resolveAsset(path) {
  return path.replace(/^\.\/public\//, './');
}

/**
 * Hero Section 3D Black Hole + Orbiting Planets (Theia Prime & Miller's Planet) + Seinen Manga 3D Layer
 * Powered by:
 * - three-js-black-hole-with-shaders (Accretion disk GLSL + Event horizon fresnel)
 * - interactive-blackhole (Gravitational ripple & Keplerian stellar collapse/expansion)
 * - theia-prime-g-frozen-ice-giant-moons (Ice giant with 3D rings & 3 orbiting moons)
 * - millers-planet-interstellar (Ocean planet with PBR normal/roughness textures)
 * - Seinen Manga visual layer (3D Floating Asteroid Shards, Kanji "宇宙" & "限界", Screentone depth)
 * - Whole-universe Mouse-Following 3D Camera Rig
 */
export class HeroBlackHoleController {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isRunning = false;
    this.rafId = null;
    this.clock = new THREE.Clock();

    // Black Hole Dimensions
    this.BLACK_HOLE_RADIUS = 1.35;
    this.DISK_INNER_RADIUS = 1.55;
    this.DISK_OUTER_RADIUS = 8.2;
    this.DISK_TILT_ANGLE = Math.PI / 3.1;

    // Interactive Shockwave Uniforms
    this.shockwave = {
      active: false,
      progress: 0,
      strength: 0
    };

    this.initScene();
    this.initStarfield();
    this.initBlackHole();
    this.initTheiaPrime();
    this.initMillersPlanet();
    this.initManga3DLayer();
    this.initEvents();
    this.resume();
  }

  initScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050508, 0.016);

    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 4000);
    this.baseCamPos = new THREE.Vector3(-6.2, 4.6, 8.2);
    this.camera.position.copy(this.baseCamPos);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 3));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none'; // Background stays non-blocking
    this.container.appendChild(canvas);

    // Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0x0c0c16, 1.2);
    this.scene.add(ambientLight);

    // Singularity Core Light (accretion disk radiation)
    this.singularityLight = new THREE.PointLight(0xff5500, 4.5, 40);
    this.singularityLight.position.set(0, 0, 0);
    this.scene.add(this.singularityLight);

    // Deep Space Cyan Backlight
    const rimLight = new THREE.DirectionalLight(0x00e5ff, 1.6);
    rimLight.position.set(-15, 8, -10);
    this.scene.add(rimLight);
  }

  initStarfield() {
    const starCount = 20000;
    this.starGeometry = new THREE.BufferGeometry();
    this.starPositions = new Float32Array(starCount * 3);
    this.starBasePositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starTwinkle = new Float32Array(starCount);
    const starFieldRadius = 1800;

    const starPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xff4400), // Grevix flame orange
      new THREE.Color(0xe285a9), // Grevix neon pink
      new THREE.Color(0x00e5ff), // SpaceX / Cosmic cyan
      new THREE.Color(0x7744ff), // Deep violet
      new THREE.Color(0xffd580)  // Warm star
    ];

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const phi = Math.acos(-1 + (2 * i) / starCount);
      const theta = Math.sqrt(starCount * Math.PI) * phi;
      const radius = Math.cbrt(Math.random()) * starFieldRadius + 80;

      const px = radius * Math.sin(phi) * Math.cos(theta);
      const py = radius * Math.sin(phi) * Math.sin(theta);
      const pz = radius * Math.cos(phi);

      this.starPositions[i3] = px;
      this.starPositions[i3 + 1] = py;
      this.starPositions[i3 + 2] = pz;

      this.starBasePositions[i3] = px;
      this.starBasePositions[i3 + 1] = py;
      this.starBasePositions[i3 + 2] = pz;

      const color = starPalette[Math.floor(Math.random() * starPalette.length)].clone();
      color.multiplyScalar(Math.random() * 0.7 + 0.35);
      starColors[i3] = color.r;
      starColors[i3 + 1] = color.g;
      starColors[i3 + 2] = color.b;

      starSizes[i] = THREE.MathUtils.randFloat(0.9, 3.2);
      starTwinkle[i] = Math.random() * Math.PI * 2;
    }

    this.starGeometry.setAttribute('position', new THREE.BufferAttribute(this.starPositions, 3));
    this.starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    this.starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    this.starGeometry.setAttribute('twinkle', new THREE.BufferAttribute(starTwinkle, 1));

    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        attribute float size;
        attribute float twinkle;
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          vColor = color;
          vTwinkle = sin(uTime * 2.4 + twinkle) * 0.5 + 0.5;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (320.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= (0.2 + vTwinkle * 0.8);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starPoints = new THREE.Points(this.starGeometry, this.starMaterial);
    this.scene.add(this.starPoints);
  }

  initBlackHole() {
    this.blackHoleGroup = new THREE.Group();
    this.scene.add(this.blackHoleGroup);

    // 1. Singularity Sphere
    const singularityGeom = new THREE.SphereGeometry(this.BLACK_HOLE_RADIUS, 128, 128);
    const singularityMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.singularityMesh = new THREE.Mesh(singularityGeom, singularityMat);
    this.blackHoleGroup.add(this.singularityMesh);

    // 2. Event Horizon Atmospheric Fresnel Glow (from three-js-black-hole-with-shaders)
    const eventHorizonGeom = new THREE.SphereGeometry(this.BLACK_HOLE_RADIUS * 1.06, 128, 128);
    this.eventHorizonMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraPosition: { value: this.camera.position }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uCameraPosition;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDirection = normalize(uCameraPosition - vPosition);
          float fresnel = 1.0 - abs(dot(vNormal, viewDirection));
          fresnel = pow(fresnel, 2.7);
          vec3 glowColor = vec3(1.0, 0.28, 0.02); // Grevix Orange
          float pulse = sin(uTime * 2.2) * 0.15 + 0.85;
          gl_FragColor = vec4(glowColor * fresnel * pulse * 1.4, fresnel * 0.75);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    this.eventHorizonMesh = new THREE.Mesh(eventHorizonGeom, this.eventHorizonMat);
    this.blackHoleGroup.add(this.eventHorizonMesh);

    // 3. Multi-Octave GLSL Accretion Disk Shader with Physical Pixel Resolution
    const diskGeom = new THREE.RingGeometry(this.DISK_INNER_RADIUS, this.DISK_OUTER_RADIUS, 256, 128);
    const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(width * dpr, height * dpr) },
        iResolution: { value: new THREE.Vector3(width * dpr, height * dpr, dpr) },
        uColorHot: { value: new THREE.Color(0xffffff) },
        uColorMid1: { value: new THREE.Color(0xff7722) },
        uColorMid2: { value: new THREE.Color(0xff3b00) }, // Grevix High-Energy Orange
        uColorMid3: { value: new THREE.Color(0xe285a9) }, // Grevix Neon Pink
        uColorOuter: { value: new THREE.Color(0x2855ee) }, // Cosmic Cyan/Blue
        uNoiseScale: { value: 2.5 },
        uFlowSpeed: { value: 0.26 },
        uDensity: { value: 1.35 },
        uShockwave: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vRadius;
        varying float vAngle;
        void main() {
          vUv = uv;
          vRadius = length(position.xy);
          vAngle = atan(position.y, position.x);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 u_resolution;
        uniform vec3 iResolution;
        uniform vec3 uColorHot;
        uniform vec3 uColorMid1;
        uniform vec3 uColorMid2;
        uniform vec3 uColorMid3;
        uniform vec3 uColorOuter;
        uniform float uNoiseScale;
        uniform float uFlowSpeed;
        uniform float uDensity;
        uniform float uShockwave;

        varying vec2 vUv;
        varying float vRadius;
        varying float vAngle;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0) * 2.0 + 1.0;
          vec4 s1 = floor(b1) * 2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          float normalizedRadius = smoothstep(${this.DISK_INNER_RADIUS.toFixed(2)}, ${this.DISK_OUTER_RADIUS.toFixed(2)}, vRadius);
          
          // Keplerian differential rotation: inner gas swirls much faster
          float keplerSpeed = (2.2 / (vRadius * 0.45 + 1.0)) * uFlowSpeed;
          float spiral = vAngle * 3.2 - (1.0 / (normalizedRadius + 0.08)) * 2.2;
          
          vec2 noiseUv = vec2(vUv.x + uTime * keplerSpeed + sin(spiral) * 0.12, vUv.y * 0.8 + cos(spiral) * 0.12);
          float n1 = snoise(vec3(noiseUv * uNoiseScale, uTime * 0.18));
          float n2 = snoise(vec3(noiseUv * uNoiseScale * 3.2 + 0.8, uTime * 0.25));
          float n3 = snoise(vec3(noiseUv * uNoiseScale * 6.5 + 1.6, uTime * 0.35));
          float noiseVal = (n1 * 0.5 + n2 * 0.35 + n3 * 0.15 + 1.0) * 0.5;

          // Color Gradient: White-hot core -> Grevix Orange -> Neon Pink -> Space Blue
          vec3 color = uColorOuter;
          color = mix(color, uColorMid3, smoothstep(0.0, 0.26, normalizedRadius));
          color = mix(color, uColorMid2, smoothstep(0.24, 0.56, normalizedRadius));
          color = mix(color, uColorMid1, smoothstep(0.52, 0.78, normalizedRadius));
          color = mix(color, uColorHot, smoothstep(0.74, 0.96, normalizedRadius));

          // Shockwave expansion ripple
          if (uShockwave > 0.01) {
            float waveDist = abs(normalizedRadius - uShockwave);
            float wavePulse = smoothstep(0.12, 0.0, waveDist);
            color += vec3(0.4, 0.7, 1.0) * wavePulse * 2.5;
          }

          float brightness = pow(1.0 - normalizedRadius, 0.9) * 3.8 + 0.4;
          brightness *= (0.35 + noiseVal * 1.9);
          float pulse = sin(uTime * 2.0 + normalizedRadius * 11.0 + vAngle * 2.0) * 0.12 + 0.88;
          brightness *= pulse;

          float alpha = uDensity * (0.22 + noiseVal * 0.88);
          alpha *= smoothstep(0.0, 0.14, normalizedRadius);
          alpha *= (1.0 - smoothstep(0.85, 1.0, normalizedRadius));
          alpha = clamp(alpha, 0.0, 1.0);

          gl_FragColor = vec4(color * brightness, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.accretionDisk = new THREE.Mesh(diskGeom, this.diskMaterial);
    this.accretionDisk.rotation.x = this.DISK_TILT_ANGLE;
    this.blackHoleGroup.add(this.accretionDisk);
  }

  initTheiaPrime() {
    // Theia Prime (Frozen Ice Giant) & 3 Orbiting Moons
    this.theiaSystem = new THREE.Group();
    this.scene.add(this.theiaSystem);

    const configureTexture = (tex) => {
      if (!tex) return;
      tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
    };

    const loader = new THREE.TextureLoader();
    const iceTexture = loader.load(resolveAsset('./assets/new_3D/theia-prime-g-frozen-ice-giant-moons/textures/ice_planet_textur.jpeg'), configureTexture);

    // Planet Mesh with 128x128 Segments
    const theiaGeom = new THREE.SphereGeometry(1.25, 128, 128);
    const theiaMat = new THREE.MeshStandardMaterial({
      map: iceTexture,
      roughness: 0.35,
      metalness: 0.15
    });
    this.theiaMesh = new THREE.Mesh(theiaGeom, theiaMat);
    this.theiaMesh.rotation.z = 0.3; // Axial tilt
    this.theiaSystem.add(this.theiaMesh);

    // 3D Planetary Ice Rings with 128x64 Segments
    const ringGeom = new THREE.RingGeometry(1.5, 2.5, 128, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    this.theiaRings = new THREE.Mesh(ringGeom, ringMat);
    this.theiaRings.rotation.x = Math.PI / 2.2;
    this.theiaMesh.add(this.theiaRings);

    // Atmospheric Ice Fresnel Rim Glow
    const rimGeom = new THREE.SphereGeometry(1.32, 128, 128);
    const rimMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x38bdf8) }
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
    const theiaRim = new THREE.Mesh(rimGeom, rimMat);
    this.theiaMesh.add(theiaRim);

    // 3 Orbiting Moons
    this.moons = [];
    const moonConfigs = [
      {
        path: './assets/new_3D/theia-prime-g-frozen-ice-giant-moons/textures/4k_eris_fictional.jpeg',
        size: 0.22,
        dist: 2.1,
        speed: 0.65,
        tilt: 0.15,
        phase: 0
      },
      {
        path: './assets/new_3D/theia-prime-g-frozen-ice-giant-moons/textures/moon_2.jpeg',
        size: 0.16,
        dist: 2.7,
        speed: -0.42,
        tilt: -0.22,
        phase: 2.2
      },
      {
        path: './assets/new_3D/theia-prime-g-frozen-ice-giant-moons/textures/moon_3.jpeg',
        size: 0.19,
        dist: 3.3,
        speed: 0.32,
        tilt: 0.35,
        phase: 4.1
      }
    ];

    moonConfigs.forEach((cfg) => {
      const tex = loader.load(resolveAsset(cfg.path), configureTexture);
      const mMesh = new THREE.Mesh(
        new THREE.SphereGeometry(cfg.size, 128, 128),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 })
      );
      this.theiaSystem.add(mMesh);
      this.moons.push({ mesh: mMesh, cfg });
    });
  }

  initMillersPlanet() {
    // Miller's Planet (Interstellar Ocean Planet)
    this.millersSystem = new THREE.Group();
    this.scene.add(this.millersSystem);

    const configureTexture = (tex) => {
      if (!tex) return;
      tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
    };

    const loader = new THREE.TextureLoader();
    const diffuse = loader.load(resolveAsset('./assets/new_3D/millers-planet-interstellar/textures/ef362dae-eeee-4ed8-8810-42ee5ea61847.png'), configureTexture);
    const normal = loader.load(resolveAsset('./assets/new_3D/millers-planet-interstellar/textures/41f4fbb5-94c5-47de-a910-1310b02f8337.png'), configureTexture);
    const rough = loader.load(resolveAsset('./assets/new_3D/millers-planet-interstellar/textures/b00d38e4-2feb-466f-a79a-6467b926f3cf.png'), configureTexture);

    const millersGeom = new THREE.SphereGeometry(1.15, 128, 128);
    const millersMat = new THREE.MeshStandardMaterial({
      map: diffuse,
      normalMap: normal,
      roughnessMap: rough,
      roughness: 0.3,
      metalness: 0.08
    });
    this.millersMesh = new THREE.Mesh(millersGeom, millersMat);
    this.millersMesh.rotation.z = 0.18;
    this.millersSystem.add(this.millersMesh);

    // Cyan Ocean Atmospheric Glow
    const atmoGeom = new THREE.SphereGeometry(1.22, 128, 128);
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x00d2ff) }
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
          float intensity = pow(0.72 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
          gl_FragColor = vec4(glowColor * 1.5, intensity * 0.85);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    const millersAtmo = new THREE.Mesh(atmoGeom, atmoMat);
    this.millersMesh.add(millersAtmo);
  }

  initManga3DLayer() {
    this.mangaGroup = new THREE.Group();
    this.scene.add(this.mangaGroup);

    // 1. Floating Manga Asteroid Panel Shards
    this.panelShards = [];
    const shardCount = 14;
    for (let i = 0; i < shardCount; i++) {
      const geom = new THREE.DodecahedronGeometry(THREE.MathUtils.randFloat(0.35, 0.75), 0);
      const wireMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff4400 : 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.45
      });
      const shard = new THREE.Mesh(geom, wireMat);

      const angle = (i / shardCount) * Math.PI * 2;
      const radius = THREE.MathUtils.randFloat(7, 13);
      shard.position.set(
        Math.cos(angle) * radius,
        THREE.MathUtils.randFloat(-3.5, 4.5),
        Math.sin(angle) * radius * 0.7
      );

      shard.userData = {
        rotSpeedX: (Math.random() - 0.5) * 0.015,
        rotSpeedY: (Math.random() - 0.5) * 0.018,
        bobSpeed: Math.random() * 0.8 + 0.4,
        bobPhase: Math.random() * Math.PI * 2,
        baseY: shard.position.y
      };

      this.mangaGroup.add(shard);
      this.panelShards.push(shard);
    }

    // 2. 3D Floating Japanese Kanji Plates ("宇宙" and "限界")
    this.kanjiPlates = [];
    const kanjiList = [
      { text: '宇宙', sub: 'COSMOS // UNIVERSE', pos: new THREE.Vector3(-5.2, 1.8, 1.5) },
      { text: '限界', sub: 'BEYOND LIMITS', pos: new THREE.Vector3(5.0, -1.2, 2.2) }
    ];

    kanjiList.forEach((k) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Draw stylized Manga Kanji with brush stroke & cyan/orange edge
      ctx.clearRect(0, 0, 512, 256);
      ctx.fillStyle = 'rgba(7, 7, 12, 0.65)';
      ctx.strokeStyle = 'rgba(255, 68, 0, 0.8)';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 492, 236);

      // Tech bracket accents
      ctx.fillStyle = '#ff4400';
      ctx.fillRect(8, 8, 20, 4);
      ctx.fillRect(8, 8, 4, 20);
      ctx.fillRect(484, 228, 20, 4);
      ctx.fillRect(500, 212, 4, 20);

      // Giant Kanji text
      ctx.font = '900 108px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 18;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(k.text, 256, 115);

      // Subtitle
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00e5ff';
      ctx.shadowBlur = 0;
      ctx.fillText(k.sub, 256, 195);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(3.8, 1.9, 1);
      sprite.position.copy(k.pos);
      sprite.userData = { baseY: k.pos.y, phase: Math.random() * Math.PI * 2 };

      this.mangaGroup.add(sprite);
      this.kanjiPlates.push(sprite);
    });
  }

  initEvents() {
    this.handleResize = () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 3));
      if (this.starMaterial && this.starMaterial.uniforms && this.starMaterial.uniforms.uPixelRatio) {
        this.starMaterial.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
      }
      if (this.diskMaterial && this.diskMaterial.uniforms) {
        if (this.diskMaterial.uniforms.u_resolution) {
          this.diskMaterial.uniforms.u_resolution.value.set(width * dpr, height * dpr);
        }
        if (this.diskMaterial.uniforms.iResolution) {
          this.diskMaterial.uniforms.iResolution.value.set(width * dpr, height * dpr, dpr);
        }
      }
    };
    window.addEventListener('resize', this.handleResize);

    // Interactive Shockwave Trigger on Section Click
    const heroSection = document.getElementById('section-home');
    if (heroSection) {
      heroSection.addEventListener('click', () => {
        this.triggerShockwave();
      });
    }
  }

  triggerShockwave() {
    this.shockwave.active = true;
    this.shockwave.progress = 0;
    this.shockwave.strength = 1.0;
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
    const delta = this.clock.getDelta();

    // 1. Mouse Follow Rig (0.06 damping from cursorState)
    const mx = cursorState.lerpedX;
    const my = cursorState.lerpedY;

    // Camera tilts and pans with mouse
    this.camera.position.x = this.baseCamPos.x + Math.sin(elapsed * 0.08) * 0.4 + mx * 1.35;
    this.camera.position.y = this.baseCamPos.y + Math.cos(elapsed * 0.07) * 0.3 - my * 1.1;
    this.camera.lookAt(mx * 0.3, -my * 0.2, 0);

    // 2. Shockwave logic
    if (this.shockwave.active) {
      this.shockwave.progress += 0.016;
      if (this.shockwave.progress >= 1.0) {
        this.shockwave.active = false;
        this.shockwave.progress = 0;
      }
    }

    // 3. Update Black Hole Uniforms
    if (this.starMaterial) this.starMaterial.uniforms.uTime.value = elapsed;
    if (this.diskMaterial) {
      this.diskMaterial.uniforms.uTime.value = elapsed;
      this.diskMaterial.uniforms.uShockwave.value = this.shockwave.active ? this.shockwave.progress : 0.0;
    }
    if (this.eventHorizonMat) {
      this.eventHorizonMat.uniforms.uTime.value = elapsed;
      this.eventHorizonMat.uniforms.uCameraPosition.value.copy(this.camera.position);
    }

    // Accretion Disk continuous 60fps swirl
    if (this.accretionDisk) {
      this.accretionDisk.rotation.z = elapsed * 0.055;
      this.accretionDisk.rotation.x = this.DISK_TILT_ANGLE + my * 0.12;
      this.accretionDisk.rotation.y = mx * 0.16;
    }

    // Singularity breathing
    if (this.singularityLight) {
      this.singularityLight.intensity = 4.2 + Math.sin(elapsed * 3.0) * 0.8;
    }

    // 4. Theia Prime (Frozen Ice Giant) Orbit & Moons
    if (this.theiaSystem) {
      const theiaOrbitSpeed = elapsed * 0.09;
      const theiaRadius = 9.8;
      this.theiaSystem.position.x = Math.cos(theiaOrbitSpeed) * theiaRadius;
      this.theiaSystem.position.z = Math.sin(theiaOrbitSpeed) * theiaRadius * 0.85;
      this.theiaSystem.position.y = 1.4 + Math.sin(theiaOrbitSpeed * 1.5) * 0.6 + my * 0.3;

      if (this.theiaMesh) {
        this.theiaMesh.rotation.y = elapsed * 0.18;
      }

      // Orbiting Moons
      this.moons.forEach((m) => {
        const angle = elapsed * m.cfg.speed + m.cfg.phase;
        m.mesh.position.x = Math.cos(angle) * m.cfg.dist;
        m.mesh.position.z = Math.sin(angle) * m.cfg.dist;
        m.mesh.position.y = Math.sin(angle) * m.cfg.tilt;
        m.mesh.rotation.y = elapsed * 0.45;
      });
    }

    // 5. Miller's Planet (Interstellar) Orbit
    if (this.millersSystem) {
      const millersOrbitSpeed = elapsed * 0.14 + 2.4;
      const millersRadius = 6.6;
      this.millersSystem.position.x = Math.cos(millersOrbitSpeed) * millersRadius;
      this.millersSystem.position.z = Math.sin(millersOrbitSpeed) * millersRadius * 0.75;
      this.millersSystem.position.y = -1.2 + Math.sin(millersOrbitSpeed * 1.8) * 0.5 - my * 0.3;

      if (this.millersMesh) {
        this.millersMesh.rotation.y = elapsed * 0.22;
      }
    }

    // 6. Manga Shards & Kanji Floating Dynamics
    this.panelShards.forEach((shard) => {
      shard.rotation.x += shard.userData.rotSpeedX;
      shard.rotation.y += shard.userData.rotSpeedY;
      shard.position.y = shard.userData.baseY + Math.sin(elapsed * shard.userData.bobSpeed + shard.userData.bobPhase) * 0.35;
    });

    this.kanjiPlates.forEach((plate) => {
      plate.position.y = plate.userData.baseY + Math.sin(elapsed * 0.8 + plate.userData.phase) * 0.25;
      plate.material.opacity = 0.82 + Math.sin(elapsed * 1.8 + plate.userData.phase) * 0.14;
    });

    // Starfield gentle rotation
    if (this.starPoints) {
      this.starPoints.rotation.y = elapsed * 0.003;
      this.starPoints.rotation.x = my * 0.03;
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
