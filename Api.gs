/**
 * Api.gs: puerta de entrada para la página que vive en GitHub Pages.
 * Archivo NUEVO. No se modifica Code.gs.
 *
 * La página manda { fn, args } por POST y aquí solo se permiten las funciones de la lista.
 * El PIN se sigue validando dentro de cada función (checkPin_), igual que antes.
 */

function API_FUNCIONES_() {
  // Se arma en cada llamada para evitar problemas de orden de carga entre archivos.
  return {
    needsPin: needsPin,
    getData: getData,
    syncHoy: syncHoy,
    syncNow: syncNow,
    syncRango: syncRango,
    importarDoorDash: importarDoorDash,
    listarImportaciones: listarImportaciones,
    borrarImportacion: borrarImportacion,
    guardarEquiv: guardarEquiv,
    guardarEquivVarios: guardarEquivVarios
  };
}

// Como la dirección de esta API queda visible en un repositorio público, se frenan los intentos de PIN:
// 8 PIN incorrectos seguidos bloquean el acceso 10 minutos (para todos).
var MAX_FALLOS_ = 8;
var BLOQUEO_SEG_ = 600;

function respuesta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var fn = String(req.fn || '');
    var args = Array.isArray(req.args) ? req.args : [];
    var tabla = API_FUNCIONES_();
    if (!Object.prototype.hasOwnProperty.call(tabla, fn)) throw new Error('Función no permitida: ' + fn);

    var cache = CacheService.getScriptCache();
    if (fn !== 'needsPin' && cache.get('bloqueo')) {
      throw new Error('PIN_BLOQUEADO: demasiados intentos. Espera 10 minutos.');
    }

    var data;
    try {
      data = tabla[fn].apply(null, args);
    } catch (err) {
      if (String(err && err.message).indexOf('PIN_INCORRECTO') >= 0) {
        var fallos = Number(cache.get('fallos') || 0) + 1;
        cache.put('fallos', String(fallos), BLOQUEO_SEG_);
        if (fallos >= MAX_FALLOS_) cache.put('bloqueo', '1', BLOQUEO_SEG_);
      }
      throw err;
    }
    if (fn !== 'needsPin') cache.remove('fallos');
    return respuesta_({ ok: true, data: data === undefined ? null : data });
  } catch (err) {
    return respuesta_({ ok: false, error: String((err && err.message) || err) });
  }
}
