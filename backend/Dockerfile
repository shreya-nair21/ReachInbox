FROM node:20-alpine

WORKDIR /app

# Install openssl and libc for Prisma engine compatibility
RUN apk add --no-cache openssl libc6-compat

# Copy package specifications
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies needed for build)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript
RUN npm run build

# Expose default port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Run database schema push then start the Node.js server
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
