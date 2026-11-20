(() => {
  const root = document.getElementById('app');
  if (!root) return;
  const mode = root.dataset.mode;
  const coreApi = root.dataset.coreApi || '';
  const modules = {
    tipos: { label: 'Tipos de proyecto', path: '/tipos-proyecto', fields: [{key:'nombre',label:'Nombre',type:'select',options:['Ensayo','Artículo','Monografía','Trabajo final de pregrado','Trabajo final de especialización']}] },
    clientes: { label: 'Clientes', path: '/clientes', fields: [{key:'nombre',label:'Nombre'},{key:'email',label:'Correo electrónico',type:'email'}] },
    universidades: { label: 'Universidades', path: '/universidades', fields: [{key:'nombre',label:'Nombre'},{key:'direccion',label:'Dirección'},{key:'telefono',label:'Teléfono'}] },
    etapas: { label: 'Etapas', path: '/etapas', fields: [{key:'nombre',label:'Nombre',type:'select',options:['Anteproyecto','Entrega parcial 1','Entrega parcial 2','Entrega final']}] },
    proyectos: { label: 'Proyectos', path: '/proyectos', fields: [
      {key:'numero',label:'Número'},{key:'titulo',label:'Título'},{key:'fechaIniciacion',label:'Fecha de iniciación',type:'date'},
      {key:'fechaEntrega',label:'Fecha de entrega',type:'date'},{key:'valor',label:'Valor (COP)',type:'number'},
      {key:'cliente',label:'Cliente',ref:'/clientes',type:'ref'},{key:'tipoProyecto',label:'Tipo de proyecto',ref:'/tipos-proyecto',type:'ref'},
      {key:'universidad',label:'Universidad',ref:'/universidades',type:'ref'},{key:'etapa',label:'Etapa',ref:'/etapas',type:'ref'}
    ] }
  };
  const visibleKeys = mode === 'core' ? ['tipos','clientes','universidades','etapas'] : mode === 'projects' ? ['proyectos'] : ['tipos','clientes','universidades','etapas','proyectos'];
  const apiFor = (path) => (mode === 'projects' && path !== '/proyectos' ? `${coreApi}${path}` : `/api${path}`);
  let activeKey = visibleKeys[0];
  let editingId = null;
  let referenceCache = {};
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  root.innerHTML = `<nav class="toolbar">${visibleKeys.map(k => `<button class="tab" data-module="${k}">${modules[k].label}</button>`).join('')}</nav><section class="panel"><h2 id="module-title"></h2><form id="record-form"><div class="grid-form" id="form-fields"></div><div class="form-actions"><button class="primary" type="submit" id="save-btn">Guardar</button><button class="secondary" type="button" id="cancel-btn" hidden>Cancelar edición</button></div></form><div class="notice" id="notice" role="status"></div><div class="table-wrap" id="records"></div></section>`;

  const title = root.querySelector('#module-title');
  const fields = root.querySelector('#form-fields');
  const form = root.querySelector('#record-form');
  const table = root.querySelector('#records');
  const notice = root.querySelector('#notice');
  const cancelBtn = root.querySelector('#cancel-btn');

  async function request(url, options = {}) {
    const response = await fetch(url, { headers: {'Content-Type':'application/json', ...(options.headers || {})}, ...options });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Error HTTP ${response.status}`);
    return payload;
  }
  async function getOptions(field) {
    const url = apiFor(field.ref);
    if (!referenceCache[url]) referenceCache[url] = (await request(url)).datos || [];
    return referenceCache[url];
  }
  async function drawForm() {
    const module = modules[activeKey];
    fields.innerHTML = '';
    for (const field of module.fields) {
      const wrapper = document.createElement('div'); wrapper.className = 'field';
      const label = document.createElement('label'); label.textContent = field.label; label.htmlFor = `field-${field.key}`;
      let control;
      if (field.type === 'select' || field.type === 'ref') {
        control = document.createElement('select');
        const options = field.type === 'ref' ? await getOptions(field) : field.options.map((nombre) => ({_id:nombre,nombre}));
        control.innerHTML = `<option value="">Selecciona...</option>` + options.map(o => `<option value="${esc(o._id)}">${esc(o.nombre)}</option>`).join('');
      } else {
        control = document.createElement('input'); control.type = field.type || 'text';
      }
      control.id = `field-${field.key}`; control.name = field.key; control.required = true;
      if (field.type === 'number') { control.min = '0'; control.step = '0.01'; }
      wrapper.append(label, control); fields.append(wrapper);
    }
  }
  function displayValue(row, key) {
    const value = row[key];
    if (value && typeof value === 'object') return value.nombre || value._id || '';
    if (key === 'valor') return Number(value).toLocaleString('es-CO');
    if (key.toLowerCase().includes('fecha') && value) return new Date(value).toLocaleDateString('es-CO');
    return value ?? '';
  }
  async function loadRows() {
    const module = modules[activeKey];
    const result = await request(apiFor(module.path));
    const rows = result.datos || [];
    const columns = module.fields.map(f => f.key);
    if (!rows.length) { table.innerHTML = '<div class="empty">No hay registros todavía. Crea el primero con el formulario.</div>'; return; }
    table.innerHTML = `<table><thead><tr>${columns.map(key => `<th>${modules[activeKey].fields.find(f=>f.key===key).label}</th>`).join('')}<th>Acciones</th></tr></thead><tbody>${rows.map(row => `<tr>${columns.map(key => `<td>${esc(displayValue(row,key))}</td>`).join('')}<td><button class="secondary" data-edit="${esc(row._id)}">Editar</button></td></tr>`).join('')}</tbody></table>`;
    table.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => beginEdit(rows.find(r => r._id === btn.dataset.edit))));
  }
  async function renderModule() {
    title.textContent = modules[activeKey].label;
    root.querySelectorAll('[data-module]').forEach(btn => btn.classList.toggle('active', btn.dataset.module === activeKey));
    notice.textContent = ''; editingId = null; form.reset(); cancelBtn.hidden = true;
    await drawForm(); await loadRows();
  }
  async function beginEdit(row) {
    editingId = row._id; cancelBtn.hidden = false;
    for (const field of modules[activeKey].fields) {
      const control = form.elements[field.key];
      const value = row[field.key];
      control.value = value && typeof value === 'object' ? value._id : (value ?? '').toString().slice(0,10);
    }
    notice.textContent = `Editando registro ${row._id}`;
    root.querySelector('#save-btn').textContent = 'Actualizar';
    window.scrollTo({top:0,behavior:'smooth'});
  }
  root.querySelectorAll('[data-module]').forEach(btn => btn.addEventListener('click', async () => { activeKey = btn.dataset.module; referenceCache = {}; await renderModule(); }));
  cancelBtn.addEventListener('click', async () => { editingId = null; form.reset(); cancelBtn.hidden = true; root.querySelector('#save-btn').textContent = 'Guardar'; notice.textContent = ''; });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    if (payload.valor !== undefined) payload.valor = Number(payload.valor);
    try {
      const path = `${apiFor(modules[activeKey].path)}${editingId ? `/${editingId}` : ''}`;
      const result = await request(path, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      notice.textContent = result.mensaje || 'Operación completada.';
      editingId = null; form.reset(); cancelBtn.hidden = true; root.querySelector('#save-btn').textContent = 'Guardar';
      referenceCache = {}; await loadRows();
    } catch (error) { notice.textContent = error.message; }
  });
  renderModule().catch(error => { notice.textContent = error.message; });
})();
