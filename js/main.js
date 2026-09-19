// ==========================================================================
// Cosmic Garden: Starfield, Particle Dynamics & Birthday Countdown
// ==========================================================================
'use strict';

(function () {
  let canvas, ctx;
  let width, height, dpr;
  let stars = [];
  let shootingStars = [];
  let fireflies = [];
  let lastTime = 0;
  let shootingStarTimer = 2.5;

  // Star Color Palette (Cosmic realism)
  const starColors = [
    'rgba(255, 255, 255, ',
    'rgba(224, 242, 254, ', // Ice Blue
    'rgba(254, 243, 199, ', // Warm Gold
    'rgba(237, 233, 254, ', // Soft Violet
    'rgba(252, 231, 243, '  // Soft Rose
  ];

  // --------------------------------------------------------------------------
  // Starfield & Canvas Engine
  // --------------------------------------------------------------------------
  function initCanvas() {
    canvas = document.getElementById('space-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    resizeCanvas();
    createStars();
    createFireflies();

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(onResize, 200);
    });

    requestAnimationFrame(render);
  }

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function onResize() {
    resizeCanvas();
    createStars();
    createFireflies();
  }

  function createStars() {
    stars = [];
    const count = Math.floor((width * height) / 4500) + 120;

    for (let i = 0; i < count; i++) {
      const isBright = Math.random() < 0.09;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.95,
        radius: isBright ? Math.random() * 0.9 + 1.2 : Math.random() * 0.8 + 0.5,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        baseAlpha: Math.random() * 0.5 + 0.35,
        twinkleSpeed: Math.random() * 1.8 + 0.8,
        twinklePhase: Math.random() * Math.PI * 2,
        isBright: isBright
      });
    }
  }

  function createFireflies() {
    fireflies = [];
    const count = Math.min(28, Math.floor(width / 50) + 10);

    for (let i = 0; i < count; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: height - Math.random() * height * 0.35,
        radius: Math.random() * 1.5 + 1.0,
        color: Math.random() > 0.4 ? 'rgba(255, 230, 150, ' : 'rgba(244, 166, 191, ',
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.5 + 0.2),
        alpha: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function spawnShootingStar() {
    const startX = Math.random() * width * 0.9 + width * 0.05;
    const startY = Math.random() * (height * 0.4);
    const length = Math.random() * 120 + 80;
    const speed = Math.random() * 12 + 15;
    const angle = (Math.PI / 180) * (Math.random() * 25 + 25);

    shootingStars.push({
      x: startX,
      y: startY,
      length: length,
      speed: speed,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      decay: Math.random() * 0.02 + 0.018
    });
  }

  function render(time) {
    if (!lastTime) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    ctx.clearRect(0, 0, width, height);

    // 1. Twinkling Stars
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const twinkle = Math.sin(time * 0.002 * s.twinkleSpeed + s.twinklePhase);
      const alpha = Math.max(0.1, Math.min(1.0, s.baseAlpha + twinkle * 0.35));

      ctx.fillStyle = s.color + alpha + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();

      // 4-point cross diffraction flare on bright twinkling stars
      if (s.isBright && alpha > 0.65) {
        const flareLen = s.radius * 3.5 * (alpha - 0.5);
        ctx.strokeStyle = s.color + (alpha * 0.45) + ')';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(s.x - flareLen, s.y);
        ctx.lineTo(s.x + flareLen, s.y);
        ctx.moveTo(s.x, s.y - flareLen);
        ctx.lineTo(s.x, s.y + flareLen);
        ctx.stroke();
      }
    }

    // 2. Shooting Stars (Meteors)
    shootingStarTimer -= dt;
    if (shootingStarTimer <= 0) {
      spawnShootingStar();
      shootingStarTimer = Math.random() * 3.5 + 3.0;
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.life -= ss.decay;

      if (ss.life <= 0 || ss.x > width + 100 || ss.y > height) {
        shootingStars.splice(i, 1);
        continue;
      }

      const tailX = ss.x - (ss.vx / ss.speed) * ss.length;
      const tailY = ss.y - (ss.vy / ss.speed) * ss.length;

      const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
      grad.addColorStop(0, 'rgba(255, 255, 255, ' + (ss.life * 0.95) + ')');
      grad.addColorStop(0.3, 'rgba(215, 235, 255, ' + (ss.life * 0.6) + ')');
      grad.addColorStop(1, 'rgba(160, 190, 255, 0)');

      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + ss.life + ')';
      ctx.fill();
    }

    // 3. Floating Fireflies & Floral Glowing Particles
    for (let i = 0; i < fireflies.length; i++) {
      const f = fireflies[i];
      f.y += f.vy;
      f.x += f.vx + Math.sin(time * 0.0015 + f.phase) * 0.3;
      f.phase += 0.01;

      if (f.y < height * 0.55) {
        f.y = height - 10;
        f.x = Math.random() * width;
      }
      if (f.x < 0) f.x = width;
      if (f.x > width) f.x = 0;

      const pulse = Math.sin(time * 0.003 + f.phase) * 0.25 + 0.75;
      const currentAlpha = f.alpha * pulse;

      const glowGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 3.5);
      glowGrad.addColorStop(0, f.color + currentAlpha + ')');
      glowGrad.addColorStop(1, f.color + '0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius * 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, ' + currentAlpha + ')';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  // --------------------------------------------------------------------------
  // Birthday Negative Countdown Engine (Target: January 30)
  // --------------------------------------------------------------------------
  function initBirthdayCountdown() {
    const daysEl = document.getElementById('cntDays');
    const hoursEl = document.getElementById('cntHours');
    const minsEl = document.getElementById('cntMins');
    const secsEl = document.getElementById('cntSecs');
    const signEl = document.querySelector('.counter-sign');
    const titleEl = document.querySelector('.counter-title');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    function getNextBirthday(now) {
      const year = now.getFullYear();
      // Month 0 = January, day 30
      const endOfToday = new Date(year, 0, 30, 23, 59, 59, 999);
      if (now.getTime() > endOfToday.getTime()) {
        return new Date(year + 1, 0, 30, 0, 0, 0);
      }
      return new Date(year, 0, 30, 0, 0, 0);
    }

    function formatNumber(num, minDigits = 2) {
      return String(num).padStart(minDigits, '0');
    }

    function update() {
      const now = new Date();
      const isBirthdayToday = now.getMonth() === 0 && now.getDate() === 30;

      if (isBirthdayToday) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        if (signEl) signEl.textContent = '🎉';
        if (titleEl) titleEl.textContent = 'Happy Birthday! 🎂✨';
        return;
      }

      const bday = getNextBirthday(now);
      const diffMs = Math.max(0, bday.getTime() - now.getTime());
      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;

      daysEl.textContent = formatNumber(days, days >= 100 ? 3 : 2);
      hoursEl.textContent = formatNumber(hours, 2);
      minsEl.textContent = formatNumber(mins, 2);
      secsEl.textContent = formatNumber(secs, 2);
    }

    update();
    setInterval(update, 1000);
  }

  // --------------------------------------------------------------------------
  // Her Cosmic Daily Thoughts Journal Engine
  // --------------------------------------------------------------------------
  function initThoughtJournal() {
    const STORAGE_KEY = 'her_cosmic_thoughts_v1';

    const openBtn = document.getElementById('openJournalBtn');
    const closeBtn = document.getElementById('closeJournalBtn');
    const backdrop = document.getElementById('journalBackdrop');
    const card = document.getElementById('journalCard');
    const tabWriteBtn = document.getElementById('tabWriteBtn');
    const tabArchiveBtn = document.getElementById('tabArchiveBtn');
    const paneWrite = document.getElementById('paneWrite');
    const paneArchive = document.getElementById('paneArchive');
    const moodPicker = document.getElementById('moodPicker');
    const thoughtInput = document.getElementById('thoughtInput');
    const thoughtCharCount = document.getElementById('thoughtCharCount');
    const saveThoughtBtn = document.getElementById('saveThoughtBtn');
    const archiveCount = document.getElementById('archiveCount');
    const archiveList = document.getElementById('thoughtArchiveList');
    const exportBtn = document.getElementById('exportThoughtsBtn');
    const currentDateEl = document.getElementById('journalCurrentDate');
    const toastEl = document.getElementById('journalToast');
    const unreadBadge = document.getElementById('journalUnreadBadge');
    const cloudStatusBadge = document.getElementById('cloudStatusBadge');
    const cloudStatusText = document.getElementById('cloudStatusText');

    if (!openBtn || !backdrop || !thoughtInput) return;

    let selectedMood = '🌸 Peaceful';
    let toastTimeout = null;

    function updateCloudStatus(status) {
      if (!cloudStatusBadge || !cloudStatusText) return;
      cloudStatusBadge.className = 'cloud-status-badge ' + status;
      if (status === 'connected') {
        cloudStatusText.textContent = 'Cloud Active ☁️';
        cloudStatusBadge.title = 'Connected: Thoughts sync live with the cloud database';
      } else if (status === 'offline') {
        cloudStatusText.textContent = 'Offline (Queued) 📡';
        cloudStatusBadge.title = 'Offline: Saved locally, will sync when connection returns';
      } else {
        cloudStatusText.textContent = 'Local Mode 💾';
        cloudStatusBadge.title = 'Running locally. Add your Firebase keys in js/config.js for real cloud sync';
      }
    }

    // Initialize real-time cloud database synchronization
    if (window.CosmicDB) {
      window.CosmicDB.init(
        // On thoughts received / updated from cloud
        (cloudThoughts) => {
          if (Array.isArray(cloudThoughts)) {
            const local = getThoughts();
            const map = new Map();
            local.forEach(t => map.set(t.id, t));
            cloudThoughts.forEach(t => map.set(t.id, t));
            const merged = Array.from(map.values()).sort((a, b) => {
              return (b.id || '').localeCompare(a.id || '');
            });
            saveThoughts(merged);
            checkTodayThought();
          }
        },
        // On cloud connection status change
        (status) => {
          updateCloudStatus(status);
        }
      );
    }

    // Format current date display
    const today = new Date();
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const todayString = today.toLocaleDateString(undefined, dateOptions);
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (currentDateEl) {
      currentDateEl.textContent = todayString;
    }

    function getThoughts() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error('Error reading thoughts from storage:', e);
        return [];
      }
    }

    function saveThoughts(thoughts) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
      } catch (e) {
        console.error('Error saving thoughts to storage:', e);
      }
    }

    function showToast(message) {
      if (!toastEl) return;
      toastEl.textContent = message;
      toastEl.classList.add('show');
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
      }, 2600);
    }

    function checkTodayThought() {
      const thoughts = getThoughts();
      const todayEntry = thoughts.find(t => t.dateKey === todayKey);

      if (todayEntry) {
        thoughtInput.value = todayEntry.text;
        thoughtCharCount.textContent = String(todayEntry.text.length);
        if (todayEntry.mood) {
          selectedMood = todayEntry.mood;
          const pills = moodPicker.querySelectorAll('.mood-pill');
          pills.forEach(p => {
            if (p.dataset.mood === todayEntry.mood) {
              p.classList.add('active');
            } else {
              p.classList.remove('active');
            }
          });
        }
        if (saveThoughtBtn) {
          saveThoughtBtn.innerHTML = '<span>Update Today\'s Thought ✨</span>';
        }
        if (unreadBadge) {
          unreadBadge.style.display = 'none';
        }
      } else {
        if (saveThoughtBtn) {
          saveThoughtBtn.innerHTML = '<span>Save to the Stars ✨</span>';
        }
        if (unreadBadge) {
          unreadBadge.style.display = 'inline-block';
        }
      }

      updateArchiveView();
    }

    function updateArchiveView() {
      const thoughts = getThoughts();
      if (archiveCount) {
        archiveCount.textContent = String(thoughts.length);
      }

      if (!archiveList) return;

      if (thoughts.length === 0) {
        archiveList.innerHTML = `
          <div class="thought-empty-state">
            <p>No star memories yet 💫</p>
            <p style="font-size:0.78rem; opacity:0.8; margin-top:4px;">Write whatever you feel today, and it will be kept safely in the cosmos forever.</p>
          </div>
        `;
        return;
      }

      archiveList.innerHTML = thoughts.map(item => `
        <div class="thought-card" data-id="${item.id}">
          <div class="thought-card-top">
            <div class="thought-card-meta">
              <span class="thought-card-mood">${escapeHtml(item.mood || '✨')}</span>
              <span class="thought-card-date">${escapeHtml(item.dateFormatted)} • ${escapeHtml(item.timeFormatted || '')}</span>
            </div>
            <button type="button" class="thought-card-delete" title="Delete thought" data-id="${item.id}">✕</button>
          </div>
          <div class="thought-card-body">${escapeHtml(item.text)}</div>
        </div>
      `).join('');

      // Add delete handlers
      const deleteButtons = archiveList.querySelectorAll('.thought-card-delete');
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          if (confirm('Release this thought from the star memories?')) {
            const current = getThoughts().filter(t => t.id !== id);
            saveThoughts(current);
            if (window.CosmicDB && window.CosmicDB.isCloudActive()) {
              window.CosmicDB.deleteThought(id);
            }
            checkTodayThought();
            showToast('Thought released to the cosmos 🌙');
          }
        });
      });
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Modal Visibility
    function openModal() {
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
      checkTodayThought();
      setTimeout(() => thoughtInput.focus(), 250);
    }

    function closeModal() {
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('open')) {
        closeModal();
      }
    });

    // Tab Navigation
    if (tabWriteBtn && tabArchiveBtn && paneWrite && paneArchive) {
      tabWriteBtn.addEventListener('click', () => {
        tabWriteBtn.classList.add('active');
        tabArchiveBtn.classList.remove('active');
        paneWrite.classList.add('active');
        paneArchive.classList.remove('active');
      });

      tabArchiveBtn.addEventListener('click', () => {
        tabArchiveBtn.classList.add('active');
        tabWriteBtn.classList.remove('active');
        paneArchive.classList.add('active');
        paneWrite.classList.remove('active');
        updateArchiveView();
      });
    }

    // Mood Selector
    if (moodPicker) {
      const pills = moodPicker.querySelectorAll('.mood-pill');
      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          pills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          selectedMood = pill.dataset.mood;
        });
      });
    }

    // Char count
    thoughtInput.addEventListener('input', () => {
      if (thoughtCharCount) {
        thoughtCharCount.textContent = String(thoughtInput.value.length);
      }
    });

    // Save Thought
    if (saveThoughtBtn) {
      saveThoughtBtn.addEventListener('click', () => {
        const text = thoughtInput.value.trim();
        if (!text) {
          thoughtInput.focus();
          showToast('Please write a little thought first ✨');
          return;
        }

        const thoughts = getThoughts();
        const existingIdx = thoughts.findIndex(t => t.dateKey === todayKey);
        const timeFormatted = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        let entryToSave;
        if (existingIdx >= 0) {
          thoughts[existingIdx].text = text;
          thoughts[existingIdx].mood = selectedMood;
          thoughts[existingIdx].timeFormatted = timeFormatted;
          entryToSave = thoughts[existingIdx];
        } else {
          entryToSave = {
            id: 'thought_' + Date.now(),
            dateKey: todayKey,
            dateFormatted: todayString,
            timeFormatted: timeFormatted,
            mood: selectedMood,
            text: text
          };
          thoughts.unshift(entryToSave);
        }

        saveThoughts(thoughts);
        checkTodayThought();

        // Sync with Cloud Database
        if (window.CosmicDB && window.CosmicDB.isCloudActive()) {
          window.CosmicDB.saveThought(entryToSave);
          showToast('Preserved in the cloud & stars ✨');
        } else {
          showToast('Preserved among the stars ✨');
        }
      });
    }

    // Export Thoughts as .txt Keepsake
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const thoughts = getThoughts();
        if (thoughts.length === 0) {
          showToast('No star memories to export yet ✨');
          return;
        }

        let content = '✦ HER STAR MEMORIES & DAILY THOUGHTS ✦\n';
        content += '=======================================\n\n';

        thoughts.forEach((item, index) => {
          content += `[Entry #${thoughts.length - index}] ${item.dateFormatted} • ${item.timeFormatted || ''}\n`;
          content += `Mood: ${item.mood || 'Peaceful'}\n`;
          content += `---------------------------------------\n`;
          content += `${item.text}\n\n`;
          content += `=======================================\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `her-cosmic-thoughts-${todayKey}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Memories exported into file 📥');
      });
    }

    // Initial check on load
    checkTodayThought();
  }

  // --------------------------------------------------------------------------
  // Application Lifecycle Initializer
  // --------------------------------------------------------------------------
  function init() {
    document.body.classList.remove('container');
    initCanvas();
    initBirthdayCountdown();
    initThoughtJournal();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
