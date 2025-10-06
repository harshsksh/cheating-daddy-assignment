import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';

export default defineConfig({
    build: {
        ssr: true,
        outDir: '.vite/build/main',
        emptyOutDir: false,
        rollupOptions: {
            input: 'src/index.js',
            external: ['electron', ...builtinModules],
            output: {
                format: 'cjs',
                entryFileNames: 'index.js',
                inlineDynamicImports: true,
            },
        },
        minify: false,
    },
});


