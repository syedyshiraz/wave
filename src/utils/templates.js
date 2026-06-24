export const DEFAULT_TEMPLATES = {
  'github-actions': `name: WAVE Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Install dependencies
        run: npm install
      - name: Run build
        run: npm run build
`,
  'docker-compose': `version: "3.8"
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - api
  api:
    image: node:18
    ports:
      - "3000:3000"
    volumes:
      - "./api:/usr/src/app"
    depends_on:
      - db
  db:
    image: postgres:15
    ports:
      - "5432:5432"
    volumes:
      - "db-data:/var/lib/postgresql/data"
volumes:
  db-data:
`,
  'kubernetes': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deploy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:alpine
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_COLOR: blue
  API_URL: http://web-service:80
`,
};
