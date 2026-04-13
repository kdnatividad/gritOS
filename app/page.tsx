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

interface RecentExercise {
  exerciseId: string;
  exerciseName: string;
  category: string;
  planName: string | null;
  setCount: number;
  lastDate: string;
}

interface DashboardStats {
  totalWorkouts: number;
  totalSets: number;
  mostUsedExercise: string;
  recentExercises: RecentExercise[];
  weeklyData: { day: string; sets: number }[];
  weeklyWorkouts: number;
  streak: number;
  avgSets: number;
}

interface SetEntry {
  id: string;
  createdAt: string;
  exercise?: { name: string };
}

function buildWeeklyData(sets: SetEntry[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const result: { day: string; sets: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = days[d.getDay()];
    const dateStr = d.toDateString();
    const setsCount = sets.filter(
      (s) => new Date(s.createdAt).toDateString() === dateStr
    ).length;
    result.push({ day: label, sets: setsCount });
  }
  return result;
}

function computeStreak(sets: SetEntry[]) {
  if (!sets.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trainedDays = new Set(
    sets.map((s) => {
      const d = new Date(s.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );
  let streak = 0;
  const DAY = 86400000;
  let cursor = today.getTime();
  if (!trainedDays.has(cursor)) cursor -= DAY;
  while (trainedDays.has(cursor)) {
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
    recentExercises: [],
    weeklyData: [],
    weeklyWorkouts: 0,
    streak: 0,
    avgSets: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/sets").then((r) => r.json()).catch(() => []),
      fetch("/api/exercises/recent").then((r) => r.json()).catch(() => []),
    ]).then(([setsData, recentData]) => {
      const sets: SetEntry[] = Array.isArray(setsData) ? setsData : [];
      const recentExercises: RecentExercise[] = Array.isArray(recentData) ? recentData : [];

      const totalSets = sets.length;

      const exerciseCount: Record<string, number> = {};
      sets.forEach((s) => {
        const name = s.exercise?.name || "Unknown";
        exerciseCount[name] = (exerciseCount[name] || 0) + 1;
      });
      const mostUsed =
        Object.entries(exerciseCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

      const weeklyData = buildWeeklyData(sets);
      const weeklyWorkouts = weeklyData.filter((d) => d.sets > 0).length;
      const streak = computeStreak(sets);

      const uniqueDays = new Set(
        sets.map((s) => new Date(s.createdAt).toDateString())
      ).size;
      const avgSets = uniqueDays ? Math.round(totalSets / uniqueDays) : 0;

      setStats({
        totalWorkouts: uniqueDays,
        totalSets,
        mostUsedExercise: mostUsed,
        recentExercises,
        weeklyData,
        weeklyWorkouts,
        streak,
        avgSets,
      });
    });
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1 style={{ color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "16px", marginTop: "4px" }}>
            {today}
          </p>
        </div>
        <a href="/workouts" style={{ textDecoration: "none" }}>
          <button className="btn-primary">+ Log Exercise</button>
        </a>
      </div>

      {/* Two-column layout */}
      <div
        className="dashboard-cols"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "18px",
          alignItems: "start",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Metrics — rings */}
          <div className="card" style={{ padding: "26px 28px" }}>
            <p style={{ fontSize: "12px", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "24px", textTransform: "uppercase" }}>
              Metrics
            </p>
            <div
              className="metrics-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "8px",
              }}
            >
              <RingMetric
                value={stats.weeklyWorkouts}
                max={7}
                label="Weekly Days"
                sub="this week"
              />
              <RingMetric
                value={Math.min(stats.streak, 30)}
                max={30}
                label="Streak"
                sub={`${stats.streak} days`}
                rawLabel={stats.streak}
              />
              <RingMetric
                value={stats.totalWorkouts}
                max={Math.max(stats.totalWorkouts, 20)}
                label="Sessions"
                sub="all time"
              />
              <RingMetric
                value={stats.avgSets}
                max={Math.max(stats.avgSets, 20)}
                label="Avg Sets"
                sub="per session"
              />
              <RingMetric
                value={stats.totalSets}
                max={Math.max(stats.totalSets, 100)}
                label="Total Sets"
                sub="all time"
              />
            </div>
          </div>

          {/* Volume Chart */}
          <div className="card" style={{ padding: "26px 28px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <p style={{ fontSize: "12px", letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Sets Per Day
              </p>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  background: "var(--bg-hover)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  letterSpacing: "0.04em",
                }}
              >
                Last 7 days
              </span>
            </div>
            {stats.weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart
                  data={stats.weeklyData}
                  margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="setsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "Inter" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "Inter" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      color: "var(--text-primary)",
                    }}
                    cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                    formatter={(v) => [v ?? 0, "sets"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sets"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fill="url(#setsFill)"
                    dot={{ fill: "var(--accent)", r: 3, strokeWidth: 0 }}
                    activeDot={{ fill: "var(--accent)", r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: "160px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                  No data yet
                </p>
              </div>
            )}
          </div>

          {/* Summary stats row */}
          <div
            className="summary-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
            }}
          >
            <SummaryCard label="Days Trained" value={stats.totalWorkouts} />
            <SummaryCard label="Total Sets" value={stats.totalSets} />
            <SummaryCard label="Avg Sets / Session" value={stats.avgSets} />
            <SummaryCard
              label="Top Exercise"
              value={stats.mostUsedExercise}
              isText
            />
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Recent Exercises */}
          <div className="card" style={{ padding: "22px 24px" }}>
            <p
              style={{
                fontSize: "12px",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginBottom: "18px",
                textTransform: "uppercase",
              }}
            >
              Recent Exercises
            </p>

            {stats.recentExercises.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "36px 16px",
                  color: "var(--text-muted)",
                }}
              >
                <p style={{ fontSize: "28px", marginBottom: "8px" }}>◎</p>
                <p style={{ fontSize: "16px" }}>No sets logged yet</p>
                <p style={{ fontSize: "16px", marginTop: "6px" }}>
                  <a
                    href="/workouts"
                    style={{ color: "var(--accent)", textDecoration: "none" }}
                  >
                    Log your first set →
                  </a>
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: "12px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid var(--border)",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>EXERCISE</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>SETS</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>DATE</span>
                </div>
                {stats.recentExercises.map((ex, i) => (
                  <div
                    key={ex.exerciseId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      gap: "12px",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom:
                        i < stats.recentExercises.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    <div style={{ overflow: "hidden" }}>
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          textTransform: "uppercase",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {ex.exerciseName}
                      </p>
                      {ex.planName && (
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {ex.planName}
                        </p>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "var(--accent)",
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      {ex.setCount}
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "var(--text-muted)",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(ex.lastDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────── */

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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <div style={{ position: "relative", width: "72px", height: "72px" }}>
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="var(--bg-hover)"
            strokeWidth="5"
          />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: display > 999 ? "12px" : "18px",
              color: "var(--text-primary)",
              lineHeight: 1,
            }}
          >
            {display}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: "12px",
            letterSpacing: "0.04em",
            color: "var(--text-secondary)",
            lineHeight: 1.2,
            textTransform: "uppercase",
          }}
        >
          {label}
        </p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
          {sub}
        </p>
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
    <div className="card" style={{ padding: "18px 20px" }}>
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          marginBottom: "8px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: isText ? "18px" : "32px",
          fontWeight: 600,
          color: "var(--accent)",
          lineHeight: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </p>
    </div>
  );
}

