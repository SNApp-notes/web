import type { NextConfig } from 'next';
import { resolve } from 'path';

const nextConfig: NextConfig = {
  distDir: process.env.E2E_TEST === 'true' ? '.next-e2e' : '.next',
  experimental: {
    optimizePackageImports: ['@chakra-ui/react']
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  allowedDevOrigins: ['host.docker.internal'],
  // Exclude server-only packages from client bundle
  serverExternalPackages: ['handlebars', 'nodemailer'],
  turbopack: {
    root: resolve('.')
  },
  webpack: (config, { isServer }) => {
    if (process.env.COVERAGE === 'true' && !isServer) {
      config.module.rules.push({
        test: /\.(tsx|ts|js|jsx)$/,
        exclude: /node_modules/,
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
