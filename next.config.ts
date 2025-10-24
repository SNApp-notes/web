import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@chakra-ui/react']
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  allowedDevOrigins: ['host.docker.internal'],
  turbopack: {},
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
