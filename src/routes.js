const express = require('express');
const mongoose = require('mongoose');
const { validateProjectPayload } = require('./validators');

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function createCatalogRouter(Model, label) {
  const router = express.Router();
  router.get('/', asyncRoute(async (_req, res) => {
    const items = await Model.find().sort({ nombre: 1 }).lean();
    res.json({ total: items.length, datos: items });
  }));
  router.post('/', asyncRoute(async (req, res) => {
    const item = await Model.create(req.body);
    res.status(201).json({ mensaje: `${label} creado correctamente.`, dato: item });
  }));
  router.put('/:id', asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Identificador no valido.' });
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: `${label} no encontrado.` });
    res.json({ mensaje: `${label} actualizado correctamente.`, dato: item });
  }));
  return router;
}

function createProjectRouter(models) {
  const router = express.Router();
  const { Proyecto, Cliente, TipoProyecto, Universidad, Etapa } = models;
  const populate = [
    { path: 'cliente', select: 'nombre email' },
    { path: 'tipoProyecto', select: 'nombre' },
    { path: 'universidad', select: 'nombre' },
    { path: 'etapa', select: 'nombre' }
  ];
  router.get('/', asyncRoute(async (_req, res) => {
    const rows = await Proyecto.find().populate(populate).sort({ fechaCreacion: -1 }).lean();
    res.json({ total: rows.length, datos: rows });
  }));
  router.post('/', asyncRoute(async (req, res) => {
    const validation = validateProjectPayload(req.body);
    if (validation) return res.status(400).json({ error: validation });
    const refs = await Promise.all([
      Cliente.exists({ _id: req.body.cliente }),
      TipoProyecto.exists({ _id: req.body.tipoProyecto }),
      Universidad.exists({ _id: req.body.universidad }),
      Etapa.exists({ _id: req.body.etapa })
    ]);
    if (refs.some((value) => !value)) return res.status(400).json({ error: 'Verifica que cliente, tipo de proyecto, universidad y etapa existan.' });
    const project = await Proyecto.create(req.body);
    const saved = await Proyecto.findById(project._id).populate(populate);
    res.status(201).json({ mensaje: 'Proyecto creado correctamente.', dato: saved });
  }));
  router.put('/:id', asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Identificador no valido.' });
    const current = await Proyecto.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Proyecto no encontrado.' });
    const candidate = { ...current.toObject(), ...req.body };
    const validation = validateProjectPayload(candidate);
    if (validation) return res.status(400).json({ error: validation });
    const updated = await Proyecto.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(populate);
    res.json({ mensaje: 'Proyecto actualizado correctamente.', dato: updated });
  }));
  return router;
}

function attachRoutes(app, mode, models) {
  const { TipoProyecto, Cliente, Universidad, Etapa } = models;
  const core = [
    ['/api/tipos-proyecto', TipoProyecto, 'Tipo de proyecto'],
    ['/api/clientes', Cliente, 'Cliente'],
    ['/api/universidades', Universidad, 'Universidad'],
    ['/api/etapas', Etapa, 'Etapa']
  ];
  if (mode === 'monolith' || mode === 'core') {
    for (const [path, model, label] of core) app.use(path, createCatalogRouter(model, label));
  }
  if (mode === 'monolith' || mode === 'projects') app.use('/api/proyectos', createProjectRouter(models));
}

module.exports = { attachRoutes };
