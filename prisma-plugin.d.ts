/**
 * Type declarations for @prisma/nextjs-monorepo-workaround-plugin
 *
 * This plugin is required for deploying Prisma projects to Vercel from GitHub Actions
 * in monorepo setups. It ensures Prisma Client is properly bundled during builds.
 *
 * @see https://github.com/prisma/prisma/issues/12909
 * @see https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/vercel-caching-issue
 */
declare module '@prisma/nextjs-monorepo-workaround-plugin' {
  import { Compiler } from 'webpack';

  /**
   * Webpack plugin that works around Prisma Client bundling issues in Next.js monorepos.
   *
   * @example
   * ```typescript
   * import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';
   *
   * // In next.config.ts webpack configuration
   * webpack: (config, { isServer }) => {
   *   if (isServer) {
   *     config.plugins = [...config.plugins, new PrismaPlugin()];
   *   }
   *   return config;
   * }
   * ```
   */
  export class PrismaPlugin {
    constructor();
    apply(compiler: Compiler): void;
  }
}
