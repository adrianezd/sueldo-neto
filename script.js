// Calculadora de sueldo neto 2026 (estimación con la escala general).
var SS_TRABAJADOR = 0.065;
var SS_EMPRESA = 0.3215;
var BASE_MAX_ANUAL = 5101.20 * 12;
var SMI_ANUAL = 16576;
var ESCALA = [[12450, 0.19], [20200, 0.24], [35200, 0.30], [60000, 0.37], [300000, 0.45], [Infinity, 0.47]];

function cuotaEscala(base) {
  var cuota = 0, desde = 0;
  for (var i = 0; i < ESCALA.length && base > desde; i++) {
    cuota += (Math.min(base, ESCALA[i][0]) - desde) * ESCALA[i][1];
    desde = ESCALA[i][0];
  }
  return cuota;
}

function reduccionTrabajo(rn) {
  if (rn <= 14852) return 7302;
  if (rn <= 17673.52) return 7302 - 1.75 * (rn - 14852);
  if (rn <= 19747.5) return 2364.34 - 1.14 * (rn - 17673.52);
  return 0;
}

function calcular(bruto, hijos, peques, mayor) {
  var ss = Math.min(bruto, BASE_MAX_ANUAL) * SS_TRABAJADOR;
  var empresa = Math.min(bruto, BASE_MAX_ANUAL) * SS_EMPRESA;
  var rn = Math.max(0, bruto - ss - 2000);
  var base = Math.max(0, rn - reduccionTrabajo(rn));
  var minimo = 5550 + (mayor ? 1150 : 0);
  var porHijo = [2400, 2700, 4000, 4500];
  for (var i = 0; i < hijos; i++) minimo += porHijo[Math.min(i, 3)];
  minimo += 2800 * Math.min(peques, hijos);
  var irpf = Math.max(0, cuotaEscala(base) - cuotaEscala(Math.min(minimo, base)));
  // Deducción por salario mínimo: exento hasta el SMI y se va retirando hasta SMI + 1.700 €.
  if (bruto <= SMI_ANUAL) irpf = 0;
  else irpf = Math.max(0, irpf - Math.max(0, 340 - 0.2 * (bruto - SMI_ANUAL)));
  return { ss: ss, irpf: irpf, neto: bruto - ss - irpf, empresa: empresa, coste: bruto + empresa };
}

function eur(v, dec) {
  return v.toLocaleString('es-ES', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }) + ' €';
}

var ultimo = null;
function pintar() {
  var bruto = Math.max(0, +document.getElementById('bruto').value || 0);
  var pagas = +document.getElementById('pagas').value;
  var hijos = +document.getElementById('hijos').value;
  var peques = +document.getElementById('peques').value;
  var r = calcular(bruto, hijos, peques, document.getElementById('mayor').checked);
  ultimo = { bruto: bruto, r: r, pagas: pagas };

  document.getElementById('mes').textContent = eur(r.neto / pagas);
  document.getElementById('anual').textContent = eur(r.neto) + ' netos al año en ' + pagas + ' pagas';
  var total = r.coste || 1;
  var partes = [['Para ti', r.neto, 'neto'], ['IRPF', r.irpf, 'irpf'], ['Seguridad Social', r.ss + r.empresa, 'ss']];
  document.getElementById('barra').innerHTML = partes.map(function (p) {
    return '<div style="width:' + (p[1] / total * 100) + '%;background:var(--' + p[2] + ')"></div>';
  }).join('');
  document.getElementById('leyenda').innerHTML = partes.map(function (p) {
    return '<li><i style="background:var(--' + p[2] + ')"></i>' + p[0] + ' ' + eur(p[1]) + '</li>';
  }).join('');

  document.getElementById('tipo').textContent = bruto ? (r.irpf / bruto * 100).toFixed(1).replace('.', ',') + ' %' : '–';
  document.getElementById('empresa').textContent = eur(r.coste);
  var dia = bruto ? Math.round((r.ss + r.irpf) / bruto * 365) : 0;
  var fecha = new Date(2026, 0, 1 + dia);
  ultimo.fecha = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  document.getElementById('libre').textContent = ultimo.fecha;

  var porCien = bruto ? Math.round(r.neto / r.coste * 100) : 0;
  document.getElementById('frase').innerHTML = bruto
    ? 'Tu empresa gasta <b>' + eur(r.coste) + '</b> en ti y a tu bolsillo llegan <b>' + eur(r.neto) + '</b>. De cada 100 € que cuestas, te quedas <b>' + porCien + '</b>.'
    : '';
}

function compartir() {
  if (!ultimo || !ultimo.bruto) return;
  var txt = '💶 Hasta el ' + ultimo.fecha + ' trabajo para pagar IRPF y Seguridad Social. De cada 100 € que cuesto a mi empresa me quedo ' +
    Math.round(ultimo.r.neto / ultimo.r.coste * 100) + '. ¿Y tú?\n' + location.href;
  if (navigator.share) navigator.share({ text: txt }).catch(function () {});
  else navigator.clipboard.writeText(txt).then(function () { document.getElementById('compartir').textContent = 'Copiado'; });
}

['bruto', 'pagas', 'hijos', 'peques', 'mayor'].forEach(function (id) {
  document.getElementById(id).addEventListener('input', pintar);
});
document.getElementById('compartir').addEventListener('click', compartir);
pintar();
