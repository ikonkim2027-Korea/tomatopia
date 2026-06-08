import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves a project site under /<repo>/, so assets need that base.
// Override with VITE_BASE (e.g. "/") when deploying elsewhere (Vercel/Netlify).
const base = process.env.VITE_BASE ?? '/tomatopia/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
