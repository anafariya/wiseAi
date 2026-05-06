type Tone = "info" | "warn" | "error" | "success";

const toneStyles: Record<Tone, string> = {
  info: "bg-accent/10 text-accent border-accent/30",
  warn: "bg-warn/10 text-warn border-warn/30",
  error: "bg-bad/10 text-bad border-bad/30",
  success: "bg-good/10 text-good border-good/30",
};

export function StatusBanner({
  tone = "info",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <div className={`px-4 py-2 rounded-lg border text-sm ${toneStyles[tone]}`}>
      {children}
    </div>
  );
}
