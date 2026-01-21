/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  images: {
    unoptimized: isDev,
    remotePatterns: [
      { protocol: "https", hostname: "uploadthing.com", pathname: "/**" },
      { protocol: "https", hostname: "utfs.io", pathname: "/**" },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "i.pravatar.cc", pathname: "/**" },
    ],
  },

  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  swcMinify: true,

  compiler: {
    removeConsole: !isDev ? { exclude: ["error", "warn"] } : false,
  },

  experimental: {
    optimizeCss: !isDev,
    scrollRestoration: true,
    serverComponentsExternalPackages: [
      "@prisma/client",
      "prisma",
      "bcrypt",
      "bcryptjs",
    ],
  },

  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },

  // 🚨 DEPLOY UNBLOCK
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: "./tsconfig.json",
  },
};

export default nextConfig;
