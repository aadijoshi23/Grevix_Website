(function () {
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

      // 2. Smooth Navigation & Active HUD Telemetry Bar
      function navigateToSection(sectionId, indexStr, labelStr) {
        const target = document.getElementById(sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (indexStr) {
          const idxEl = document.getElementById('hud-active-index');
          if (idxEl) idxEl.textContent = indexStr;
        }
        if (labelStr) {
          const lblEl = document.getElementById('hud-active-label');
          if (lblEl) lblEl.textContent = labelStr;
        }
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
      }

      document.querySelectorAll('.hud-nav-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          navigateToSection(
            btn.getAttribute('data-target'),
            btn.getAttribute('data-index'),
            btn.getAttribute('data-label')
          );
        });
      });

      document.querySelectorAll('.rail-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          navigateToSection(btn.getAttribute('data-target'));
        });
      });

      document.querySelectorAll('.mobile-nav-item').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const drawer = document.getElementById('mobile-nav-drawer');
          if (drawer) drawer.classList.add('hidden');
          navigateToSection(btn.getAttribute('data-target'));
        });
      });

      const mobileMenuBtn = document.getElementById('btn-mobile-menu');
      if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function () {
          const drawer = document.getElementById('mobile-nav-drawer');
          if (drawer) drawer.classList.toggle('hidden');
        });
      }

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
          if (dir) dir.scrollIntoView({ behavior: 'smooth' });
        });
      }

      document.querySelectorAll('.scroll-trigger').forEach(function (btn) {
        btn.addEventListener('click', function () {
          navigateToSection(btn.getAttribute('data-scroll-to'));
        });
      });

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
      document.querySelectorAll('.social-orbit-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const net = btn.getAttribute('data-social');
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

          document.getElementById('pillar-detail-tag').textContent = info.tag;
          document.getElementById('pillar-detail-title').textContent = info.title;
          document.getElementById('pillar-detail-desc').textContent = info.desc;
          document.getElementById('btn-pillar-action').textContent = info.cta;

          const bracket = document.getElementById('pillar-active-bracket');
          if (bracket) bracket.textContent = '[ ' + code + ' ]';
          const dot = document.getElementById('pillar-progress-dot');
          if (dot) dot.style.left = info.dotLeft;
        });
      });

      const btnPillarAction = document.getElementById('btn-pillar-action');
      if (btnPillarAction) {
        btnPillarAction.addEventListener('click', function () {
          openPitchModal('Month 2 Builder Team (She Builds)');
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
        btn.addEventListener('click', function () {
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
          const name = document.getElementById('pitch-creator-name').value.trim();
          const email = document.getElementById('pitch-creator-email').value.trim();
          const title = document.getElementById('pitch-title').value.trim();
          const domain = document.getElementById('pitch-domain').value;
          const approach = document.getElementById('pitch-approach').value.trim();
          const role = document.getElementById('pitch-role-input').value;

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
          const name = document.getElementById('host-name').value.trim();
          const org = document.getElementById('host-org').value.trim();
          const email = document.getElementById('host-email').value.trim();
          const type = document.getElementById('host-type').value;
          const message = document.getElementById('host-message').value.trim();

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

      function updateGalleryModal() {
        const item = activeGalleryList[activeGalleryIdx];
        if (!item) return;
        document.getElementById('gallery-active-img').src = item.src;
        document.getElementById('gallery-active-tag').textContent = item.tag;
        document.getElementById('gallery-active-heading').textContent = item.heading;
        document.getElementById('gallery-active-caption').textContent = item.caption;
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

      // Escape key closes any active modal
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          [modalPitch, modalDashboard, modalGallery, modalReel].forEach(function (m) {
            if (m) m.classList.add('hidden');
          });
        }
      });

      // Initialize counts
      updateBadgeCount();
    })();
