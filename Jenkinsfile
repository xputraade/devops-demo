pipeline {
  agent any

  environment {
    IMAGE_NAME = "ghcr.io/xputraade/devops-demo"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Show Info') {
      steps {
        sh 'pwd'
        sh 'ls -la'
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG .'
      }
    }
  }
}
