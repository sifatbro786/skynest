/** @type {import('next').NextConfig} */
const nextConfig = {
    // Mongoose + sharp must stay outside the bundler (native bindings / dynamic requires).
    serverExternalPackages: ["mongoose", "sharp"],

    // Uploads are already normalised to WebP by the upload engine (Phase 3),
    // so the built-in optimizer only has to handle resizing. Long TTL keeps
    // CPU off the VPS.
    images: {
        formats: ["image/webp"],
        minimumCacheTTL: 2678400, // 31 days
        qualities: [75, 90],
    },

    poweredByHeader: false,
    reactStrictMode: true,

    // Uploaded media lives on disk and is served straight from /public.
    // Cache it hard — filenames are content-hashed by the upload engine.
    async headers() {
        return [
            {
                source: "/uploads/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
