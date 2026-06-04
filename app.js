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
    var slider = document.getElementById("priceSlider");
    if (!slider || !M) return;

    var out = {
      variation:  document.getElementById("priceVariation"),
      price:      document.getElementById("priceValue"),
      cmu:        document.getElementById("cmuResult"),
      resultado:  document.getElementById("resultadoResult"),
      van:        document.getElementById("vanResult"),
      tir:        document.getElementById("tirResult"),
      breakeven:  document.getElementById("breakeven")
    };

    var charts = {
      cmu:        document.getElementById("cmuChart"),
      resultado:  document.getElementById("resultadoChart"),
      van:        document.getElementById("vanChart"),
      tir:        document.getElementById("tirChart")
    };

    var serie = M.series();

    // Punto de quiebre real: donde el VAN cruza de positivo a negativo
    // (la serie va de -25..+25, el VAN crece con el precio).
    var breakeven = (function () {
      for (var i = 1; i < serie.length; i++) {
        if (serie[i - 1].van < 0 && serie[i].van >= 0) {
          return "Entre " + serie[i - 1].deltaPct + "% y " + serie[i].deltaPct + "%";
        }
      }
      if (serie[0].van >= 0) return "VAN positivo en todo el rango";
      return "VAN negativo en todo el rango";
    })();

    function render() {
      var d = parseInt(slider.value, 10);
      var r = M.compute(d);

      out.variation.textContent = (d > 0 ? "+" : "") + d + "%";
      out.price.textContent     = fmtMoney(r.precio);
      out.cmu.textContent       = fmtMoney(r.cmu);
      out.resultado.textContent = fmtM(r.resultadoOp);
      out.van.textContent       = fmtM(r.van);
      out.tir.textContent       = r.tir.toFixed(1) + "%";
      if (out.breakeven) out.breakeven.textContent = breakeven;

      // Marcar resultados en rojo cuando son negativos / bajo tasa de corte
      toggleNeg(out.resultado, r.resultadoOp < 0);
      toggleNeg(out.van, r.van < 0);
      toggleNeg(out.tir, r.tir < 15);
      toggleNeg(out.cmu, r.cmu < 0);

      drawSpark(charts.cmu,       serie, "cmu",         d, "#cdff00");
      drawSpark(charts.resultado, serie, "resultadoOp", d, "#cdff00");
      drawSpark(charts.van,       serie, "van",         d, "#cdff00");
      drawSpark(charts.tir,       serie, "tir",         d, "#cdff00");
    }

    function toggleNeg(el, isNeg) {
      if (el) el.classList.toggle("is-negative", !!isNeg);
    }

    slider.addEventListener("input", render);
    window.addEventListener("resize", debounce(render, 120));
    render();
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
    var min = Math.min.apply(null, vals);
    var max = Math.max.apply(null, vals);
    var range = (max - min) || 1;
    var pad = 6;

    var x = function (i) { return pad + (i / (serie.length - 1)) * (w - pad * 2); };
    var y = function (v) { return h - pad - ((v - min) / range) * (h - pad * 2); };

    // Línea base en cero (si el rango lo cruza)
    if (min < 0 && max > 0) {
      ctx.strokeStyle = "rgba(220,38,38,.35)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pad, y(0)); ctx.lineTo(w - pad, y(0));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Área + línea
    ctx.beginPath();
    serie.forEach(function (s, i) {
      var px = x(i), py = y(s[key]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.lineTo(x(serie.length - 1), h - pad);
    ctx.lineTo(x(0), h - pad);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(color, 0.10);
    ctx.fill();

    // Punto actual
    var idx = currentDelta + 25; // serie va de -25..25
    if (idx >= 0 && idx < serie.length) {
      var cx = x(idx), cy = y(serie[idx][key]);
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
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
      el.className = "case-card reveal";
      el.innerHTML =
        '<div class="case-top">' +
          '<div class="case-emoji">' + c.emoji + '</div>' +
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
