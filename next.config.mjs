/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploadthing.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**"
      }
    ]
  },
  optimizeFonts: true,
  
  // Performance optimizations
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Optimize bundle size
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'recharts'],
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
    optimizeCss: true,
  },
  
  // Improve TypeScript checking performance
  typescript: {
    // Run type checking in a separate process during production builds
    tsconfigPath: './tsconfig.json',
  },
  
  // Modularize imports for better tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
};

export default nextConfig;
