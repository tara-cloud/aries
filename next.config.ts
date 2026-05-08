import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["antd", "@ant-design/icons"],
  },
  allowedDevOrigins: ["192.168.0.107"],
};

export default nextConfig;
