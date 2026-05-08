import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Wise AI rPPG Prototype",
  description:
    "Near real-time rPPG vitals from a 60-second face video, processed in 5-second chunks via the Wise AI SDK.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        {/* MediaPipe FaceMesh — used by the pre-capture quality checklist
            (lib/preflight/PreflightChecker.ts). Loaded from CDN to avoid
            bundling ~2MB of WASM/models into the Next.js client bundle. */}
        <Script
          src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        {children}
      </body>
    </html>
  );
}
