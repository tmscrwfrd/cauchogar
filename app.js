/* =========================================================
   CauchoHogar — Interacción
   - Navbar con sombra al scrollear
   - Reveal-on-scroll (IntersectionObserver)
   - Contadores animados del hero
   - Dashboard de sensibilidad (slider + mini-gráficas canvas)
   - 
   ========================================================= */
(function () {
  "use strict";

  var M = window.CAUCHO;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    initNavbar();
    initNavToggle();
    initLogoHome();
    initReveal();
    initCounters();
    initSensitivity();
    initCases();
  });

  /* ---------- Helpers de formato ---------- */
  function fmtMoney(n) {
    return "$" + Math.round(n).toLocaleString("es-AR");
  }
  function fmtM(n) {
    return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "M";
  }

  /* ============================================================
     Navbar
     ============================================================ */
  function initNavbar() {
    var nav = document.querySelector(".navbar");
    if (!nav) return;
    var toggle = document.getElementById("navToggle");
    var lastY = Math.max(0, window.scrollY);
    var pointerAtTop = false;     // mouse dentro de la franja superior
    var revealedByHover = false;  // el navbar se mostró por hover (no por scroll)
    function menuIsOpen() { return toggle && toggle.getAttribute("aria-expanded") === "true"; }

    var onScroll = function () {
      var y = Math.max(0, window.scrollY);
      nav.classList.toggle("scrolled", y > 8);
      var dy = y - lastY;
      if (Math.abs(dy) > 4) {                 // ignora micro-scroll para no parpadear
        if (!menuIsOpen() && dy > 0 && y > nav.offsetHeight && !pointerAtTop) {
          nav.classList.add("nav-hidden");    // bajando → ocultar (salvo que el mouse esté en el borde)
        } else if (dy < 0 || y <= nav.offsetHeight) {
          nav.classList.remove("nav-hidden");  // subiendo o cerca del tope → mostrar
          revealedByHover = false;             // mostrado legítimamente por scroll, no por hover
        }
        // el rombo del logo se inclina a 45° al bajar y vuelve a 90° al subir
        nav.classList.toggle("logo-tilt", dy > 0);
        lastY = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Desktop: el navbar reaparece al llevar el mouse a la franja superior y se vuelve a ocultar al salir
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      window.addEventListener("mousemove", function (e) {
        var atTop = e.clientY <= nav.offsetHeight;
        if (atTop === pointerAtTop) return;    // sólo al cruzar el límite de la franja
        pointerAtTop = atTop;
        if (atTop) {
          if (nav.classList.contains("nav-hidden")) {
            revealedByHover = true;
            nav.classList.remove("nav-hidden");
          }
        } else if (revealedByHover && !menuIsOpen()) {
          revealedByHover = false;
          nav.classList.add("nav-hidden");     // se fue del borde → ocultar lo que reveló el hover
        }
      }, { passive: true });
    }
  }

  /* ============================================================
     Logo → vuelve al tope de la página
     ============================================================ */
  function initLogoHome() {
    var logo = document.querySelector(".logo");
    if (!logo) return;
    logo.addEventListener("click", function (e) {
      e.preventDefault();
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* ============================================================
     Menú hamburguesa (mobile)
     ============================================================ */
  function initNavToggle() {
    var btn = document.getElementById("navToggle");
    var menu = document.getElementById("navMenu");
    var scrim = document.getElementById("navScrim");
    var navEl = document.querySelector(".navbar");
    if (!btn || !menu) return;

    function setOpen(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      menu.classList.toggle("is-open", open);
      if (open && navEl) navEl.classList.remove("nav-hidden"); // el nav siempre visible con el menú abierto
      if (scrim) {
        if (open) { scrim.hidden = false; requestAnimationFrame(function () { scrim.classList.add("is-open"); }); }
        else { scrim.classList.remove("is-open"); }
      }
    }
    function isOpen() { return btn.getAttribute("aria-expanded") === "true"; }
    function toggle() { setOpen(!isOpen()); }
    function close() { if (isOpen()) setOpen(false); }

    btn.addEventListener("click", toggle);
    if (scrim) scrim.addEventListener("click", close);

    // Cerrar al elegir una sección
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });

    // Cerrar con Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    // Cerrar el panel cuando se vuelve a desktop y ocultar el scrim al terminar la transición
    window.addEventListener("resize", debounce(function () {
      if (window.innerWidth >= 860) close();
    }, 150));
    if (scrim) {
      scrim.addEventListener("transitionend", function () {
        if (!scrim.classList.contains("is-open")) scrim.hidden = true;
      });
    }
  }

  /* ============================================================
     Reveal-on-scroll
     ============================================================ */
  function initReveal() {
    // Marcar candidatos para animar
    var selectors = [
      ".section-title", ".section-subtitle", ".card", ".segment",
      ".metric-card", ".kpi-box", ".investment-box", ".slider-container",
      ".result-card", ".sensitivity-warning", ".opportunity-card",
      ".risk-card", ".cta-content"
    ];
    var nodes = document.querySelectorAll(selectors.join(","));
    nodes.forEach(function (el) { el.classList.add("reveal"); });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    nodes.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     Contadores animados (hero)
     ============================================================ */
  function initCounters() {
    var els = document.querySelectorAll(".stat-value");
    if (!els.length) return;

    var animate = function (el) {
      var raw = el.textContent.trim();
      var m = raw.match(/^([^\d-]*)([\d.,]+)(.*)$/);
      if (!m || reduceMotion) return;
      var prefix = m[1], suffix = m[3];
      var target = parseFloat(m[2].replace(/\./g, "").replace(",", "."));
      var decimals = (m[2].split(/[.,]/)[1] || "").length;
      var dur = 1100, start = null;
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = (target * eased).toFixed(decimals);
        el.textContent = prefix + Number(val).toLocaleString("es-AR", {
          minimumFractionDigits: decimals, maximumFractionDigits: decimals
        }) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = raw;
      };
      requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) { els.forEach(animate); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     Dashboard de sensibilidad
     ============================================================ */
  function initSensitivity() {
    var slider = document.getElementById("driverSlider");
    if (!slider || !M || !M.drivers) return;

    var out = {
      variation: document.getElementById("driverVariation"),
      value:     document.getElementById("driverValue"),
      varLabel:  document.getElementById("driverVarLabel"),
      cmu:       document.getElementById("cmuResult"),
      resultado: document.getElementById("resultadoResult"),
      van:       document.getElementById("vanResult"),
      tir:       document.getElementById("tirResult"),
      breakeven: document.getElementById("breakeven"),
      tasaCorte: document.getElementById("tasaCorte")
    };
    var charts = {
      cmu:       document.getElementById("cmuChart"),
      resultado: document.getElementById("resultadoChart"),
      van:       document.getElementById("vanChart"),
      tir:       document.getElementById("tirChart")
    };

    function driverMeta(key) {
      for (var i = 0; i < M.drivers.length; i++) if (M.drivers[i].key === key) return M.drivers[i];
      return M.drivers[0];
    }

    // Variación guardada por cada driver (default 0). Los resultados de abajo
    // son el escenario COMBINADO de todas estas variaciones a la vez.
    var deltas = {};
    M.drivers.forEach(function (dr) { deltas[dr.key] = 0; });

    var activeKey = M.drivers[0].key;
    var driver = driverMeta(activeKey);

    // Construir las tabs de drivers (con badge de variación guardada)
    var tabsWrap = document.getElementById("driverTabs");
    if (tabsWrap) {
      M.drivers.forEach(function (dr) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "driver-tab" + (dr.key === activeKey ? " is-active" : "");
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", dr.key === activeKey ? "true" : "false");
        b.dataset.key = dr.key;
        b.innerHTML = '<span class="driver-tab-num">0' + dr.crit + '</span>' +
                      '<span class="driver-tab-label">' + dr.label + '</span>' +
                      '<span class="driver-tab-delta" data-key="' + dr.key + '"></span>';
        b.addEventListener("click", function () { setDriver(dr.key); });
        tabsWrap.appendChild(b);
      });
    }

    function setDriver(key) {
      if (key === activeKey) return;
      activeKey = key;
      driver = driverMeta(key);
      if (tabsWrap) {
        [].forEach.call(tabsWrap.children, function (b) {
          var on = b.dataset.key === key;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
      }
      slider.value = deltas[key] || 0;          // restaurar la variación guardada del driver
      if (out.varLabel) out.varLabel.textContent = driver.sliderLabel;
      render();
    }

    function fmtDriverValue(v) {
      if (driver.unidad === "m²/mes") return Math.round(v).toLocaleString("es-AR") + " m²/mes";
      if (driver.unidad === "$/mes")  return fmtMoney(v) + "/mes";
      return fmtMoney(v) + "/m²";
    }

    function updateTabDeltas() {
      if (!tabsWrap) return;
      [].forEach.call(tabsWrap.querySelectorAll(".driver-tab-delta"), function (el) {
        var dv = deltas[el.dataset.key] || 0;
        el.textContent = dv ? ((dv > 0 ? "+" : "") + dv + "%") : "";
        el.classList.toggle("is-set", !!dv);
      });
    }

    function render() {
      var d = parseInt(slider.value, 10);
      deltas[activeKey] = d;                         // guardar la variación del driver activo

      var active = M.computeDriver(activeKey, d);    // valor del driver activo (readout)
      var comb = M.computeCombined(deltas);          // escenario combinado (todos los drivers)

      out.variation.textContent = (d > 0 ? "+" : "") + d + "%";
      out.value.textContent     = fmtDriverValue(active.value);
      out.cmu.textContent       = fmtMoney(comb.cmu);
      out.resultado.textContent = fmtM(comb.resultadoOp);
      out.van.textContent       = fmtM(comb.van);
      out.tir.textContent       = (comb.tir === null) ? "n/a" : comb.tir.toFixed(1) + "%";
      if (out.breakeven) out.breakeven.textContent = M.breakevenCombined(activeKey, deltas);
      if (out.tasaCorte) {
        var ok = (comb.tir !== null && comb.tir >= M.BASE.corte);
        var tirTxt = (comb.tir === null) ? "n/a" : Math.round(comb.tir) + "%";
        out.tasaCorte.textContent = "15% (TIR " + tirTxt + (ok ? " > " : " < ") + "15%)";
        toggleNeg(out.tasaCorte, !ok);
      }

      toggleNeg(out.resultado, comb.resultadoOp < 0);
      toggleNeg(out.van, comb.van < 0);
      toggleNeg(out.tir, comb.tir === null || comb.tir < M.BASE.corte);
      toggleNeg(out.cmu, comb.cmu < 0);

      var serie = M.seriesCombined(activeKey, deltas);
      drawSpark(charts.cmu,       serie, "cmu",         d, "#cdff00");
      drawSpark(charts.resultado, serie, "resultadoOp", d, "#cdff00");
      drawSpark(charts.van,       serie, "van",         d, "#cdff00");
      drawSpark(charts.tir,       serie, "tir",         d, "#cdff00");

      updateTabDeltas();
    }

    function toggleNeg(el, isNeg) {
      if (el) el.classList.toggle("is-negative", !!isNeg);
    }

    // Reiniciar todos los drivers a 0
    var resetBtn = document.getElementById("driverReset");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        M.drivers.forEach(function (dr) { deltas[dr.key] = 0; });
        slider.value = 0;
        render();
      });
    }

    if (out.varLabel) out.varLabel.textContent = driver.sliderLabel;
    slider.value = deltas[activeKey] || 0;
    slider.addEventListener("input", render);
    window.addEventListener("resize", debounce(render, 120));
    renderTornado();
    render();
  }

  /* Tornado: amplitud de VAN por driver (barras CSS) */
  function renderTornado() {
    var wrap = document.getElementById("tornado");
    if (!wrap || !M || !M.tornado) return;
    var data = M.tornado;
    var lo = Math.min(0, Math.min.apply(null, data.map(function (t) { return t.vanAdv; })));
    var hi = Math.max(0, Math.max.apply(null, data.map(function (t) { return t.vanFav; })));
    var span = (hi - lo) || 1;
    var pos = function (v) { return ((v - lo) / span) * 100; };
    var zero = pos(0);

    wrap.innerHTML = "";
    data.forEach(function (t) {
      var xa = pos(t.vanAdv), xf = pos(t.vanFav);
      var left = Math.min(xa, xf), right = Math.max(xa, xf);
      var loss = "";
      if (left < zero) {
        var lr = Math.min(right, zero);
        loss = '<span class="tornado-loss" style="left:' + left + '%;width:' + (lr - left) + '%"></span>';
      }
      var row = document.createElement("div");
      row.className = "tornado-row";
      row.innerHTML =
        '<span class="tornado-rank">0' + t.rank + '</span>' +
        '<span class="tornado-name">' + t.label + '</span>' +
        '<span class="tornado-track">' +
          '<span class="tornado-zero" style="left:' + zero + '%"></span>' +
          '<span class="tornado-bar" style="left:' + left + '%;width:' + (right - left) + '%"></span>' +
          loss +
        '</span>' +
        '<span class="tornado-amp">$' + Math.round(t.amplitud).toLocaleString("es-AR") + 'M</span>';
      wrap.appendChild(row);
    });
  }

  /* Dibuja una sparkline en canvas con el punto actual resaltado */
  function drawSpark(canvas, serie, key, currentDelta, color) {
    if (!canvas || !canvas.getContext) return;
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth || canvas.offsetWidth || 200;
    var h = canvas.clientHeight || 48;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var vals = serie.map(function (s) { return s[key]; });
    var nn = vals.filter(function (v) { return v !== null && !isNaN(v); });
    if (!nn.length) return;
    var min = Math.min.apply(null, nn);
    var max = Math.max.apply(null, nn);
    var range = (max - min) || 1;
    var pad = 6;

    var x = function (i) { return pad + (i / (serie.length - 1)) * (w - pad * 2); };
    var y = function (v) { return h - pad - ((v - min) / range) * (h - pad * 2); };

    // Línea base en cero (si el rango lo cruza)
    if (min < 0 && max > 0) {
      ctx.strokeStyle = "rgba(255,90,77,.4)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pad, y(0)); ctx.lineTo(w - pad, y(0));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Línea (saltando puntos no modelados / null)
    ctx.beginPath();
    var started = false;
    serie.forEach(function (s, i) {
      var v = s[key];
      if (v === null || isNaN(v)) { started = false; return; }
      var px = x(i), py = y(v);
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Área de relleno solo cuando la serie no tiene huecos
    if (nn.length === serie.length) {
      ctx.lineTo(x(serie.length - 1), h - pad);
      ctx.lineTo(x(0), h - pad);
      ctx.closePath();
      ctx.fillStyle = hexToRgba(color, 0.10);
      ctx.fill();
    }

    // Punto actual
    var idx = currentDelta + 25; // serie va de -25..25
    if (idx >= 0 && idx < serie.length) {
      var cv = serie[idx][key];
      if (cv !== null && !isNaN(cv)) {
        var cx = x(idx), cy = y(cv);
        ctx.lineJoin = "miter";
        // Rombo tipo baldosa: marco lima con borde claro y centro negro
        diamond(ctx, cx, cy, 5.5);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#f2f2ec";
        ctx.stroke();
        diamond(ctx, cx, cy, 2.6);   // rombo interior negro
        ctx.fillStyle = "#0a0a09";
        ctx.fill();
      }
    }
  }

  /* ============================================================
     Carrusel horizontal — casos de aplicación
     ============================================================ */
  function initCases() {
    var viewport = document.getElementById("casesViewport");
    var track = document.getElementById("casesGrid");
    if (!viewport || !track || !M) return;

    var pool = M.cases;

    function makeCard(c) {
      var el = document.createElement("article");
      el.className = "case-card is-visible" + (c.img ? " has-media" : "");
      var media = c.img
        ? '<div class="case-media"><img loading="lazy" decoding="async" src="' + c.img +
          '" alt="' + (c.alt || c.titulo) + '"></div>'
        : '';
      el.innerHTML =
        media +
        '<div class="case-top">' +
          '<div><h4>' + c.titulo + '</h4><span class="case-tag">' + c.tag + '</span></div>' +
        '</div>' +
        '<p>' + c.desc + '</p>' +
        '<div class="case-metric"><span>Impacto</span><strong>' + c.metrica + '</strong></div>';
      return el;
    }

    var frag = document.createDocumentFragment();
    for (var i = 0; i < pool.length; i++) frag.appendChild(makeCard(pool[i]));
    track.appendChild(frag);

    /* ---- Motor del carrusel: arrastre + inercia + rebote + anclado ----
       Trabajamos con transform (no scroll nativo) para controlar la física:
       offset = px desplazados a la derecha; translate = -offset. */
    var DRAG = 1;            // sensibilidad del arrastre (1:1)
    var FRICTION = 0.94;     // decaimiento de la inercia por frame
    var RUBBER = 0.32;       // resistencia al estirar más allá de un extremo
    var EDGE_STIFF = 0.10;   // fuerza del rebote en los bordes
    var EDGE_DAMP = 0.72;    // amortiguación del rebote
    var SNAP_V = 1.2;        // umbral de velocidad para empezar a anclar
    var SNAP_STIFF = 0.14;   // fuerza del anclado a la card
    var SNAP_DAMP = 0.74;    // amortiguación del anclado
    var MAX_V = 55;          // tope de velocidad al soltar

    var offset = 0, velocity = 0, max = 0, raf = null;
    var dragging = false, startX = 0, startOffset = 0, lastX = 0, moved = false;
    var nudged = false;

    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function measure() { max = Math.max(0, track.scrollWidth - viewport.clientWidth); }
    function apply() { track.style.transform = "translate3d(" + (-offset) + "px,0,0)"; }
    function step() {
      var card = track.querySelector(".case-card");
      if (!card) return viewport.clientWidth;
      var cs = getComputedStyle(track);
      var gap = parseFloat(cs.columnGap || cs.gap) || 0;
      return card.getBoundingClientRect().width + gap;
    }
    function startLoop() { if (!raf) raf = requestAnimationFrame(tick); }
    function stopLoop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    function tick() {
      if (offset < 0) {                              // rebote en el borde izquierdo
        velocity += (0 - offset) * EDGE_STIFF;
        velocity *= EDGE_DAMP;
        offset += velocity;
        if (Math.abs(offset) < 0.4 && Math.abs(velocity) < 0.4) { offset = 0; velocity = 0; apply(); raf = null; return; }
      } else if (offset > max) {                     // rebote en la última card
        velocity += (max - offset) * EDGE_STIFF;
        velocity *= EDGE_DAMP;
        offset += velocity;
        if (Math.abs(offset - max) < 0.4 && Math.abs(velocity) < 0.4) { offset = max; velocity = 0; apply(); raf = null; return; }
      } else if (Math.abs(velocity) > SNAP_V) {      // inercia
        offset += velocity;
        velocity *= FRICTION;
      } else {                                       // anclar a la card más cercana
        var target = clamp(Math.round(offset / step()) * step(), 0, max);
        velocity += (target - offset) * SNAP_STIFF;
        velocity *= SNAP_DAMP;
        offset += velocity;
        if (Math.abs(target - offset) < 0.4 && Math.abs(velocity) < 0.4) { offset = target; velocity = 0; apply(); raf = null; return; }
      }
      apply();
      raf = requestAnimationFrame(tick);
    }

    // --- Arrastre con mouse / touch / lápiz (Pointer Events unificados) ---
    viewport.addEventListener("pointerdown", function (e) {
      if (e.button && e.button !== 0) return;
      stopLoop();
      dragging = true; moved = false; velocity = 0;
      startX = lastX = e.clientX;
      startOffset = offset;
      measure();
      viewport.classList.add("is-dragging");
      try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
    });
    viewport.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      velocity = -(e.clientX - lastX);   // px/frame aprox. para la inercia
      lastX = e.clientX;
      var raw = startOffset - dx * DRAG;
      if (raw < 0) offset = raw * RUBBER;               // resistencia elástica
      else if (raw > max) offset = max + (raw - max) * RUBBER;
      else offset = raw;
      apply();
    });
    function release(e) {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove("is-dragging");
      try { viewport.releasePointerCapture(e.pointerId); } catch (err) {}
      if (reduceMotion) {
        offset = clamp(Math.round(offset / step()) * step(), 0, max);
        apply();
        return;
      }
      velocity = clamp(velocity, -MAX_V, MAX_V);
      startLoop();
    }
    viewport.addEventListener("pointerup", release);
    viewport.addEventListener("pointercancel", release);
    // Si hubo arrastre, cancela el click fantasma dentro de la card
    viewport.addEventListener("click", function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    viewport.addEventListener("dragstart", function (e) { e.preventDefault(); });

    // --- Teclado (accesibilidad): flechas mueven ~una card ---
    viewport.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      measure();
      var dir = e.key === "ArrowRight" ? 1 : -1;
      stopLoop();
      if (reduceMotion) {
        offset = clamp(Math.round(offset / step()) * step() + dir * step(), 0, max);
        apply();
        return;
      }
      velocity = dir * step() * (1 - FRICTION) * 1.05; // inercia de ~una card
      startLoop();
    });

    // --- "Peek" al entrar en viewport: insinúa que hay más cards ---
    function nudge() {
      if (nudged || dragging || reduceMotion) return;
      measure();
      if (max <= 0) return;
      nudged = true;
      velocity = 5.5;          // empuje suave → asoma la card siguiente y vuelve
      startLoop();
    }

    function relayout() {
      measure();
      if (!dragging && !raf) { offset = clamp(offset, 0, max); apply(); }
    }

    requestAnimationFrame(function () { measure(); apply(); });
    window.addEventListener("resize", debounce(relayout, 120));

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { nudge(); io.disconnect(); } });
      }, { threshold: 0.35 });
      io.observe(viewport);
    }
  }

  /* ============================================================
     Utils
     ============================================================ */
  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }
  function diamond(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
  }
  function hexToRgba(hex, a) {
    var h = hex.replace("#", "");
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
})();
