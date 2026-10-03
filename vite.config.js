import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Bei einer Änderung an dieser Datei startet der Entwicklungsserver neu und
// baut seinen Modul-Zwischenspeicher frisch auf.
export default defineConfig({
  resolve: {
    // Manche Module werden unter ihrem vollen Pfad angesprochen (/app/src/...).
    // Vite sucht sie dann relativ zur Wurzel und findet sie nicht. Diese Zeile
    // biegt den vollen Pfad wieder auf den richtigen um.
    alias: [{ find: /^\/app\//, replacement: "/" }],
  },
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});