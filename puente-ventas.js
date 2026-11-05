/**
 * Puente para GitHub Pages.
 * Imita google.script.run usando fetch hacia el web app de Apps Script,
 * así index.html funciona sin cambiar su lógica ni su diseño.
 *
 * ÚNICO PASO MANUAL: pega abajo la URL de tu implementación (la que termina en /exec).
 */
(function () {
  'use strict';

  var API_URL = 'https://script.google.com/macros/s/AKfycbzto1ZYZLPVXCmQuWVPebdiRh_xokyVzUK0-nmCsQ6Gsx7a2bGYFDJhPBexhpW1Wy9msA/exec';

  // Si la página corre dentro de Apps Script, no hace falta el puente.
  if (window.google && window.google.script && window.google.script.run) return;

  var FUNCIONES = ['needsPin', 'getData', 'syncHoy', 'syncNow', 'syncRango', 'importarDoorDash',
    'listarImportaciones', 'borrarImportacion', 'guardarEquiv', 'guardarEquivVarios'];

  function llamar(fn, args) {
    if (API_URL.indexOf('PEGA_AQUI') === 0) {
      return Promise.reject(new Error('Falta pegar la URL de Apps Script en puente-ventas.js'));
    }
    return fetch(API_URL, {
      method: 'POST',
      // text/plain evita la consulta previa de CORS, que Apps Script no responde
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      credentials: 'omit',
      redirect: 'follow',
      body: JSON.stringify({ fn: fn, args: args })
    })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        var j;
        try { j = JSON.parse(t); }
        catch (e) { throw new Error('El servidor no respondió con datos. Revisa que la implementación sea "Cualquier persona" y que la URL termine en /exec.'); }
        if (!j.ok) throw new Error(j.error || 'Error del servidor');
        return j.data;
      });
  }

  function cadena(ok, fail) {
    var c = {
      withSuccessHandler: function (f) { return cadena(f, fail); },
      withFailureHandler: function (f) { return cadena(ok, f); }
    };
    FUNCIONES.forEach(function (fn) {
      c[fn] = function () {
        var args = Array.prototype.slice.call(arguments);
        llamar(fn, args).then(
          function (d) { if (ok) ok(d); },
          function (e) { if (fail) fail(e); }
        );
      };
    });
    return c;
  }

  window.google = window.google || {};
  window.google.script = { run: cadena(null, null) };
})();
