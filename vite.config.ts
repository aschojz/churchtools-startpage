import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import eslintPlugin from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default ({ mode }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
    return defineConfig({
        base: `/ccm/${process.env.VITE_KEY}/`,
        plugins: [vue(), eslintPlugin(), tailwindcss()],
        resolve: {
            dedupe: ['vue'],
        },
        server: {
            host: '127.0.0.1',
            port: 5173,
        },
    });
};
