
  import { defineConfig, loadEnv } from 'vite';
  import type { Plugin } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import tailwindcss from '@tailwindcss/vite';
  import path from 'path';
  import { sentryVitePlugin } from '@sentry/vite-plugin';

  /** Vite dev/preview do not map `/path/` → `/path/index.html` for public/ assets; production hosts (e.g. Vercel) do. */
  function publicDirIndexFallback(staticPaths: string[]): Plugin {
    const apply = (req: { url?: string } | undefined) => {
      const raw = req?.url ?? '';
      const pathname = raw.split('?')[0];
      for (const base of staticPaths) {
        if (pathname === base || pathname === `${base}/`) {
          const qs = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
          req.url = `${base}/index.html${qs}`;
          break;
        }
      }
    };
    return {
      name: 'public-dir-index-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          apply(req);
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          apply(req);
          next();
        });
      },
    };
  }

  export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
    plugins: [
      react(),
      tailwindcss(),
      publicDirIndexFallback(['/yt-ai-summarizer']),
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
      // Bind all interfaces so the site is reachable from a phone on the same
      // Wi-Fi (http://<LAN-IP>:3000) without needing the --host flag.
      host: true,
      // DEV ONLY — `server.proxy` is ignored by `vite build`, so this has zero
      // effect on production.
      //
      // The `api/` folder is Vercel serverless; Vite knows nothing about it and
      // would otherwise serve api/*.js as transformed JS, so /api/tech-news
      // returned JavaScript source where the app expected JSON and every
      // article detail page failed with "is not valid JSON".
      //
      // Point /api at a real backend so /tech-news/:slug and chat
      // are actually exercisable locally. Override the target with
      // VITE_DEV_API_PROXY (e.g. http://localhost:3001 when running `vercel dev`).
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_PROXY || 'https://cemkoyluoglu.codes',
          changeOrigin: true,
          secure: true,
        },
      },
    },
    preview: {
      port: 4173,
      host: true,
    },
    };
  });