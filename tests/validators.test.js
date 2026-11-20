const test = require('node:test');
const assert = require('node:assert/strict');
const { validateProjectDates, validateProjectPayload, TIPOS_PROYECTO, ETAPAS } = require('../src/validators');

test('catalogos contienen los tipos de proyecto definidos en el caso', () => {
  assert.equal(TIPOS_PROYECTO.length, 5);
  assert.ok(TIPOS_PROYECTO.includes('Monografía'));
});

test('catalogo de etapas contiene las cuatro etapas requeridas', () => {
  assert.deepEqual(ETAPAS, ['Anteproyecto', 'Entrega parcial 1', 'Entrega parcial 2', 'Entrega final']);
});

test('acepta intervalo de fechas valido', () => {
  assert.equal(validateProjectDates('2026-01-01', '2026-02-01'), null);
});

test('rechaza entrega anterior a la iniciacion', () => {
  assert.match(validateProjectDates('2026-02-01', '2026-01-01'), /no puede ser anterior/);
});

test('rechaza fechas invalidas', () => {
  assert.match(validateProjectDates('fecha', '2026-01-01'), /no es valida/);
});

test('valida campos obligatorios del proyecto', () => {
  assert.match(validateProjectPayload({numero:'P-01'}), /Faltan campos obligatorios/);
});

test('rechaza valor negativo', () => {
  const payload = {numero:'P-01',titulo:'Proyecto',fechaIniciacion:'2026-01-01',fechaEntrega:'2026-02-01',valor:-1,cliente:'a',tipoProyecto:'b',universidad:'c',etapa:'d'};
  assert.match(validateProjectPayload(payload), /mayor o igual a cero/);
});

test('acepta un proyecto con todos los campos y fechas validas', () => {
  const payload = {numero:'P-01',titulo:'Asesoria',fechaIniciacion:'2026-01-01',fechaEntrega:'2026-02-01',valor:250000,cliente:'a',tipoProyecto:'b',universidad:'c',etapa:'d'};
  assert.equal(validateProjectPayload(payload), null);
});
