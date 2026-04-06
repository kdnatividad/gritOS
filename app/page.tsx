"use client";

import { useEffect, useState } from "react";

interface StatData {
  totalWorkouts: number;
  totalSets: number;
  mostUsedExercise: string;
  recentSessions: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatData>({
    totalWorkouts: 0,
    totalSets: 0,
    mostUsedExercise: "—",
    recentSessions: [],
  });

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((sessions) => {
        const totalSets = sessions.reduce(
          (acc: number, s: any) => acc + (s.sets?.length || 0),
          0,
        );
        const exerciseCount: Record<string, number> = {};
        sessions.forEach((s: any) => {
          s.sets?.forEach((set: any) => {
            const name = set.exercise?.name || "Unknown";
            exerciseCount[name] = (exerciseCount[name] || 0) + 1;
          });
        });
        const mostUsed =
          Object.entries(exerciseCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "—";
        setStats({
          totalWorkouts: sessions.length,
          totalSets,
          mostUsedExercise: mostUsed,
          recentSessions: sessions.slice(0, 5),
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "36px", color: "var(--text-primary)" }}>
          DASHBOARD
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <StatCard
          label="Total Workouts"
          value={stats.totalWorkouts}
          unit="sessions"
        />
        <StatCard
          label="Total Sets Logged"
          value={stats.totalSets}
          unit="sets"
        />
        <StatCard
          label="Top Exercise"
          value={stats.mostUsedExercise}
          unit=""
          isText
        />
      </div>

      <div className="card" style={{ padding: "24px" }}>
        <h2
          style={{
            fontSize: "18px",
            marginBottom: "16px",
            color: "var(--text-secondary)",
          }}
        >
          RECENT ACTIVITY
        </h2>
        {stats.recentSessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--text-muted)",
            }}
          >
            <p style={{ fontSize: "32px", marginBottom: "8px" }}>◎</p>
            <p>No workouts logged yet.</p>
            <p style={{ marginTop: "4px", fontSize: "12px" }}>
              Head to <span style={{ color: "var(--accent)" }}>Workouts</span>{" "}
              to start your first session.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {stats.recentSessions.map((session: any) => (
              <div
                key={session.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "var(--bg-hover)",
                  borderRadius: "2px",
                  borderLeft: "2px solid var(--accent)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {session.plan?.name || "Open Session"}
                  </p>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      marginTop: "2px",
                    }}
                  >
                    {session.sets?.length || 0} sets logged
                  </p>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                  {new Date(session.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        <a href="/workouts" style={{ textDecoration: "none" }}>
          <div
            className="card"
            style={{
              padding: "20px",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            <p style={{ fontSize: "24px", marginBottom: "8px" }}>◈</p>
            <h3 style={{ fontSize: "16px", color: "var(--text-primary)" }}>
              START WORKOUT
            </h3>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              Log a new session
            </p>
          </div>
        </a>
        <a href="/analytics" style={{ textDecoration: "none" }}>
          <div
            className="card"
            style={{
              padding: "20px",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            <p style={{ fontSize: "24px", marginBottom: "8px" }}>◎</p>
            <h3 style={{ fontSize: "16px", color: "var(--text-primary)" }}>
              VIEW ANALYTICS
            </h3>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              Track your progress
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  isText,
}: {
  label: string;
  value: string | number;
  unit: string;
  isText?: boolean;
}) {
  return (
    <div className="card" style={{ padding: "20px" }}>
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          letterSpacing: "0.12em",
          marginBottom: "8px",
          fontFamily: "Barlow Condensed, sans-serif",
        }}
      >
        {label.toUpperCase()}
      </p>
      <p
        style={{
          fontSize: isText ? "20px" : "36px",
          fontFamily: "Barlow Condensed, sans-serif",
          fontWeight: 700,
          color: "var(--accent)",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {unit && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-secondary)",
            marginTop: "4px",
          }}
        >
          {unit}
        </p>
      )}
    </div>
  );
}
