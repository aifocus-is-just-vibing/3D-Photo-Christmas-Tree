import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // REPLACE '3D-Photo-Christmas-Tree' with your actual GitHub repository name
  // Example: base: '/christmas-tree-app/'
  base: '/3D-Photo-Christmas-Tree/', 
  server: {
    port: 3000
  }
})