pipeline {
  agent any
  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 25, unit: 'MINUTES')
  }
  parameters {
    choice(name: 'DEPLOYMENT', choices: ['monolith', 'microservices'], description: 'Selecciona la arquitectura que deseas desplegar.')
    booleanParam(name: 'PUSH_TO_DOCKERHUB', defaultValue: false, description: 'Publicar las imagenes en Docker Hub. Requiere la credencial dockerhub-creds.')
    string(name: 'DOCKERHUB_NAMESPACE', defaultValue: '', description: 'Usuario u organizacion de Docker Hub, sin @.')
  }
  environment {
    IMAGE_TAG = "${BUILD_NUMBER}"
    COMPOSE_PROJECT_NAME = 'ea3-asesorias'
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Validar parametros') {
      steps {
        script {
          if (params.DOCKERHUB_NAMESPACE?.trim() && !(params.DOCKERHUB_NAMESPACE.trim() ==~ /[a-z0-9][a-z0-9_-]*/)) {
            error('El namespace solo puede contener letras minusculas, numeros, guion y guion bajo.')
          }
          if (params.PUSH_TO_DOCKERHUB && !params.DOCKERHUB_NAMESPACE?.trim()) {
            error('Escribe el namespace de Docker Hub antes de publicar.')
          }
        }
      }
    }
    stage('Validar codigo y pruebas') {
      steps {
        sh "docker build -f Dockerfile.test -t ea3-asesorias-test:${IMAGE_TAG} ."
        sh "docker run --rm ea3-asesorias-test:${IMAGE_TAG}"
      }
    }
    stage('Construir imagenes') {
      steps {
        script {
          def ns = params.DOCKERHUB_NAMESPACE?.trim() ? params.DOCKERHUB_NAMESPACE.trim() : 'local'
          sh "docker build -f Dockerfile.monolith -t ${ns}/iudigital-asesorias-monolith:${IMAGE_TAG} -t ${ns}/iudigital-asesorias-monolith:latest ."
          sh "docker build -f Dockerfile.core -t ${ns}/iudigital-asesorias-core:${IMAGE_TAG} -t ${ns}/iudigital-asesorias-core:latest ."
          sh "docker build -f Dockerfile.projects -t ${ns}/iudigital-asesorias-projects:${IMAGE_TAG} -t ${ns}/iudigital-asesorias-projects:latest ."
        }
      }
    }
    stage('Publicar Docker Hub') {
      when { expression { return params.PUSH_TO_DOCKERHUB } }
      steps {
        script {
        }
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER', passwordVariable: 'DH_TOKEN')]) {
          sh 'echo "$DH_TOKEN" | docker login -u "$DH_USER" --password-stdin'
          sh "docker push ${params.DOCKERHUB_NAMESPACE.trim()}/iudigital-asesorias-monolith:${IMAGE_TAG}"
          sh "docker push ${params.DOCKERHUB_NAMESPACE.trim()}/iudigital-asesorias-monolith:latest"
          sh "docker push ${params.DOCKERHUB_NAMESPACE.trim()}/iudigital-asesorias-core:${IMAGE_TAG}"
          sh "docker push ${params.DOCKERHUB_NAMESPACE.trim()}/iudigital-asesorias-core:latest"
          sh "docker push ${params.DOCKERHUB_NAMESPACE.trim()}/iudigital-asesorias-projects:${IMAGE_TAG}"
          sh "docker push ${params.DOCKERHUB_NAMESPACE.trim()}/iudigital-asesorias-projects:latest"
          sh 'docker logout'
        }
      }
    }
    stage('Desplegar con Docker Compose') {
      steps {
        script {
          def ns = params.DOCKERHUB_NAMESPACE?.trim() ? params.DOCKERHUB_NAMESPACE.trim() : 'local'
          if (params.DEPLOYMENT == 'monolith') {
            sh 'docker compose -p ea3-asesorias-decoupled -f docker-compose.microservices.yml down --remove-orphans || true'
            sh "DOCKERHUB_NAMESPACE=${ns} IMAGE_TAG=${IMAGE_TAG} docker compose -p ea3-asesorias-monolith -f docker-compose.monolith.yml up -d --build"
          } else {
            sh 'docker compose -p ea3-asesorias-monolith -f docker-compose.monolith.yml down --remove-orphans || true'
            sh "DOCKERHUB_NAMESPACE=${ns} IMAGE_TAG=${IMAGE_TAG} docker compose -p ea3-asesorias-decoupled -f docker-compose.microservices.yml up -d --build"
          }
        }
      }
    }
    stage('Verificar despliegue') {
      steps {
        script {
          if (params.DEPLOYMENT == 'monolith') {
            sh 'for i in $(seq 1 20); do curl -fsS http://docker:3002/health && exit 0; sleep 3; done; exit 1'
          } else {
            sh 'for i in $(seq 1 20); do curl -fsS http://docker:3002/health && curl -fsS http://docker:3001/health && exit 0; sleep 3; done; exit 1'
          }
          sh 'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"'
        }
      }
    }
  }
  post {
    success { echo 'CD finalizado: pruebas, construccion y despliegue verificados.' }
    failure { echo 'El pipeline fallo. Revisa la etapa marcada en la consola de Jenkins.' }
  }
}
