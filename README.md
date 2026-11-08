# GREVIX — Calm Japanese-Inspired Editorial Hackathon Platform

Official web platform for **GREVIX** — rebuilt into a calm, cozy Japanese-inspired editorial platform with video backgrounds across 4 distinct pages/sections, a tranquil Japandi color system, dark washi contrast overlays for crystal-clear readability, and minimal, meditative micro-interactions.

---

## Architecture & Design System

### 1. Video Background Architecture (4 Pages / Sections)
Utilizes the high-definition video assets in `public/assets/new_videos/`:
- **Home**: `/assets/new_videos/bg-home.mp4`
- **Hackathons**: `/assets/new_videos/bg-hackathons.mp4`
- **Community**: `/assets/new_videos/bg-community.mp4`
- **About**: `/assets/new_videos/bg-about.mp4`

**Specs:**
- Rendered as `<video autoPlay loop muted playsInline preload="metadata" />` with full-bleed fixed positioning (`fixed inset-0 width: 100% height: 100% object-fit: cover pointer-events: none z-index: 0`).
- Cross-fading: 0.8s ease-in-out opacity transition when switching between pages/tabs or scrolling between sections via `IntersectionObserver`.

### 2. Contrast, Palette & Washi Overlays
- **Protective Dark Sumi-Ink Layer (z-index 1)**:
  `linear-gradient(180deg, rgba(14, 18, 17, 0.72) 0%, rgba(14, 18, 17, 0.52) 50%, rgba(14, 18, 17, 0.88) 100%)`
- **Calm Japandi Color Tokens**:
  - Dark Canvas: `#0e1211` (Deep Charcoal Sumi Ink)
  - Card Surfaces: `rgba(22, 27, 26, 0.62)` with `backdrop-filter: blur(20px)` and 1px border `rgba(235, 230, 220, 0.1)`
  - Primary Typography: `#f2eee6` (Warm Washi Cream)
  - Secondary Typography: `#bfb8a8` (Soft Sand)
  - Accent: `#c85a4e` (Muted Japanese Vermilion / Shuu-iro) for active indicators, status dots, and button accents
- **Delicate Washi Paper Fiber Layer (z-index 2)**:
  Organic fiber texture overlay providing warmth and depth without clutter.

### 3. Page Architecture & Sections
- **Top Navigation Bar**: Minimalist header with "GREVIX" logo in refined letter-spaced serif typography, Japanese seal mark (創), clean nav links `[ Home | Hackathons | Community | About ]` with vermilion active indicator, My Orbit drawer trigger, and a tranquil "Join Orbit" CTA.
- **Page 1 — Home**: Editorial serif headline (*"Building the Next Frontier. Where calm craft meets bold architecture"*), minimalist subtitle, clean CTAs, and 3 minimalist stat pills:
  - Global Builders: `45,000+`
  - Live Tracks: `12 Tracks`
  - Prize Pools: `$180,000`
- **Page 2 — Hackathons**: Frosted washi glass cards showcasing flagship and active tracks:
  - *She Builds* (Flagship 3-Month Fellowship for Women Idea Creators)
  - *AI Systems & Cognitive Agents* (Rust / Edge TensorRT / ROS2)
  - *Open Orbit & Planetary Telemetry* (Orbital Mechanics / Mesh Networks)
  - *Quantum & Distributed Kernels* (WebAssembly / Post-Quantum Cryptography)
  - Interactive "View Track" modal detailing curriculum, requirements, and the 3-month roadmap.
- **Page 3 — Community**: Calm builder community hub highlighting:
  - 4 Interactive Pillars (*Connect, Learn, Collaborate, Grow*)
  - Mentor Networks (*Dr. Emi Tanaka, Marcus Vance, Soraya Al-Mansoor, Kenji Morita*)
  - Developer Spotlights (*AetherGrid, PulseGuard, SingularityOS*)
  - Direct community links (*Discord Sanctuary, X @GrevixOrbit, GitHub*)
- **Page 4 — About**: Generous negative space (*Ma* - 間), founding mission statement, 4 core values (*Ma*, *Shokunin*, *Kaizen*, *Kyosei*), and an interactive "Partner with Grevix / Host a Hackathon" form with validation and toast feedback.

### 4. Meditative Micro-Interactions
- **Buttons**: Clean pill-shaped borders; on hover, produce a gentle +2px float, subtle cream border brightening, and soft ambient glow (`transition: 0.3s ease`).
- **Cards**: Rock-solid flat layout; on hover, produce a subtle 1.01x scale and smooth border highlight.
- **Zero Aggressive FX**: Zero aggressive 3D rotations, zero glitches, zero screen shakes.

---

## Directory Structure

```text
Grevix_Website/
├── index.html                   # Japandi Editorial Entry Point
├── package.json                 # Project dependencies & Vite scripts
├── vite.config.js               # Clean production build configuration
├── public/
│   └── assets/
│       ├── logo-zen.svg         # Tranquil Enso Japandi SVG brand logo
│       └── new_videos/
│           ├── bg-home.mp4      # Home section video background
│           ├── bg-hackathons.mp4# Hackathons section video background
│           ├── bg-community.mp4 # Community section video background
│           └── bg-about.mp4     # About section video background
└── src/
    ├── data/
    │   └── programData.json     # Flagship She Builds fellowship metadata & roadmap
    ├── scripts/
    │   └── zen-app.js           # 4-video crossfade engine, state management, modals & filters
    └── styles/
        └── zen.css              # Japandi design system, sumi-ink contrast, washi cards & pills
```

---

## Development & Build

```bash
# Install dependencies
npm install

# Start development server with live reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```
