/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // HTML pages — never cache, always fetch fresh so chunk hashes stay in sync
        source: "/((?!_next/static|_next/image|favicon.ico|icons|branding|manifest.json).*)",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
