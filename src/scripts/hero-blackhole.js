import * as THREE from 'three';

/**
 * Hero Section 3D Black Hole Shader Background
 * Features:
 * - GLSL Accretion Disk with procedural simplex noise & multi-octave flow
 * - Event Horizon mesh with Fresnel atmospheric glow
 * - Twinkling multi-spectral starfield
 * - Non-blocking pointer events & mouse parallax
 */
export class HeroBlackHoleController {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isRunning = false;
    this.rafId = null;
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    this.BLACK_HOLE_RADIUS = 1.35;
    this.DISK_INNER_RADIUS = 1.55;
    this.DISK_OUTER_RADIUS = 7.8;
    this.DISK_TILT_ANGLE = Math.PI / 3.2;

    this.initScene();
    this.initObjects();
    this.initEvents();
    this.resume();
  }

  initScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x060608, 0.02);

    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 3000);
    this.camera.position.set(-5.5, 4.2, 7.0);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // Style canvas to stay strictly background
    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    this.container.appendChild(canvas);
  }

  initObjects() {
    // 1. Multi-spectral Twinkling Starfield
    const starCount = 18000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starTwinkle = new Float32Array(starCount);
    const starRadius = 1400;

    const starPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xff4400), // Grevix orange
      new THREE.Color(0xe285a9), // Grevix pink
      new THREE.Color(0x88bbff), // Cyan/Blue
      new THREE.Color(0xffd799)  // Warm amber
    ];

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const phi = Math.acos(-1 + (2 * i) / starCount);
      const theta = Math.sqrt(starCount * Math.PI) * phi;
      const radius = Math.cbrt(Math.random()) * starRadius + 60;

      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = radius * Math.cos(phi);

      const color = starPalette[Math.floor(Math.random() * starPalette.length)].clone();
      color.multiplyScalar(Math.random() * 0.7 + 0.3);
      starColors[i3] = color.r;
      starColors[i3 + 1] = color.g;
      starColors[i3 + 2] = color.b;

      starSizes[i] = THREE.MathUtils.randFloat(0.8, 2.8);
      starTwinkle[i] = Math.random() * Math.PI * 2;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    starGeometry.setAttribute('twinkle', new THREE.BufferAttribute(starTwinkle, 1));

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
          vTwinkle = sin(uTime * 2.2 + twinkle) * 0.5 + 0.5;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (280.0 / -mvPosition.z);
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

    const stars = new THREE.Points(starGeometry, this.starMaterial);
    this.scene.add(stars);

    // 2. Black Hole Event Horizon Fresnel Glow
    const eventHorizonGeom = new THREE.SphereGeometry(this.BLACK_HOLE_RADIUS * 1.06, 64, 48);
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
          fresnel = pow(fresnel, 2.6);
          vec3 glowColor = vec3(1.0, 0.28, 0.02); // Grevix High-Energy Orange
          float pulse = sin(uTime * 2.0) * 0.15 + 0.85;
          gl_FragColor = vec4(glowColor * fresnel * pulse, fresnel * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const eventHorizon = new THREE.Mesh(eventHorizonGeom, this.eventHorizonMat);
    this.scene.add(eventHorizon);

    // 3. True Singularity Sphere (Absorbs All Light)
    const blackHoleGeom = new THREE.SphereGeometry(this.BLACK_HOLE_RADIUS, 64, 48);
    const blackHoleMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.blackHoleMesh = new THREE.Mesh(blackHoleGeom, blackHoleMat);
    this.scene.add(this.blackHoleMesh);

    // 4. Accretion Disk with Procedural Simplex Noise GLSL
    const diskGeometry = new THREE.RingGeometry(this.DISK_INNER_RADIUS, this.DISK_OUTER_RADIUS, 180, 72);
    this.diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColorHot: { value: new THREE.Color(0xffffff) },
        uColorMid1: { value: new THREE.Color(0xff7722) },
        uColorMid2: { value: new THREE.Color(0xff3b00) }, // Grevix Orange
        uColorMid3: { value: new THREE.Color(0xe285a9) }, // Grevix Pink
        uColorOuter: { value: new THREE.Color(0x3866f2) }, // Cosmic Blue
        uNoiseScale: { value: 2.4 },
        uFlowSpeed: { value: 0.24 },
        uDensity: { value: 1.25 }
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
        uniform vec3 uColorHot;
        uniform vec3 uColorMid1;
        uniform vec3 uColorMid2;
        uniform vec3 uColorMid3;
        uniform vec3 uColorOuter;
        uniform float uNoiseScale;
        uniform float uFlowSpeed;
        uniform float uDensity;
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
          float spiral = vAngle * 3.0 - (1.0 / (normalizedRadius + 0.1)) * 2.0;
          vec2 noiseUv = vec2(vUv.x + uTime * uFlowSpeed * (2.0 / (vRadius * 0.3 + 1.0)) + sin(spiral) * 0.1, vUv.y * 0.8 + cos(spiral) * 0.1);
          float noiseVal1 = snoise(vec3(noiseUv * uNoiseScale, uTime * 0.15));
          float noiseVal2 = snoise(vec3(noiseUv * uNoiseScale * 3.0 + 0.8, uTime * 0.22));
          float noiseVal = (noiseVal1 * 0.55 + noiseVal2 * 0.45 + 1.0) * 0.5;

          vec3 color = uColorOuter;
          color = mix(color, uColorMid3, smoothstep(0.0, 0.25, normalizedRadius));
          color = mix(color, uColorMid2, smoothstep(0.2, 0.55, normalizedRadius));
          color = mix(color, uColorMid1, smoothstep(0.5, 0.75, normalizedRadius));
          color = mix(color, uColorHot, smoothstep(0.7, 0.95, normalizedRadius));

          float brightness = pow(1.0 - normalizedRadius, 0.9) * 3.6 + 0.4;
          brightness *= (0.35 + noiseVal * 1.8);
          float pulse = sin(uTime * 1.8 + normalizedRadius * 10.0 + vAngle * 2.0) * 0.12 + 0.88;
          brightness *= pulse;

          float alpha = uDensity * (0.25 + noiseVal * 0.85);
          alpha *= smoothstep(0.0, 0.12, normalizedRadius);
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

    this.accretionDisk = new THREE.Mesh(diskGeometry, this.diskMaterial);
    this.accretionDisk.rotation.x = this.DISK_TILT_ANGLE;
    this.scene.add(this.accretionDisk);
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
      if (this.starMaterial) {
        this.starMaterial.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
      }
    };
    window.addEventListener('resize', this.handleResize);

    // Passive mouse parallax over the section
    const heroSection = document.getElementById('section-home');
    if (heroSection) {
      heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
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
    const elapsedTime = this.clock.getElapsedTime();

    // Smooth mouse lerping
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    // Update uniforms
    if (this.starMaterial) this.starMaterial.uniforms.uTime.value = elapsedTime;
    if (this.diskMaterial) this.diskMaterial.uniforms.uTime.value = elapsedTime;
    if (this.eventHorizonMat) {
      this.eventHorizonMat.uniforms.uTime.value = elapsedTime;
      this.eventHorizonMat.uniforms.uCameraPosition.value.copy(this.camera.position);
    }

    // Dynamic rotation & subtle parallax
    if (this.accretionDisk) {
      this.accretionDisk.rotation.z = elapsedTime * 0.05;
      this.accretionDisk.rotation.x = this.DISK_TILT_ANGLE + this.mouse.y * 0.12;
      this.accretionDisk.rotation.y = this.mouse.x * 0.15;
    }

    // Camera subtle orbital breathing
    this.camera.position.x = -5.5 + Math.sin(elapsedTime * 0.08) * 0.4 + this.mouse.x * 0.8;
    this.camera.position.y = 4.2 + Math.cos(elapsedTime * 0.07) * 0.3 - this.mouse.y * 0.6;
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
 * Interactive Black Hole Vortex Widget
 * Directly implements interactive particle physics from interactive-blackhole archive:
 * - Keplerian orbital velocities
 * - Collapse into singularity on hover/attraction
 * - Relativistic expansion shockwave on click
 * - Smooth gravitational rebound
 */
export class InteractiveBlackholeWidget {
  constructor(canvasOrId) {
    this.canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.isRunning = false;
    this.rafId = null;

    this.stars = [];
    this.collapse = false;
    this.expanse = false;
    this.returning = false;
    this.currentTime = 0;
    this.maxorbit = 130;

    this.initCanvas();
    this.initStars();
    this.initInteractions();
    this.resume();
  }

  initCanvas() {
    const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : { width: 280, height: 280 };
    this.cw = Math.max(rect.width, 240);
    this.ch = Math.max(rect.height || 260, 240);
    this.canvas.width = this.cw * (window.devicePixelRatio || 1);
    this.canvas.height = this.ch * (window.devicePixelRatio || 1);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    this.centerx = this.cw / 2;
    this.centery = this.ch / 2;
  }

  initStars() {
    this.stars = [];
    const count = 380;
    for (let i = 0; i < count; i++) {
      const rands = [
        Math.random() * (this.maxorbit / 2) + 1,
        Math.random() * (this.maxorbit / 2) + this.maxorbit
      ];
      const orbital = (rands[0] + rands[1]) / 2;
      const collapseBonus = Math.max(0, orbital - this.maxorbit * 0.7);

      this.stars.push({
        orbital: orbital,
        x: this.centerx,
        y: this.centery + orbital,
        yOrigin: this.centery + orbital,
        speed: (Math.random() * 2.2 + 1.2) * (Math.PI / 180),
        rotation: 0,
        startRotation: Math.random() * Math.PI * 2,
        id: i,
        collapseBonus: collapseBonus,
        color: `rgba(255, ${Math.floor(180 + Math.random() * 75)}, ${Math.floor(120 + Math.random() * 135)}, ${Math.max(0.2, 1 - orbital / this.maxorbit)})`,
        hoverPos: this.centery + this.maxorbit / 2.8 + collapseBonus,
        expansePos: this.centery + (i % 60) * -4 + (Math.random() * 20 - 10),
        prevR: 0,
        prevX: this.centerx,
        prevY: this.centery + orbital
      });
    }
  }

  rotatePoint(cx, cy, x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
      cos * (x - cx) + sin * (y - cy) + cx,
      cos * (y - cy) - sin * (x - cx) + cy
    ];
  }

  initInteractions() {
    const trigger = this.canvas.parentElement || this.canvas;
    trigger.addEventListener('mouseenter', () => {
      this.collapse = true;
    });
    trigger.addEventListener('mouseleave', () => {
      this.collapse = false;
      this.expanse = false;
      this.returning = true;
    });
    trigger.addEventListener('click', () => {
      this.expanse = true;
      this.collapse = false;
      setTimeout(() => {
        this.expanse = false;
        this.returning = true;
      }, 1400);
    });
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
      this.update();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  update() {
    this.currentTime++;
    this.ctx.fillStyle = 'rgba(7, 7, 9, 0.25)';
    this.ctx.fillRect(0, 0, this.cw, this.ch);

    // Singularity Core Glow
    const gradient = this.ctx.createRadialGradient(this.centerx, this.centery, 4, this.centerx, this.centery, 34);
    gradient.addColorStop(0, '#000000');
    gradient.addColorStop(0.4, '#1a0800');
    gradient.addColorStop(0.8, '#ff4400');
    gradient.addColorStop(1, 'rgba(255, 68, 0, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(this.centerx, this.centery, 34, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner pure black horizon
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(this.centerx, this.centery, 14, 0, Math.PI * 2);
    this.ctx.fill();

    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];

      if (!this.expanse && !this.returning) {
        s.rotation = s.startRotation + this.currentTime * s.speed;
        if (!this.collapse) {
          if (s.y > s.yOrigin) s.y -= 1.8;
          if (s.y < s.yOrigin - 3) s.y += (s.yOrigin - s.y) / 10;
        } else {
          s.y -= (s.y - s.hoverPos) / 12;
        }
      } else if (this.expanse) {
        s.rotation = s.startRotation + this.currentTime * (s.speed * 2.2);
        s.y += (s.expansePos - s.y) / 7;
      } else if (this.returning) {
        s.rotation = s.startRotation + this.currentTime * s.speed;
        s.y += (s.yOrigin - s.y) / 14;
        if (Math.abs(s.y - s.yOrigin) < 1) {
          if (i === this.stars.length - 1) this.returning = false;
        }
      }

      const p = this.rotatePoint(this.centerx, this.centery, s.x, s.y, s.rotation);
      this.ctx.strokeStyle = s.color;
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.ctx.moveTo(s.prevX, s.prevY);
      this.ctx.lineTo(p[0], p[1]);
      this.ctx.stroke();

      s.prevX = p[0];
      s.prevY = p[1];
    }
  }
}
