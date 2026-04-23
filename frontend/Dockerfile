# ============================================
# Multi-stage build (Bonus TP)
# ============================================

# --- Stage 1 : Préparer les fichiers ---
FROM node:18-alpine AS build
WORKDIR /app
COPY index.html ./

# --- Stage 2 : Servir avec Nginx ---
FROM nginx:alpine AS production
COPY --from=build /app/index.html /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
