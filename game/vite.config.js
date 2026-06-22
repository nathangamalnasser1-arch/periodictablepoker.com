import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        scoreboard: './scoreboard.html',
        concept: './concept.html',
        coins: './coins.html',
        profile: './profile.html',
        rankings: './rankings.html',
        ledger: './ledger.html',
      },
    },
  },
});
