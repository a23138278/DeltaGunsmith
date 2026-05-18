/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出配置（适合 Vercel 部署）
  output: 'standalone',
  
  // 图片优化配置
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aka.doubaocdn.com',
        pathname: '/s/**',
      },
    ],
  },
  
  // 环境变量（可在 Vercel 后台覆盖）
  env: {
    CRON_SECRET: process.env.CRON_SECRET || 'default-secret',
  },
}

export default nextConfig
