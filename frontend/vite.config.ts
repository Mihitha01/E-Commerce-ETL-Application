import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` (development, qa, uat, production)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),  // Tailwind v4 Vite plugin — compiles utility classes
    ],
    // PDF Day 2: Path-based builds — sets the public base path
    // e.g., build:qa → base = '/qa/', build:uat → base = '/uat/'
    base: mode === 'development' ? '/' : `/${env.VITE_ENV || mode}/`,
    server: {
      port: 5173,
      open: true,
    },
    build: {
      outDir: `dist/${mode}`,
      sourcemap: mode !== 'production',
    },
  }
})
