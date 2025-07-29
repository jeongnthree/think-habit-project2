import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';

  return {
    plugins: [react(), ...(isLib ? [dts({ include: ['src'] })] : [])],

    build: isLib
      ? {
          // 라이브러리 빌드 설정
          lib: {
            entry: resolve(__dirname, 'src/index.tsx'),
            name: 'ThinkHabitGroupWidget',
            formats: ['es', 'umd'],
            fileName: format => `index.${format === 'es' ? 'esm' : format}.js`,
          },
          rollupOptions: {
            external: ['react', 'react-dom'],
            output: {
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
              },
            },
          },
          sourcemap: true,
          minify: 'terser',
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          },
        }
      : {
          // 개발/프리뷰 빌드 설정
          outDir: 'dist',
          sourcemap: true,
        },

    server: {
      port: 3001,
      open: true,
      cors: true,
    },

    preview: {
      port: 3002,
      open: true,
    },

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },

    css: {
      modules: {
        localsConvention: 'camelCase',
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },

    define: {
      __DEV__: JSON.stringify(mode === 'development'),
      __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },

    optimizeDeps: {
      include: ['react', 'react-dom'],
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          'dist/',
        ],
      },
    },
  };
});
