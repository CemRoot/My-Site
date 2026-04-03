
  import { defineConfig, loadEnv } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';
  import { sentryVitePlugin } from '@sentry/vite-plugin';

  export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
    plugins: [
      react(),
      // Sentry plugin for uploading source maps
      // Only in production builds with auth token
      mode === 'production' && env.SENTRY_AUTH_TOKEN
        ? sentryVitePlugin({
            org: env.SENTRY_ORG,
            project: env.SENTRY_PROJECT,
            authToken: env.SENTRY_AUTH_TOKEN,
            sourcemaps: {
              assets: './build/**',
              filesToDeleteAfterUpload: './build/**/*.map',
            },
            release: {
              name: env.VITE_APP_VERSION || env.VERCEL_GIT_COMMIT_SHA || 'unknown',
            },
          })
        : null,
    ].filter(Boolean),
    define: {
      // Explicitly inject environment variables at build time
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      // SECURITY: VITE_SUPABASE_SERVICE_ROLE_KEY must NOT be injected into the
      // client bundle – it grants full DB admin access. Use only on the server.
      // Sentry environment variables
      'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(env.VITE_SENTRY_DSN || ''),
      'import.meta.env.VITE_SENTRY_ENVIRONMENT': JSON.stringify(env.VITE_SENTRY_ENVIRONMENT || 'development'),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION || env.VERCEL_GIT_COMMIT_SHA || 'unknown'),
    },
    optimizeDeps: {
      include: ['lucide-react'],
      exclude: [],
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'sonner@2.0.3': 'sonner',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: ['es2021', 'chrome90', 'firefox88', 'safari14', 'edge90'],
      outDir: 'build',
      // Generate source maps for Sentry
      sourcemap: mode === 'production',
      // Optimize bundle size
      cssCodeSplit: true,
      // Aggressive minification for production
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
        },
      },
      // Manual chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: undefined, // Let Vite handle chunking automatically
        },
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 500,
    },
    server: {
      port: 3000,
      open: true,
    },
    };
  });