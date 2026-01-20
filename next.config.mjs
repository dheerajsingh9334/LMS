/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  // ✅ Images: allow external domains but disable optimization in dev
  images: {
    unoptimized: isDev,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploadthing.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**",
      },
    ],
  },

  // ✅ Dev speed > strict checks
  reactStrictMode: false,

  // ✅ Safe defaults
  poweredByHeader: false,
  compress: true,
  swcMinify: true,

  // ✅ Only strip console in production
  compiler: {
    removeConsole: !isDev ? { exclude: ["error", "warn"] } : false,
  },

  // ⚠️ Experimental = PROD focused, keep minimal
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

  // ✅ Tree-shaking icons properly (single definition)
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },

  // ✅ TS config only, no extra checks in dev
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
};

export default nextConfig;
