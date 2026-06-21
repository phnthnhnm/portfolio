(async () => {
  if (!document.querySelector('.mermaid')) return;

  const { default: mermaid } =
    await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');

  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#6366f1',
      primaryTextColor: '#e2e8f0',
      primaryBorderColor: '#4f46e5',
      lineColor: '#818cf8',
      secondaryColor: '#1e293b',
      tertiaryColor: '#0f172a',
      background: 'transparent',
      mainBkg: '#0f172a',
      nodeBorder: '#334155',
      clusterBkg: '#0f172a',
      clusterBorder: '#334155',
      titleColor: '#e2e8f0',
      edgeLabelBackground: 'transparent',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      fontSize: '14px',
    },
  });

  await mermaid.run({ querySelector: '.mermaid' });

  // --- Wrap each diagram with zoom/pan controls ---
  document.querySelectorAll('.mermaid').forEach((el) => {
    const svg = el.querySelector('svg');
    if (!svg) return;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'mermaid-wrapper';
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    // Expand button
    const expandBtn = document.createElement('button');
    expandBtn.innerHTML =
      '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 8.25M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15.75M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 8.25M20.25 20.25h-4.5m4.5 0v-4.5m0 4.5L15 15.75"/></svg>';
    expandBtn.className = 'mermaid-expand-btn';
    expandBtn.title = 'Open fullscreen';
    wrapper.appendChild(expandBtn);

    // --- Build fullscreen overlay (one per diagram) ---
    const overlay = document.createElement('div');
    overlay.className = 'mermaid-overlay';
    overlay.innerHTML = `
      <div class="mermaid-overlay-bg"></div>
      <div class="mermaid-overlay-content">
        <button class="mermaid-overlay-close" title="Close (Esc)"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        <div class="mermaid-overlay-controls">
          <button class="mermaid-zoom-out" title="Zoom out">&minus;</button>
          <span class="mermaid-zoom-level">100%</span>
          <button class="mermaid-zoom-in" title="Zoom in">+</button>
          <button class="mermaid-zoom-reset" title="Reset">&#8634;</button>
        </div>
        <div class="mermaid-overlay-stage"></div>
      </div>`;
    document.body.appendChild(overlay);

    const stage = overlay.querySelector('.mermaid-overlay-stage');
    const zoomLabel = overlay.querySelector('.mermaid-zoom-level');

    // --- Wrapper state ---
    let scale = 1,
      panX = 0,
      panY = 0;
    let didDrag = false; // track if mouse moved between mousedown & mouseup

    function updateTransform(target, s, x, y) {
      target.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
      target.style.transformOrigin = '0 0';
    }

    // Zoom toward a specific point (clientX, clientY) by a scale delta
    function zoomAt(clientX, clientY, ds) {
      const rect = wrapper.getBoundingClientRect();
      const cx = clientX - rect.left;
      const cy = clientY - rect.top;
      const ns = Math.max(0.5, Math.min(4, scale + ds));
      panX = cx - (cx - panX) * (ns / scale);
      panY = cy - (cy - panY) * (ns / scale);
      scale = ns;
      updateTransform(el, scale, panX, panY);
      zoomLabel.textContent = Math.round(scale * 100) + '%';
    }

    // --- Scroll zoom (wrapper) ---
    wrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? -0.15 : 0.15);
    });

    // --- Drag (wrapper) ---
    wrapper.addEventListener('mousedown', (e) => {
      if (e.target === expandBtn || expandBtn.contains(e.target)) return;
      wrapper.classList.add('dragging');
      const startX = e.clientX - panX;
      const startY = e.clientY - panY;

      function onMove(ev) {
        didDrag = true;
        panX = ev.clientX - startX;
        panY = ev.clientY - startY;
        updateTransform(el, scale, panX, panY);
      }
      function onUp() {
        wrapper.classList.remove('dragging');
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });

    // Clicks are for drag only; zoom via scroll wheel

    // --- Fullscreen ---
    function openFullscreen() {
      const clone = svg.cloneNode(true);
      clone.style.maxWidth = '95vw';
      clone.style.maxHeight = '82vh';
      clone.style.width = 'auto';
      clone.style.height = 'auto';
      stage.innerHTML = '';
      stage.appendChild(clone);
      overlay.classList.add('active');

      let ovScale = 1,
        ovPanX = 0,
        ovPanY = 0;
      let ovDidDrag = false;

      function ovUpdate() {
        updateTransform(stage, ovScale, ovPanX, ovPanY);
        zoomLabel.textContent = Math.round(ovScale * 100) + '%';
      }

      // Overlay wheel — use onwheel to prevent listener accumulation
      stage.onwheel = (ev) => {
        ev.preventDefault();
        ovScale = Math.max(0.3, Math.min(5, ovScale + (ev.deltaY > 0 ? -0.2 : 0.2)));
        ovUpdate();
      };

      // Overlay drag
      stage.onmousedown = (ev) => {
        ovDidDrag = false;
        const startX = ev.clientX - ovPanX,
          startY = ev.clientY - ovPanY;
        stage.classList.add('dragging');

        function onMove(e) {
          ovDidDrag = true;
          ovPanX = e.clientX - startX;
          ovPanY = e.clientY - startY;
          ovUpdate();
        }
        function onUp() {
          stage.classList.remove('dragging');
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        }
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      };

      // Overlay click (only if not a drag) — do nothing on click in overlay
      stage.onclick = () => {
        // intentionally: no single-click zoom in overlay; only scroll or drag
      };

      // Overlay zoom buttons
      overlay.querySelector('.mermaid-zoom-in').onclick = (ev) => {
        ev.stopPropagation();
        ovScale = Math.min(5, ovScale + 0.3);
        ovUpdate();
      };
      overlay.querySelector('.mermaid-zoom-out').onclick = (ev) => {
        ev.stopPropagation();
        ovScale = Math.max(0.3, ovScale - 0.3);
        ovUpdate();
      };
      overlay.querySelector('.mermaid-zoom-reset').onclick = (ev) => {
        ev.stopPropagation();
        ovScale = 1;
        ovPanX = 0;
        ovPanY = 0;
        ovUpdate();
      };
    }

    // Expand button → single click opens fullscreen
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openFullscreen();
    });

    // Double-click on wrapper → fullscreen
    wrapper.addEventListener('dblclick', () => {
      openFullscreen();
    });

    // Close overlay
    function closeOverlay() {
      overlay.classList.remove('active');
      // Clean up overlay handlers
      stage.onwheel = null;
      stage.onmousedown = null;
      stage.onclick = null;
    }
    overlay.querySelector('.mermaid-overlay-close').onclick = closeOverlay;
    overlay.querySelector('.mermaid-overlay-bg').onclick = closeOverlay;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeOverlay();
    });
  });
})();
