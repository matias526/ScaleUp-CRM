/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // ESTA ES LA LÍNEA NUEVA:
  allowedDevOrigins: ['vm-7ibsc4kgeje27p0twmr5w6fo.vusercontent.net'],

  serverExternalPackages: ['unpdf', 'mammoth', 'xlsx'],

  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

export default nextConfig