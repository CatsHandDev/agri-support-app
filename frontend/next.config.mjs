/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    unoptimized: true,
    // remotePatterns: [
    //   {
    //     protocol: 'http', // または 'https'
    //     hostname: 'localhost',
    //     port: '8000', // Django サーバーのポート
    //     pathname: '/media/**', // /media/ 以下のすべてのパスを許可
    //   },
    //   // 必要であれば他の許可するホストも追加
    //   // 例: 本番環境のメディアサーバーのホスト名など
    //   // {
    //   //   protocol: 'https',
    //   //   hostname: 'your-production-media.com',
    //   //   port: '', // ポートがなければ空文字
    //   //   pathname: '/media/**',
    //   // },
    // ],
  },
};

export default nextConfig;
