/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack es el bundler por defecto en Next 16 (usado en build/start).
  // `dev` sigue forzando webpack (ver package.json) porque el polling de
  // Turbopack para hot reload en bind mounts de Docker en Windows todavía
  // no es confiable: https://github.com/vercel/next.js/issues/80665
  turbopack: {},
  // Necesario para hot reload dentro de Docker con bind mounts en Windows
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;
