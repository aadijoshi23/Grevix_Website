# GREVIX — Global Hackathon Platform & "She Builds" Fellowship

Official web platform for **Grevix** (`BUILD WHAT'S NEXT.`), featuring the flagship **She Builds** 3-month open innovation program exclusively for girls.

## Folder Structure

```text
grevix-platform/
├── index.html                          # Main entry point (HUD Sections 01–05)
├── package.json                        # Vite & static server scripts
├── vercel.json                         # Zero-config Vercel deployment
├── .gitignore                          # Standard Git ignore rules
├── .github/
│   └── workflows/
│       └── deploy.yml                  # Automated GitHub Pages CI/CD pipeline
├── public/
│   └── assets/
│       ├── astronauts/                 # Astronaut HUD visuals & satellite assets
│       │   ├── astro_light.jpg         # Section 01 Unit-01 Astronaut
│       │   ├── satellite.jpg           # Section 01 Orbital Satellite
│       │   ├── astro_dark.jpg          # Section 02 Dark Rim-Lit Astronaut
│       │   ├── comm_art.jpg            # Section 03 3D Community Corridor
│       │   └── cyber_about.jpg         # Section 05 Cybernetic Builder
│       ├── posters/                    # Official "She Builds" campaign posters (1–5)
│       └── ui-references/              # Original Grevix UI design mockups (1–4)
└── src/
    ├── styles/
    │   └── hud.css                     # Chamfered HUD frames, grids, animations & blend modes
    ├── scripts/
    │   ├── tailwind.config.js          # Grevix custom color tokens & font families
    │   └── app.js                      # Navigation, filters, modals, My Orbit state & gallery
    └── data/
        └── programData.json            # Structured "She Builds" 3-month program metadata
```

## Quick Start

```bash
# Option 1: Run with Vite (hot reload)
npm install
npm run dev

# Option 2: Run directly with Python or npx serve (zero install)
python3 -m http.server 3000
```
