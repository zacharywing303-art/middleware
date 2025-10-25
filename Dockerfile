# ---- Base image ----
    FROM node:20-alpine AS base
    WORKDIR /usr/src/app
    ENV NODE_ENV=production
    
    # Optionally install tini for proper signal handling (recommended)
    RUN apk add --no-cache tini
    
    # ---- Dependencies layer (better cache) ----
    FROM base AS deps
    # Copy only package manifests for caching
    COPY package*.json ./
    # Install prod deps
    RUN yarn install --production
    
    # ---- App layer ----
    FROM base AS app
    # Copy node_modules from deps layer
    COPY --from=deps /usr/src/app/node_modules ./node_modules
    # Copy the rest of your source
    COPY . .
    
    # Expose the port your Express app listens on
    EXPOSE 3333
    
    # Healthcheck is better in docker-compose, but you can add:
    # HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    #   CMD wget -qO- http://localhost:3001/health || exit 1
    
    # Use tini as entrypoint for proper signal handling
    ENTRYPOINT ["/sbin/tini", "--"]
    
    # Start your app; docker-compose can override this if needed
    CMD ["node", "bin/www"]