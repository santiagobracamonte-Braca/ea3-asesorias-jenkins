const path = require('node:path');
const express = require('express');
const mongoose = require('mongoose');
const models = require('./models');
const { attachRoutes } = require('./routes');
const { TIPOS_PROYECTO, ETAPAS } = require('./validators');

const mode = process.argv[2] || process.env.APP_MODE || 'monolith';
const PORT = Number(process.env.PORT || (mode === 'projects' ? 3001 : 3000));
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/iudigital_asesorias';
const publicDir = path.join(__dirname, '..', 'public');

const pageForMode = {
  monolith: 'monolith.html',
  core: 'core.html',
  projects: 'projects.html'
};

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && /^http:\/\/localhost:(3000|3001|3002)$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static(publicDir));
app.get('/health', (_req, res) => res.json({ status: 'ok', servicio: mode, baseDatos: mongoose.connection.readyState === 1 ? 'conectada' : 'conectando' }));
app.get('/', (_req, res) => res.sendFile(path.join(publicDir, pageForMode[mode] || pageForMode.monolith)));
attachRoutes(app, mode, models);
app.use((err, _req, res, _next) => {
  if (err && err.code === 11000) return res.status(409).json({ error: 'Ya existe un registro con ese numero o dato unico.' });
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ error: Object.values(err.errors).map((item) => item.message).join(' ') });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

async function seedCatalogs() {
  const [typeCount, stageCount] = await Promise.all([models.TipoProyecto.countDocuments(), models.Etapa.countDocuments()]);
  if (typeCount === 0) await models.TipoProyecto.insertMany(TIPOS_PROYECTO.map((nombre) => ({ nombre })));
  if (stageCount === 0) await models.Etapa.insertMany(ETAPAS.map((nombre) => ({ nombre })));
}

async function start() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  if (mode === 'monolith' || mode === 'core') await seedCatalogs();
  app.listen(PORT, '0.0.0.0', () => console.log(`Servicio ${mode} escuchando en puerto ${PORT}`));
}

start().catch((error) => {
  console.error('No fue posible iniciar el servicio:', error.message);
  process.exit(1);
});
