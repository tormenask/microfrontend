import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from "@originjs/vite-plugin-federation";
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
  tailwindcss(),
  federation({
    name: "widgetGPS",
    filename: "remoteEntry.js",
    exposes: {'./OrderTracker': './src/OrderTracker.jsx'},
    remotes: {},
    shared: ["react", "react-dom"],
  }),
  ],
  build: {
    modulePreload: false,
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
  },
})
