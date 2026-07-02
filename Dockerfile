FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci          
COPY . .
RUN npm run build   

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
RUN adduser -D appuser && chown -R appuser /usr/share/nginx/html
USER appuser
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]