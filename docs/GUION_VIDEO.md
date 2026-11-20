# Guion de sustentacion individual - EA3 Jenkins

**Duracion sugerida:** 2 a 3 minutos. Graba despues de que Jenkins haya ejecutado correctamente el Job y de que los dos despliegues esten comprobados. Ajusta los verbos al resultado real.

## Guion

Hola, mi nombre es Santiago Bracamonte Suárez y voy a presentar la actividad EA3 de Tecnologías Web, sobre automatización usando Jenkins.

El caso de estudio propone un sistema para administrar asesorías académicas. La aplicación monolítica fue construida con Node.js y MongoDB e integra cinco módulos: tipos de proyecto, clientes, universidades, etapas y proyectos. Cada proyecto almacena un número único, título, fechas, valor y las relaciones con los catálogos.

Después de revisar la estructura funcional, seleccioné el módulo de proyectos para desacoplarlo. Es el componente que representa cada asesoría y concentra las relaciones con los demás módulos. Esta selección es un análisis cualitativo de arquitectura, porque el caso de estudio no entrega métricas reales de tráfico o concurrencia.

En la segunda arquitectura, los catálogos permanecen en el servicio central y la gestión de proyectos se ejecuta en un microservicio independiente. Docker Compose permite levantar los contenedores y MongoDB de cada despliegue.

Para automatizar el proceso configuré Jenkins con el Job EA3-Asesorias-CD. El pipeline obtiene el código desde Git, ejecuta las pruebas, construye las imágenes Docker, publica las imágenes en Docker Hub cuando se habilita esa opción, despliega la arquitectura seleccionada y verifica los endpoints de salud.

La interfaz de Jenkins está disponible en el puerto 8090. La aplicación monolítica y el servicio central utilizan el puerto 3002 en Windows (puerto interno 3000), mientras que el microservicio de proyectos utiliza el puerto 3001.

Jenkins es importante porque permite repetir el proceso de construcción y despliegue de una forma controlada, reduce pasos manuales y ayuda a detectar errores antes de publicar cambios.

Con esto finalizo la demostración de la automatización y el despliegue de la aplicación. Muchas gracias.

## Tomas que deben aparecer en el video

1. Jenkins Dashboard y Job `EA3-Asesorias-CD`.
2. Console Output mostrando el resultado real del pipeline.
3. Aplicación monolítica en `http://localhost:3002`.
4. Arquitectura desacoplada: core en `http://localhost:3002` y proyectos en `http://localhost:3001`.
5. Docker Hub con las imágenes publicadas, si se activó el push.

**Importante:** no digas que una etapa fue exitosa ni muestres imágenes como publicadas hasta haberlo comprobado en tu equipo.
