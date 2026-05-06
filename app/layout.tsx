import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wise AI rPPG Prototype",
  description:
    "Near real-time rPPG vitals from a 60-second face video, processed in 5-second chunks via the Wise AI SDK.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
