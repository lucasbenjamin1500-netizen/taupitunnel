/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'microphone=(self), camera=()',
          },
          {
            key: 'Feature-Policy',
            value: "microphone 'self'",
          },
        ],
      },
    ]
  },
}

export default nextConfig
