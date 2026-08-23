# Inspirella

Inspirella is a premium, intelligent, multilingual educational discovery platform focusing on Switzerland and global educational systems.

## Tech Stack

This project is built with:
- **Frontend Framework**: React 19 + TypeScript
- **Bundler / Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Backend**: Express + Node.js (via `server.ts`)
- **Animations**: Motion
- **Map / Geospatial**: Mapbox GL JS
- **Database / Auth**: Supabase (PostgreSQL + Realtime)
- **AI**: Google Gen AI SDK (Gemini)

## Local Development

The project includes a custom Express backend to proxy requests and handle API secrets securely.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Run the production build locally:
   ```bash
   npm run start
   ```

## Environment Variables

Make sure to create a `.env` file based on `.env.example` in the root of the project with all necessary variables.

## Structure

- `src/App.tsx`: Main entry point for the frontend
- `src/components/`: Reusable UI components
- `src/data.ts`: Static app data and translations
- `src/supabaseClient.ts`: Supabase client and offline fallback configuration
- `server.ts`: The Express backend entry point
