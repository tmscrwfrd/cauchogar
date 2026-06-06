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
    initReveal();
    initCounters();
    initSensitivity();
    initInfiniteScroll();
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
    var onScroll = function () {
      nav.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
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

  /* Observador reutilizable para nodos agregados dinámicamente */
  function revealObserver() {
    if (reduceMotion || !("IntersectionObserver" in window)) return null;
    return new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
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

    var activeKey = M.drivers[0].key;
    var driver = driverMeta(activeKey);
    var serie = M.seriesDriver(activeKey);

    // Construir las tabs de drivers
    var tabsWrap = document.getElementById("driverTabs");
    if (tabsWrap) {
      M.drivers.forEach(function (dr) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "driver-tab" + (dr.key === activeKey ? " is-active" : "");
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", dr.key === activeKey ? "true" : "false");
        b.dataset.key = dr.key;
        b.innerHTML = '<span class="driver-tab-num">0' + dr.crit + '</span>' + dr.label;
        b.addEventListener("click", function () { setDriver(dr.key); });
        tabsWrap.appendChild(b);
      });
    }

    function setDriver(key) {
      if (key === activeKey) return;
      activeKey = key;
      driver = driverMeta(key);
      serie = M.seriesDriver(key);
      if (tabsWrap) {
        [].forEach.call(tabsWrap.children, function (b) {
          var on = b.dataset.key === key;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
      }
      if (out.varLabel) out.varLabel.textContent = driver.sliderLabel;
      render();
    }

    function fmtDriverValue(v) {
      if (driver.unidad === "m²/mes") return Math.round(v).toLocaleString("es-AR") + " m²/mes";
      if (driver.unidad === "$/mes")  return fmtMoney(v) + "/mes";
      return fmtMoney(v) + "/m²";
    }

    function render() {
      var d = parseInt(slider.value, 10);
      var r = M.computeDriver(activeKey, d);

      out.variation.textContent = (d > 0 ? "+" : "") + d + "%";
      out.value.textContent     = fmtDriverValue(r.value);
      out.cmu.textContent       = fmtMoney(r.cmu);
      out.resultado.textContent = fmtM(r.resultadoOp);
      out.van.textContent       = fmtM(r.van);
      out.tir.textContent       = (r.tir === null) ? "n/a" : r.tir.toFixed(1) + "%";
      if (out.breakeven) out.breakeven.textContent = M.breakeven(activeKey);
      if (out.tasaCorte) {
        var ok = (r.tir !== null && r.tir >= M.BASE.corte);
        var tirTxt = (r.tir === null) ? "n/a" : Math.round(r.tir) + "%";
        out.tasaCorte.textContent = "15% (TIR " + tirTxt + (ok ? " > " : " < ") + "15%)";
        toggleNeg(out.tasaCorte, !ok);
      }

      toggleNeg(out.resultado, r.resultadoOp < 0);
      toggleNeg(out.van, r.van < 0);
      toggleNeg(out.tir, r.tir === null || r.tir < M.BASE.corte);
      toggleNeg(out.cmu, r.cmu < 0);

      drawSpark(charts.cmu,       serie, "cmu",         d, "#cdff00");
      drawSpark(charts.resultado, serie, "resultadoOp", d, "#cdff00");
      drawSpark(charts.van,       serie, "van",         d, "#cdff00");
      drawSpark(charts.tir,       serie, "tir",         d, "#cdff00");
    }

    function toggleNeg(el, isNeg) {
      if (el) el.classList.toggle("is-negative", !!isNeg);
    }

    if (out.varLabel) out.varLabel.textContent = driver.sliderLabel;
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
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#f2f2ec";
        ctx.stroke();
      }
    }
  }

  /* ============================================================
     Scroll infinito — casos de aplicación
     ============================================================ */
  function initInfiniteScroll() {
    var grid = document.getElementById("casesGrid");
    var sentinel = document.getElementById("casesSentinel");
    var loader = document.getElementById("casesLoader");
    if (!grid || !sentinel || !M) return;

    var pool = M.cases;
    var perBatch = 6;
    var index = 0;
    // Se carga el catálogo completo de casos únicos y luego se detiene, para que
    // el usuario pueda seguir hasta "Factores de Riesgo" (issue #1).
    var maxCards = pool.length;
    var loading = false;
    var ro = revealObserver();

    function makeCard(c, n) {
      var el = document.createElement("article");
      el.className = "case-card reveal" + (c.img ? " has-media" : "");
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
      if (ro) ro.observe(el); else el.classList.add("is-visible");
      return el;
    }

    function loadBatch() {
      if (loading || index >= maxCards) return;
      loading = true;
      if (loader) loader.hidden = false;

      // Pequeño delay para que el loader sea perceptible (UX de feed)
      setTimeout(function () {
        var frag = document.createDocumentFragment();
        for (var i = 0; i < perBatch && index < maxCards; i++, index++) {
          var c = pool[index % pool.length];
          frag.appendChild(makeCard(c, index));
        }
        grid.appendChild(frag);
        loading = false;
        if (index >= maxCards && loader) {
          loader.innerHTML = '<p style="color:var(--c-text-soft)">Mostrando todos los casos de aplicación.</p>';
        } else if (loader) {
          loader.hidden = true;
        }
      }, reduceMotion ? 0 : 350);
    }

    loadBatch(); // primer lote

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        loadBatch();
        if (index >= maxCards) io.disconnect(); // ya no hay más casos que cargar
      }, { rootMargin: "200px" });
      io.observe(sentinel);
    } else {
      // Fallback: botón implícito por scroll
      window.addEventListener("scroll", debounce(function () {
        var r = sentinel.getBoundingClientRect();
        if (r.top < window.innerHeight + 200) loadBatch();
      }, 150), { passive: true });
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
  function hexToRgba(hex, a) {
    var h = hex.replace("#", "");
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
})();
