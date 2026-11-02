(function () {
  'use strict';

  function initGrevixApp() {
    // 1. State Management with Safe LocalStorage Persistence
    const defaultSubmissions = [
      {
        id: 'SB-101',
        role: 'Week 1 Idea Creator (She Builds)',
        name: 'Riya Verma',
        email: 'riya.v@campus.edu',
        title: 'AetherGrid — Decentralized Campus Micro-Compute',
        domain: 'AI & Autonomous Systems',
        approach: 'Pooling idle college lab GPUs for student researchers during Month 2 Grevix Innovation Lab sprint.',
        status: 'WEEK 1 CANDIDATE // UNDER REVIEW'
      },
      {
        id: 'SB-102',
        role: 'Week 1 Idea Creator (She Builds)',
        name: 'Meera Nair',
        email: 'meera.nair@campus.edu',
        title: 'PulseGuard — Edge Wearable Biosensor Firmware',
        domain: 'HealthTech & Bio-Innovation',
        approach: 'Low-power acoustic & PPG anomaly detection with Month 3 clinical simulation showcase.',
        status: 'SHORTLISTED SLOT #1 PREVIEW'
      }
    ];

    const defaultPartners = [
      {
        id: 'PR-01',
        name: 'Arjun Mehta',
        org: 'College Coding Community Lead',
        email: 'lead@grevix.org',
        type: 'She Builds Sponsor / Lab Partner',
        message: 'Launching the 3-month She Builds open innovation program exclusively for girls.'
      }
    ];

    let submissions = defaultSubmissions.slice();
    let partnerRequests = defaultPartners.slice();

    try {
      const savedSub = localStorage.getItem('grevix_submissions_v1');
      if (savedSub) submissions = JSON.parse(savedSub);
      const savedPart = localStorage.getItem('grevix_partners_v1');
      if (savedPart) partnerRequests = JSON.parse(savedPart);
    } catch (e) {
      // Fallback to in-memory inside sandboxed iframe
    }

    function saveState() {
      try {
        localStorage.setItem('grevix_submissions_v1', JSON.stringify(submissions));
        localStorage.setItem('grevix_partners_v1', JSON.stringify(partnerRequests));
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
      }, 3600);
    }

    // 2. Navigation Metadata Mapping & Smooth Scrolling
    const sectionMeta = {
      'section-home': { index: '01.', label: 'HOME // ORBIT' },
      'section-hackathons': { index: '02.', label: 'HACKATHONS // BEYOND LIMITS' },
      'section-she-builds': { index: '02.B', label: 'SHE BUILDS // 3-MONTH PROGRAM' },
      'section-community': { index: '03.', label: 'COMMUNITY // NETWORK' },
      'section-resources': { index: '04.', label: 'INNOVATION LAB // RESOURCES' },
      'section-about': { index: '05.', label: 'ABOUT // PARTNER' }
    };

    function updateNavState(sectionId, indexStr, labelStr) {
      const meta = sectionMeta[sectionId];
      const finalIndex = indexStr || (meta ? meta.index : '');
      const finalLabel = labelStr || (meta ? meta.label : '');

      if (finalIndex) {
        const idxEl = document.getElementById('hud-active-index');
        if (idxEl) idxEl.textContent = finalIndex;
      }
      if (finalLabel) {
        const lblEl = document.getElementById('hud-active-label');
        if (lblEl) lblEl.textContent = finalLabel;
      }

      // Update Top HUD Header buttons
      document.querySelectorAll('.hud-nav-btn').forEach(function (btn) {
        const dot = btn.querySelector('.nav-dot');
        if (btn.getAttribute('data-target') === sectionId) {
          btn.classList.remove('opacity-70');
          if (dot) dot.classList.remove('hidden');
        } else {
          btn.classList.add('opacity-70');
          if (dot) dot.classList.add('hidden');
        }
      });

      // Update Fixed Right Rail buttons
      document.querySelectorAll('.rail-btn').forEach(function (btn) {
        if (btn.getAttribute('data-target') === sectionId) {
          btn.classList.remove('text-black/50');
          btn.classList.add('text-grevix-orange', 'font-bold');
        } else {
          btn.classList.remove('text-grevix-orange', 'font-bold');
          btn.classList.add('text-black/50');
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

    // Right rail buttons
    document.querySelectorAll('.rail-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        navigateToSection(btn.getAttribute('data-target'));
      });
    });

    // Mobile nav drawer & items
    const mobileMenuBtn = document.getElementById('btn-mobile-menu');
    const mobileNavDrawer = document.getElementById('mobile-nav-drawer');

    if (mobileMenuBtn && mobileNavDrawer) {
      mobileMenuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        mobileNavDrawer.classList.toggle('hidden');
      });

      // Close mobile drawer when clicking outside
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

    // Quick scroll triggers
    const btnBannerSheBuilds = document.getElementById('btn-banner-shebuilds');
    if (btnBannerSheBuilds) {
      btnBannerSheBuilds.addEventListener('click', function () {
        navigateToSection('section-she-builds', '02.B', 'SHE BUILDS // 3-MONTH PROGRAM');
      });
    }

    const btnHeroExplore = document.getElementById('btn-hero-explore');
    if (btnHeroExplore) {
      btnHeroExplore.addEventListener('click', function () {
        navigateToSection('section-hackathons', '02.', 'HACKATHONS // BEYOND LIMITS');
      });
    }

    const btnDarkExplore = document.getElementById('btn-dark-explore-tracks');
    if (btnDarkExplore) {
      btnDarkExplore.addEventListener('click', function () {
        const dir = document.getElementById('hackathons-directory');
        if (dir) {
          const header = document.getElementById('hud-header');
          const headerH = header ? header.offsetHeight : 0;
          const pos = dir.getBoundingClientRect().top + window.pageYOffset - headerH;
          window.scrollTo({ top: Math.max(0, pos), behavior: 'smooth' });
        }
      });
    }

    document.querySelectorAll('.scroll-trigger').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        navigateToSection(btn.getAttribute('data-scroll-to'));
      });
    });

    // Handle all '#' anchor links and prevent dead jumps
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const targetId = href.substring(1);
        navigateToSection(targetId);
      });
    });

    // Grevix Brand Logo
    const brandLogo = document.querySelector('.nav-trigger');
    if (brandLogo) {
      brandLogo.addEventListener('click', function (e) {
        e.preventDefault();
        navigateToSection('section-home', '01.', 'HOME // ORBIT');
      });
    }

    // ScrollSpy telemetry with IntersectionObserver
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              updateNavState(entry.target.id);
            }
          });
        },
        { rootMargin: '-25% 0px -65% 0px' }
      );

      Object.keys(sectionMeta).forEach(function (id) {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }

    // 3. Region / Node Switcher
    const regions = ['GLOBAL // EN', 'INDIA // CAMPUS', 'APAC // ORBIT', 'EU-WEST // HUB'];
    let regionIdx = 0;
    const btnRegion = document.getElementById('btn-region-cycle');
    if (btnRegion) {
      btnRegion.addEventListener('click', function () {
        regionIdx = (regionIdx + 1) % regions.length;
        const codeEl = document.getElementById('region-code');
        if (codeEl) codeEl.textContent = regions[regionIdx];
        showToast('ORBITAL NODE SWITCHED TO ' + regions[regionIdx]);
      });
    }

    // 4. Social Orbit Buttons
    const socialLinks = {
      'LinkedIn': 'https://linkedin.com/company/grevix',
      'X (Twitter)': 'https://x.com/grevix_org',
      'Instagram': 'https://instagram.com/grevix',
      'Discord Community': 'https://discord.gg/grevix'
    };

    document.querySelectorAll('.social-orbit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const net = btn.getAttribute('data-social') || '';
        const url = socialLinks[net] || 'https://grevix.org';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).catch(function () {});
        }
        showToast('GREVIX ' + net.toUpperCase() + ' CHANNEL LINK COPIED TO CLIPBOARD');
      });
    });

    // 5. Hackathon Category Filter
    document.querySelectorAll('.hack-filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('.hack-filter-btn').forEach(function (b) {
          b.className = 'hack-filter-btn px-3.5 py-2 bg-white/5 hover:bg-white/15 text-white/80 border border-white/15 tracking-wider';
        });
        btn.className = 'hack-filter-btn px-3.5 py-2 bg-grevix-orange text-white font-bold tracking-wider';

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

    // Allow clicking anywhere on a hackathon card to trigger its main action
    document.querySelectorAll('.hackathon-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('button, a, input, select, textarea, label')) return;
        const trigger = card.querySelector('.open-pitch-modal-btn') || card.querySelector('.scroll-trigger');
        if (trigger) trigger.click();
      });
    });

    // 6. She Builds 3-Month Interactive Phase Inspector
    const phaseData = {
      '1': {
        tag: 'PHASE 01 // SHAPE YOUR IDEA (MONTH 1)',
        weeks: 'WEEKS 01 – 04',
        title: 'Week 1 Total Exploration \u2192 Top 2 Shortlist \u2192 Concept Refinement',
        b1Title: 'WEEK 1: COMPLETE CREATIVE FREEDOM & SHORTLISTING',
        b1Desc: 'Anyone can submit their ideas. Idea creators have complete freedom to explore what they want to build and how they want to approach it. By the end of Week 1, Grevix selects the 2 most promising ideas.',
        b2Title: 'WEEKS 2–4: REFINE CONCEPTS & PLAN APPROACH',
        b2Desc: 'For the rest of the first month, the 2 shortlisted creators refine their concepts, validate system architecture, and plan their execution approach.'
      },
      '2': {
        tag: 'PHASE 02 // FORM TEAMS & DEVELOP (MONTH 2)',
        weeks: 'WEEKS 05 – 08',
        title: 'Team Formation, Active Engineering & Grevix Innovation Lab Access',
        b1Title: 'TEAM BUILDING & CORE DEVELOPMENT',
        b1Desc: 'The 2 shortlisted creators recruit specialized builders (frontend, backend, AI, design) and start developing their ideas into working systems.',
        b2Title: 'GREVIX INNOVATION LAB ACCESS',
        b2Desc: 'Full access to the Grevix Innovation Lab: dedicated mentorship, collaboration with industry professionals and engineers, and direct opportunities to connect with partner companies.'
      },
      '3': {
        tag: 'PHASE 03 // IMPROVE, TEST & SHOWCASE (MONTH 3)',
        weeks: 'WEEKS 09 – 12',
        title: 'QA Hardening, Real-World Testing & Public Industry Showcase',
        b1Title: 'IMPROVING & RIGOROUS TESTING',
        b1Desc: 'Focus on refining product UX, stress-testing edge cases, and iterating with feedback from Grevix engineers and early users.',
        b2Title: 'FINAL SHOWCASE & SHARED OWNERSHIP',
        b2Desc: 'Present the completed project to partner companies and the community. Project ownership is shared between the creator and Grevix under clearly defined terms, with proper credit for everyone involved.'
      }
    };

    document.querySelectorAll('.phase-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const p = btn.getAttribute('data-phase');
        const d = phaseData[p];
        if (!d) return;

        document.querySelectorAll('.phase-tab-btn').forEach(function (b) {
          b.className = 'phase-tab-btn py-2.5 px-2 border border-white/20 bg-white/5 text-white/75 hover:border-white/50 text-center transition';
        });
        btn.className = 'phase-tab-btn py-2.5 px-2 border border-grevix-orange bg-grevix-orange text-white font-bold text-center transition';

        const panel = document.getElementById('phase-detail-panel');
        if (panel) {
          panel.innerHTML =
            '<div class="flex items-center justify-between font-mono text-xs text-grevix-pink">' +
              '<span>' + d.tag + '</span>' +
              '<span>' + d.weeks + '</span>' +
            '</div>' +
            '<h4 class="font-display text-xl font-bold text-white">' + d.title + '</h4>' +
            '<div class="space-y-3 text-xs sm:text-sm text-white/80 leading-relaxed">' +
              '<div class="p-3 border-l-2 border-grevix-orange bg-white/5">' +
                '<strong class="text-white block font-mono text-xs mb-1">' + d.b1Title + '</strong>' +
                d.b1Desc +
              '</div>' +
              '<div class="p-3 border-l-2 border-grevix-pink bg-white/5">' +
                '<strong class="text-white block font-mono text-xs mb-1">' + d.b2Title + '</strong>' +
                d.b2Desc +
              '</div>' +
            '</div>';
        }
      });
    });

    // Toggle Posters Strip
    const btnTogglePosters = document.getElementById('btn-toggle-posters');
    if (btnTogglePosters) {
      btnTogglePosters.addEventListener('click', function () {
        const grid = document.getElementById('posters-grid-container');
        if (grid) grid.classList.toggle('hidden');
      });
    }

    // 7. Community 4 Pillars Interactive Switcher
    const pillarDetails = {
      '01': {
        tag: 'PILLAR 01 // CONNECT — GLOBAL BUILDER GRAPH',
        title: 'Connect with student founders, systems engineers, and designers across chapters.',
        desc: 'Join verified college coding hubs, regional hackathon squads, and the dedicated She Builds creator circle.',
        cta: 'JOIN BUILDER DIRECTORY \u2192',
        dotLeft: '0%'
      },
      '02': {
        tag: 'PILLAR 02 // LEARN — TECHNICAL WORKSHOPS & DEEP DIVES',
        title: 'Master system architecture, AI engineering, and product execution.',
        desc: 'Participate in weekly technical teardowns, open-source code clinics, and Week 1 idea exploration sessions.',
        cta: 'EXPLORE LEARNING SESSIONS \u2192',
        dotLeft: '33%'
      },
      '03': {
        tag: 'PILLAR 03 // COLLABORATE — SQUAD & TEAM MATCHING',
        title: 'Find co-builders and form high-velocity engineering teams.',
        desc: 'In Month 2 of She Builds, shortlisted idea creators recruit developers, designers, and researchers directly from the Grevix talent pool.',
        cta: 'BROWSE OPEN ROLES \u2192',
        dotLeft: '66%'
      },
      '04': {
        tag: 'PILLAR 04 // GROW — GREVIX INNOVATION LAB & INDUSTRY ACCESS',
        title: 'Accelerate inside the Grevix Innovation Lab with industry mentors.',
        desc: 'Gain 1-on-1 mentorship from practicing engineers, connect with partner companies, and launch with shared ownership and full creator credit.',
        cta: 'APPLY FOR LAB MENTORSHIP \u2192',
        dotLeft: '94%'
      }
    };

    document.querySelectorAll('.community-pillar-card').forEach(function (card) {
      card.addEventListener('click', function () {
        const code = card.getAttribute('data-pillar');
        const info = pillarDetails[code];
        if (!info) return;

        document.querySelectorAll('.community-pillar-card').forEach(function (c) {
          c.className = 'community-pillar-card group text-left border border-black/40 bg-white/80 p-5 hover:bg-black hover:text-white hover:border-black transition relative';
        });
        card.className = 'community-pillar-card group text-left border-2 border-black bg-white p-5 hover:bg-black hover:text-white transition relative';

        const tagEl = document.getElementById('pillar-detail-tag');
        const titleEl = document.getElementById('pillar-detail-title');
        const descEl = document.getElementById('pillar-detail-desc');
        const actionBtn = document.getElementById('btn-pillar-action');

        if (tagEl) tagEl.textContent = info.tag;
        if (titleEl) titleEl.textContent = info.title;
        if (descEl) descEl.textContent = info.desc;
        if (actionBtn) actionBtn.textContent = info.cta;

        const bracket = document.getElementById('pillar-active-bracket');
        if (bracket) bracket.textContent = '[ ' + code + ' ]';
        const dot = document.getElementById('pillar-progress-dot');
        if (dot) dot.style.left = info.dotLeft;
      });
    });

    const btnPillarAction = document.getElementById('btn-pillar-action');
    if (btnPillarAction) {
      btnPillarAction.addEventListener('click', function () {
        const bracket = document.getElementById('pillar-active-bracket');
        const code = bracket ? bracket.textContent.replace(/[^0-9]/g, '') : '01';
        if (code === '04') {
          openPitchModal('Week 1 Idea Creator (She Builds)');
        } else if (code === '03') {
          openPitchModal('Month 2 Builder Team (She Builds)');
        } else {
          openPitchModal('Global Hackathon Squad');
        }
      });
    }

    // 8. Pitch / Application Modal Logic
    const modalPitch = document.getElementById('modal-pitch');

    function selectModalRole(roleName) {
      const input = document.getElementById('pitch-role-input');
      if (input) input.value = roleName;
      document.querySelectorAll('.modal-role-tab').forEach(function (tab) {
        if (tab.getAttribute('data-role') === roleName) {
          tab.className = 'modal-role-tab py-2.5 px-3 border border-grevix-orange bg-grevix-orange text-white font-bold text-left';
        } else {
          tab.className = 'modal-role-tab py-2.5 px-3 border border-white/20 bg-white/5 text-white/75 hover:border-white/50 text-left';
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

    ['btn-header-join', 'btn-hero-pitch-cta', 'btn-shebuilds-submit-idea', 'btn-footer-submit'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', function () {
          openPitchModal('Week 1 Idea Creator (She Builds)');
        });
      }
    });

    const btnJoinTeam = document.getElementById('btn-shebuilds-join-team');
    if (btnJoinTeam) {
      btnJoinTeam.addEventListener('click', function () {
        openPitchModal('Month 2 Builder Team (She Builds)');
      });
    }

    document.querySelectorAll('.open-pitch-modal-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const track = btn.getAttribute('data-open-pitch') || '';
        if (track.indexOf('She Builds') !== -1) {
          openPitchModal('Week 1 Idea Creator (She Builds)');
        } else {
          openPitchModal('Global Hackathon Squad');
        }
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
        const role = roleInput ? roleInput.value : 'Week 1 Idea Creator (She Builds)';

        if (!name || !email || !title || !approach) {
          showToast('PLEASE COMPLETE ALL REQUIRED SUBMISSION FIELDS');
          return;
        }

        const newEntry = {
          id: 'SB-' + (100 + submissions.length + 1),
          role: role,
          name: name,
          email: email,
          title: title,
          domain: domain,
          approach: approach,
          status: 'WEEK 1 CANDIDATE // RECEIVED'
        };

        submissions.unshift(newEntry);
        saveState();
        formPitch.reset();
        closePitchModal();
        renderDashboardLists();
        openDashboardModal();
        showToast('IDEA TRANSMITTED TO GREVIX ORBIT (' + newEntry.id + ')');
      });
    }

    // 9. Partner "Conduct a Hackathon with Grevix" Form (Section 05)
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
          fb.textContent = 'REQUEST LOGGED [' + req.id + ']: ' + org + ' (' + type + ') — Saved in MY ORBIT.';
          fb.classList.remove('hidden');
        }
        showToast('HACKATHON PARTNERSHIP REQUEST TRANSMITTED');
      });
    }

    // 10. "MY ORBIT" Submissions & Shortlist Tracker Modal
    const modalDashboard = document.getElementById('modal-dashboard');

    function renderDashboardLists() {
      const subContainer = document.getElementById('dashboard-submissions-list');
      if (subContainer) {
        subContainer.innerHTML = submissions.map(function (s) {
          return (
            '<div class="p-4 border border-white/20 bg-black/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">' +
              '<div class="space-y-1">' +
                '<div class="flex items-center gap-2 font-mono text-[11px]">' +
                  '<span class="px-2 py-0.5 bg-grevix-orange text-white font-bold">' + s.id + '</span>' +
                  '<span class="text-grevix-pink">' + s.role + '</span>' +
                  '<span class="text-white/50">&bull; ' + s.domain + '</span>' +
                '</div>' +
                '<div class="font-display font-bold text-base text-white">' + s.title + '</div>' +
                '<div class="text-xs text-white/70">' + s.approach + '</div>' +
                '<div class="font-mono text-[10px] text-white/50">CREATOR: ' + s.name + ' (' + s.email + ')</div>' +
              '</div>' +
              '<div class="shrink-0 font-mono text-[10px] px-2.5 py-1 border border-grevix-orange/50 text-grevix-orange">' +
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
            '<div class="p-3 border border-white/15 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">' +
              '<div>' +
                '<span class="font-mono text-grevix-orange font-bold mr-2">[' + p.id + ']</span>' +
                '<strong class="text-white">' + p.org + '</strong> &mdash; ' + p.type +
                '<div class="text-white/60 text-[11px] mt-0.5">' + p.message + '</div>' +
              '</div>' +
              '<span class="font-mono text-[10px] text-white/50">' + p.name + '</span>' +
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
        openPitchModal('Week 1 Idea Creator (She Builds)');
      });
    }

    // 11. Lightbox Gallery for Posters & UI Mockups
    const posterGalleryItems = [
      {
        src: './public/assets/posters/she_builds_poster_1.jpg',
        tag: 'SHE BUILDS POSTER // 01 OF 05',
        heading: 'She Builds — Rooftop Singularity Horizon',
        caption: 'A 3-month open innovation program for girls only. Explore (Month 1) -> Build (Month 2) -> Improve & Showcase (Month 3).'
      },
      {
        src: './public/assets/posters/she_builds_poster_2.jpg',
        tag: 'SHE BUILDS POSTER // 02 OF 05',
        heading: 'She Builds — Coastal Journey Toward What’s Next',
        caption: 'Ideas, People, Possibilities, Real Impact. Week 1 open exploration where the top 2 ideas are shortlisted.'
      },
      {
        src: './public/assets/posters/she_builds_poster_3.jpg',
        tag: 'SHE BUILDS POSTER // 03 OF 05',
        heading: 'She Builds — Twilight Innovation Street',
        caption: 'Month 2 grants full access to the Grevix Innovation Lab with engineer mentorship and industry connections.'
      },
      {
        src: './public/assets/posters/she_builds_poster_4.jpg',
        tag: 'SHE BUILDS POSTER // 04 OF 05',
        heading: 'She Builds — Collaborative Rally & Team Formation',
        caption: 'Shortlisted creators build their teams in Month 2 and refine, test, and showcase in Month 3.'
      },
      {
        src: './public/assets/posters/she_builds_poster_5.jpg',
        tag: 'SHE BUILDS POSTER // 05 OF 05',
        heading: 'She Builds — Midnight Creator Architecture',
        caption: 'Shared project ownership between the creator and Grevix under clearly defined terms with full credit.'
      }
    ];

    const uiGalleryItems = [
      {
        src: './public/assets/ui-references/grevix_ui_ref_1.jpg',
        tag: 'GREVIX ASTRONAUT UI // 01 HOME',
        heading: 'Grevix — Build What’s Next (Light HUD Architecture)',
        caption: 'Reference 01: Astronaut 01 centerpiece, orbital satellite telemetry, and Follow Our Orbit social module.'
      },
      {
        src: './public/assets/ui-references/grevix_ui_ref_2.jpg',
        tag: 'GREVIX ASTRONAUT UI // 02 HACKATHONS',
        heading: 'Grevix — Hack Beyond Limits (Dark Obsidian HUD)',
        caption: 'Reference 02: High-contrast dark rim-lit astronaut, live global builder metrics, and event launch indicator.'
      },
      {
        src: './public/assets/ui-references/grevix_ui_ref_3.jpg',
        tag: 'GREVIX ASTRONAUT UI // 03 COMMUNITY',
        heading: 'Grevix — 3D Perspective Community Corridor',
        caption: 'Reference 03: Architectural COMMUNITY perspective grid, black hole singularity, and 01–04 Connect/Learn/Collaborate/Grow tiles.'
      },
      {
        src: './public/assets/ui-references/grevix_ui_ref_4.jpg',
        tag: 'GREVIX ASTRONAUT UI // 04 ABOUT',
        heading: 'Grevix — About & Hackathon Partnership Portal',
        caption: 'Reference 04: Cybernetic builder centerpiece paired with the interactive "Want to conduct hackathon with Grevix?" form.'
      }
    ];

    let activeGalleryList = posterGalleryItems;
    let activeGalleryIdx = 0;
    const modalGallery = document.getElementById('modal-gallery');
    const galleryImg = document.getElementById('gallery-active-img');

    if (galleryImg) {
      galleryImg.addEventListener('error', function () {
        if (this.src && this.src.includes('/public/assets/')) {
          this.src = this.src.replace('/public/assets/', '/assets/');
        }
      });
    }

    function updateGalleryModal() {
      const item = activeGalleryList[activeGalleryIdx];
      if (!item) return;
      const imgEl = document.getElementById('gallery-active-img');
      const tagEl = document.getElementById('gallery-active-tag');
      const headingEl = document.getElementById('gallery-active-heading');
      const captionEl = document.getElementById('gallery-active-caption');

      if (imgEl) imgEl.src = item.src;
      if (tagEl) tagEl.textContent = item.tag;
      if (headingEl) headingEl.textContent = item.heading;
      if (captionEl) captionEl.textContent = item.caption;
    }

    function openGallery(list, index) {
      activeGalleryList = list;
      activeGalleryIdx = index || 0;
      updateGalleryModal();
      if (modalGallery) modalGallery.classList.remove('hidden');
    }

    document.querySelectorAll('.poster-card').forEach(function (card) {
      card.addEventListener('click', function () {
        const idx = parseInt(card.getAttribute('data-poster-idx') || '0', 10);
        openGallery(posterGalleryItems, idx);
      });
    });

    ['btn-shebuilds-posters', 'btn-footer-posters'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', function () {
          openGallery(posterGalleryItems, 0);
        });
      }
    });

    const btnUiRefs = document.getElementById('btn-footer-ui-refs');
    if (btnUiRefs) {
      btnUiRefs.addEventListener('click', function () {
        openGallery(uiGalleryItems, 0);
      });
    }

    const btnPrevGal = document.getElementById('btn-gallery-prev');
    if (btnPrevGal) {
      btnPrevGal.addEventListener('click', function () {
        activeGalleryIdx = (activeGalleryIdx - 1 + activeGalleryList.length) % activeGalleryList.length;
        updateGalleryModal();
      });
    }

    const btnNextGal = document.getElementById('btn-gallery-next');
    if (btnNextGal) {
      btnNextGal.addEventListener('click', function () {
        activeGalleryIdx = (activeGalleryIdx + 1) % activeGalleryList.length;
        updateGalleryModal();
      });
    }

    const btnCloseGal = document.getElementById('btn-close-gallery');
    if (btnCloseGal) {
      btnCloseGal.addEventListener('click', function () {
        if (modalGallery) modalGallery.classList.add('hidden');
      });
    }

    // 12. Watch Reel / How It Works Modal
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
        openPitchModal('Week 1 Idea Creator (She Builds)');
      });
    }

    // 13. Clean Modal Backdrop Clicks (Click outside closes modal)
    [modalPitch, modalDashboard, modalGallery, modalReel].forEach(function (m) {
      if (!m) return;
      m.addEventListener('click', function (e) {
        if (e.target === m) {
          m.classList.add('hidden');
        }
      });
    });

    // 14. Keyboard Navigation (Escape to close modals & drawers, Arrow keys for gallery)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        [modalPitch, modalDashboard, modalGallery, modalReel].forEach(function (m) {
          if (m) m.classList.add('hidden');
        });
        if (mobileNavDrawer) mobileNavDrawer.classList.add('hidden');
      } else if (modalGallery && !modalGallery.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') {
          activeGalleryIdx = (activeGalleryIdx - 1 + activeGalleryList.length) % activeGalleryList.length;
          updateGalleryModal();
        } else if (e.key === 'ArrowRight') {
          activeGalleryIdx = (activeGalleryIdx + 1) % activeGalleryList.length;
          updateGalleryModal();
        }
      }
    });

    // Initialize counts and initial nav state
    updateBadgeCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGrevixApp);
  } else {
    initGrevixApp();
  }
})();
