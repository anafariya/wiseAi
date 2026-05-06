/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Wise AI SDK is shipped as static assets under public/wiseai-sdk.
  // We dynamically import it from the browser at runtime, so Next never
  // tries to bundle it.
};

export default nextConfig;
