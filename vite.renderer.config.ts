import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for Electron Forge Vite plugin (renderer process)
export default defineConfig({
    plugins: [react()],
    root: '.',
    build: {
        outDir: 'out/renderer',
        emptyOutDir: false,
        rollupOptions: {
            input: 'src/renderer/index.html',
        },
    },
    optimizeDeps: {
        include: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
});


