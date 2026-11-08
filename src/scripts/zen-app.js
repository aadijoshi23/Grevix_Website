/**
 * GREVIX — Calm Japandi Editorial Platform Engine
 * 4-Video Background Cross-Fade Architecture, Meditative Navigation,
 * Washi Glass Micro-Interactions, and Track Modals.
 */

import programData from '../data/programData.json';

(function () {
  'use strict';

  // 1. DATA STATE MANAGEMENT (Local Storage Persistence)
  const defaultSubmissions = [
    {
      id: 'GX-101',
      role: 'She Builds Flagship Fellowship',
      name: 'Riya Verma',
      email: 'riya.v@orbital.grevix.org',
      title: 'AetherGrid — Decentralized Micro-Compute',
      domain: 'AI & Autonomous Systems',
      approach: 'Pooling distributed edge nodes for student researchers during the Grevix fellowship cycle.',
      status: 'INCUBATOR CANDIDATE // UNDER REVIEW'
    },
    {
      id: 'GX-102',
      role: 'SpaceTech & Planetary Telemetry',
      name: 'Meera Nair',
      email: 'meera.nair@orbital.grevix.org',
      title: 'PulseGuard — Edge Biosensor Telemetry',
      domain: 'Bio-Innovation & SpaceTech',
      approach: 'Low-power acoustic & PPG anomaly detection firmware with real-time orbital simulation.',
      status: 'FELLOWSHIP SHORTLIST #1'
    },
    {
      id: 'GX-103',
      role: 'Quantum & Distributed Kernels',
      name: 'Alex Chen',
      email: 'alex.c@quantum.grevix.org',
      title: 'SingularityOS — Wasm Micro-Kernel Visualizer',
      domain: 'Quantum Computing & Systems',
      approach: 'Interactive real-time visualization of quantum logic gate execution in WebAssembly.',
      status: 'STAGE 2 SEED ACCELERATION'
    }
  ];

  const defaultPartners = [
    {
      id: 'PR-01',
      name: 'Elena Rostova',
      org: 'Tokyo Institute of Technology / Autonomous Lab',
      email: 'elena.r@tokyotech.ac.jp',
      type: 'Sponsor Autonomous AI / Space Track',
      message: 'Interested in sponsoring the 2026 Autonomous Systems track with high-performance edge compute clusters.'
    }
  ];

  let submissions = defaultSubmissions.slice();
  let partnerRequests = defaultPartners.slice();

  try {
    const savedSub = localStorage.getItem('grevix_submissions_zen');
    if (savedSub) submissions = JSON.parse(savedSub);
    const savedPart = localStorage.getItem('grevix_partners_zen');
    if (savedPart) partnerRequests = JSON.parse(savedPart);
  } catch (e) {
    console.warn('Storage access restricted', e);
  }

  function saveState() {
    try {
      localStorage.setItem('grevix_submissions_zen', JSON.stringify(submissions));
      localStorage.setItem('grevix_partners_zen', JSON.stringify(partnerRequests));
    } catch (e) {}
    updateBadgeCount();
  }

  function updateBadgeCount() {
    const badge = document.getElementById('badge-orbit-count');
    if (badge) {
      badge.textContent = String(submissions.length + partnerRequests.length);
    }
  }

  function showToast(message) {
    const toast = document.getElementById('zen-toast');
    const toastText = document.getElementById('zen-toast-text');
    if (!toast || !toastText) return;
    toastText.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__zenToastTimer);
    window.__zenToastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  // 2. VIDEO BACKGROUND CONTROLLER (4 PAGES / SECTIONS WITH 0.8s CROSS-FADE)
  class VideoBackgroundController {
    constructor() {
      this.videos = {
        'section-home': document.getElementById('bg-video-home'),
        'section-hackathons': document.getElementById('bg-video-hackathons'),
        'section-community': document.getElementById('bg-video-community'),
        'section-about': document.getElementById('bg-video-about')
      };
      this.activeSection = 'section-home';
      this.initVideos();
    }

    initVideos() {
      Object.entries(this.videos).forEach(([sectionId, video]) => {
        if (!video) return;
        video.muted = true;
        video.playsInline = true;
        video.loop = true;

        // Graceful autoplay promise handling
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Browser autoplay restrictions: start playback upon first gentle user interaction
            const unlockAudioPlay = () => {
              Object.values(this.videos).forEach(v => v && v.play().catch(() => {}));
              window.removeEventListener('click', unlockAudioPlay);
              window.removeEventListener('scroll', unlockAudioPlay);
              window.removeEventListener('touchstart', unlockAudioPlay);
            };
            window.addEventListener('click', unlockAudioPlay, { once: true, passive: true });
            window.addEventListener('scroll', unlockAudioPlay, { once: true, passive: true });
            window.addEventListener('touchstart', unlockAudioPlay, { once: true, passive: true });
          });
        }
      });

      this.crossFadeTo('section-home');
    }

    crossFadeTo(sectionId) {
      if (!this.videos[sectionId]) return;
      if (this.activeSection === sectionId && this.videos[sectionId].classList.contains('active')) {
        return;
      }

      // Smooth cross-fade: remove .active from all other videos, add .active to target
      Object.entries(this.videos).forEach(([key, video]) => {
        if (!video) return;
        if (key === sectionId) {
          video.classList.add('active');
          video.play().catch(() => {});
        } else {
          video.classList.remove('active');
        }
      });

      this.activeSection = sectionId;
    }
  }

  // 3. TRACK DIRECTORY METADATA
  const tracksDatabase = {
    'she-builds': {
      title: programData.flagshipProgram.title || 'She Builds',
      badge: 'FLAGSHIP 3-MONTH FELLOWSHIP',
      timeline: 'April 15 – July 15, 2026',
      allocation: '$50,000 Allocation + Grevix Lab Incubator',
      eligibility: programData.flagshipProgram.eligibility || 'Exclusively for women idea creators & engineers — open to all idea creators in Week 1',
      ownership: programData.flagshipProgram.ownershipPolicy || 'Shared between the idea creator and Grevix under clearly defined terms, with proper credit for everyone involved.',
      overview: 'A tranquil 3-month fellowship for women engineers and visionary idea creators to transform radical concepts into working systems. Top 2 ideas are shortlisted in Week 1, entering the Grevix Innovation Lab for full architectural mentorship.',
      roadmap: programData.flagshipProgram.roadmap || [
        {
          month: 1,
          name: 'Explore & Conceptualize',
          week1: 'Complete creative freedom to explore ideas and decide what to build and how to approach it. Top 2 most promising ideas are selected at the end of Week 1.',
          weeks2to4: 'Refine concepts, validate system architecture, and plan the engineering approach.'
        },
        {
          month: 2,
          name: 'Build & Grevix Innovation Lab',
          summary: 'Build teams, start active development, and unlock the Grevix Innovation Lab (mentorship, collaboration with industry professionals and engineers, and opportunities to connect with companies).'
        },
        {
          month: 3,
          name: 'Improve, Test & Showcase',
          summary: 'Focus on improving, rigorous testing, and showcasing completed projects to partner companies and the community.'
        }
      ],
      techStack: ['Full Creative Freedom', 'Systems Architecture', 'Mentor Pairing', 'IP Shared Ownership']
    },
    'ai-systems': {
      title: 'AI Systems & Cognitive Agents',
      badge: 'ACTIVE LIVE TRACK',
      timeline: 'May 01 – June 12, 2026',
      allocation: '$45,000 Prize Pool + Dedicated GPU Clusters',
      eligibility: 'Open globally to individual engineers and squads up to 4 builders.',
      ownership: '100% Builder-owned open source or proprietary license.',
      overview: 'Build deterministic multi-agent cognition engines, edge reinforcement learning firmware, and low-latency robotics controllers designed for high reliability.',
      roadmap: [
        { month: 1, name: 'Architecture & Foundations', summary: 'Develop multi-agent communication schemas and ROS2/Rust bridge foundations.' },
        { month: 2, name: 'Simulated Benchmark & Deployment', summary: 'Test agents in physics simulations and deploy to edge tensor micro-nodes.' }
      ],
      techStack: ['Rust', 'ROS2', 'TensorRT', 'Multi-Agent LLMs', 'WebSockets']
    },
    'open-orbit': {
      title: 'Open Orbit & Planetary Telemetry',
      badge: 'RESEARCH SPRINT',
      timeline: 'May 20 – July 02, 2026',
      allocation: '$45,000 Prize Pool + Ground Station Uplink',
      eligibility: 'Global developers, aerospace researchers, and students.',
      ownership: 'Open source telemetry protocols with contributor recognition.',
      overview: 'Construct real-time satellite constellation telemetry streaming, Keplerian orbital propagators, and resilient interplanetary mesh network protocols.',
      roadmap: [
        { month: 1, name: 'Telemetry Protocol Ingestion', summary: 'Stream high-frequency simulated orbital coordinates with zero packet loss.' },
        { month: 2, name: 'Visualizer & Planetary Simulation', summary: 'Render orbits in WebGL with Keplerian physics and ground station handshake.' }
      ],
      techStack: ['Orbital Mechanics', 'Three.js / WebGL', 'Rust', 'Real-time Telemetry']
    },
    'quantum-kernels': {
      title: 'Quantum & Distributed Kernels',
      badge: 'ADVANCED LAB',
      timeline: 'June 10 – July 28, 2026',
      allocation: '$40,000 Prize Pool + Qiskit Sandbox Access',
      eligibility: 'Engineers interested in quantum computing, cryptography, and systems programming.',
      ownership: 'Apache 2.0 / MIT open license.',
      overview: 'Design post-quantum cryptographic handshakes, browser WebAssembly micro-kernels, and interactive quantum logic gate visualizers.',
      roadmap: [
        { month: 1, name: 'Simulator Core & Quantum Circuits', summary: 'Implement Clifford gate simulators and state-vector mathematical models.' },
        { month: 2, name: 'Browser Wasm Micro-Kernel', summary: 'Compile kernels to WebAssembly with zero memory overhead and instant browser execution.' }
      ],
      techStack: ['WebAssembly', 'C++ / Rust', 'Post-Quantum Crypto', 'Qiskit']
    }
  };

  // DOM Content Loaded Handler
  document.addEventListener('DOMContentLoaded', () => {
    const videoController = new VideoBackgroundController();

    // 4. NAVIGATION & SCROLL TRACKING
    const navLinks = document.querySelectorAll('.zen-nav-link, .mobile-nav-link');
    const allTargetButtons = document.querySelectorAll('[data-target]');
    const sections = ['section-home', 'section-hackathons', 'section-community', 'section-about']
      .map(id => document.getElementById(id))
      .filter(Boolean);

    function setActiveNav(sectionId) {
      navLinks.forEach(link => {
        const target = link.getAttribute('data-target');
        if (target === sectionId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
      videoController.crossFadeTo(sectionId);
    }

    // Target Button Click Handling (Smooth Scroll & Video Crossfade)
    allTargetButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const targetId = btn.getAttribute('data-target');
        if (!targetId) return;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          setActiveNav(targetId);
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
        // Close mobile drawer if open
        const mobileDrawer = document.getElementById('mobile-drawer');
        if (mobileDrawer && !mobileDrawer.classList.contains('hidden')) {
          mobileDrawer.classList.add('hidden');
        }
      });
    });

    // IntersectionObserver for Automatic Scroll Crossfade
    const observerOptions = {
      root: null,
      rootMargin: '-25% 0px -35% 0px',
      threshold: [0.1, 0.4, 0.7]
    };

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setActiveNav(sectionId);
        }
      });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));

    // Mobile Drawer Toggle
    const btnMobileToggle = document.getElementById('btn-mobile-menu-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    if (btnMobileToggle && mobileDrawer) {
      btnMobileToggle.addEventListener('click', () => {
        mobileDrawer.classList.toggle('hidden');
      });
    }

    // 5. HACKATHON FILTER PILLS
    const filterButtons = document.querySelectorAll('.zen-filter-btn');
    const hackathonCards = document.querySelectorAll('.hackathon-card-item');

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-filter');

        filterButtons.forEach(b => {
          b.classList.remove('zen-pill-vermilion');
          b.classList.add('zen-pill-subtle');
        });
        btn.classList.remove('zen-pill-subtle');
        btn.classList.add('zen-pill-vermilion');

        hackathonCards.forEach(card => {
          const cardCategory = card.getAttribute('data-category');
          if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            card.style.opacity = '1';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    // 6. TRACK DETAIL MODAL ("VIEW TRACK")
    const modalTrack = document.getElementById('modal-track-detail');
    const btnCloseTrackModal = document.getElementById('btn-close-track-modal');
    const trackDetailContainer = document.getElementById('track-detail-content');

    function openTrackModal(trackKey) {
      const data = tracksDatabase[trackKey];
      if (!data || !modalTrack || !trackDetailContainer) return;

      let roadmapHtml = '';
      if (Array.isArray(data.roadmap)) {
        roadmapHtml = `
          <div class="space-y-3 mt-4">
            <h4 class="font-zen-mono text-xs uppercase tracking-wider text-washi-sand">Curriculum & Milestone Roadmap</h4>
            <div class="grid grid-cols-1 gap-3">
              ${data.roadmap.map(step => `
                <div class="p-3.5 rounded-lg bg-black/40 border border-white/10">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-zen-mono text-xs text-washi-vermilion font-bold">Month 0${step.month} // ${step.name}</span>
                  </div>
                  ${step.week1 ? `<p class="text-xs text-washi-cream/90 mt-1 leading-relaxed"><strong class="text-washi-sand">Week 1:</strong> ${step.week1}</p>` : ''}
                  ${step.weeks2to4 ? `<p class="text-xs text-washi-cream/80 mt-1 leading-relaxed"><strong class="text-washi-sand">Weeks 2–4:</strong> ${step.weeks2to4}</p>` : ''}
                  ${step.summary ? `<p class="text-xs text-washi-cream/80 mt-1 leading-relaxed">${step.summary}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      trackDetailContainer.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <span class="washi-tag washi-tag-vermilion">${data.badge}</span>
            <span class="washi-tag">${data.timeline}</span>
          </div>

          <h3 class="font-editorial-serif text-3xl sm:text-4xl text-washi-cream font-medium">${data.title}</h3>
          
          <p class="text-sm text-washi-sand leading-relaxed">${data.overview}</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div class="p-3 rounded-lg bg-black/30 border border-white/5">
              <span class="font-zen-mono text-[11px] text-washi-sand/70 block">PRIZE & ALLOCATION</span>
              <span class="font-sans text-sm font-semibold text-washi-cream mt-0.5 block">${data.allocation}</span>
            </div>
            <div class="p-3 rounded-lg bg-black/30 border border-white/5">
              <span class="font-zen-mono text-[11px] text-washi-sand/70 block">ELIGIBILITY</span>
              <span class="font-sans text-xs text-washi-cream/90 mt-0.5 block">${data.eligibility}</span>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-black/30 border border-white/5">
            <span class="font-zen-mono text-[11px] text-washi-sand/70 block">INTELLECTUAL PROPERTY & ETHOS</span>
            <span class="font-sans text-xs text-washi-cream/90 mt-0.5 block">${data.ownership}</span>
          </div>

          ${roadmapHtml}

          <div class="pt-2">
            <span class="font-zen-mono text-xs text-washi-sand/80 block mb-2">KEY TECHNOLOGIES & METHODS</span>
            <div class="flex flex-wrap gap-2">
              ${data.techStack.map(tag => `<span class="washi-tag">${tag}</span>`).join('')}
            </div>
          </div>

          <div class="pt-4 border-t border-white/10 flex items-center justify-between">
            <button type="button" class="zen-pill zen-pill-subtle" id="btn-back-track-modal">Close</button>
            <button type="button" class="zen-pill zen-pill-vermilion" id="btn-apply-from-track" data-track="${data.title}">
              Apply for Track &rarr;
            </button>
          </div>
        </div>
      `;

      modalTrack.classList.add('open');

      // Bind Apply button inside modal
      const btnApply = document.getElementById('btn-apply-from-track');
      if (btnApply) {
        btnApply.addEventListener('click', () => {
          modalTrack.classList.remove('open');
          openPitchModal(btnApply.getAttribute('data-track'));
        });
      }

      const btnBack = document.getElementById('btn-back-track-modal');
      if (btnBack) {
        btnBack.addEventListener('click', () => {
          modalTrack.classList.remove('open');
        });
      }
    }

    // Attach click listeners to "View Track" buttons
    document.querySelectorAll('.btn-view-track').forEach(btn => {
      btn.addEventListener('click', () => {
        const trackKey = btn.getAttribute('data-track-key');
        openTrackModal(trackKey);
      });
    });

    if (btnCloseTrackModal && modalTrack) {
      btnCloseTrackModal.addEventListener('click', () => {
        modalTrack.classList.remove('open');
      });
    }

    // 7. PROPOSAL / "JOIN ORBIT" SUBMISSION MODAL
    const modalPitch = document.getElementById('modal-pitch');
    const btnClosePitch = document.getElementById('btn-close-pitch');
    const formPitch = document.getElementById('form-pitch-submission');
    const inputPitchRole = document.getElementById('pitch-role-input');

    function openPitchModal(preselectedRole) {
      if (!modalPitch) return;
      if (preselectedRole && inputPitchRole) {
        inputPitchRole.value = preselectedRole;
      }
      modalPitch.classList.add('open');
    }

    // Trigger buttons for Join Orbit / Pitch
    document.querySelectorAll('.btn-open-pitch').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-role') || 'She Builds Flagship Fellowship';
        openPitchModal(role);
      });
    });

    if (btnClosePitch && modalPitch) {
      btnClosePitch.addEventListener('click', () => {
        modalPitch.classList.remove('open');
      });
    }

    // Role Tab selection in pitch modal
    document.querySelectorAll('.modal-role-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.modal-role-pill').forEach(p => {
          p.classList.remove('zen-pill-vermilion');
          p.classList.add('zen-pill-subtle');
        });
        pill.classList.remove('zen-pill-subtle');
        pill.classList.add('zen-pill-vermilion');
        if (inputPitchRole) {
          inputPitchRole.value = pill.getAttribute('data-role');
        }
      });
    });

    // Pitch Form Submission
    if (formPitch) {
      formPitch.addEventListener('submit', e => {
        e.preventDefault();
        const name = (document.getElementById('pitch-name')?.value || '').trim();
        const email = (document.getElementById('pitch-email')?.value || '').trim();
        const title = (document.getElementById('pitch-title')?.value || '').trim();
        const domain = document.getElementById('pitch-domain')?.value || 'AI & Autonomous Systems';
        const approach = (document.getElementById('pitch-approach')?.value || '').trim();
        const role = inputPitchRole?.value || 'She Builds Flagship Fellowship';

        if (!name || !email || !title || !approach) {
          showToast('Please provide all required proposal fields.');
          return;
        }

        const newSubmission = {
          id: 'GX-' + (100 + submissions.length + 1),
          role,
          name,
          email,
          title,
          domain,
          approach,
          status: 'PROPOSAL TRANSMITTED // UNDER MINDFUL REVIEW'
        };

        submissions.unshift(newSubmission);
        saveState();
        formPitch.reset();
        modalPitch.classList.remove('open');
        showToast('Your proposal has been transmitted to Grevix Orbit.');
        renderDashboardList();
      });
    }

    // 8. PARTNER WITH GREVIX / HOST A HACKATHON FORM (Page 4 About)
    const formPartner = document.getElementById('form-host-hackathon');
    if (formPartner) {
      formPartner.addEventListener('submit', e => {
        e.preventDefault();
        const name = (document.getElementById('partner-name')?.value || '').trim();
        const org = (document.getElementById('partner-org')?.value || '').trim();
        const email = (document.getElementById('partner-email')?.value || '').trim();
        const type = document.getElementById('partner-type')?.value || 'Host Branded Hackathon';
        const message = (document.getElementById('partner-message')?.value || '').trim();

        if (!name || !org || !email || !message) {
          showToast('Please complete all partnership directive fields.');
          return;
        }

        const newPartner = {
          id: 'PR-' + String(partnerRequests.length + 1).padStart(2, '0'),
          name,
          org,
          email,
          type,
          message
        };

        partnerRequests.unshift(newPartner);
        saveState();
        formPartner.reset();
        showToast('Partnership directive received. We will respond with mindfulness.');
        renderDashboardList();
      });
    }

    // 9. MY ORBIT DASHBOARD MODAL
    const modalDashboard = document.getElementById('modal-dashboard');
    const btnOpenDashboard = document.getElementById('btn-open-dashboard');
    const btnCloseDashboard = document.getElementById('btn-close-dashboard');

    function renderDashboardList() {
      const submissionsList = document.getElementById('dashboard-submissions-list');
      const partnerList = document.getElementById('dashboard-partner-list');

      if (submissionsList) {
        if (submissions.length === 0) {
          submissionsList.innerHTML = `<div class="p-4 rounded-lg bg-black/30 border border-white/5 text-xs text-washi-sand/70">No active project proposals yet.</div>`;
        } else {
          submissionsList.innerHTML = submissions.map(sub => `
            <div class="p-3.5 rounded-lg bg-black/40 border border-white/10 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-zen-mono text-xs text-washi-vermilion font-semibold">${sub.id} // ${sub.role}</span>
                <span class="font-zen-mono text-[10px] px-2 py-0.5 rounded bg-white/5 text-washi-sand">${sub.domain}</span>
              </div>
              <div class="font-editorial-serif text-lg text-washi-cream font-medium">${sub.title}</div>
              <p class="text-xs text-washi-sand/80 line-clamp-2">${sub.approach}</p>
              <div class="flex items-center justify-between pt-1 font-zen-mono text-[11px] text-washi-sand/60">
                <span>By ${sub.name} &lt;${sub.email}&gt;</span>
                <span class="text-emerald-400 font-semibold">${sub.status}</span>
              </div>
            </div>
          `).join('');
        }
      }

      if (partnerList) {
        if (partnerRequests.length === 0) {
          partnerList.innerHTML = `<div class="p-4 rounded-lg bg-black/30 border border-white/5 text-xs text-washi-sand/70">No partnership directives filed yet.</div>`;
        } else {
          partnerList.innerHTML = partnerRequests.map(p => `
            <div class="p-3.5 rounded-lg bg-black/40 border border-white/10 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-zen-mono text-xs text-washi-cream font-semibold">${p.org}</span>
                <span class="font-zen-mono text-[10px] px-2 py-0.5 rounded bg-white/5 text-washi-vermilion">${p.type}</span>
              </div>
              <p class="text-xs text-washi-sand/80">${p.message}</p>
              <div class="font-zen-mono text-[11px] text-washi-sand/60">Contact: ${p.name} &lt;${p.email}&gt;</div>
            </div>
          `).join('');
        }
      }
    }

    if (btnOpenDashboard && modalDashboard) {
      btnOpenDashboard.addEventListener('click', () => {
        renderDashboardList();
        modalDashboard.classList.add('open');
      });
    }

    if (btnCloseDashboard && modalDashboard) {
      btnCloseDashboard.addEventListener('click', () => {
        modalDashboard.classList.remove('open');
      });
    }

    // Close any modal on backdrop click or ESC key
    document.querySelectorAll('.zen-modal-backdrop').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.zen-modal-backdrop.open').forEach(modal => {
          modal.classList.remove('open');
        });
      }
    });

    // 10. COMMUNITY PILLAR DETAILS INTERACTION
    const pillarCards = document.querySelectorAll('.community-pillar-tile');
    const pillarDetailTitle = document.getElementById('community-detail-title');
    const pillarDetailDesc = document.getElementById('community-detail-desc');
    const pillarDetailTag = document.getElementById('community-detail-tag');

    const pillarData = {
      '01': {
        tag: 'PILLAR 01 // GLOBAL BUILDER SANCTUARY',
        title: 'Network with mindful systems engineers, robotics architects, and researchers.',
        desc: 'Join verified regional chapters across Tokyo, San Francisco, Bengaluru, London, and Berlin for quiet weekly builds, collaborative hackathon squads, and architecture teardowns.'
      },
      '02': {
        tag: 'PILLAR 02 // MEDITATIVE TEARDOWNS',
        title: 'Weekly deep dives into systems engineering and deliberate craft.',
        desc: 'Masterclasses that discard fleeting hype to explore kernel architectures, deterministic robotics firmware, orbital mechanics, and clean, durable code.'
      },
      '03': {
        tag: 'PILLAR 03 // CO-CREATION SQUADS',
        title: 'Form cross-disciplinary squads built on mutual respect and shared ownership.',
        desc: 'Pair with hardware specialists, distributed backend engineers, and product artisans to enter live Grevix hackathons and accelerator cohorts.'
      },
      '04': {
        tag: 'PILLAR 04 // GREVIX INNOVATION LAB',
        title: 'Access compute credits, partner labs, and seed incubation grants.',
        desc: 'Validated projects graduate into the Grevix Innovation Lab with dedicated mentor offices, compute cluster allocations, and institutional connections.'
      }
    };

    pillarCards.forEach(card => {
      card.addEventListener('click', () => {
        const pillarId = card.getAttribute('data-pillar');
        const data = pillarData[pillarId];
        if (!data) return;

        pillarCards.forEach(c => c.classList.remove('border-washi-vermilion', 'bg-white/10'));
        card.classList.add('border-washi-vermilion', 'bg-white/10');

        if (pillarDetailTag) pillarDetailTag.textContent = data.tag;
        if (pillarDetailTitle) pillarDetailTitle.textContent = data.title;
        if (pillarDetailDesc) pillarDetailDesc.textContent = data.desc;
      });
    });

    // Initial state setup
    updateBadgeCount();
    renderDashboardList();
  });
})();
