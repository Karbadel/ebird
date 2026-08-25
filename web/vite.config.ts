import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` = ruta pública donde se sirve el portal. Por defecto '/' (raíz del
// dominio). Para desplegar en subcarpeta, define BASE_PATH al build, p. ej.:
//   BASE_PATH=/condores/ npm run build   (PowerShell: $env:BASE_PATH='/condores/'; npm run build)
// Todos los assets y los fetch usan import.meta.env.BASE_URL, que deriva de aquí,
// así que este único valor basta para reubicar el portal sin tocar código.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
});
