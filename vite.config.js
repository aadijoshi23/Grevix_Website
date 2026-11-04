import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'three-addons': [
            'three/examples/jsm/controls/OrbitControls.js',
            'three/examples/jsm/loaders/GLTFLoader.js'
          ]
        }
      }
    }
  }
});
