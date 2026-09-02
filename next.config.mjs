/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  experimental: { serverComponentsExternalPackages: ['pdf-parse'] },
  webpack: (config) => {
    config.externals.push({ canvas: 'commonjs canvas' });
    return config;
  },
};
export default nextConfig;
