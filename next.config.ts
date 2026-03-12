// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [
      'http://172.20.8.66:3000', // your local IP
      'http://localhost:3000'    // localhost
    ],
  },
};

module.exports = nextConfig;