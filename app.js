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
    initHeroCarousel();
    initReveal();
    initCounters();
    initSensitivity();
    initScenarios();
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
     Carrusel del hero (imagen / specs) — solo activo en mobile.
     En desktop ambas slides son visibles y los puntos están ocultos.
     ============================================================ */
  function initHeroCarousel() {
    var showcase = document.querySelector(".hero-showcase");
    var dotsWrap = document.querySelector(".hero-dots");
    if (!showcase || !dotsWrap) return;

    var slides = showcase.querySelectorAll(".hero-slide");
    var dots = dotsWrap.querySelectorAll(".hero-dot");
    if (!slides.length || dots.length !== slides.length) return;

    // Click en un punto -> desliza a esa slide (sin mover la página verticalmente)
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        slides[i].scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          inline: "center",
          block: "nearest"
        });
      });
    });

    // Marca el punto de la slide más centrada en el viewport del carrusel
    var ticking = false;
    function update() {
      ticking = false;
      var center = showcase.scrollLeft + showcase.clientWidth / 2;
      var active = 0, best = Infinity;
      slides.forEach(function (s, i) {
        var d = Math.abs((s.offsetLeft + s.offsetWidth / 2) - center);
        if (d < best) { best = d; active = i; }
      });
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === active); });
    }
    showcase.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
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
      out.tir.textContent       = comb.tir.toFixed(1) + "%";
      if (out.breakeven) out.breakeven.textContent = M.breakevenCombined(activeKey, deltas);
      if (out.tasaCorte) {
        var ok = comb.tir >= M.BASE.corte;
        out.tasaCorte.textContent = "15% (TIR " + Math.round(comb.tir) + "%" + (ok ? " > " : " < ") + "15%)";
        toggleNeg(out.tasaCorte, !ok);
      }

      toggleNeg(out.resultado, comb.resultadoOp < 0);
      toggleNeg(out.van, comb.van < 0);
      toggleNeg(out.tir, comb.tir < M.BASE.corte);
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
     Simulación de escenarios — FF acumulado (39 trayectorias)
     Un solo gráfico "tipo Monte Carlo": cada línea es un escenario
     de la sheet DRIVERS(1); la base común se dibuja una sola vez.
     ============================================================ */
  function initScenarios() {
    var canvas = document.getElementById("mcChart");
    var legendWrap = document.getElementById("mcLegend");
    var tip = document.getElementById("mcTip");
    if (!canvas || !canvas.getContext || !legendWrap || !tip || !M || !M.scenarios) return;

    var COLORS = { precio: "#cdff00", volumen: "#aadb00", cvu: "#ff5a4d", cf: "#ffb338", mp: "#8e918a" };
    var BASE_COLOR = "#f2f2ec";
    var PAD = { top: 14, right: 18, bottom: 30, left: 68 };

    // Cada curva es el VAN acumulado año a año del modelo (vanY: VPN del flujo
    // cortado en ese año, a la tasa del inversor), así el punto del año 10
    // coincide con el VAN del escenario y las curvas de VAN negativo terminan
    // debajo del cero. tirY trae la TIR de ese mismo flujo cortado —cuánto
    // rendiría cerrar en ese año— y es null hasta que el flujo recupera la
    // inversión. La primera trayectoria con d=0 es la base; las demás d=0 que
    // coinciden con ella son duplicados y se saltean (en la vista proyecto la
    // de MP difiere: queda como línea).
    function sameSeries(a, b) {
      for (var i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 0.5) return false;
      return true;
    }

    function buildDataset(groups) {
      var lines = [], base = null;
      groups.forEach(function (g) {
        g.rows.forEach(function (r) {
          var l = {
            key: g.key, label: g.label, d: r.d,
            pts: r.vanY, tirY: r.tirY, van: r.van, tir: r.tir
          };
          if (r.d === 0) {
            if (!base) { l.key = "base"; l.label = "Escenario base"; base = l; return; }
            if (sameSeries(l.pts, base.pts)) return;
          }
          lines.push(l);
        });
      });
      return { lines: lines, base: base };
    }

    var datasets = {
      proyecto: buildDataset(M.scenarios),
      inversor: M.scenariosInvestor ? buildDataset(M.scenariosInvestor) : null
    };
    var mode = "proyecto";
    var lines = datasets[mode].lines;
    var base = datasets[mode].base;
    if (!base) return;

    var hiddenKeys = {};      // key de driver -> true si está oculto desde la leyenda
    var highlighted = null;   // línea bajo el cursor
    var hoverYear = null;     // año (0..10) bajo el cursor
    var geom = null;          // escalas del último render (para el hit-test del hover)

    /* ---- Tabs Proyecto / Inversor: cambian el set de trayectorias ---- */
    var modesWrap = document.getElementById("mcModes");
    var noteEl = document.getElementById("mcNote");
    var MODE_LABEL = { proyecto: "Proyecto", inversor: "Inversor" };
    var NOTES = {
      proyecto: "Flujo de fondos del proyecto completo (base: VAN $6.940M · TIR 65,2%). Pasá el mouse (o tocá) una línea para leerla año por año: VAN acumulado y TIR de cerrar en ese año, con el detalle completo en la tabla de abajo. La TIR aparece recién cuando el flujo recupera la inversión. Los escenarios de materia prima corren sobre la base de flujo del inversor, por eso forman la banda inferior.",
      inversor: "Flujo que efectivamente recibe el inversor: 100% de los años 1-3, 60% del año 4 y 34% de los años 5-10 (base: VAN $2.242M · TIR 42,2%). Pasá el mouse (o tocá) una línea para leerla año por año: VAN acumulado y TIR de cerrar en ese año, con el detalle completo en la tabla de abajo. La TIR aparece recién cuando el flujo recupera la inversión."
    };
    function setMode(m) {
      if (m === mode || !datasets[m]) return;
      mode = m;
      lines = datasets[m].lines;
      base = datasets[m].base;
      highlighted = null;
      hoverYear = null;
      tip.hidden = true;
      if (modesWrap) {
        [].forEach.call(modesWrap.querySelectorAll(".mc-mode"), function (b) {
          var on = b.dataset.mode === m;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
      }
      if (noteEl && NOTES[m]) noteEl.textContent = NOTES[m];
      render();
      renderYearly();
    }
    if (modesWrap) {
      [].forEach.call(modesWrap.querySelectorAll(".mc-mode"), function (b) {
        b.addEventListener("click", function () { setMode(b.dataset.mode); });
      });
    }

    function visibleLines() {
      return lines.filter(function (l) { return !hiddenKeys[l.key]; });
    }

    /* Paso "redondo" para ~5 gridlines horizontales */
    function niceStep(range) {
      var raw = range / 5;
      var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
      var norm = raw / mag;
      var step = norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1;
      return step * mag;
    }

    function fmtVanM(v) {
      var n = Math.round(v);
      if (n === 0) n = 0;                 // normaliza el -0 de los ticks flotantes
      return "$" + n.toLocaleString("es-AR") + "M";
    }
    /* TIR null = el flujo acumulado todavía no cambia de signo en ese año */
    function fmtTir(t) {
      return (t === null || t === undefined) ? "—" : t.toFixed(1).replace(".", ",") + "%";
    }
    function scenName(l) {
      return l.key === "base" ? "Escenario base" : l.label + " " + (l.d > 0 ? "+" : "") + l.d + "%";
    }

    function render() {
      var dpr = window.devicePixelRatio || 1;
      var w = canvas.clientWidth || 600;
      var h = canvas.clientHeight || 380;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var vis = visibleLines();
      var all = vis.concat([base]);
      var min = Infinity, max = -Infinity;
      all.forEach(function (l) {
        l.pts.forEach(function (v) { if (v < min) min = v; if (v > max) max = v; });
      });
      var span = (max - min) || 1;
      min -= span * 0.04;
      max += span * 0.04;
      span = max - min;

      function x(i) { return PAD.left + (i / 10) * (w - PAD.left - PAD.right); }
      function y(v) { return PAD.top + (1 - (v - min) / span) * (h - PAD.top - PAD.bottom); }
      geom = { x: x, y: y, w: w, h: h };

      /* Grid horizontal + labels de M$ (el cero va más marcado) */
      ctx.font = '10px "Space Mono", ui-monospace, monospace';
      var step = niceStep(span);
      var v0 = Math.ceil(min / step) * step;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (var v = v0; v <= max; v += step) {
        var yy = y(v);
        var isZero = Math.abs(v) < step / 1e6;
        ctx.strokeStyle = isZero ? "rgba(242,242,236,.30)" : "rgba(242,242,236,.09)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD.left, yy);
        ctx.lineTo(w - PAD.right, yy);
        ctx.stroke();
        ctx.fillStyle = isZero ? "rgba(242,242,236,.75)" : "rgba(142,145,138,.9)";
        ctx.fillText(fmtVanM(v), PAD.left - 8, yy);
      }

      /* Ticks de años (cada 2 si el ancho aprieta; el año bajo el cursor
         siempre se dibuja, resaltado) */
      var everyX = w < 520 ? 2 : 1;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (var i = 0; i <= 10; i++) {
        var onYear = i === hoverYear;
        if (i % everyX !== 0 && !onYear) continue;
        ctx.fillStyle = onYear ? "#cdff00" : "rgba(142,145,138,.9)";
        ctx.fillText(String(i), x(i), h - PAD.bottom + 8);
      }

      /* Guía vertical del año bajo el cursor (detrás de las trayectorias) */
      if (hoverYear !== null) {
        ctx.save();
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = "rgba(242,242,236,.28)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x(hoverYear), PAD.top);
        ctx.lineTo(x(hoverYear), h - PAD.bottom);
        ctx.stroke();
        ctx.restore();
      }

      function strokeLine(l, color, alpha, width) {
        ctx.strokeStyle = hexToRgba(color, alpha);
        ctx.lineWidth = width;
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (var j = 0; j < l.pts.length; j++) {
          var px = x(j), py = y(l.pts[j]);
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      /* Enjambre -> base -> resaltada (de atrás hacia adelante) */
      var hasHi = !!highlighted;
      vis.forEach(function (l) {
        if (l === highlighted) return;
        strokeLine(l, COLORS[l.key], hasHi ? 0.14 : 0.5, 1.4);
      });
      if (base !== highlighted) strokeLine(base, BASE_COLOR, hasHi ? 0.35 : 0.95, 2.4);
      if (highlighted) {
        var hc = highlighted.key === "base" ? BASE_COLOR : COLORS[highlighted.key];
        strokeLine(highlighted, hc, 1, 2.6);
      }

      /* Marcador del año leído: sobre la línea resaltada o, si no hay
         ninguna, sobre la base (que es la que muestra la tabla). */
      var readLine = highlighted || (hoverYear !== null ? base : null);
      if (readLine) {
        var yr = hoverYear === null ? 10 : hoverYear;
        var rc = readLine.key === "base" ? BASE_COLOR : COLORS[readLine.key];
        ctx.beginPath();
        ctx.arc(x(yr), y(readLine.pts[yr]), 3.8, 0, Math.PI * 2);
        ctx.fillStyle = rc;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#0a0a09";
        ctx.stroke();
      }
    }

    /* ---- Hover / tap: resaltar la línea más cercana + tooltip ---- */
    /* Tooltip en dos líneas: escenario + año arriba, VAN/TIR de ese año abajo */
    var tipHead = document.createElement("span");
    tipHead.className = "mc-tip-head";
    var tipVals = document.createElement("span");
    tipVals.className = "mc-tip-vals";
    tip.appendChild(tipHead);
    tip.appendChild(tipVals);

    function segDist(px, py, x1, y1, x2, y2) {
      var dx = x2 - x1, dy = y2 - y1;
      var len2 = (dx * dx + dy * dy) || 1;
      var t = ((px - x1) * dx + (py - y1) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      var qx = x1 + t * dx, qy = y1 + t * dy;
      return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
    }

    function nearestLine(mx, my) {
      if (!geom) return null;
      var best = null, bestD = 12;   // tolerancia en px
      var cands = visibleLines().concat([base]);
      cands.forEach(function (l) {
        for (var i = 0; i < 10; i++) {
          var d = segDist(mx, my, geom.x(i), geom.y(l.pts[i]), geom.x(i + 1), geom.y(l.pts[i + 1]));
          if (d < bestD) { bestD = d; best = l; }
        }
      });
      return best;
    }

    /* Año más cercano al cursor; null si el puntero está fuera del área de plot */
    function yearAt(mx, my) {
      if (!geom) return null;
      if (mx < PAD.left - 8 || mx > geom.w - PAD.right + 8) return null;
      if (my < PAD.top - 8 || my > geom.h - PAD.bottom + 8) return null;
      var i = Math.round(((mx - PAD.left) / (geom.w - PAD.left - PAD.right)) * 10);
      return Math.max(0, Math.min(10, i));
    }

    function onMove(e) {
      var rect = canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left, my = e.clientY - rect.top;
      var hit = nearestLine(mx, my);
      var yr = yearAt(mx, my);
      if (hit !== highlighted || yr !== hoverYear) {
        highlighted = hit;
        hoverYear = yr;
        render();
        renderYearly();
      }
      if (hit && yr !== null) {
        var head = hit.key === "base" ? "Base" : hit.label + " " + (hit.d > 0 ? "+" : "") + hit.d + "%";
        tipHead.textContent = head + " · Año " + yr;
        tipVals.textContent = "VAN " + fmtVanM(hit.pts[yr]) + " · TIR " + fmtTir(hit.tirY[yr]);
        tip.hidden = false;
        var tw = tip.offsetWidth, th = tip.offsetHeight;
        // Prioriza el borde izquierdo: si el tip es más ancho que el canvas,
        // mejor recortar a la derecha que dibujarlo en left negativo.
        var tx = Math.max(0, Math.min(mx + 14, rect.width - tw - 2));
        var ty = my - th - 12;
        if (ty < 0) ty = my + 16;
        tip.style.left = tx + "px";
        tip.style.top = ty + "px";
      } else {
        tip.hidden = true;
      }
    }
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);    // tap en touch
    canvas.addEventListener("pointerleave", function (e) {
      // En touch el UA dispara pointerleave apenas se levanta el dedo:
      // ignorarlo para que el tap deje el tooltip fijado (un tap en zona
      // vacía lo oculta vía la rama else de onMove).
      if (e.pointerType && e.pointerType !== "mouse") return;
      highlighted = null;
      hoverYear = null;
      tip.hidden = true;
      render();
      renderYearly();
    });

    /* ---- Tabla año por año del escenario leído (el resaltado, o la base) ---- */
    var yearlyWrap = document.getElementById("mcYearly");
    var yearlyScen = null, yearlyHead = [], yearlyVan = [], yearlyTir = [];

    function buildYearly() {
      if (!yearlyWrap) return;
      var years = "", cells = "", i;
      for (i = 0; i <= 10; i++) {
        years += '<th scope="col">' + i + "</th>";
        cells += "<td>—</td>";
      }
      yearlyWrap.innerHTML =
        '<div class="mc-yearly-head">' +
          '<h5 class="mc-yearly-title">VAN y TIR año por año</h5>' +
          '<p class="mc-yearly-scen"></p>' +
        '</div>' +
        '<div class="mc-yearly-scroll">' +
          '<table class="mc-yearly-table">' +
            '<caption>VAN acumulado y TIR de cerrar en cada año, para el escenario resaltado en el gráfico.</caption>' +
            '<thead><tr><th scope="col">Año</th>' + years + '</tr></thead>' +
            '<tbody>' +
              '<tr class="mc-yearly-van"><th scope="row">VAN (M$)</th>' + cells + '</tr>' +
              '<tr class="mc-yearly-tir"><th scope="row">TIR</th>' + cells + '</tr>' +
            '</tbody>' +
          '</table>' +
        '</div>';
      yearlyScen = yearlyWrap.querySelector(".mc-yearly-scen");
      yearlyHead = [].slice.call(yearlyWrap.querySelectorAll("thead th")).slice(1);
      yearlyVan = [].slice.call(yearlyWrap.querySelectorAll(".mc-yearly-van td"));
      yearlyTir = [].slice.call(yearlyWrap.querySelectorAll(".mc-yearly-tir td"));
    }

    function renderYearly() {
      if (!yearlyScen) return;
      var l = highlighted || base;
      yearlyScen.textContent = scenName(l) + " · " + MODE_LABEL[mode];
      for (var i = 0; i <= 10; i++) {
        var van = Math.round(l.pts[i]);
        var on = i === hoverYear;
        yearlyVan[i].textContent = van.toLocaleString("es-AR");
        yearlyVan[i].classList.toggle("is-neg", van < 0);
        yearlyTir[i].textContent = fmtTir(l.tirY[i]);
        yearlyHead[i].classList.toggle("is-on", on);
        yearlyVan[i].classList.toggle("is-on", on);
        yearlyTir[i].classList.toggle("is-on", on);
      }
    }

    /* ---- Leyenda: base fija + un toggle por driver ---- */
    var baseTag = document.createElement("span");
    baseTag.className = "mc-legend-item is-static";
    baseTag.innerHTML = '<span class="mc-swatch" style="background:' + BASE_COLOR + '"></span>Base';
    legendWrap.appendChild(baseTag);
    M.scenarios.forEach(function (g) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "mc-legend-item";
      b.setAttribute("aria-pressed", "true");
      b.innerHTML = '<span class="mc-swatch" style="background:' + COLORS[g.key] + '"></span>' + g.label;
      b.addEventListener("click", function () {
        hiddenKeys[g.key] = !hiddenKeys[g.key];
        b.classList.toggle("is-off", !!hiddenKeys[g.key]);
        b.setAttribute("aria-pressed", hiddenKeys[g.key] ? "false" : "true");
        if (highlighted && highlighted.key === g.key) { highlighted = null; tip.hidden = true; }
        render();
        renderYearly();
      });
      legendWrap.appendChild(b);
    });

    buildYearly();
    window.addEventListener("resize", debounce(render, 120));
    render();
    renderYearly();
    // Re-render cuando cargue Space Mono: el primer paint puede rasterizar
    // los labels del eje con la fuente fallback (display=swap no re-pinta canvas).
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(function () { render(); });
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
