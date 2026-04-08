"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Session {
  id: number;
  date: string;
  plan?: { name: string };
  sets?: { exercise?: { name: string }; reps: number; weight: number }[];
}

interface DashboardStats {
  totalWorkouts: number;
  totalSets: number;
  mostUsedExercise: string;
  recentSessions: Session[];
  weeklyData: { day: string; sets: number }[];
  weeklyWorkouts: number;
  streak: number;
  avgSets: number;
}

function buildWeeklyData(sessions: Session[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const result: { day: string; sets: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = days[d.getDay()];
    const dateStr = d.toDateString();
    const setsCount = sessions
      .filter((s) => new Date(s.date).toDateString() === dateStr)
      .reduce((acc, s) => acc + (s.sets?.length || 0), 0);
    result.push({ day: label, sets: setsCount });
  }
  return result;
}

function computeStreak(sessions: Session[]) {
  if (!sessions.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const workoutDays = new Set(
    sessions.map((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let streak = 0;
  let cursor = today.getTime();
  // allow today or yesterday as the "start"
  const DAY = 86400000;
  if (!workoutDays.has(cursor)) cursor -= DAY;
  while (workoutDays.has(cursor)) {
    streak++;
    cursor -= DAY;
  }
  return streak;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkouts: 0,
    totalSets: 0,
    mostUsedExercise: "—",
    recentSessions: [],
    weeklyData: [],
    weeklyWorkouts: 0,
    streak: 0,
    avgSets: 0,
  });

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((sessions: Session[]) => {
        const totalSets = sessions.reduce(
          (acc, s) => acc + (s.sets?.length || 0),
          0
        );
        const exerciseCount: Record<string, number> = {};
        sessions.forEach((s) => {
          s.sets?.forEach((set) => {
            const name = set.exercise?.name || "Unknown";
            exerciseCount[name] = (exerciseCount[name] || 0) + 1;
          });
        });
        const mostUsed =
          Object.entries(exerciseCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "—";

        const weeklyData = buildWeeklyData(sessions);
        const weeklyWorkouts = weeklyData.filter((d) => d.sets > 0).length;
        const streak = computeStreak(sessions);
        const avgSets = sessions.length
          ? Math.round(totalSets / sessions.length)
          : 0;

        setStats({
          totalWorkouts: sessions.length,
          totalSets,
          mostUsedExercise: mostUsed,
          recentSessions: sessions.slice(0, 7),
          weeklyData,
          weeklyWorkouts,
          streak,
          avgSets,
        });
      })
      .catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              color: "var(--text-primary)",
              letterSpacing: "0.06em",
            }}
          >
            DASHBOARD
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "3px" }}>
            {today}
          </p>
        </div>
        <a href="/workouts" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ fontSize: "12px", padding: "8px 18px" }}>
            + START WORKOUT
          </button>
        </a>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", alignItems: "start" }}>
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Metric Rings */}
          <div className="card" style={{ padding: "24px" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.14em", color: "var(--text-muted)", marginBottom: "20px", fontFamily: "Barlow Condensed, sans-serif" }}>
              METRICS
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
              <RingMetric value={stats.weeklyWorkouts} max={7} label="WEEKLY DAYS" sub="this week" />
              <RingMetric value={Math.min(stats.streak, 30)} max={30} label="STREAK" sub={`${stats.streak} days`} rawLabel={stats.streak} />
              <RingMetric value={stats.totalWorkouts} max={Math.max(stats.totalWorkouts, 20)} label="SESSIONS" sub="all time" />
              <RingMetric value={stats.avgSets} max={Math.max(stats.avgSets, 20)} label="AVG SETS" sub="per session" />
              <RingMetric value={stats.totalSets} max={Math.max(stats.totalSets, 100)} label="TOTAL SETS" sub="all time" />
            </div>
          </div>

          {/* Volume Chart */}
          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.14em", color: "var(--text-muted)", fontFamily: "Barlow Condensed, sans-serif" }}>
                SETS / DAY — LAST 7 DAYS
              </p>
            </div>
            {stats.weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={stats.weeklyData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="setsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "Barlow Condensed" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      fontSize: "11px",
                      color: "var(--text-primary)",
                    }}
                    cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                    formatter={(v: number) => [v, "sets"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sets"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fill="url(#setsFill)"
                    dot={{ fill: "var(--accent)", r: 3, strokeWidth: 0 }}
                    activeDot={{ fill: "var(--accent)", r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>No data yet</p>
              </div>
            )}
          </div>

          {/* Summary Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <SummaryCard label="TOTAL SESSIONS" value={stats.totalWorkouts} />
            <SummaryCard label="TOTAL SETS" value={stats.totalSets} />
            <SummaryCard label="AVG SETS / SESSION" value={stats.avgSets} />
            <SummaryCard label="TOP EXERCISE" value={stats.mostUsedExercise} isText />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Recent Sessions */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.14em", color: "var(--text-muted)", fontFamily: "Barlow Condensed, sans-serif" }}>
                RECENT SESSIONS
              </p>
            </div>

            {stats.recentSessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
                <p style={{ fontSize: "28px", marginBottom: "6px" }}>◎</p>
                <p style={{ fontSize: "12px" }}>No sessions yet</p>
                <p style={{ fontSize: "11px", marginTop: "4px" }}>
                  <a href="/workouts" style={{ color: "var(--accent)", textDecoration: "none" }}>Start your first workout →</a>
                </p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: "12px",
                  padding: "0 0 8px",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: "4px",
                }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.1em" }}>SESSION</span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.1em" }}>SETS</span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.1em" }}>DATE</span>
                </div>
                {stats.recentSessions.map((session, i) => (
                  <div
                    key={session.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      gap: "12px",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: i < stats.recentSessions.length - 1 ? "1px solid var(--border)" : "none",
                      opacity: i > 4 ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <div style={{ width: "2px", height: "20px", background: "var(--accent)", borderRadius: "1px", flexShrink: 0 }} />
                      <p style={{
                        fontFamily: "Barlow Condensed, sans-serif",
                        fontSize: "13px",
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {session.plan?.name || "Open Session"}
                      </p>
                    </div>
                    <p style={{ fontSize: "13px", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 600, color: "var(--accent)", textAlign: "right" }}>
                      {session.sets?.length || 0}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "right", whiteSpace: "nowrap" }}>
                      {new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding: "20px" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.14em", color: "var(--text-muted)", fontFamily: "Barlow Condensed, sans-serif", marginBottom: "14px" }}>
              QUICK ACCESS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <ActionLink href="/workouts" icon="◈" label="START WORKOUT" sub="Log a new session" />
              <ActionLink href="/analytics" icon="◎" label="VIEW ANALYTICS" sub="Track your progress" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function RingMetric({
  value,
  max,
  label,
  sub,
  rawLabel,
}: {
  value: number;
  max: number;
  label: string;
  sub: string;
  rawLabel?: number;
}) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circ * (1 - pct);
  const display = rawLabel !== undefined ? rawLabel : value;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: "72px", height: "72px" }}>
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--bg-hover)" strokeWidth="5" />
          <circle
            cx="36" cy="36" r={r} fill="none"
            stroke="var(--accent)" strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontWeight: 700,
            fontSize: display > 999 ? "13px" : "18px",
            color: "var(--text-primary)",
            lineHeight: 1,
          }}>
            {display}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontFamily: "Barlow Condensed, sans-serif",
          fontSize: "10px",
          letterSpacing: "0.1em",
          color: "var(--text-secondary)",
          lineHeight: 1.2,
        }}>{label}</p>
        <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>{sub}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  isText,
}: {
  label: string;
  value: string | number;
  isText?: boolean;
}) {
  return (
    <div className="card" style={{ padding: "16px" }}>
      <p style={{
        fontSize: "9px",
        color: "var(--text-muted)",
        letterSpacing: "0.12em",
        marginBottom: "6px",
        fontFamily: "Barlow Condensed, sans-serif",
      }}>
        {label}
      </p>
      <p style={{
        fontSize: isText ? "16px" : "28px",
        fontFamily: "Barlow Condensed, sans-serif",
        fontWeight: 700,
        color: "var(--accent)",
        lineHeight: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {value}
      </p>
    </div>
  );
}

function ActionLink({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: string;
  label: string;
  sub: string;
}) {
  return (
    <a href={href} style={{ textDecoration: "none" }}>
      <div
        className="card"
        style={{
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        <span style={{ fontSize: "18px", flexShrink: 0 }}>{icon}</span>
        <div>
          <p style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "var(--text-primary)",
          }}>{label}</p>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>{sub}</p>
        </div>
      </div>
    </a>
  );
}
