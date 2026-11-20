# Analisis funcional para seleccionar el componente a desacoplar

## Alcance y limitacion de los datos

El caso de estudio describe cinco modulos, pero no incluye datos de usuarios, trazas, cantidades de solicitudes, mediciones de CPU/memoria ni tiempos de respuesta. No es posible demostrar una demanda real mediante estadistica con la informacion suministrada.

## Criterios cualitativos

| Criterio | Tipos | Clientes | Universidades | Etapas | Proyectos |
|---|---|---|---|---|---|
| Centralidad dentro del proceso de asesoria | Media | Alta | Alta | Alta | Muy alta |
| Numero de relaciones principales | Baja | Media | Media | Baja | Alta |
| Operaciones durante el ciclo de una asesoria | Baja | Media | Media | Baja | Alta |
| Necesidad de evolucion independiente | Media | Media | Media | Baja | Alta |

## Seleccion

Se selecciona **Proyectos** como componente candidato para desacoplar. El proyecto representa cada asesoria, contiene sus fechas, valor y numero unico, y referencia cliente, tipo, universidad y etapa. Por ello agrupa datos de los cuatro catalogos y participa en el flujo central de negocio.

Esta seleccion es una inferencia de arquitectura a partir del modelo funcional, no el resultado de una medicion de carga. En una implantacion real se deberian recoger por modulo: solicitudes por minuto, usuarios concurrentes, latencia p95, tasa de error, consumo de CPU/memoria y frecuencia de cambios. La decision se confirmaria si el modulo Proyectos concentra mayor volumen o necesita escalar con independencia.
