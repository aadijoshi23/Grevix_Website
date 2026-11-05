import { webGLManager } from './webgl-manager.js';
import { cursorSystem, cursorState } from './cursor-system.js';
import { HeroBlackHoleController } from './hero-blackhole.js';
import { GalaxyBackgroundController, KeplerPlanetController } from './galaxy-theia.js';
import { PortalBackdropController, TitanShowcaseController } from './showcase-titan.js';
import { AboutPlanetsController } from './about-planets.js';

(function () {
  'use strict';

  function initGrevixApp() {
    // 1. State Management with LocalStorage Persistence (Clean Grevix Tracks)
    const defaultSubmissions = [
      {
        id: 'GX-101',
        role: 'Autonomous Systems & Robotics Lead',
        name: 'Riya Verma',
        email: 'riya.v@orbital.grevix.org',
        title: 'AetherGrid — Decentralized Campus Micro-Compute',
        domain: 'AI & Autonomous Systems',
        approach: 'Pooling distributed edge nodes for student researchers during the Grevix Orbital Innovation cycle.',
        status: 'INCUBATOR CANDIDATE // UNDER REVIEW'
      },
      {
        id: 'GX-102',
        role: 'SpaceTech & Orbital Telemetry Architect',
        name: 'Meera Nair',
        email: 'meera.nair@orbital.grevix.org',
        title: 'PulseGuard — Edge Planetary Biosensor Firmware',
        domain: 'Bio-Innovation & SpaceTech',
        approach: 'Low-power acoustic & PPG anomaly detection firmware with real-time orbital simulation telemetry.',
        status: 'FELLOWSHIP SHORTLIST #1'
      },
      {
        id: 'GX-103',
        role: 'DeepTech Quantum Compute Fellow',
        name: 'Alex Chen',
        email: 'alex.c@quantum.grevix.org',
        title: 'SingularityOS — Real-time WebGL Micro-Kernel Visualizer',
        domain: 'Quantum Computing & Systems',
        approach: 'Interactive real-time visualization of quantum logic gate execution in browser WebGL.',
        status: 'STAGE 2 SEED ACCELERATION'
      }
    ];

    const defaultPartners = [
      {
        id: 'PR-01',
        name: 'Arjun Mehta',
        org: 'DeepTech & SpaceTech Guild Lead',
        email: 'lead@grevix.org',
        type: 'Orbital Innovation Sponsor / Lab Partner',
        message: 'Hosting a high-intensity global open innovation hackathon on orbital mechanics and autonomous AI.'
      }
    ];

    let submissions = defaultSubmissions.slice();
    let partnerRequests = defaultPartners.slice();

    try {
      const savedSub = localStorage.getItem('grevix_submissions_v2');
      if (savedSub) submissions = JSON.parse(savedSub);
      const savedPart = localStorage.getItem('grevix_partners_v2');
      if (savedPart) partnerRequests = JSON.parse(savedPart);
    } catch (e) {}

    function saveState() {
      try {
        localStorage.setItem('grevix_submissions_v2', JSON.stringify(submissions));
        localStorage.setItem('grevix_partners_v2', JSON.stringify(partnerRequests));
      } catch (e) {}
      updateBadgeCount();
    }

    function updateBadgeCount() {
      const badge = document.getElementById('badge-submission-count');
      if (badge) badge.textContent = String(submissions.length);
    }

    function showToast(msg) {
      const toast = document.getElementById('hud-toast');
      const text = document.getElementById('hud-toast-text');
      if (!toast || !text) return;
      text.textContent = msg;
      toast.classList.remove('hidden');
      clearTimeout(window.__grevixToastTimer);
      window.__grevixToastTimer = setTimeout(function () {
        toast.classList.add('hidden');
      }, 3400);
    }

    // 2. Navigation Metadata Mapping & Smooth Scrolling
    const sectionMeta = {
      'section-home': { index: '01 /', label: 'HOME // ORBIT' },
      'section-hackathons': { index: '02 /', label: 'TRACKS // 100K GALAXY' },
      'section-community': { index: '03 /', label: 'COMMUNITY // NETWORK' },
      'section-resources': { index: '04 /', label: 'INNOVATION LAB // TOOLS' },
      'section-showcase': { index: '05 /', label: 'SHOWCASE // TITAN MECHA' },
      'section-about': { index: '06 /', label: 'ABOUT // PARTNER' }
    };

    function updateNavState(sectionId, indexStr, labelStr) {
      const meta = sectionMeta[sectionId];
      const finalIndex = indexStr || (meta ? meta.index : '');
      const finalLabel = labelStr || (meta ? meta.label : '');

      const idxEl = document.getElementById('hud-active-index');
      if (idxEl && finalIndex) idxEl.textContent = finalIndex;

      const lblEl = document.getElementById('hud-active-label');
      if (lblEl && finalLabel) lblEl.textContent = finalLabel;

      // Update Header nav buttons
      document.querySelectorAll('.hud-nav-btn').forEach(function (btn) {
        const dot = btn.querySelector('.nav-dot');
        if (btn.getAttribute('data-target') === sectionId) {
          btn.classList.remove('opacity-60');
          btn.classList.add('opacity-100', 'text-white');
          if (dot) dot.classList.remove('hidden');
        } else {
          btn.classList.add('opacity-60');
          btn.classList.remove('opacity-100', 'text-white');
          if (dot) dot.classList.add('hidden');
        }
      });
    }

    function navigateToSection(sectionId, indexStr, labelStr) {
      if (!sectionId) return;
      const target = document.getElementById(sectionId);
      if (target) {
        if (sectionId === 'section-home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const header = document.getElementById('hud-header');
          const headerH = header ? header.offsetHeight : 0;
          const targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerH;
          window.scrollTo({ top: Math.max(0, targetPos), behavior: 'smooth' });
        }
      }
      updateNavState(sectionId, indexStr, labelStr);
    }

    // Header nav buttons
    document.querySelectorAll('.hud-nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        navigateToSection(
          btn.getAttribute('data-target'),
          btn.getAttribute('data-index'),
          btn.getAttribute('data-label')
        );
      });
    });

    // Mobile nav drawer
    const mobileMenuBtn = document.getElementById('btn-mobile-menu');
    const mobileNavDrawer = document.getElementById('mobile-nav-drawer');

    if (mobileMenuBtn && mobileNavDrawer) {
      mobileMenuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        mobileNavDrawer.classList.toggle('hidden');
      });

      document.addEventListener('click', function (e) {
        if (!mobileNavDrawer.classList.contains('hidden') &&
            !mobileNavDrawer.contains(e.target) &&
            e.target !== mobileMenuBtn &&
            !mobileMenuBtn.contains(e.target)) {
          mobileNavDrawer.classList.add('hidden');
        }
      });
    }

    document.querySelectorAll('.mobile-nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (mobileNavDrawer) mobileNavDrawer.classList.add('hidden');
        navigateToSection(btn.getAttribute('data-target'));
      });
    });

    // Scroll buttons
    const btnHeroExplore = document.getElementById('btn-hero-explore');
    if (btnHeroExplore) {
      btnHeroExplore.addEventListener('click', function () {
        navigateToSection('section-hackathons', '02 /', 'TRACKS // 100K GALAXY');
      });
    }

    const btnDarkExplore = document.getElementById('btn-dark-explore-tracks');
    if (btnDarkExplore) {
      btnDarkExplore.addEventListener('click', function () {
        navigateToSection('section-hackathons', '02 /', 'TRACKS // 100K GALAXY');
      });
    }

    document.querySelectorAll('.scroll-trigger').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        navigateToSection(btn.getAttribute('data-scroll-to'));
      });
    });

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        navigateToSection(href.substring(1));
      });
    });

    const brandLogo = document.querySelector('.nav-trigger');
    if (brandLogo) {
      brandLogo.addEventListener('click', function (e) {
        e.preventDefault();
        navigateToSection('section-home', '01 /', 'HOME // ORBIT');
      });
    }

    // ScrollSpy telemetry with IntersectionObserver
    if ('IntersectionObserver' in window) {
      const navObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              updateNavState(entry.target.id);
            }
          });
        },
        { rootMargin: '-20% 0px -60% 0px' }
      );

      Object.keys(sectionMeta).forEach(function (id) {
        const el = document.getElementById(id);
        if (el) navObserver.observe(el);
      });
    }

    // 3. Scroll-Triggered Blur-to-Crisp Reveal Animations
    function initScrollReveal() {
      if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal-blur').forEach(function (el) {
          el.classList.add('is-revealed');
        });
        return;
      }

      const revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -50px 0px', threshold: 0.1 }
      );

      document.querySelectorAll('.reveal-blur').forEach(function (el) {
        revealObserver.observe(el);
      });
    }
    initScrollReveal();

    // 4. Regional Orbit Selector
    const regions = ['GLOBAL // EN', 'INDIA // BENGALURU', 'APAC // TOKYO', 'EU-WEST // ZURICH', 'US-EAST // SF'];
    let regionIdx = 0;
    const btnRegion = document.getElementById('btn-region-cycle');
    if (btnRegion) {
      btnRegion.addEventListener('click', function () {
        regionIdx = (regionIdx + 1) % regions.length;
        const codeEl = document.getElementById('region-code');
        if (codeEl) codeEl.textContent = regions[regionIdx];
        showToast('ORBITAL TELEMETRY NODE CONNECTED: ' + regions[regionIdx]);
      });
    }

    // 5. Hackathon Category Filter
    document.querySelectorAll('.hack-filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('.hack-filter-btn').forEach(function (b) {
          b.className = 'hack-filter-btn px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 rounded-full text-xs font-mono tracking-wider transition';
        });
        btn.className = 'hack-filter-btn px-4 py-2 bg-grevix-orange text-white font-bold border border-grevix-orange rounded-full text-xs font-mono tracking-wider transition shadow-lg shadow-orange-500/25';

        document.querySelectorAll('.hackathon-card').forEach(function (card) {
          const cat = card.getAttribute('data-category');
          if (filter === 'all' || cat === filter) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });

    // 6. Community 4 Pillars Interactive Switcher
    const pillarDetails = {
      '01': {
        tag: 'PILLAR 01 // CONNECT — GLOBAL BUILDER GRAPH',
        title: 'Connect with autonomous systems engineers, space tech founders, and WebGL developers.',
        desc: 'Join verified regional hackathon squads, open research collectives, and university engineering labs across 40+ countries.',
        cta: 'EXPLORE BUILDER DIRECTORY \u2192'
      },
      '02': {
        tag: 'PILLAR 02 // LEARN — ADVANCED WORKSHOPS & TEARDOWNS',
        title: 'Master orbital mechanics simulation, GLSL shaders, and edge robotics firmware.',
        desc: 'Participate in weekly live code clinics, shader optimization masterclasses, and architecture breakdown sessions.',
        cta: 'ACCESS TECHNICAL REPOSITORIES \u2192'
      },
      '03': {
        tag: 'PILLAR 03 // COLLABORATE — AUTONOMOUS TEAM MATCHING',
        title: 'Form high-velocity squads with complementary technical skillsets.',
        desc: 'Recruit specialized engineers across WebGL 3D graphics, embedded rust, autonomous navigation, and quantum computing.',
        cta: 'MATCH WITH SQUADS \u2192'
      },
      '04': {
        tag: 'PILLAR 04 // GROW — GREVIX INNOVATION LAB & ACCELERATION',
        title: 'Deploy production systems with industry engineering mentors and seed capital.',
        desc: 'Direct access to high-compute GPU clusters, space tech hardware sandboxes, and corporate pilot launch opportunities.',
        cta: 'APPLY FOR LAB ACCELERATOR \u2192'
      }
    };

    document.querySelectorAll('.community-pillar-card').forEach(function (card) {
      card.addEventListener('click', function () {
        const code = card.getAttribute('data-pillar');
        const info = pillarDetails[code];
        if (!info) return;

        document.querySelectorAll('.community-pillar-card').forEach(function (c) {
          c.classList.remove('border-grevix-orange', 'bg-white/10');
          c.classList.add('border-white/10', 'bg-white/[0.03]');
        });
        card.classList.remove('border-white/10', 'bg-white/[0.03]');
        card.classList.add('border-grevix-orange', 'bg-white/10');

        const tagEl = document.getElementById('pillar-detail-tag');
        const titleEl = document.getElementById('pillar-detail-title');
        const descEl = document.getElementById('pillar-detail-desc');
        const actionBtn = document.getElementById('btn-pillar-action');

        if (tagEl) tagEl.textContent = info.tag;
        if (titleEl) titleEl.textContent = info.title;
        if (descEl) descEl.textContent = info.desc;
        if (actionBtn) actionBtn.textContent = info.cta;
      });
    });

    const btnPillarAction = document.getElementById('btn-pillar-action');
    if (btnPillarAction) {
      btnPillarAction.addEventListener('click', function () {
        openPitchModal('Autonomous Systems & Robotics Lead');
      });
    }

    // 7. Pitch / Application Modal
    const modalPitch = document.getElementById('modal-pitch');

    function selectModalRole(roleName) {
      const input = document.getElementById('pitch-role-input');
      if (input) input.value = roleName;
      document.querySelectorAll('.modal-role-tab').forEach(function (tab) {
        if (tab.getAttribute('data-role') === roleName) {
          tab.className = 'modal-role-tab py-2.5 px-3 border border-grevix-orange bg-grevix-orange text-white font-bold text-left rounded text-xs font-mono';
        } else {
          tab.className = 'modal-role-tab py-2.5 px-3 border border-white/20 bg-white/5 text-white/70 hover:border-white/40 text-left rounded text-xs font-mono';
        }
      });
    }

    function openPitchModal(defaultRole) {
      if (defaultRole) selectModalRole(defaultRole);
      if (modalPitch) modalPitch.classList.remove('hidden');
    }

    function closePitchModal() {
      if (modalPitch) modalPitch.classList.add('hidden');
    }

    document.querySelectorAll('.modal-role-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        selectModalRole(tab.getAttribute('data-role'));
      });
    });

    ['btn-header-join', 'btn-hero-pitch-cta', 'btn-footer-submit', 'btn-showcase-pitch'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', function () {
          openPitchModal('Autonomous Systems & Robotics Lead');
        });
      }
    });

    document.querySelectorAll('.open-pitch-modal-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const role = btn.getAttribute('data-role') || 'Autonomous Systems & Robotics Lead';
        openPitchModal(role);
      });
    });

    ['btn-close-pitch-modal', 'btn-cancel-pitch'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', closePitchModal);
    });

    const formPitch = document.getElementById('form-pitch-submission');
    if (formPitch) {
      formPitch.addEventListener('submit', function (e) {
        e.preventDefault();
        const nameInput = document.getElementById('pitch-creator-name');
        const emailInput = document.getElementById('pitch-creator-email');
        const titleInput = document.getElementById('pitch-title');
        const domainInput = document.getElementById('pitch-domain');
        const approachInput = document.getElementById('pitch-approach');
        const roleInput = document.getElementById('pitch-role-input');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const title = titleInput ? titleInput.value.trim() : '';
        const domain = domainInput ? domainInput.value : 'AI & Autonomous Systems';
        const approach = approachInput ? approachInput.value.trim() : '';
        const role = roleInput ? roleInput.value : 'Autonomous Systems & Robotics Lead';

        if (!name || !email || !title || !approach) {
          showToast('PLEASE COMPLETE ALL REQUIRED SUBMISSION FIELDS');
          return;
        }

        const newEntry = {
          id: 'GX-' + (100 + submissions.length + 1),
          role: role,
          name: name,
          email: email,
          title: title,
          domain: domain,
          approach: approach,
          status: 'INCUBATOR CANDIDATE // RECEIVED'
        };

        submissions.unshift(newEntry);
        saveState();
        formPitch.reset();
        closePitchModal();
        renderDashboardLists();
        openDashboardModal();
        showToast('PROJECT PROPOSAL TRANSMITTED TO GREVIX ORBIT (' + newEntry.id + ')');
      });
    }

    // 8. Partner Hackathon Form
    const formHost = document.getElementById('form-host-hackathon');
    if (formHost) {
      formHost.addEventListener('submit', function (e) {
        e.preventDefault();
        const nameInput = document.getElementById('host-name');
        const orgInput = document.getElementById('host-org');
        const emailInput = document.getElementById('host-email');
        const typeInput = document.getElementById('host-type');
        const msgInput = document.getElementById('host-message');

        const name = nameInput ? nameInput.value.trim() : '';
        const org = orgInput ? orgInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const type = typeInput ? typeInput.value : '';
        const message = msgInput ? msgInput.value.trim() : '';

        if (!name || !org || !email || !type || !message) {
          showToast('PLEASE FILL ALL FIELDS TO SUBMIT YOUR HACKATHON REQUEST');
          return;
        }

        const req = {
          id: 'PR-0' + (partnerRequests.length + 1),
          name: name,
          org: org,
          email: email,
          type: type,
          message: message
        };
        partnerRequests.unshift(req);
        saveState();
        formHost.reset();

        const fb = document.getElementById('host-form-feedback');
        if (fb) {
          fb.textContent = 'REQUEST LOGGED [' + req.id + ']: ' + org + ' (' + type + ') — TELEMETRY DISPATCHED.';
          fb.classList.remove('hidden');
        }
        showToast('HACKATHON PARTNERSHIP REQUEST TRANSMITTED');
      });
    }

    // 9. Dashboard Modal
    const modalDashboard = document.getElementById('modal-dashboard');

    function renderDashboardLists() {
      const subContainer = document.getElementById('dashboard-submissions-list');
      if (subContainer) {
        subContainer.innerHTML = submissions.map(function (s) {
          return (
            '<div class="p-4 border border-white/10 bg-black/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">' +
              '<div class="space-y-1">' +
                '<div class="flex items-center gap-2 font-mono text-[11px]">' +
                  '<span class="px-2 py-0.5 bg-grevix-orange text-white font-bold rounded">' + s.id + '</span>' +
                  '<span class="text-grevix-pink">' + s.role + '</span>' +
                  '<span class="text-white/40">&bull; ' + s.domain + '</span>' +
                '</div>' +
                '<div class="font-display font-bold text-base text-white">' + s.title + '</div>' +
                '<div class="text-xs text-white/70">' + s.approach + '</div>' +
                '<div class="font-mono text-[10px] text-white/40">LEAD: ' + s.name + ' (' + s.email + ')</div>' +
              '</div>' +
              '<div class="shrink-0 font-mono text-[10px] px-2.5 py-1 border border-cyan-400/40 text-cyan-300 rounded">' +
                s.status +
              '</div>' +
            '</div>'
          );
        }).join('');
      }

      const partContainer = document.getElementById('dashboard-partner-list');
      if (partContainer) {
        partContainer.innerHTML = partnerRequests.map(function (p) {
          return (
            '<div class="p-3 border border-white/10 bg-black/40 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">' +
              '<div>' +
                '<span class="font-mono text-grevix-orange font-bold mr-2">[' + p.id + ']</span>' +
                '<strong class="text-white">' + p.org + '</strong> &mdash; ' + p.type +
                '<div class="text-white/60 text-[11px] mt-0.5">' + p.message + '</div>' +
              '</div>' +
              '<span class="font-mono text-[10px] text-white/40">' + p.name + '</span>' +
            '</div>'
          );
        }).join('');
      }
    }

    function openDashboardModal() {
      renderDashboardLists();
      if (modalDashboard) modalDashboard.classList.remove('hidden');
    }

    const btnOpenDash = document.getElementById('btn-open-dashboard');
    if (btnOpenDash) btnOpenDash.addEventListener('click', openDashboardModal);

    const btnCloseDash = document.getElementById('btn-close-dashboard');
    if (btnCloseDash) {
      btnCloseDash.addEventListener('click', function () {
        if (modalDashboard) modalDashboard.classList.add('hidden');
      });
    }

    const btnNewFromDash = document.getElementById('btn-new-from-dashboard');
    if (btnNewFromDash) {
      btnNewFromDash.addEventListener('click', function () {
        if (modalDashboard) modalDashboard.classList.add('hidden');
        openPitchModal('Autonomous Systems & Robotics Lead');
      });
    }

    // 10. Watch Reel Modal
    const modalReel = document.getElementById('modal-reel');
    ['btn-watch-reel', 'btn-watch-how-it-works'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', function () {
          if (modalReel) modalReel.classList.remove('hidden');
        });
      }
    });

    const btnCloseReel = document.getElementById('btn-close-reel');
    if (btnCloseReel) {
      btnCloseReel.addEventListener('click', function () {
        if (modalReel) modalReel.classList.add('hidden');
      });
    }

    const btnReelToPitch = document.getElementById('btn-reel-to-pitch');
    if (btnReelToPitch) {
      btnReelToPitch.addEventListener('click', function () {
        if (modalReel) modalReel.classList.add('hidden');
        openPitchModal('Autonomous Systems & Robotics Lead');
      });
    }

    // Modal click outside & escape
    [modalPitch, modalDashboard, modalReel].forEach(function (m) {
      if (!m) return;
      m.addEventListener('click', function (e) {
        if (e.target === m) m.classList.add('hidden');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        [modalPitch, modalDashboard, modalReel].forEach(function (m) {
          if (m) m.classList.add('hidden');
        });
        if (mobileNavDrawer) mobileNavDrawer.classList.add('hidden');
      }
    });

    // 11. Scoped 3D & WebGL Assets Integration
    function init3DAssets() {
      try {
        // Hero Section: 3D Black Hole with Shaders + Theia Prime + Miller's Planet + Manga Layer
        const heroWrap = document.getElementById('hero-blackhole-canvas-wrap');
        if (heroWrap) {
          const heroBlackHole = new HeroBlackHoleController('hero-blackhole-canvas-wrap');
          webGLManager.register('section-home', heroBlackHole);
        }

        // Programs & Tracks: 100,000 Particle Spiral Galaxy (galaxythree-js)
        const galaxyContainer = document.getElementById('galaxy-bg-container');
        if (galaxyContainer) {
          const galaxyCtrl = new GalaxyBackgroundController('galaxy-bg-container');
          webGLManager.register('section-hackathons', galaxyCtrl);
        }

        // Programs & Tracks: Kepler-36b Exoplanet 3D Viewport
        const keplerContainer = document.getElementById('kepler-planet-container');
        if (keplerContainer) {
          const keplerCtrl = new KeplerPlanetController('kepler-planet-container');
          webGLManager.register(keplerContainer, keplerCtrl);
        }

        // Showcase: Black Hole Canvas Vortex (black-hole-animation-canvas)
        const portalCanvas = document.getElementById('portal-backdrop-canvas');
        if (portalCanvas) {
          const portalCtrl = new PortalBackdropController('portal-backdrop-canvas');
          webGLManager.register('section-showcase', portalCtrl);
        }

        // Showcase: Brute Prototype Titan Cameraman Mecha (3D GLTF Viewport)
        const titanContainer = document.getElementById('titan-showcase-container');
        if (titanContainer) {
          const titanCtrl = new TitanShowcaseController('titan-showcase-container');
          webGLManager.register('section-showcase', titanCtrl);
        }

        // About / Telemetry Section: Miller's Planet & Kepler Celestial Engine
        const aboutPlanetsContainer = document.getElementById('about-planets-container');
        if (aboutPlanetsContainer) {
          const aboutPlanetsCtrl = new AboutPlanetsController('about-planets-container');
          webGLManager.register(aboutPlanetsContainer, aboutPlanetsCtrl);

          const btnDual = document.getElementById('btn-focus-dual');
          const btnMillers = document.getElementById('btn-focus-millers');
          const btnKepler = document.getElementById('btn-focus-kepler');
          const focusButtons = [btnDual, btnMillers, btnKepler];

          function setFocusBtn(activeBtn) {
            focusButtons.forEach(function (b) {
              if (!b) return;
              if (b === activeBtn) b.classList.add('active');
              else b.classList.remove('active');
            });
          }

          if (btnDual) {
            btnDual.addEventListener('click', function () {
              aboutPlanetsCtrl.setFocus('dual');
              setFocusBtn(btnDual);
            });
          }
          if (btnMillers) {
            btnMillers.addEventListener('click', function () {
              aboutPlanetsCtrl.setFocus('millers');
              setFocusBtn(btnMillers);
            });
          }
          if (btnKepler) {
            btnKepler.addEventListener('click', function () {
              aboutPlanetsCtrl.setFocus('kepler');
              setFocusBtn(btnKepler);
            });
          }
        }
      } catch (err) {
        console.error('[Grevix 3D Engine] Initialization error:', err);
      }
    }

    init3DAssets();
    updateBadgeCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGrevixApp);
  } else {
    initGrevixApp();
  }
})();
