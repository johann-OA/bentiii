// ==========================================================================
// Celestial Star Photo Orbs Engine
// Floating circular star portraits drifting through deep space behind the heart
// ==========================================================================
'use strict';

(function () {
  const photoCaptions = {
    '1': 'Soft whispers, sweet dreams, and the gentlest soul in the universe 🌸✨',
    '2': 'More radiant than every blossom in the cosmic meadow 💐💖',
    '3': 'Every star in the night sky pales compared to your light 💫⭐'
  };

  const photoSources = {
    '1': 'img/photo1.jpg',
    '2': 'img/photo2.jpg',
    '3': 'img/photo3.jpg'
  };

  function initStarPhotos() {
    const modal = document.getElementById('cosmicPhotoModal');
    const backdrop = document.getElementById('cosmicPhotoBackdrop');
    const closeBtn = document.getElementById('closePhotoModalBtn');
    const modalImg = document.getElementById('modalPhotoImg');
    const modalCaption = document.getElementById('modalPhotoCaption');
    const orbs = document.querySelectorAll('.star-photo-orb');

    if (!orbs.length) return;

    // Open lightbox modal on click
    orbs.forEach((orb) => {
      orb.addEventListener('click', (e) => {
        e.stopPropagation();
        const photoId = orb.getAttribute('data-photo') || '1';
        openPhotoModal(photoId);
      });
    });

    function openPhotoModal(id) {
      if (!modal || !modalImg) return;
      modalImg.src = photoSources[id] || 'img/photo1.jpg';
      if (modalCaption) {
        modalCaption.textContent = photoCaptions[id] || 'My brightest star ✨';
      }
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }

    function closePhotoModal() {
      if (!modal) return;
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }

    if (closeBtn) closeBtn.addEventListener('click', closePhotoModal);
    if (backdrop) backdrop.addEventListener('click', closePhotoModal);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        closePhotoModal();
      }
    });

    // Subtle 3D mouse parallax on star orbs
    window.addEventListener('mousemove', (e) => {
      const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

      orbs.forEach((orb, idx) => {
        const factor = (idx + 1) * 8;
        orb.style.setProperty('--mouse-shift-x', `${mouseX * factor}px`);
        orb.style.setProperty('--mouse-shift-y', `${mouseY * factor}px`);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStarPhotos);
  } else {
    initStarPhotos();
  }
})();
