import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves the site under /<repo>/; dev stays at /
  base: command === 'build' ? '/prove_prediction_market/' : '/',
}))
