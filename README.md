# Suivi de Poids — TP Déploiement Continu (CI/CD)

Application full stack **Frontend (Nginx) + Backend (Node.js/Express)** conteneurisée avec Docker, orchestrée avec Kubernetes (K3s), et déployée automatiquement via GitHub Actions.

L'application permet d'enregistrer son poids avec la date, de modifier et supprimer des entrées. Les données sont stockées en mémoire (pas de base de données).

**Application en ligne :** http://51.120.124.68:30080/

**Repository GitHub :** https://github.com/HoWilhem/tp_cicd_wilhem.git

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
git clone https://github.com/HoWilhem/tp_cicd_wilhem.git
cd tp_cicd_wilhem

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

## Partie 2 — Configuration de la VM Cloud (Azure)

### VM créée sur Azure

| Paramètre     | Valeur                  |
|----------------|------------------------|
| OS             | Ubuntu 24.04 LTS       |
| Taille         | Standard_B2s           |
| IP publique    | 51.120.124.68          |
| Utilisateur    | wilhem                 |

### Ports ouverts dans le NSG Azure

| Port  | Usage                  |
|-------|------------------------|
| 22    | SSH                    |
| 80    | HTTP                   |
| 30080 | Kubernetes NodePort    |

### Installation Docker + K3s

```bash
ssh -i "TPDocker_key.pem" wilhem@51.120.124.68

# Docker
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker wilhem

# K3s
curl -sfL https://get.k3s.io | sudo sh -
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
mkdir -p ~/.kube && sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config

# Vérifier
docker --version
kubectl get nodes
```

---

## Partie 3 — Déploiement Kubernetes

### Build et push des images

```bash
docker login

docker build -t 88wiwi/tp-cicd-backend:latest ./backend
docker push 88wiwi/tp-cicd-backend:latest

docker build -t 88wiwi/tp-cicd-frontend:latest ./frontend
docker push 88wiwi/tp-cicd-frontend:latest
```

### Déployer sur la VM

```bash
# Copier les manifests
scp -i "TPDocker_key.pem" -r k8s wilhem@51.120.124.68:~/

# Sur la VM
kubectl apply -f ~/k8s/namespace.yaml
kubectl apply -f ~/k8s/configmap.yaml
kubectl apply -f ~/k8s/backend.yaml
kubectl apply -f ~/k8s/frontend.yaml

kubectl get pods -n tpcicd
kubectl get svc -n tpcicd
```

Application accessible sur : **http://51.120.124.68:30080**

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

### Secrets GitHub configurés

Settings → Secrets and variables → Actions :

| Secret            | Description                     |
|-------------------|---------------------------------|
| `DOCKER_USERNAME` | 88wiwi                          |
| `DOCKER_PASSWORD` | Token Docker Hub                |
| `VM_HOST`         | 51.120.124.68                   |
| `VM_USER`         | wilhem                          |
| `VM_SSH_KEY`      | Clé privée SSH de déploiement   |

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
