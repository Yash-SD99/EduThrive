/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "http://192.168.0.101",
    "http://192.168.0.101:3000",
    "http://localhost:3000"
  ]
};

export default nextConfig;