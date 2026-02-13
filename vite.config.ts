import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    webExtension({
      manifest: 'src/manifest.json',
      additionalInputs: [
        'src/about/about.html',
        'src/content/index.ts',
        'src/styles/content.css',
      ],
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
