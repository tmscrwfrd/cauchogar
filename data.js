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

  /* Interpolación lineal sobre las anclas; null = no modelado (n/a) */
  function lerp(pts, pct) {
    if (pct <= PCTS[0]) return pts[0];
    if (pct >= PCTS[PCTS.length - 1]) return pts[pts.length - 1];
    for (var i = 0; i < PCTS.length - 1; i++) {
      if (pct >= PCTS[i] && pct <= PCTS[i + 1]) {
        var a = pts[i], b = pts[i + 1];
        if (a === null || b === null) return null;
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
      tir: lerp(dr.tir, pct)     // % o null
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

  /* ---- Catálogo de casos de aplicación (scroll infinito) ---- */
  var CASES = [
    { titulo: "Geriátricos",        tag: "B2B · Salud",        desc: "Pasillos y habitaciones con amortiguación de impacto para residencias de adultos mayores.", metrica: "Caídas −68%", img: "assets/img/lifestyle.jpg", alt: "Adulto mayor con bastón y un niño jugando sobre piso de caucho CaucHogar en un patio" },
    { titulo: "Guarderías",          tag: "B2B · Educación",    desc: "Salas de juego seguras donde los más chicos pueden moverse libremente.",                    metrica: "Lesiones −70%" },
    { titulo: "Hogares con niños",   tag: "B2C · Familias",     desc: "Cuartos y áreas de juego protegidas sin renunciar al diseño.",                              metrica: "Premium asequible" },
    { titulo: "Colegios",            tag: "B2B · Educación",    desc: "Patios, gimnasios y zonas de recreo con superficie anti-impacto.",                          metrica: "Norma seguridad" },
    { titulo: "Gimnasios",           tag: "B2B · Deporte",      desc: "Zonas de peso libre y funcional con absorción de vibración y ruido.",                       metrica: "Ruido −40%" },
    { titulo: "Bordes de pileta",    tag: "B2C · Hogar",        desc: "Superficie antideslizante para zonas húmedas y solárium.",                                  metrica: "Antideslizante" },
    { titulo: "Centros de rehab.",   tag: "B2B · Salud",        desc: "Pisos seguros para terapia y movilidad asistida.",                                          metrica: "Accesible" },
    { titulo: "Coworkings",          tag: "B2B · Oficinas",     desc: "Áreas de descanso y break con confort acústico y térmico.",                                 metrica: "ESG ready" },
    { titulo: "Pet-friendly",        tag: "B2C · Hogar",        desc: "Espacios para mascotas, fáciles de limpiar y resistentes.",                                 metrica: "Lavable" },
    { titulo: "Espacios creativos",  tag: "B2B · Cultura",      desc: "Talleres y salas de arte donde la seguridad acompaña la actividad.",                        metrica: "Modular" },
    { titulo: "Retail construcción", tag: "B2B · Distribución", desc: "Línea premium para corralones y retailers de materiales.",                                  metrica: "Margen alto" },
    { titulo: "Terrazas verdes",     tag: "B2C · Exterior",     desc: "Pisos sostenibles para balcones y terrazas urbanas.",                                       metrica: "100% reciclado", img: "assets/img/outdoorlounge.jpg", alt: "Lounge exterior con sofá y brasero sobre piso de caucho CaucHogar" }
  ];

  window.CAUCHO = {
    BASE: BASE,
    drivers: DRIVER_LIST,
    computeDriver: computeDriver,
    seriesDriver: seriesDriver,
    breakeven: breakeven,
    tornado: TORNADO,
    cases: CASES
  };
})();
