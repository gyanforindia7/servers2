# Build Stage (Frontend)
FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm install
# Verify your package.json has a "build" script!
RUN npm run build 

# Production Stage (Backend)
FROM node:20-slim
WORKDIR /app

# 1. Copy dependencies
COPY package*.json ./
RUN npm install --omit=dev

# 2. Copy frontend build output
COPY --from=builder /app/dist ./dist

# 3. FIX: Copy backend files from your backend folder
# Assuming your local structure is: project-root/backend/server.js
COPY backend/server.js ./
COPY backend/routes.js ./
COPY backend/models.js ./

EXPOSE 8080
CMD ["node", "server.js"]
