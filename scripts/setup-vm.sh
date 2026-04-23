#!/bin/bash
# ============================================
# Installation Docker + K3s sur VM Ubuntu 22.04+
# Usage: chmod +x setup-vm.sh && sudo ./setup-vm.sh
# ============================================
set -e

echo "=============================="
echo "  Setup Docker + K3s"
echo "=============================="

# 1. Mise à jour
echo "[1/4] Mise à jour..."
apt-get update && apt-get upgrade -y

# 2. Docker
echo "[2/4] Installation Docker..."
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
usermod -aG docker $SUDO_USER || true
echo "Docker: $(docker --version)"

# 3. K3s
echo "[3/4] Installation K3s..."
curl -sfL https://get.k3s.io | sh -
mkdir -p /home/$SUDO_USER/.kube
cp /etc/rancher/k3s/k3s.yaml /home/$SUDO_USER/.kube/config
chown -R $SUDO_USER:$SUDO_USER /home/$SUDO_USER/.kube
chmod 600 /home/$SUDO_USER/.kube/config
echo 'export KUBECONFIG=~/.kube/config' >> /home/$SUDO_USER/.bashrc
echo "K3s: $(k3s --version)"

# 4. Vérification
echo "[4/4] Vérification..."
kubectl get nodes

echo ""
echo "=============================="
echo "  Installation terminée !"
echo "  1. Déconnectez-vous puis reconnectez-vous"
echo "  2. Ouvrez le port 30080 dans le firewall"
echo "=============================="
