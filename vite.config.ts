import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@/components': '/src/components',
      '@/utils': '/src/utils',
      '@/hooks': '/src/hooks',
      '@/services': '/src/services',
      '@/context': '/src/context',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Silence Sass deprecation warnings
        // These warnings are mostly from Bootstrap in node_modules
        silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions'],
      },
    },
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better optimization
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['apexcharts', 'react-apexcharts'],
          'calendar-vendor': [
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/interaction',
            '@fullcalendar/list',
            '@fullcalendar/timegrid',
          ],
          'date-vendor': [
            'date-fns',
            'react-datepicker',
            'react-calendar',
            'react-date-range',
            'react-datetime',
          ],
          'editor-vendor': ['quill', 'react-quill'],
          'table-vendor': ['@tanstack/react-table'],
          'ui-vendor': [
            'react-select',
            'react-icons',
            'react-perfect-scrollbar',
            'react-circular-progressbar',
            'sweetalert2',
            'sweetalert2-react-content',
          ],
          'bootstrap-vendor': ['bootstrap', '@popperjs/core'],
        },
      },
    },
  },
})
