# WAVE – Workflow Actions Visualizer & Engine

WAVE (Workflow Actions Visualizer & Engine) is a fully client-side, interactive web application that provides bidirectional rendering and visual editing of configuration schemas. Built with a premium GitHub-inspired dark aesthetic, WAVE enables developers to seamlessly switch engines to visualize and edit configurations for **GitHub Actions**, **Docker Compose**, and **Kubernetes Manifests** in real-time.

---

## 🚀 Key Features

* **Multi-Schema Switcher**: Dynamically toggle between GitHub Actions workflows, Docker Compose stacks, and Kubernetes multi-document manifests.
* **Two-Way Sync Engine**: Edit the YAML text on the right and watch the flowchart on the left layout itself; drag nodes or configure specs on the canvas and see the YAML update instantly.
* **Auto-Layout (Dagre)**: Calculates Directed Acyclic Graph (DAG) visual node placements with automated smooth viewport centering.
* **Visual Relational Linkers**:
  * **GitHub Actions**: Visualizes jobs and dependency paths via `needs:`.
  * **Docker Compose**: Visualizes service containers and boot orders via `depends_on:`.
  * **Kubernetes**: Resolves selector labels to map **Service -> Deployment** traffic targets, HTTP routing rules to map **Ingress -> Service** bindings, and environment variables to map **ConfigMap/Secret -> Deployment** dependencies.
* **Schema Mismatch Protection**: Warns users immediately if they paste a Kubernetes resource while in Docker Compose mode (and vice-versa) before the app crashes.
* **Attribution-Free Canvas**: Clean visualizer board with hidden xyflow/React Flow tags.

---

## 🛠️ Tech Stack

* **Core**: React, Vite (Static Export configuration)
* **Canvas Engine**: `@xyflow/react` (React Flow v12+)
* **State Management**: Zustand
* **Layout Engine**: `dagre`
* **Parser/Serializer**: `js-yaml`
* **Styling**: Tailwind CSS v4, Lucide React (Icons)
* **Testing**: Vitest, React Testing Library, jsdom

---

## 📂 Project Directory Structure

```text
├── .github/workflows/deploy.yml   # GitHub Pages deployment pipeline
├── src/
│   ├── __tests__/                 # Vitest unit test suites
│   │   ├── multiSchema.test.js    # Docker and K8s parser tests
│   │   └── yamlParser.test.js     # Github Actions parser tests
│   ├── components/                # React visual canvas components
│   │   ├── DockerServiceNode.jsx  # Docker service container node
│   │   ├── Header.jsx             # Top bar branding & mode switcher
│   │   ├── JobNode.jsx            # GitHub Actions job node
│   │   ├── K8sNode.jsx            # Dynamic K8s resource node
│   │   ├── TriggerNode.jsx        # GitHub Actions trigger event node
│   │   ├── WorkflowCanvas.jsx     # Canvas board layout
│   │   └── YamlEditor.jsx         # Textarea editor & error panel
│   ├── store/
│   │   └── useWorkflowStore.js    # Zustand global state manager
│   ├── utils/
│   │   ├── parsers/               # Parser Engine Factory
│   │   │   ├── githubActions.js
│   │   │   ├── dockerCompose.js
│   │   │   └── kubernetes.js
│   │   ├── layout.js              # Dagre coordinate layout manager
│   │   ├── templates.js           # Mode boilerplate templates
│   │   └── yamlParser.js          # Dynamic parser resolver
│   ├── index.css                  # Global Tailwind v4 settings
│   ├── main.jsx                   # React bootloader
│   └── App.jsx                    # Split-pane layout wrapper
├── package.json
├── vite.config.js
└── index.html
```

---

## 💻 Getting Started

### 1. Prerequisites
Ensure you have Node.js (version 18+) installed.

### 2. Installation
Install the package dependencies:
```bash
npm install
```

### 3. Run Development Server
Start the local server at `http://localhost:5173/`:
```bash
npm run dev
```

### 4. Run Unit Tests
Run the parser and layout validation test suites:
```bash
npx vitest run
```

### 5. Production Build
Verify standard production bundling:
```bash
npm run build
```

---

## 📝 Schema Verification Examples

### 1. GitHub Actions (needs:)
```yaml
name: WAVE Workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Install dependencies
        run: npm install
  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy app
        run: npm run deploy
```

### 2. Docker Compose (depends_on:)
```yaml
version: "3.8"
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - api
  api:
    image: node:18
    depends_on:
      - db
  db:
    image: postgres:15
```

### 3. Kubernetes (Selector Labels)
```yaml
apiVersion: apps/v1
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
```

---

## 🚀 CI/CD Auto-Deployment
WAVE contains an automated Pages pipeline in `.github/workflows/deploy.yml`. When pushing updates to your repository's `main` branch, the workflow will trigger, run the production compiler, and deploy static assets directly to GitHub Pages.
