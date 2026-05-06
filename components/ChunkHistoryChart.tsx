"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChunkResult } from "@/lib/rppg/types";

type Point = {
  chunk: string;
  hr: number | null;
  rr: number | null;
  valid: boolean;
};

export function ChunkHistoryChart({ chunks }: { chunks: Array<ChunkResult | null> }) {
  const data: Point[] = chunks.map((c, i) => ({
    chunk: `${i * 5}s`,
    hr: c?.hr ?? null,
    rr: c?.rr ?? null,
    valid: !!c && c.faceDetected && (c.hrConfidence ?? 0) >= 0.5,
  }));

  return (
    <div className="panel p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wider text-muted">Chunk history</h2>
        <span className="text-xs text-muted">grey = flagged / excluded from final</span>
      </div>
      <div className="w-full h-48">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2c" />
            <XAxis dataKey="chunk" stroke="#6b7280" fontSize={11} />
            <YAxis stroke="#6b7280" fontSize={11} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                background: "#12121a",
                border: "1px solid #1f1f2c",
                borderRadius: 8,
                color: "#e5e7eb",
              }}
              formatter={(v: unknown, name: string) => {
                if (v === null || v === undefined) return ["—", name];
                return [Math.round(Number(v)), name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
            <Bar dataKey="hr" name="HR (bpm)" fill="#00A3FC">
              {data.map((d, i) => (
                <Cell key={i} fill={d.valid ? "#00A3FC" : "#4b5563"} fillOpacity={d.valid ? 0.95 : 0.45} />
              ))}
            </Bar>
            <Bar dataKey="rr" name="RR (br/min)" fill="#22c55e">
              {data.map((d, i) => (
                <Cell key={i} fill={d.valid ? "#22c55e" : "#4b5563"} fillOpacity={d.valid ? 0.85 : 0.4} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
