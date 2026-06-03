FROM node:20-alpine
WORKDIR /app
COPY package.json server.js ./
COPY client-sites ./client-sites
ENV NODE_ENV=production
ENV PORT=80
ENV DATA_DIR=/data
VOLUME ["/data"]
EXPOSE 80
CMD ["node", "server.js"]
