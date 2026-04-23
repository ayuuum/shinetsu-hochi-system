import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Keep heavy server-only packages out of the client bundle and reduce cold start size
    serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],

    // Reduce memory pressure on serverless functions
    experimental: {
        optimizePackageImports: ["lucide-react", "date-fns"],
    },
};

export default nextConfig;
