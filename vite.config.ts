import { defineConfig } from 'vite';

// base 使用相对路径 './'：无论仓库叫什么名字、部署在
// https://<user>.github.io/<repo>/ 还是自定义域名，产物都能直接运行。
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
