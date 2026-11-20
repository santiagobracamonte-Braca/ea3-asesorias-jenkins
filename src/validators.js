const TIPOS_PROYECTO = [
  'Ensayo', 'Artículo', 'Monografía', 'Trabajo final de pregrado', 'Trabajo final de especialización'
];
const ETAPAS = ['Anteproyecto', 'Entrega parcial 1', 'Entrega parcial 2', 'Entrega final'];

function validateProjectDates(startDate, deliveryDate) {
  const start = new Date(startDate);
  const end = new Date(deliveryDate);
  if (!startDate || Number.isNaN(start.getTime())) return 'La fecha de iniciacion no es valida.';
  if (!deliveryDate || Number.isNaN(end.getTime())) return 'La fecha de entrega no es valida.';
  if (end < start) return 'La fecha de entrega no puede ser anterior a la fecha de iniciacion.';
  return null;
}

function validateProjectPayload(payload = {}) {
  const required = ['numero', 'titulo', 'fechaIniciacion', 'fechaEntrega', 'valor', 'cliente', 'tipoProyecto', 'universidad', 'etapa'];
  const missing = required.filter((key) => payload[key] === undefined || payload[key] === null || String(payload[key]).trim() === '');
  if (missing.length) return `Faltan campos obligatorios: ${missing.join(', ')}.`;
  const amount = Number(payload.valor);
  if (!Number.isFinite(amount) || amount < 0) return 'El valor debe ser un numero mayor o igual a cero.';
  return validateProjectDates(payload.fechaIniciacion, payload.fechaEntrega);
}

module.exports = { TIPOS_PROYECTO, ETAPAS, validateProjectDates, validateProjectPayload };
