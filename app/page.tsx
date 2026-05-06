import dynamic from "next/dynamic";

// The dashboard owns the SDK lifecycle and uses browser-only APIs
// (MediaStream, dynamic import of /wiseai-sdk/...). Render client-only.
const Dashboard = dynamic(() => import("@/components/Dashboard"), { ssr: false });

export default function Page() {
  return <Dashboard />;
}
