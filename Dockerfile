# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies with retry logic
RUN yarn config set network-timeout 300000 && \
    yarn install --frozen-lockfile --network-timeout 300000 || \
    (rm -rf node_modules && yarn install --network-timeout 300000)

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port 8080
EXPOSE 8080

# Start the application
CMD ["yarn", "start:prod"]
