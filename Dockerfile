# Use a standard Node.js image. 
# For RHEL/OpenShift environments, you can switch this to:
# FROM registry.access.redhat.com/ubi9/nodejs-20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Using ci to ensure clean install from lockfile
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies to keep image small
RUN npm prune --production

# Expose the port the app runs on
EXPOSE 1025

# Start the application
CMD ["npm", "start"]
