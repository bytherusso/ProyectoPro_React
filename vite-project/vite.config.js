import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/ProyectoPro_React/", // Tu nombre de repo
  build: {
    outDir: 'docs', // <--- ESTO ES LO NUEVO
  }
})