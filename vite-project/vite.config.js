import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/ProyectoPro_React/", 
  build: {
    outDir: '../docs', // <--- OJO AQUÍ: Los dos puntos .. sacan la carpeta afuera
  }
})