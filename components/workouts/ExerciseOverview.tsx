"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

type Tab = "weight" | "volume" | "est1rm";

interface SessionPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  est1RM: number;
  unit: string;
}

interface Stats {
  lastWeight: number;
  lastDate: string | null;
  allTimePR: number;
  sessionCount: number;
  totalVolume: number;
  est1RM: number;
  bestSessionVol: number;
  unit: string;
}

interface Props {
  exerciseId: string;
  exerciseName: string;
  onClose: () => void;
}

const TAB_LABELS: Record<Tab, string> = {
  weight: "Weight",
  volume: "Volume",
  est1rm: "Est 1RM",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function ExerciseOverview({ exerciseId, exerciseName, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("weight");
  const [sessions, setSessions] = useState<SessionPoint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/exercises/${exerciseId}/history`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions ?? []);
        setStats(data.stats ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [exerciseId]);

  const chartData = sessions.map((s) => ({
    date: fmtDate(s.date),
    value:
      tab === "weight"
        ? s.maxWeight
        : tab === "volume"
        ? s.totalVolume
        : s.est1RM,
  }));

  const unit = stats?.unit ?? "kg";
  const chartUnit =
    tab === "volume" ? unit : tab === "est1rm" ? unit : unit;

  // Find peak for reference dot
  const peakIdx = chartData.reduce(
    (best, d, i) => (d.value > (chartData[best]?.value ?? -Infinity) ? i : best),
    0
  );
  const peak = chartData[peakIdx];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--bg-secondary)",
          borderRadius: "8px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--text-primary)",
            }}
          >
            {exerciseName.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: "5px 14px",
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              letterSpacing: "0.08em",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              background: "transparent",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>

        {/* Chart area */}
        <div style={{ background: "var(--bg-card)", padding: "16px 20px 8px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
            {(["weight", "volume", "est1rm"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "5px 14px",
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  border: "1px solid",
                  borderColor: tab === t ? "transparent" : "transparent",
                  borderRadius: "20px",
                  cursor: "pointer",
                  background: tab === t ? "var(--accent)" : "var(--bg-hover)",
                  color: tab === t ? "#fff" : "var(--text-secondary)",
                  transition: "all 0.15s",
                }}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Loading...</p>
            </div>
          ) : chartData.length < 2 ? (
            <div
              style={{
                height: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Not enough data yet</p>
              <p style={{ color: "var(--text-muted)", fontSize: "11px" }}>Log at least 2 sessions to see progression</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    fontSize: "11px",
                    color: "var(--text-primary)",
                  }}
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  formatter={(v: number) => [`${v} ${chartUnit}`, TAB_LABELS[tab]]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ fill: "var(--accent)", r: 4, strokeWidth: 0 }}
                />
                {peak && (
                  <ReferenceDot
                    x={peak.date}
                    y={peak.value}
                    r={4}
                    fill="var(--accent)"
                    stroke="none"
                    label={{
                      value: `${peak.value} ${chartUnit}`,
                      position: "top",
                      fontSize: 10,
                      fill: "var(--accent)",
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats grid */}
        {stats ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1px",
              background: "var(--border)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <StatCell
              label="LAST SESSION"
              value={`${stats.lastWeight} ${unit}`}
              sub={stats.lastDate ? fmtDate(stats.lastDate) : "—"}
            />
            <StatCell
              label="ALL-TIME PR"
              value={`${stats.allTimePR} ${unit}`}
              sub="Max weight"
            />
            <StatCell
              label="SESSIONS"
              value={String(stats.sessionCount)}
              sub="Total logged"
            />
            <StatCell
              label="TOTAL VOLUME"
              value={`${fmtNum(stats.totalVolume)} ${unit}`}
              sub="All time"
            />
            <StatCell
              label="ESTIMATED 1RM"
              value={`${stats.est1RM} ${unit}`}
              sub="Epley formula"
            />
            <StatCell
              label="BEST SESSION VOL"
              value={`${fmtNum(stats.bestSessionVol)} ${unit}`}
              sub="Single session"
            />
          </div>
        ) : (
          !loading && (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                No data yet — log this exercise in a session to see stats.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      style={{
        padding: "16px 18px",
        background: "var(--bg-card)",
      }}
    >
      <p
        style={{
          fontSize: "9px",
          letterSpacing: "0.12em",
          color: "var(--text-muted)",
          fontFamily: "Barlow Condensed, sans-serif",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "Barlow Condensed, sans-serif",
          fontWeight: 700,
          fontSize: "22px",
          color: "var(--text-primary)",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
        {sub}
      </p>
    </div>
  );
}
