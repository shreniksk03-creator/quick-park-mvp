/** @type {import('next').NextConfig} */
const nextConfig = {
  // This allows your phone to talk to your laptop's dev server
  allowedDevOrigins: ['10.105.31.75', '10.105.30.182', 'localhost:3000'],
  // ... keep any other existing config you have here
};

module.exports = nextConfig;