const mongoose = require('mongoose');

const timestampOptions = { timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } };

const tipoProyectoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, enum: [
    'Ensayo', 'Artículo', 'Monografía', 'Trabajo final de pregrado', 'Trabajo final de especialización'
  ] }
}, timestampOptions);

const clienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
}, timestampOptions);

const universidadSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 160 },
  direccion: { type: String, required: true, trim: true, maxlength: 240 },
  telefono: { type: String, required: true, trim: true, maxlength: 40 }
}, timestampOptions);

const etapaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, enum: [
    'Anteproyecto', 'Entrega parcial 1', 'Entrega parcial 2', 'Entrega final'
  ] }
}, timestampOptions);

const proyectoSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true, trim: true, maxlength: 40 },
  titulo: { type: String, required: true, trim: true, maxlength: 240 },
  fechaIniciacion: { type: Date, required: true },
  fechaEntrega: { type: Date, required: true },
  valor: { type: Number, required: true, min: 0 },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  tipoProyecto: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoProyecto', required: true },
  universidad: { type: mongoose.Schema.Types.ObjectId, ref: 'Universidad', required: true },
  etapa: { type: mongoose.Schema.Types.ObjectId, ref: 'Etapa', required: true }
}, timestampOptions);

proyectoSchema.pre('validate', function validateDateOrder(next) {
  if (this.fechaIniciacion && this.fechaEntrega && this.fechaEntrega < this.fechaIniciacion) {
    this.invalidate('fechaEntrega', 'La fecha de entrega no puede ser anterior a la fecha de iniciacion.');
  }
  next();
});

function model(name, schema) {
  return mongoose.models[name] || mongoose.model(name, schema);
}

module.exports = {
  TipoProyecto: model('TipoProyecto', tipoProyectoSchema),
  Cliente: model('Cliente', clienteSchema),
  Universidad: model('Universidad', universidadSchema),
  Etapa: model('Etapa', etapaSchema),
  Proyecto: model('Proyecto', proyectoSchema)
};
