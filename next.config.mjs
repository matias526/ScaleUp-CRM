/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // En Next 16, 'eslint' ya no va acá, se ignora por defecto en dev
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fnwdqskdddohcotrowmd.supabase.co',
        pathname: '/**',
      },
    ],
  },
  // La clave se movió de experimental a la raíz
  serverExternalPackages: ['unpdf', 'mammoth', 'xlsx'],

  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;