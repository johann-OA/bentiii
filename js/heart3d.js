// ==========================================================================
// 3D Pixel Heart Engine (Voxel Art in Cosmic Garden)
// Built with Three.js - Smooth 60 FPS hardware accelerated WebGL
// ==========================================================================
'use strict';

(function () {
  let container, canvas, renderer, scene, camera;
  let heartPivot, heartGroup, voxelsGroup, stardustGroup;
  let corePointLight, ambientLight, dirLight1, dirLight2;
  let animId = null;
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let dragVelocity = { x: 0, y: 0 };
  let mode = 'x-axis'; // 'x-axis' | 'orbit' | 'y-axis'
  let clock;
  let burstParticles = [];

  // 13 Columns x 11 Rows Classic Retro Pixel Heart Matrix
  // 0: Empty, 1: Main Ruby, 2: Specular Pearl Highlight, 3: Deep Garnet Shadow
  const HEART_MATRIX = [
    [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 1, 2, 2, 1, 1, 0, 1, 1, 1, 1, 1, 0],
    [1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]
  ];

  const MATRIX_ROWS = HEART_MATRIX.length; // 11
  const MATRIX_COLS = HEART_MATRIX[0].length; // 13
  const VOXEL_SIZE = 0.94; // slight gap for crisp pixel grid lines
  const VOXEL_SPACING = 1.0;

  function init() {
    container = document.getElementById('pixelHeart3DContainer');
    if (!container) return;

    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded, cannot initialize 3D Pixel Heart');
      return;
    }

    clock = new THREE.Clock();

    // 1. Scene & Camera
    scene = new THREE.Scene();

    const w = container.clientWidth || 320;
    const h = container.clientHeight || 320;
    const aspect = w / h;
    camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
    camera.position.set(0, 0, 21.5);

    // 2. Renderer
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. Lighting Setup for rich volumetric pixel cubes
    ambientLight = new THREE.AmbientLight(0xffe6f0, 0.85);
    scene.add(ambientLight);

    // Warm celestial rim light (top-right)
    dirLight1 = new THREE.DirectionalLight(0xffb3d9, 1.4);
    dirLight1.position.set(12, 16, 14);
    scene.add(dirLight1);

    // Cold starfield fill light (bottom-left)
    dirLight2 = new THREE.DirectionalLight(0x73b9ff, 0.85);
    dirLight2.position.set(-14, -12, 10);
    scene.add(dirLight2);

    // Glowing core point light inside the heart
    corePointLight = new THREE.PointLight(0xff2a75, 2.2, 28, 1.8);
    corePointLight.position.set(0, 0, 1);
    scene.add(corePointLight);

    // 4. Heart Mesh Hierarchical Groups
    heartPivot = new THREE.Group();
    scene.add(heartPivot);

    heartGroup = new THREE.Group();
    heartPivot.add(heartGroup);

    voxelsGroup = new THREE.Group();
    heartGroup.add(voxelsGroup);

    // Initial aesthetic 3D tilt so voxel cube facets are gorgeous
    heartPivot.rotation.y = 0.28;
    heartPivot.rotation.z = -0.08;

    // 5. Build 3D Voxel Sculpture
    buildVoxelHeart();

    // 6. Orbiting Stardust Halo
    buildStardustHalo();

    // 7. Event Listeners
    setupInteractions();
    window.addEventListener('resize', onResize);

    // 8. Start Animation Loop
    animate();
  }

  function isPerimeter(r, c) {
    if (HEART_MATRIX[r][c] === 0) return false;
    if (r === 0 || r === MATRIX_ROWS - 1 || c === 0 || c === MATRIX_COLS - 1) return true;
    if (HEART_MATRIX[r - 1][c] === 0) return true;
    if (HEART_MATRIX[r + 1][c] === 0) return true;
    if (HEART_MATRIX[r][c - 1] === 0) return true;
    if (HEART_MATRIX[r][c + 1] === 0) return true;
    return false;
  }

  function buildVoxelHeart() {
    const cubeGeo = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);

    // Specular glint pearl
    const matHighlight = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffe6f0,
      emissiveIntensity: 0.65,
      roughness: 0.12,
      metalness: 0.25
    });

    // Golden accent glint
    const matGoldGlint = new THREE.MeshStandardMaterial({
      color: 0xffe899,
      emissive: 0xffc233,
      emissiveIntensity: 0.65,
      roughness: 0.1,
      metalness: 0.35
    });

    // Vivid celestial ruby
    const matRuby = new THREE.MeshStandardMaterial({
      color: 0xff1765,
      emissive: 0xcc004e,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.15
    });

    // Soft rose inner tone
    const matRose = new THREE.MeshStandardMaterial({
      color: 0xff4586,
      emissive: 0xe6005c,
      emissiveIntensity: 0.4,
      roughness: 0.24,
      metalness: 0.12
    });

    // Dark contour rim / underside shadow (retro pixel outline)
    const matDarkGarnet = new THREE.MeshStandardMaterial({
      color: 0x800028,
      emissive: 0x3d0013,
      emissiveIntensity: 0.22,
      roughness: 0.35,
      metalness: 0.1
    });

    // 5 Depth Layers: Z = -2, -1, 0, 1, 2 for a true sculpted 3D jewel
    const layers = [-2, -1, 0, 1, 2];

    layers.forEach((layerZ) => {
      const isOuterBevel = Math.abs(layerZ) === 2;

      for (let r = 0; r < MATRIX_ROWS; r++) {
        for (let c = 0; c < MATRIX_COLS; c++) {
          const val = HEART_MATRIX[r][c];
          if (val === 0) continue;

          const onPerimeter = isPerimeter(r, c);

          // Outer beveled caps (Z = +/-2) only include inner voxels (gives beveled roundness)
          if (isOuterBevel) {
            if (onPerimeter) continue;
            // Also taper tip and lobe tops
            if (r === 1 && (c === 1 || c === 5 || c === 7 || c === 11)) continue;
            if (r >= 8) continue;
          }

          let mat = matRuby;

          if (layerZ === 2 || layerZ === 1) {
            // Front face
            if (val === 2) {
              mat = (r === 1 && c === 2) ? matGoldGlint : matHighlight;
            } else if (onPerimeter && layerZ !== 2) {
              mat = matDarkGarnet; // crisp pixel contour
            } else if (r >= 7) {
              mat = matDarkGarnet;
            } else if ((r + c) % 2 === 0) {
              mat = matRose;
            } else {
              mat = matRuby;
            }
          } else if (layerZ === 0) {
            // Center Core layer with dark pixel outline
            if (onPerimeter) {
              mat = matDarkGarnet;
            } else {
              mat = matRuby;
            }
          } else {
            // Back face
            if (onPerimeter && layerZ !== -2) {
              mat = matDarkGarnet;
            } else if (r >= 6) {
              mat = matDarkGarnet;
            } else {
              mat = matRuby;
            }
          }

          const mesh = new THREE.Mesh(cubeGeo, mat);
          const x = (c - (MATRIX_COLS - 1) / 2) * VOXEL_SPACING;
          const y = ((MATRIX_ROWS - 1) / 2 - r) * VOXEL_SPACING;
          const z = layerZ * VOXEL_SPACING;

          mesh.position.set(x, y, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          voxelsGroup.add(mesh);
        }
      }
    });
  }

  function buildStardustHalo() {
    stardustGroup = new THREE.Group();
    heartPivot.add(stardustGroup);

    const dustGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const dustColors = [0xffd700, 0xff80bf, 0x80d4ff, 0xffffff, 0xff66a3];

    const count = 28;
    for (let i = 0; i < count; i++) {
      const col = dustColors[Math.floor(Math.random() * dustColors.length)];
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.3
      });
      const mesh = new THREE.Mesh(dustGeo, mat);

      const radius = 8.5 + Math.random() * 3.5;
      const angle = (i / count) * Math.PI * 2;
      const tilt = (Math.random() - 0.5) * 2.8;

      mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * (radius * 0.45) + tilt,
        Math.sin(angle) * radius * 0.6
      );

      mesh.userData = {
        radius: radius,
        speed: 0.6 + Math.random() * 0.8,
        angleOffset: angle,
        tilt: tilt,
        origY: mesh.position.y
      };

      stardustGroup.add(mesh);
    }
  }

  function spawnBurstParticles() {
    const burstGeo = new THREE.BoxGeometry(0.36, 0.36, 0.36);
    const colors = [0xff2a75, 0xff66a3, 0xffffff, 0xffd700, 0xff85c0];

    for (let i = 0; i < 18; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 1.0,
        roughness: 0.2
      });
      const p = new THREE.Mesh(burstGeo, mat);
      p.position.set(0, 0, 0);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 6.0 + Math.random() * 7.0;

      p.userData = {
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.sin(phi) * Math.sin(theta) * speed,
        vz: Math.cos(phi) * speed,
        rotSpeedX: (Math.random() - 0.5) * 10,
        rotSpeedY: (Math.random() - 0.5) * 10,
        life: 1.0,
        decay: 0.024 + Math.random() * 0.018
      };

      scene.add(p);
      burstParticles.push(p);
    }
  }

  function triggerHeartbeatImpulse() {
    // Energetic double-thump animation trigger
    let step = 0;
    const pulseInterval = setInterval(() => {
      step++;
      if (step === 1) heartGroup.scale.set(1.22, 1.22, 1.22);
      else if (step === 3) heartGroup.scale.set(1.08, 1.08, 1.08);
      else if (step === 4) heartGroup.scale.set(1.26, 1.26, 1.26);
      else if (step >= 8) {
        heartGroup.scale.set(1.0, 1.0, 1.0);
        clearInterval(pulseInterval);
      }
    }, 40);

    spawnBurstParticles();
  }

  function setupInteractions() {
    const el = container;

    // Click / Tap to burst sparkles
    el.addEventListener('click', (e) => {
      // If user was just dragging, don't trigger burst
      if (Math.abs(dragVelocity.x) > 0.01 || Math.abs(dragVelocity.y) > 0.01) return;
      triggerHeartbeatImpulse();
    });

    // Mouse drag
    el.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      dragVelocity = { x: 0, y: 0 };
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      dragVelocity.x = deltaX * 0.005;
      dragVelocity.y = deltaY * 0.005;

      heartPivot.rotation.y += dragVelocity.x;
      heartPivot.rotation.x += dragVelocity.y;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch events for mobile
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        dragVelocity = { x: 0, y: 0 };
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      dragVelocity.x = deltaX * 0.006;
      dragVelocity.y = deltaY * 0.006;

      heartPivot.rotation.y += dragVelocity.x;
      heartPivot.rotation.x += dragVelocity.y;

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Mode Toggle Pill Button
    const modeBtn = document.getElementById('heartModeToggleBtn');
    if (modeBtn) {
      modeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleMode();
      });
    }
  }

  function cycleMode() {
    const modes = ['x-axis', 'orbit', 'y-axis'];
    const nextIdx = (modes.indexOf(mode) + 1) % modes.length;
    mode = modes[nextIdx];

    const label = document.getElementById('heartModeLabel');
    if (label) {
      if (mode === 'x-axis') label.textContent = 'X-Axis Spin ↺';
      else if (mode === 'orbit') label.textContent = '3D Orbit ✦';
      else if (mode === 'y-axis') label.textContent = 'Y-Axis Spin ↻';
    }
  }

  function onResize() {
    if (!container || !camera || !renderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    animId = requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // 1. Primary Continuous Rotation around the X Axis ("x line")
    // When not being dragged, turn continuously along the X line
    if (!isDragging) {
      if (mode === 'x-axis') {
        // Continuous tumble around the X-axis (center horizontal line)
        heartGroup.rotation.x += delta * 1.35;

        // Keep a subtle, pleasing isometric perspective tilt
        const targetY = 0.32 + Math.sin(elapsedTime * 0.8) * 0.10;
        const targetZ = -0.06 + Math.cos(elapsedTime * 0.6) * 0.04;
        heartPivot.rotation.y += (targetY - heartPivot.rotation.y) * 0.05;
        heartPivot.rotation.z += (targetZ - heartPivot.rotation.z) * 0.05;
      } else if (mode === 'orbit') {
        // Full smooth 3D tumbling orbit
        heartGroup.rotation.x += delta * 1.1;
        heartPivot.rotation.y += delta * 0.65;
        heartPivot.rotation.z = Math.sin(elapsedTime * 0.5) * 0.15;
      } else if (mode === 'y-axis') {
        // Classic horizontal spin
        heartGroup.rotation.y += delta * 1.5;
        heartPivot.rotation.x += (0.12 - heartPivot.rotation.x) * 0.04;
      }

      // Smooth inertia decay after dragging
      dragVelocity.x *= 0.92;
      dragVelocity.y *= 0.92;
      heartPivot.rotation.y += dragVelocity.x;
      heartPivot.rotation.x += dragVelocity.y;
    }

    // 2. Organic Heartbeat Pulse ("Lub-Dub" rhythm)
    const tBeat = elapsedTime * 2.8;
    const pulse1 = Math.pow(Math.max(0, Math.sin(tBeat)), 12) * 0.08;
    const pulse2 = Math.pow(Math.max(0, Math.sin(tBeat - 0.28)), 14) * 0.05;
    const scaleFactor = 1.0 + pulse1 + pulse2;

    if (!isDragging) {
      voxelsGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    // Dynamic light pulsing in sync with heartbeat
    if (corePointLight) {
      corePointLight.intensity = 1.8 + (pulse1 + pulse2) * 12.0;
    }

    // 3. Orbiting Stardust Particles
    if (stardustGroup) {
      for (let i = 0; i < stardustGroup.children.length; i++) {
        const star = stardustGroup.children[i];
        const u = star.userData;
        const curAngle = elapsedTime * u.speed + u.angleOffset;

        star.position.x = Math.cos(curAngle) * u.radius;
        star.position.y = u.origY + Math.sin(elapsedTime * 1.8 + u.angleOffset) * 0.8;
        star.position.z = Math.sin(curAngle) * (u.radius * 0.7);

        star.rotation.x += 0.02;
        star.rotation.y += 0.03;
      }
    }

    // 4. Update Burst Sparkle Particles
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const p = burstParticles[i];
      const u = p.userData;

      p.position.x += u.vx * delta;
      p.position.y += u.vy * delta;
      p.position.z += u.vz * delta;

      p.rotation.x += u.rotSpeedX * delta;
      p.rotation.y += u.rotSpeedY * delta;

      u.life -= u.decay;
      p.scale.set(u.life, u.life, u.life);

      if (u.life <= 0) {
        scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
        burstParticles.splice(i, 1);
      }
    }

    // 5. Render Scene
    renderer.render(scene, camera);
  }

  // Self-initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for external triggers if needed
  window.PixelHeart3D = {
    triggerPulse: triggerHeartbeatImpulse,
    setMode: (newMode) => { mode = newMode; },
    getMode: () => mode
  };
})();
