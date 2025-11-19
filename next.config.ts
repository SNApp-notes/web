import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';
import type { NextConfig } from 'next';
import { createRequire } from 'module';
import globToRegExp from 'glob-to-regexp';

const require = createRequire(import.meta.url);
const coverageConfig = require('./coverage.config.js');

const nextConfig: NextConfig = {
  distDir: process.env.E2E_TEST === 'true' ? '.next-e2e' : '.next',
  experimental: {
    optimizePackageImports: ['@chakra-ui/react']
  },
  // Externalize Prisma to prevent webpack from bundling/processing it
  serverExternalPackages: ['@prisma/client', 'prisma'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  allowedDevOrigins: ['host.docker.internal'],
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    if (process.env.COVERAGE === 'true' && !isServer) {
      // Convert glob patterns from coverage.config.js to webpack-compatible regexes
      // This ensures E2E coverage respects the same exclusions as unit tests
      const excludePatterns = [
        /node_modules/,
        // Explicitly exclude Prisma generated clients to prevent webpack from breaking them
        /prisma-main\//,
        /prisma-e2e\//,
        ...coverageConfig.exclude
          .filter(
            (pattern: string) => pattern.startsWith('src/') && !pattern.includes('prisma')
          )
          .map((pattern: string) => globToRegExp(pattern))
      ];

      config.module.rules.push({
        test: /\.(tsx|ts|js|jsx)$/,
        exclude: (filePath: string) => {
          return excludePatterns.some((pattern) => pattern.test(filePath));
        },
        use: {
          loader: '@jsdevtools/coverage-istanbul-loader',
          options: { esModules: true }
        },
        enforce: 'post'
      });
    }
    return config;
  }
};

export default nextConfig;
