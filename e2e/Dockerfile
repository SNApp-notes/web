FROM playwright:e2e-local

WORKDIR /app

# Copy package files and scripts from parent directory
COPY package.json package-lock.json ./
COPY scripts ./scripts

# Install dependencies (including @playwright/test and project deps)
RUN npm ci

# Create necessary directories with proper permissions
RUN mkdir -p results report .auth .nyc_output && chmod -R 777 results report .auth .nyc_output

CMD ["npx", "playwright", "test"]
