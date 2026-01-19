import path from 'path';
import { defineConfig, loadEnv, UserConfig } from 'vite'; // Ajout de UserConfig
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // On définit la configuration dans une variable typée pour aider TypeScript
    const config: UserConfig = {
      server: {
        port: 3000,
        host: '0.0.0.0',
        https: true,
      },
      plugins: [
        react(), 
        basicSsl()
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };

    return config;
});