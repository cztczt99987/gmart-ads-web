import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:5320/api',
            ws: true,
          },
          '/file-proxy': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/file-proxy/, ''),
            target: 'https://max.gmartmax.com',
          },
        },
      },
    },
  };
});
