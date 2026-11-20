# Sistema de asesorias academicas - EA3 Jenkins

Proyecto construido con base en el documento **Actividad Enfasis 2a Tecnologias web**. Implementa los cinco modulos requeridos con Node.js, Express y MongoDB; despues separa el modulo de proyectos como servicio independiente.

## Correspondencia con el caso de estudio

| Modulo solicitado | Funcionalidad implementada |
|---|---|
| Tipo de proyecto | Listar, crear y editar los cinco tipos indicados. |
| Cliente | Listar, crear y editar nombre y correo. |
| Universidad | Listar, crear y editar nombre, direccion y telefono. |
| Etapas | Listar, crear y editar las cuatro etapas indicadas. |
| Proyecto | Listar, crear y editar numero unico, titulo, fechas, valor y relaciones. |

Las fechas de creacion y actualizacion se generan automaticamente. Los tipos de proyecto y las etapas se precargan si sus colecciones estan vacias.

## Analisis del componente seleccionado para desacoplar

El PDF no aporta registros de trafico, conteos de operaciones ni telemetria. Por tanto, no es correcto afirmar que exista una medicion empirica de demanda. Para la demostracion se selecciona **Proyectos** mediante un analisis funcional: es la entidad central del caso, concentra el mayor numero de atributos y relaciones, requiere operaciones de ciclo de vida y es el modulo que conecta los catalogos de clientes, tipos, universidades y etapas. Esta seleccion es una hipotesis tecnica razonada, no una estadistica observada. En un entorno real debe validarse con metricas de uso, tiempos de respuesta y volumen de solicitudes.

## Requisitos

- Docker Desktop ejecutandose con contenedores Linux.
- Docker Compose v2 (`docker compose version`).
- Git y una cuenta de GitHub para conectar el repositorio con Jenkins.
- Cuenta Docker Hub para publicar las imagenes requeridas por el caso de estudio.

## Ejecucion local: aplicacion monolitica

Desde la raiz de este repositorio:

```powershell
docker compose -f docker-compose.monolith.yml up -d --build
```

Abrir `http://localhost:3002`. Comprobar `http://localhost:3002/health`.

Detener:

```powershell
docker compose -f docker-compose.monolith.yml down
```

## Ejecucion desacoplada

```powershell
docker compose -f docker-compose.microservices.yml up -d --build
```

- Catalogos centrales (tipos, clientes, universidades, etapas): `http://localhost:3002`.
- Microservicio de proyectos: `http://localhost:3001`.
- Salud del core: `http://localhost:3002/health`.
- Salud del servicio de proyectos: `http://localhost:3001/health`.

Detener:

```powershell
docker compose -f docker-compose.microservices.yml down
```

Los dos despliegues usan volumenes de MongoDB separados para no mezclar los datos de la demostracion monolitica con los del despliegue desacoplado.

## API

| Recurso | GET | POST | PUT |
|---|---|---|---|
| `/api/tipos-proyecto` | Listar | Crear | `/:id` editar |
| `/api/clientes` | Listar | Crear | `/:id` editar |
| `/api/universidades` | Listar | Crear | `/:id` editar |
| `/api/etapas` | Listar | Crear | `/:id` editar |
| `/api/proyectos` | Listar | Crear | `/:id` editar |

En la arquitectura desacoplada el microservicio de proyectos publica `/api/proyectos`; los catalogos siguen disponibles en el servicio central.

## Pruebas automatizadas

```powershell
npm install
npm run check
npm test
```

Las pruebas unitarias validan catalogos y reglas de fechas y valor del proyecto. No sustituyen las pruebas de integracion contra MongoDB.

## Jenkins: instalacion local con Docker Desktop

El archivo `jenkins/compose.yaml` levanta un Jenkins LTS en `http://localhost:8090` y un Docker-in-Docker dedicado. Se exponen los puertos 3002 y 3001 desde ese daemon para que los despliegues de Jenkins sean visibles desde Windows.

Antes de iniciar Jenkins, detén cualquier despliegue manual que hayas levantado desde la raíz del proyecto, porque Jenkins/Docker-in-Docker publicará los puertos 3002 y 3001 en Windows:

```powershell
docker compose -f docker-compose.monolith.yml down
docker compose -f docker-compose.microservices.yml down
```

Desde la carpeta `jenkins`:

```powershell
cd jenkins
docker compose up -d --build
```

Ver la clave inicial:

```powershell
docker exec ea3-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Abrir `http://localhost:8090`, desbloquear Jenkins e instalar los plugins sugeridos. Crear el usuario administrador. Al ser la primera instalacion, se descargara Jenkins y sus plugins.

### Crear el Job

1. En Jenkins, seleccionar **New Item**.
2. Nombre: `EA3-Asesorias-CD`.
3. Tipo: **Pipeline**.
4. En Pipeline seleccionar **Pipeline script from SCM**.
5. SCM: Git; indicar la URL del repositorio GitHub y la rama `main`.
6. Script Path: `Jenkinsfile`.
7. Guardar y ejecutar **Build with Parameters**.

### Credenciales Docker Hub

Para publicar imagenes, crear en Jenkins una credencial de tipo **Username with password** con ID `dockerhub-creds`, usuario Docker Hub y un access token (no la contrasena de inicio de sesion). En el Job, activar `PUSH_TO_DOCKERHUB` y escribir el namespace/usuario en `DOCKERHUB_NAMESPACE`.

Si solo se quiere probar el despliegue local, dejar `PUSH_TO_DOCKERHUB` desactivado y `DOCKERHUB_NAMESPACE` vacio.

### Job y puertos documentados

- Job: `EA3-Asesorias-CD`.
- Jenkins (interfaz): puerto anfitrion `8090`.
- Aplicacion monolitica: puerto anfitrion `3002` (puerto interno `3000`).
- Arquitectura desacoplada: core puerto anfitrion `3002` (interno `3000`), microservicio de proyectos `3001`.

El PDF del caso no fija un puerto de despliegue. Se eligieron 3002/3001 para el acceso desde Windows y 8090 para Jenkins, evitando colisiones entre sus interfaces.

## Importante sobre seguridad y evidencia

La configuracion Jenkins/Docker-in-Docker esta pensada para un laboratorio academico local. El servicio Docker-in-Docker usa `privileged: true`; no debe exponerse a Internet ni reutilizarse como configuracion de produccion. No subir archivos `.env`, tokens ni contrasenas a GitHub. Capturar las pantallas reales de los dos despliegues, el Job exitoso, las imagenes en Docker Hub y las respuestas `/health`.
