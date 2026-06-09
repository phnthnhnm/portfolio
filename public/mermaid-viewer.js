(async () => {
  // Skip if no mermaid blocks on page
  if (!document.querySelector(".mermaid")) return;

  const { default: mermaid } = await import(
    "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"
  );

  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    themeVariables: {
      primaryColor: "#6366f1",
      primaryTextColor: "#e2e8f0",
      primaryBorderColor: "#4f46e5",
      lineColor: "#818cf8",
      secondaryColor: "#1e293b",
      tertiaryColor: "#0f172a",
      background: "transparent",
      mainBkg: "#0f172a",
      nodeBorder: "#334155",
      clusterBkg: "#0f172a",
      clusterBorder: "#334155",
      titleColor: "#e2e8f0",
      edgeLabelBackground: "transparent",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      fontSize: "14px",
    },
  });

  await mermaid.run({ querySelector: ".mermaid" });

  // --- Wrap diagrams with zoom/pan controls ---
  document.querySelectorAll(".mermaid").forEach((el) => {
    const svg = el.querySelector("svg");
    if (!svg) return;

    const wrapper = document.createElement("div");
    wrapper.className = "mermaid-wrapper";
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    // Expand button
    const expandBtn = document.createElement("button");
    expandBtn.innerHTML =
      '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 8.25M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15.75M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 8.25M20.25 20.25h-4.5m4.5 0v-4.5m0 4.5L15 15.75"/></svg>';
    expandBtn.className = "mermaid-expand-btn";
    expandBtn.title = "Scroll to zoom · Drag to pan · Double-click for fullscreen";
    wrapper.appendChild(expandBtn);

    // Fullscreen overlay
    const overlay = document.createElement("div");
    overlay.className = "mermaid-overlay";
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

    const stage = overlay.querySelector(".mermaid-overlay-stage");
    const zoomLabel = overlay.querySelector(".mermaid-zoom-level");
    let scale = 1,
      panX = 0,
      panY = 0;
    let dragging = false,
      lastX = 0,
      lastY = 0;

    function updateTransform(el, s, x, y) {
      el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
      el.style.transformOrigin = "0 0";
    }

    function setZoom(s) {
      scale = s;
      updateTransform(el, scale, panX, panY);
      if (zoomLabel) zoomLabel.textContent = Math.round(scale * 100) + "%";
    }

    // Click → zoom in
    wrapper.addEventListener("click", (e) => {
      if (e.target === expandBtn || expandBtn.contains(e.target)) return;
      setZoom(Math.min(4, scale + 0.25));
    });

    // Wheel zoom
    wrapper.addEventListener("wheel", (e) => {
      e.preventDefault();
      const rect = wrapper.getBoundingClientRect();
      const cx = e.clientX - rect.left,
        cy = e.clientY - rect.top;
      const newScale = Math.max(0.5, Math.min(4, scale + (e.deltaY > 0 ? -0.15 : 0.15)));
      panX = cx - (cx - panX) * (newScale / scale);
      panY = cy - (cy - panY) * (newScale / scale);
      setZoom(newScale);
    });

    // Drag
    wrapper.addEventListener("mousedown", (e) => {
      if (scale <= 1) return;
      dragging = true;
      lastX = e.clientX - panX;
      lastY = e.clientY - panY;
      wrapper.classList.add("dragging");
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      panX = e.clientX - lastX;
      panY = e.clientY - lastY;
      updateTransform(el, scale, panX, panY);
    });
    window.addEventListener("mouseup", () => {
      dragging = false;
      wrapper.classList.remove("dragging");
    });

    // Double-click → fullscreen overlay
    wrapper.addEventListener("dblclick", () => {
      const clone = svg.cloneNode(true);
      clone.style.maxWidth = "95vw";
      clone.style.maxHeight = "82vh";
      clone.style.width = "auto";
      clone.style.height = "auto";
      stage.innerHTML = "";
      stage.appendChild(clone);
      overlay.classList.add("active");

      let ovScale = 1,
        ovPanX = 0,
        ovPanY = 0;
      let ovDragging = false,
        ovLastX = 0,
        ovLastY = 0;

      function ovUpdate() {
        updateTransform(stage, ovScale, ovPanX, ovPanY);
        if (zoomLabel) zoomLabel.textContent = Math.round(ovScale * 100) + "%";
      }

      stage.addEventListener("wheel", (ev) => {
        ev.preventDefault();
        ovScale = Math.max(0.3, Math.min(5, ovScale + (ev.deltaY > 0 ? -0.2 : 0.2)));
        ovUpdate();
      });
      stage.addEventListener("mousedown", (ev) => {
        ovDragging = true;
        ovLastX = ev.clientX - ovPanX;
        ovLastY = ev.clientY - ovPanY;
        stage.classList.add("dragging");
      });
      window.addEventListener("mousemove", (ev) => {
        if (!ovDragging || !overlay.classList.contains("active")) return;
        ovPanX = ev.clientX - ovLastX;
        ovPanY = ev.clientY - ovLastY;
        ovUpdate();
      });
      const onMouseUp = () => {
        ovDragging = false;
        stage.classList.remove("dragging");
      };
      window.addEventListener("mouseup", onMouseUp, { once: true });

      overlay.querySelector(".mermaid-zoom-in").onclick = () => {
        ovScale = Math.min(5, ovScale + 0.3);
        ovUpdate();
      };
      overlay.querySelector(".mermaid-zoom-out").onclick = () => {
        ovScale = Math.max(0.3, ovScale - 0.3);
        ovUpdate();
      };
      overlay.querySelector(".mermaid-zoom-reset").onclick = () => {
        ovScale = 1;
        ovPanX = 0;
        ovPanY = 0;
        ovUpdate();
      };
    });

    // Close overlay
    const closeOverlay = () => overlay.classList.remove("active");
    overlay.querySelector(".mermaid-overlay-close").onclick = closeOverlay;
    overlay.querySelector(".mermaid-overlay-bg").onclick = closeOverlay;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeOverlay();
    });
  });
})();
