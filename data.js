/* =========================================================
   CauchoHogar — Datos del modelo
   Expone window.CAUCHO con el modelo financiero (para el
   dashboard de sensibilidad) y el catálogo de casos de uso
   (para la sección de scroll infinito).

   NOTA: el modelo es una simplificación lineal anclada a los
   valores base del pitch, pensada para ilustrar la sensibilidad
   al precio. No reemplaza el modelo financiero completo.
   ========================================================= */
(function () {
  "use strict";

  /* ---- Valores base (Año 7 / proyecto a 10 años) ---- */
  var BASE = {
    precio:        58734,        // $/m² precio promedio ponderado
    costoVar:      38330,        // $/m² costo variable unitario
    volumenAnual:  155184,       // m²/año (12.932 m²/mes)
    costosFijos:   1881.8e6,     // $ costos fijos anuales (derivado: leverage 2.47x)
    van:           2246.7,       // M$  VAN base (descontado al 10.2%)
    tir:           42.2,         // %   TIR base
    // sensibilidades (pendientes del modelo lineal)
    kVan:          31902,        // M$ de VAN por unidad de variación de precio (Δ fracción)
    kTir:          250           // puntos % de TIR por unidad de Δ
  };
  BASE.cmu = BASE.precio - BASE.costoVar;                       // 20.404 $/m²
  BASE.resultadoOp = (BASE.cmu * BASE.volumenAnual - BASE.costosFijos) / 1e6; // M$

  /* Calcula todos los outputs para una variación de precio (delta en %, ej -10..25) */
  function compute(deltaPct) {
    var d = deltaPct / 100;
    var precio = BASE.precio * (1 + d);
    var cmu = precio - BASE.costoVar;
    var resultadoOp = (cmu * BASE.volumenAnual - BASE.costosFijos) / 1e6; // M$
    var van = BASE.van + BASE.kVan * d;                                   // M$
    var tir = BASE.tir + BASE.kTir * d;                                   // %
    return { deltaPct: deltaPct, precio: precio, cmu: cmu, resultadoOp: resultadoOp, van: van, tir: tir };
  }

  /* Serie completa -25..+25 para dibujar las mini-gráficas */
  function series() {
    var out = [];
    for (var v = -25; v <= 25; v++) out.push(compute(v));
    return out;
  }

  /* ---- Catálogo de casos de aplicación (scroll infinito) ---- */
  var CASES = [
    { emoji: "🏥", titulo: "Geriátricos",        tag: "B2B · Salud",        desc: "Pasillos y habitaciones con amortiguación de impacto para residencias de adultos mayores.", metrica: "Caídas −68%" },
    { emoji: "🧒", titulo: "Guarderías",          tag: "B2B · Educación",    desc: "Salas de juego seguras donde los más chicos pueden moverse libremente.",                    metrica: "Lesiones −70%" },
    { emoji: "🏠", titulo: "Hogares con niños",   tag: "B2C · Familias",     desc: "Cuartos y áreas de juego protegidas sin renunciar al diseño.",                              metrica: "Premium asequible" },
    { emoji: "🏫", titulo: "Colegios",            tag: "B2B · Educación",    desc: "Patios, gimnasios y zonas de recreo con superficie anti-impacto.",                          metrica: "Norma seguridad ✓" },
    { emoji: "🏋️", titulo: "Gimnasios",           tag: "B2B · Deporte",      desc: "Zonas de peso libre y funcional con absorción de vibración y ruido.",                       metrica: "Ruido −40%" },
    { emoji: "🏊", titulo: "Bordes de pileta",    tag: "B2C · Hogar",        desc: "Superficie antideslizante para zonas húmedas y solárium.",                                  metrica: "Antideslizante" },
    { emoji: "🦽", titulo: "Centros de rehab.",   tag: "B2B · Salud",        desc: "Pisos seguros para terapia y movilidad asistida.",                                          metrica: "Accesible" },
    { emoji: "🏢", titulo: "Coworkings",          tag: "B2B · Oficinas",     desc: "Áreas de descanso y break con confort acústico y térmico.",                                 metrica: "ESG ready" },
    { emoji: "🐶", titulo: "Pet-friendly",        tag: "B2C · Hogar",        desc: "Espacios para mascotas, fáciles de limpiar y resistentes.",                                 metrica: "Lavable" },
    { emoji: "🎨", titulo: "Espacios creativos",  tag: "B2B · Cultura",      desc: "Talleres y salas de arte donde la seguridad acompaña la actividad.",                        metrica: "Modular" },
    { emoji: "🏬", titulo: "Retail construcción", tag: "B2B · Distribución", desc: "Línea premium para corralones y retailers de materiales.",                                  metrica: "Margen alto" },
    { emoji: "🌿", titulo: "Terrazas verdes",     tag: "B2C · Exterior",     desc: "Pisos sostenibles para balcones y terrazas urbanas.",                                       metrica: "100% reciclado" }
  ];

  window.CAUCHO = {
    BASE: BASE,
    compute: compute,
    series: series,
    cases: CASES
  };
})();
