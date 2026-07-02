pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
    }

    environment {
        IMAGE_NAME      = 'tasklist-front'
        IMAGE_TAG       = "${BUILD_NUMBER}"
        DOCKERHUB_CREDS = credentials('dockerhub-credentials')
    }

    stages {

        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'npm run test:coverage'
            }
            post {
                always {
                    junit 'reports/junit.xml'
                    publishHTML(target: [
                        allowMissing         : false,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'coverage',
                        reportFiles          : 'index.html',
                        reportName           : 'Coverage Report'
                    ])
                }
            }
        }


        stage('Security Scan') {
            steps {
                sh 'npm audit --audit-level=high'
            }
        }
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'npx sonar-scanner'
                }
            }
        }
        stage('Docker Build') {
            steps {
                sh "docker build -t ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}:${IMAGE_TAG} -t ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}:latest ."
            }
        }

        stage('Install Trivy') {
            steps {
                sh '''
                    set -e
                    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh
                    ./bin/trivy --version
                '''
            }
        }

        stage('Image Scan') {
            steps {
                sh '''
                    set -e

                    ./bin/trivy image \
                      --no-progress \
                      --exit-code 0 \
                      ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Docker Push') {
            steps {
                sh "echo ${DOCKERHUB_CREDS_PSW} | docker login -u ${DOCKERHUB_CREDS_USR} --password-stdin"
                sh "docker push ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}:latest"
            }
            post {
                always {
                    sh 'docker logout'
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Pipeline success — image: ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}:${IMAGE_TAG}"
        }
        failure {
            echo "Pipeline failed — check logs"
        }
    }
}