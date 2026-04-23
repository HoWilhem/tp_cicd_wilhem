# Suivi de Poids — TP Déploiement Continu (CI/CD)

Application full stack **Frontend (Nginx) + Backend (Node.js/Express)** conteneurisée avec Docker, orchestrée avec Kubernetes (K3s), et déployée automatiquement via GitHub Actions.

L'application permet d'enregistrer son poids avec la date, de modifier et supprimer des entrées. Les données sont stockées en mémoire (pas de base de données).

---

## Architecture

```
┌─────────────┐        ┌──────────────┐
│  Frontend   │───────▶│  Backend API │
│  (Nginx)    │        │  (Express)   │
│  Port 80    │        │  Port 3001   │
└─────────────┘        └──────────────┘
```

Le frontend (Nginx) sert le fichier HTML et fait office de **reverse proxy** vers le backend pour les routes `/api/*` et `/health`.

**Endpoints :**
- `GET /health` — Health check
- `GET /api/weights` — Liste des poids (triés par date)
- `POST /api/weights` — Ajouter un poids
- `PUT /api/weights/:id` — Modifier un enregistrement
- `DELETE /api/weights/:id` — Supprimer un enregistrement

---

## Structure du projet

```
tp-cicd/
├── backend/
│   ├── Dockerfile          # Multi-stage build
│   ├── .dockerignore
│   ├── package.json
│   ├── server.js           # API Express (données en mémoire)
│   └── server.test.js      # Tests Jest + Supertest
├── frontend/
│   ├── Dockerfile          # Multi-stage build (Nginx)
│   ├── index.html          # Interface Suivi de Poids
│   └── nginx.conf          # Reverse proxy vers le backend
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml      # Variables d'environnement
│   ├── backend.yaml        # Deployment + Service
│   └── frontend.yaml       # Deployment + Service NodePort
├── scripts/
│   └── setup-vm.sh         # Installation Docker + K3s
├── .github/workflows/
│   └── ci-cd.yml           # Pipeline GitHub Actions
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Partie 1 — Lancer en local avec Docker Compose

```bash
git clone https://github.com/VOTRE_USERNAME/tp-cicd.git
cd tp-cicd

docker-compose up --build -d

docker-compose ps
```

### Tester

```bash
# Health check
curl http://localhost/health

# Ajouter un poids
curl -X POST http://localhost/api/weights \
  -H "Content-Type: application/json" \
  -d '{"weight": 75.5, "date": "2026-04-23"}'

# Lister les poids
curl http://localhost/api/weights
```

Ouvrir **http://localhost** dans le navigateur.

### Arrêter

```bash
docker-compose down
```

---

## Partie 2 — Configuration de la VM Cloud

### Créer une VM Ubuntu 22.04+ (Azure, AWS, GCP...)

**Ports à ouvrir :**

| Port  | Usage                  |
|-------|------------------------|
| 22    | SSH                    |
| 80    | Frontend (Compose)     |
| 30080 | Frontend (Kubernetes)  |

### Installer Docker + K3s

```bash
ssh user@IP_VM
chmod +x setup-vm.sh
sudo ./setup-vm.sh
exit
ssh user@IP_VM
docker --version
kubectl get nodes
```

---

## Partie 3 — Déploiement Kubernetes

### Préparer les images

```bash
sed -i 's/YOUR_DOCKERHUB_USERNAME/votre_username/g' k8s/backend.yaml k8s/frontend.yaml

docker login
docker build -t votre_username/weight-tracker-backend:latest ./backend
docker push votre_username/weight-tracker-backend:latest
docker build -t votre_username/weight-tracker-frontend:latest ./frontend
docker push votre_username/weight-tracker-frontend:latest
```

### Déployer

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

kubectl get pods -n taskmanager
kubectl get svc -n taskmanager
```

Application accessible sur : **http://IP_VM:30080**

---

## Partie 4 — Pipeline CI/CD (GitHub Actions)

### Flow

```
git push
  └─▶ 1) Install dépendances + Tests (npm test)
       └─ Échec → Pipeline arrêté
  └─▶ 2) Build Docker + Push Docker Hub
  └─▶ 3) Déploiement sur la VM via SSH
       └─ kubectl apply + rollout restart
```

### Secrets GitHub à configurer

Settings → Secrets and variables → Actions :

| Secret            | Valeur                          |
|-------------------|---------------------------------|
| `DOCKER_USERNAME` | Username Docker Hub             |
| `DOCKER_PASSWORD` | Password / token Docker Hub     |
| `VM_HOST`         | IP publique de la VM            |
| `VM_USER`         | Utilisateur SSH                 |
| `VM_SSH_KEY`      | Contenu de la clé privée SSH    |

### Générer une clé SSH

```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
ssh-copy-id -i ~/.ssh/deploy_key.pub user@IP_VM
cat ~/.ssh/deploy_key    # → copier dans VM_SSH_KEY
```

---

## Checklist du TP

- [x] Dockerfile multi-stage pour le backend et le frontend
- [x] Docker Compose avec 2 services (frontend + backend)
- [x] Communication inter-services via reverse proxy Nginx
- [x] Endpoint `/health`
- [x] Tests automatisés (Jest + Supertest)
- [x] Manifests Kubernetes (Deployments, Services, ConfigMap)
- [x] Application accessible via IP de la VM (NodePort 30080)
- [x] Pipeline CI/CD : Tests → Build → Push → Deploy
- [x] Déploiement automatique sans action manuelle
- [x] Échec du pipeline si les tests échouent
- [x] Variables d'environnement gérées proprement
- [x] Documentation complète
