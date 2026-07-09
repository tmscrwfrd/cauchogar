/* =========================================================
   CauchoHogar — Datos del modelo
   Expone window.CAUCHO: modelo de sensibilidad multi-driver
   (dashboard) + catálogo de casos de uso (scroll infinito).

   Fuente: tab "DRIVERS (1)" de la sheet PdN CAUCHOGAR.
   VAN/TIR por driver = puntos reales del flujo de fondos a 10
   años (interpolados linealmente entre anclas -25/-15/-5/0/+5/
   +15/+25). CMU y Resultado operativo se derivan analíticamente
   y reproducen la tabla tornado de la sheet.
   ========================================================= */
(function () {
  "use strict";

  /* ---- Valores base (Año 7 estabilizado / proyecto 10 años) ---- */
  var BASE = {
    precio:    58734,            // $/m² PPP
    cvu:       38330,            // $/m² costo variable unitario
    mp:        15206,            // $/m² costo materia prima (gránulo SBR, parte del CVU)
    volMensual:12932,            // m²/mes
    volAnual:  155184,           // m²/año
    cfMensual: 157287535,        // $/mes costos fijos
    cfAnual:   1887450420,       // $/año
    cmu:       20404,            // $/m² contribución marginal unitaria
    van:       2242,             // M$  VAN base (descontado al 10,2%)
    tir:       42.2,             // %   TIR base
    tasaInv:   10.2,             // %   tasa exigida por el inversor
    corte:     15,               // %   tasa de corte del proyecto
    dol:       2.5               // x   apalancamiento operativo
  };
  BASE.resultadoOp = (BASE.cmu * BASE.volAnual - BASE.cfAnual) / 1e6; // M$/año

  /* Anclas de % comunes a todos los anexos */
  var PCTS = [-25, -15, -5, 0, 5, 15, 25];

  /* Interpolación lineal sobre las anclas */
  function lerp(pts, pct) {
    if (pct <= PCTS[0]) return pts[0];
    if (pct >= PCTS[PCTS.length - 1]) return pts[pts.length - 1];
    for (var i = 0; i < PCTS.length - 1; i++) {
      if (pct >= PCTS[i] && pct <= PCTS[i + 1]) {
        var a = pts[i], b = pts[i + 1];
        var t = (pct - PCTS[i]) / (PCTS[i + 1] - PCTS[i]);
        return a + (b - a) * t;
      }
    }
    return pts[3];
  }

  /* ---- Drivers (VAN en M$, TIR en %, alineados a PCTS) ---- */
  var DRIVERS = [
    {
      key: "precio", label: "Precio", sliderLabel: "Variación de Precio",
      unidad: "$/m²", crit: 1,
      van: [-7086, -3355, 377, 2242, 4108, 7839, 11571],
      tir: [null, null, 17.3, 42.2, 60.8, 91.9, 119.8],
      value: function (d) { return BASE.precio * (1 + d); },
      cmu:   function (d) { return BASE.precio * (1 + d) - BASE.cvu; },
      ro:    function (d) { return ((BASE.precio * (1 + d) - BASE.cvu) * BASE.volAnual - BASE.cfAnual) / 1e6; }
    },
    {
      key: "volumen", label: "Volumen", sliderLabel: "Variación de Volumen",
      unidad: "m²/mes", crit: 2,
      van: [-3520, -1215, 1090, 2242, 3395, 5700, 8005],
      tir: [null, null, 28.6, 42.2, 53.4, 72.4, 88.9],
      value: function (d) { return BASE.volMensual * (1 + d); },
      cmu:   function ()  { return BASE.cmu; },
      ro:    function (d) { return (BASE.cmu * BASE.volAnual * (1 + d) - BASE.cfAnual) / 1e6; }
    },
    {
      key: "cvu", label: "Costo variable", sliderLabel: "Variación de Costo Variable (CVU)",
      unidad: "$/m²", crit: 3, adverseUp: true,
      van: [6368, 4718, 3068, 2242, 1417, -233, -1883],
      tir: [85.4, 69.1, 51.7, 42.2, 31.8, 5.8, -55.5],
      value: function (d) { return BASE.cvu * (1 + d); },
      cmu:   function (d) { return BASE.precio - BASE.cvu * (1 + d); },
      ro:    function (d) { return ((BASE.precio - BASE.cvu * (1 + d)) * BASE.volAnual - BASE.cfAnual) / 1e6; }
    },
    {
      key: "cf", label: "Costos fijos", sliderLabel: "Variación de Costos Fijos",
      unidad: "$/mes", crit: 4, adverseUp: true,
      van: [4544, 3623, 2703, 2242, 1782, 862, -59],
      tir: [75.6, 61.9, 48.6, 42.2, 35.8, 22.9, 9.3],
      value: function (d) { return BASE.cfMensual * (1 + d); },
      cmu:   function ()  { return BASE.cmu; },
      ro:    function (d) { return (BASE.cmu * BASE.volAnual - BASE.cfAnual * (1 + d)) / 1e6; }
    },
    {
      key: "mp", label: "Materia prima", sliderLabel: "Variación de Materia Prima (SBR)",
      unidad: "$/m²", crit: 5, adverseUp: true,
      van: [2737, 2539, 2341, 2242, 2144, 1946, 1748],
      tir: [47.9, 45.7, 43.4, 42.2, 41.0, 38.6, 36.1],
      value: function (d) { return BASE.mp * (1 + d); },
      cmu:   function (d) { return BASE.cmu - BASE.mp * d; },
      ro:    function (d) { return ((BASE.cmu - BASE.mp * d) * BASE.volAnual - BASE.cfAnual) / 1e6; }
    }
  ];

  /* La sheet no modela la TIR en los extremos adversos de precio y volumen
     (null en las anclas). Para que el dashboard muestre siempre un número,
     esas anclas se extrapolan linealmente desde los dos puntos conocidos
     más cercanos: son estimaciones, no valores de la sheet. */
  DRIVERS.forEach(function (dr) {
    var t = dr.tir;
    var i = 0;
    while (i < t.length && t[i] === null) i++;
    if (i === 0 || i >= t.length - 1) return;
    var slope = (t[i + 1] - t[i]) / (PCTS[i + 1] - PCTS[i]);
    for (var k = i - 1; k >= 0; k--) {
      t[k] = Math.round((t[i] + slope * (PCTS[k] - PCTS[i])) * 10) / 10;
    }
  });

  function driverByKey(key) {
    for (var i = 0; i < DRIVERS.length; i++) if (DRIVERS[i].key === key) return DRIVERS[i];
    return DRIVERS[0];
  }

  /* Outputs de un driver para una variación dada (pct -25..25) */
  function computeDriver(key, pct) {
    var dr = driverByKey(key), d = pct / 100;
    return {
      deltaPct: pct,
      value: dr.value(d),
      cmu: dr.cmu(d),
      resultadoOp: dr.ro(d),     // M$
      van: lerp(dr.van, pct),    // M$
      tir: lerp(dr.tir, pct)     // %
    };
  }

  /* Serie -25..+25 (paso 1) para las mini-gráficas */
  function seriesDriver(key) {
    var out = [];
    for (var v = -25; v <= 25; v++) out.push(computeDriver(key, v));
    return out;
  }

  /* Banda donde el VAN cruza de positivo a negativo (o nota) */
  function breakeven(key) {
    var s = seriesDriver(key);
    for (var i = 1; i < s.length; i++) {
      var a = s[i - 1].van, b = s[i].van;
      if (a === null || b === null) continue;
      if ((a >= 0 && b < 0) || (a < 0 && b >= 0)) {
        var lo = Math.min(s[i - 1].deltaPct, s[i].deltaPct);
        var hi = Math.max(s[i - 1].deltaPct, s[i].deltaPct);
        return "Entre " + lo + "% y " + hi + "%";
      }
    }
    return s[0].van >= 0 && s[s.length - 1].van >= 0
      ? "VAN positivo en todo el rango"
      : "VAN negativo en todo el rango";
  }

  /* ============================================================
     Escenario COMBINADO (todos los drivers a la vez)
     Superposición de primer orden: combinado = base + Σ (driver_i − base).
     Cada driver aporta su impacto individual (su curva/analítica real).
     Exacto cuando hay un solo driver ≠ 0; aproxima interacciones cuando
     hay varios. CVU y MP se solapan parcialmente (MP es parte del CVU),
     así que moverlos juntos suma ambos impactos.
     ============================================================ */
  var METRIC_BASE = { cmu: BASE.cmu, resultadoOp: BASE.resultadoOp, van: BASE.van, tir: BASE.tir };

  function deltaOf(deltas, key) { return (deltas && deltas[key]) ? deltas[key] : 0; }

  /* Resultados combinados para un mapa de variaciones { key: pct, ... } */
  function computeCombined(deltas) {
    var out = {
      cmu: METRIC_BASE.cmu, resultadoOp: METRIC_BASE.resultadoOp,
      van: METRIC_BASE.van, tir: METRIC_BASE.tir
    };
    for (var i = 0; i < DRIVERS.length; i++) {
      var key = DRIVERS[i].key, pct = deltaOf(deltas, key);
      if (!pct) continue;
      var r = computeDriver(key, pct);
      out.cmu         += r.cmu - METRIC_BASE.cmu;
      out.resultadoOp += r.resultadoOp - METRIC_BASE.resultadoOp;
      out.van         += r.van - METRIC_BASE.van;
      out.tir         += r.tir - METRIC_BASE.tir;
    }
    return out;
  }

  /* Serie -25..+25 del driver activo con los demás fijos en sus valores guardados.
     Por superposición, equivale a la curva del driver activo desplazada por el
     offset constante de los demás. */
  function seriesCombined(activeKey, deltas) {
    var off = { cmu: 0, resultadoOp: 0, van: 0, tir: 0 };
    for (var i = 0; i < DRIVERS.length; i++) {
      var key = DRIVERS[i].key;
      if (key === activeKey) continue;
      var pct = deltaOf(deltas, key);
      if (!pct) continue;
      var r = computeDriver(key, pct);
      off.cmu += r.cmu - METRIC_BASE.cmu;
      off.resultadoOp += r.resultadoOp - METRIC_BASE.resultadoOp;
      off.van += r.van - METRIC_BASE.van;
      off.tir += r.tir - METRIC_BASE.tir;
    }
    var arr = [];
    for (var v = -25; v <= 25; v++) {
      var c = computeDriver(activeKey, v);
      arr.push({
        deltaPct: v,
        cmu: c.cmu + off.cmu,
        resultadoOp: c.resultadoOp + off.resultadoOp,
        van: c.van + off.van,
        tir: c.tir + off.tir
      });
    }
    return arr;
  }

  /* Punto de quiebre (VAN < 0) del driver activo dentro del escenario combinado */
  function breakevenCombined(activeKey, deltas) {
    var s = seriesCombined(activeKey, deltas);
    for (var i = 1; i < s.length; i++) {
      var a = s[i - 1].van, b = s[i].van;
      if (a === null || b === null) continue;
      if ((a >= 0 && b < 0) || (a < 0 && b >= 0)) {
        var lo = Math.min(s[i - 1].deltaPct, s[i].deltaPct);
        var hi = Math.max(s[i - 1].deltaPct, s[i].deltaPct);
        return "Entre " + lo + "% y " + hi + "%";
      }
    }
    return s[0].van >= 0 && s[s.length - 1].van >= 0
      ? "VAN positivo en todo el rango"
      : "VAN negativo en todo el rango";
  }

  /* Tornado: amplitud de VAN (favorable vs adverso) por driver */
  var TORNADO = DRIVERS.map(function (dr) {
    var hi = Math.max.apply(null, dr.van);
    var lo = Math.min.apply(null, dr.van);
    return {
      key: dr.key, label: dr.label, rank: dr.crit,
      vanFav: hi, vanAdv: lo, vanBase: BASE.van, amplitud: hi - lo
    };
  }).sort(function (a, b) { return a.rank - b.rank; });

  /* Lista liviana de drivers para construir las tabs */
  var DRIVER_LIST = DRIVERS.map(function (dr) {
    return { key: dr.key, label: dr.label, sliderLabel: dr.sliderLabel, unidad: dr.unidad, crit: dr.crit };
  });

  /* ---- Catálogo de casos de aplicación ---- */
  var CASES = [
    /* Primero las que tienen foto */
    { titulo: "Hogares con niños",   tag: "Familia",     desc: "Cuartos y áreas de juego protegidas sin renunciar al diseño.",                              metrica: "Premium asequible", img: "assets/img/lifestyle.webp", alt: "Adulto mayor con bastón y un niño jugando sobre piso de caucho CaucHogar en un patio" },
    { titulo: "Geriátricos",        tag: "Salud",        desc: "Pasillos y habitaciones con amortiguación de impacto para residencias de adultos mayores.", metrica: "Caídas −68%", img: "assets/img/rubber-tile-hero.webp", alt: "Patio de estar con sillones sobre piso de caucho CaucHogar en una residencia" },
    { titulo: "Colegios",            tag: "Educación",    desc: "Patios, gimnasios y zonas de recreo con superficie anti-impacto.",                          metrica: "Norma seguridad", img: "assets/img/playground.webp", alt: "Baldosas de caucho rojas y verdes en un patio de juegos con tobogán" },
    { titulo: "Patios y Decks",        tag: "Hogar",        desc: "Espacios exteriores.",                                 metrica: "Lavable", img: "assets/img/walkway.webp", alt: "Sendero de baldosas de caucho gris en un patio con jardín" },
    { titulo: "Espacios creativos",  tag: "Cultura",      desc: "Para tu Taller o invernadero.",                        metrica: "Modular", img: "assets/img/invernadero.webp", alt: "Invernadero con macetas y banco de trabajo sobre piso de caucho CaucHogar" },
    { titulo: "Terrazas verdes",     tag: "Exterior",     desc: "Pisos sostenibles para balcones y terrazas urbanas.",                                       metrica: "100% reciclado", img: "assets/img/outdoorlounge.webp", alt: "Lounge exterior con sofá y brasero sobre piso de caucho CaucHogar" },
    /* Después las que no tienen foto */
    { titulo: "Guarderías",          tag: "Educación",    desc: "Salas de juego seguras donde los más chicos pueden moverse libremente.",                    metrica: "Lesiones −70%" },
    { titulo: "Gimnasios",           tag: "Deporte",      desc: "Zonas de peso libre y funcional con absorción de vibración y ruido.",                       metrica: "Ruido −40%" },
    { titulo: "Bordes de pileta",    tag: "Hogar",        desc: "Superficie antideslizante para zonas húmedas y solárium.",                                  metrica: "Antideslizante" },
    { titulo: "Centros de rehab.",   tag: "Salud",        desc: "Pisos seguros para terapia y movilidad asistida.",                                          metrica: "Accesible" },
    { titulo: "Coworkings",          tag: "Oficinas",     desc: "Áreas de descanso y break con confort acústico y térmico.",                                 metrica: "ESG ready" },
    { titulo: "Retail construcción", tag: "B2B · Distribución", desc: "Línea premium para corralones y retailers de materiales.",                                  metrica: "Margen alto" }
  ];

  /* ---- Escenarios completos por driver (sheet DRIVERS(1), anexos 1-5) ----
     ff = flujo de fondos del inversor por año 0..10 en M$; van en M$; tir en %.
     Nota: el anexo de materia prima usa su propia base de FF (tal cual la sheet),
     por eso sus trayectorias corren por debajo de las demás. */
  var SCENARIOS = [
    { key: "precio", label: "Precio", rows: [
      { d: -25, ff: [-323, -692, -608, -518, -482, -359, -244, -131, -34, 112, 446], van: -2388, tir: -24.8 },
      { d: -20, ff: [-323, -657, -472, -320, -191, 6, 183, 326, 478, 650, 1042], van: -522, tir: 4.5 },
      { d: -15, ff: [-323, -622, -337, -121, 100, 371, 610, 783, 989, 1187, 1637], van: 1343, tir: 23 },
      { d: -10, ff: [-323, -587, -201, 78, 391, 736, 1036, 1240, 1501, 1725, 2233], van: 3209, tir: 38.2 },
      { d: -5, ff: [-323, -553, -66, 276, 682, 1101, 1463, 1697, 2013, 2262, 2828], van: 5075, tir: 52.1 },
      { d: 0, ff: [-323, -518, 70, 475, 972, 1466, 1890, 2154, 2524, 2799, 3424], van: 6940, tir: 65.2 },
      { d: 5, ff: [-323, -483, 206, 674, 1263, 1831, 2316, 2611, 3036, 3337, 4019], van: 8806, tir: 77.9 },
      { d: 10, ff: [-323, -448, 341, 872, 1554, 2196, 2743, 3068, 3548, 3874, 4615], van: 10672, tir: 90.3 },
      { d: 15, ff: [-323, -413, 477, 1071, 1845, 2561, 3170, 3525, 4059, 4411, 5210], van: 12537, tir: 102.6 },
      { d: 20, ff: [-323, -378, 612, 1270, 2136, 2925, 3596, 3982, 4571, 4949, 5806], van: 14403, tir: 114.7 },
      { d: 25, ff: [-323, -343, 748, 1468, 2427, 3290, 4023, 4440, 5083, 5486, 6401], van: 16269, tir: 126.7 }
    ] },
    { key: "cvu", label: "Costo variable", rows: [
      { d: -25, ff: [-323, -403, 425, 995, 1681, 2321, 2854, 3167, 3515, 3846, 4477], van: 11070, tir: 97.7 },
      { d: -15, ff: [-323, -449, 283, 787, 1398, 1979, 2468, 2762, 3119, 3428, 4056], van: 9418, tir: 84.6 },
      { d: -5, ff: [-323, -495, 141, 579, 1114, 1637, 2082, 2357, 2723, 3009, 3634], van: 7766, tir: 71.6 },
      { d: 0, ff: [-323, -518, 70, 475, 972, 1466, 1890, 2154, 2524, 2799, 3424], van: 6940, tir: 65.2 },
      { d: 5, ff: [-323, -541, -1, 371, 831, 1295, 1697, 1952, 2326, 2590, 3213], van: 6115, tir: 58.8 },
      { d: 15, ff: [-323, -586, -143, 163, 547, 953, 1311, 1546, 1930, 2171, 2792], van: 4463, tir: 45.9 },
      { d: 25, ff: [-323, -632, -285, -45, 264, 610, 926, 1141, 1533, 1752, 2371], van: 2811, tir: 33.1 }
    ] },
    { key: "volumen", label: "Volumen", rows: [
      { d: -25, ff: [-323, -585, -308, -83, 109, 353, 563, 720, 874, 1073, 1403], van: 1178, tir: 22.4 },
      { d: -15, ff: [-323, -558, -157, 140, 455, 798, 1094, 1294, 1534, 1763, 2211], van: 3483, tir: 41.5 },
      { d: -5, ff: [-323, -531, -6, 363, 800, 1243, 1624, 1867, 2194, 2454, 3020], van: 5788, tir: 57.7 },
      { d: 0, ff: [-323, -518, 70, 475, 972, 1466, 1890, 2154, 2524, 2799, 3424], van: 6940, tir: 65.2 },
      { d: 5, ff: [-323, -504, 146, 586, 1145, 1688, 2155, 2441, 2854, 3145, 3828], van: 8093, tir: 72.4 },
      { d: 15, ff: [-323, -477, 297, 810, 1490, 2134, 2686, 3015, 3514, 3835, 4636], van: 10398, tir: 86.4 },
      { d: 25, ff: [-323, -450, 448, 1033, 1835, 2579, 3216, 3589, 4174, 4526, 5444], van: 12703, tir: 99.7 }
    ] },
    { key: "cf", label: "Costos fijos", rows: [
      { d: -25, ff: [-323, -332, 354, 791, 1349, 1906, 2363, 2626, 3036, 3297, 3933], van: 9242, tir: 91 },
      { d: -15, ff: [-323, -406, 241, 664, 1198, 1730, 2174, 2437, 2831, 3098, 3729], van: 8321, tir: 80 },
      { d: -5, ff: [-323, -480, 127, 538, 1048, 1554, 1984, 2249, 2627, 2899, 3526], van: 7401, tir: 69.9 },
      { d: 0, ff: [-323, -518, 70, 475, 972, 1466, 1890, 2154, 2524, 2799, 3424], van: 6940, tir: 65.2 },
      { d: 5, ff: [-323, -555, 13, 412, 897, 1378, 1795, 2060, 2422, 2700, 3322], van: 6480, tir: 60.6 },
      { d: 15, ff: [-323, -629, -100, 285, 747, 1202, 1605, 1871, 2217, 2501, 3118], van: 5560, tir: 52.1 },
      { d: 25, ff: [-323, -704, -214, 159, 596, 1026, 1416, 1683, 2012, 2302, 2915], van: 4639, tir: 44.1 }
    ] },
    { key: "mp", label: "Materia prima", rows: [
      { d: -25, ff: [-319, -497, 120, 542, 575, 603, 760, 855, 979, 1079, 1293], van: 2737, tir: 47.9 },
      { d: -15, ff: [-319, -503, 103, 517, 541, 562, 714, 807, 932, 1029, 1242], van: 2539, tir: 45.7 },
      { d: -5, ff: [-319, -508, 86, 492, 507, 521, 667, 758, 884, 978, 1192], van: 2341, tir: 43.4 },
      { d: 0, ff: [-319, -511, 77, 480, 490, 500, 644, 734, 860, 953, 1166], van: 2242, tir: 42.2 },
      { d: 5, ff: [-319, -513, 69, 467, 473, 480, 621, 710, 837, 928, 1141], van: 2144, tir: 41 },
      { d: 15, ff: [-319, -518, 52, 443, 439, 439, 575, 661, 789, 878, 1091], van: 1946, tir: 38.6 },
      { d: 25, ff: [-319, -524, 35, 418, 405, 398, 529, 613, 742, 828, 1040], van: 1748, tir: 36.1 }
    ] }
  ];

  window.CAUCHO = {
    BASE: BASE,
    drivers: DRIVER_LIST,
    computeDriver: computeDriver,
    seriesDriver: seriesDriver,
    breakeven: breakeven,
    computeCombined: computeCombined,
    seriesCombined: seriesCombined,
    breakevenCombined: breakevenCombined,
    tornado: TORNADO,
    cases: CASES,
    scenarios: SCENARIOS
  };
})();
