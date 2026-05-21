import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/books': 'http://localhost:8000',
      '/borrowers': 'http://localhost:8000',
      '/transactions': 'http://localhost:8000',
      '/borrow': 'http://localhost:8000',
      '/return': 'http://localhost:8000',
      '/dashboard': 'http://localhost:8000',
      '/search': 'http://localhost:8000',
      '/analytics': 'http://localhost:8000',
    }
  }
})
