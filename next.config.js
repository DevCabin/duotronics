/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['js-yaml']
  }
}

module.exports = nextConfig
