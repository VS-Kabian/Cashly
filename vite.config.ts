import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-tabs'],
          'admin-pages': [
            path.resolve(__dirname, 'src/pages/admin/AdminLogin.tsx'),
            path.resolve(__dirname, 'src/pages/admin/AdminDashboard.tsx'),
            path.resolve(__dirname, 'src/pages/admin/AdminSettings.tsx'),
            path.resolve(__dirname, 'src/pages/admin/AdminActivityLogs.tsx'),
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
  },
  define: {
    global: 'globalThis',
  },
}));
