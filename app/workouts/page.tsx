"use client";

import WorkoutLogger from "@/components/workouts/WorkoutLogger";
import { useWorkoutStore } from "@/store/useWorkoutStore";
import { useEffect, useState } from "react";

interface Exercise {
  id: string;
  name: string;
  category: string;
  isDefault: boolean;
}

export default function WorkoutsPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("push");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"list" | "logger">("list");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { startSession, endSession } = useWorkoutStore();

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((data) => {
        setExercises(data);
        setLoading(false);
      });
  }, []);

  const handleStartSession = async () => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const session = await res.json();
    setSessionId(session.id);
    startSession(session.id);
    setView("logger");
  };

  const handleFinish = () => {
    endSession();
    setSessionId(null);
    setView("list");
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), category: newCategory }),
    });
    const created = await res.json();
    setExercises((prev) => [...prev, created]);
    setNewName("");
    setNewCategory("push");
    setShowAdd(false);
  };

  const categories = ["all", "push", "pull", "legs", "core", "cardio"];
  const filtered =
    filter === "all"
      ? exercises
      : exercises.filter((e) => e.category === filter);
  const categoryColor: Record<string, string> = {
    push: "#c8ff00",
    pull: "#00cfff",
    legs: "#ff6b35",
    core: "#ff3bff",
    cardio: "#ffcc00",
  };

  if (view === "logger" && sessionId) {
    return (
      <div style={{ maxWidth: "1000px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "36px" }}>ACTIVE SESSION</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
              Select an exercise and log your sets
            </p>
          </div>
          <div
            style={{
              padding: "6px 14px",
              background: "var(--accent-glow)",
              border: "1px solid var(--accent)",
              borderRadius: "2px",
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 700,
              fontSize: "12px",
              color: "var(--accent)",
              letterSpacing: "0.1em",
            }}
          >
            ● LIVE
          </div>
        </div>
        <WorkoutLogger
          exercises={exercises}
          sessionId={sessionId}
          onFinish={handleFinish}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "36px" }}>WORKOUTS</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
            Manage exercises and start sessions
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-ghost" onClick={() => setShowAdd(true)}>
            + ADD EXERCISE
          </button>
          <button className="btn-primary" onClick={handleStartSession}>
            ▶ START SESSION
          </button>
        </div>
      </div>

      {showAdd && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div className="card" style={{ padding: "32px", width: "400px" }}>
            <h2 style={{ fontSize: "22px", marginBottom: "24px" }}>
              NEW EXERCISE
            </h2>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                EXERCISE NAME
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="e.g. Romanian Deadlift"
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: "2px",
                  color: "var(--text-primary)",
                  fontFamily: "Barlow, sans-serif",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                CATEGORY
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["push", "pull", "legs", "core", "cardio"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    style={{
                      padding: "6px 14px",
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontWeight: 600,
                      fontSize: "12px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      border: "1px solid",
                      borderColor:
                        newCategory === cat
                          ? categoryColor[cat]
                          : "var(--border)",
                      color:
                        newCategory === cat
                          ? categoryColor[cat]
                          : "var(--text-secondary)",
                      background:
                        newCategory === cat
                          ? `${categoryColor[cat]}15`
                          : "transparent",
                      borderRadius: "2px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-primary"
                onClick={handleAdd}
                style={{ flex: 1 }}
              >
                ADD EXERCISE
              </button>
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: "6px 16px",
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "1px solid",
              borderColor: filter === cat ? "var(--accent)" : "var(--border)",
              color: filter === cat ? "var(--accent)" : "var(--text-secondary)",
              background:
                filter === cat ? "var(--accent-glow)" : "transparent",
              borderRadius: "2px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading exercises...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "8px",
          }}
        >
          {filtered.map((exercise) => (
            <div
              key={exercise.id}
              className="card"
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            >
              <div>
                <p
                  style={{
                    fontFamily: "Barlow Condensed, sans-serif",
                    fontWeight: 600,
                    fontSize: "15px",
                    letterSpacing: "0.05em",
                  }}
                >
                  {exercise.name}
                </p>
                {exercise.isDefault && (
                  <p
                    style={{
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                      letterSpacing: "0.08em",
                    }}
                  >
                    DEFAULT
                  </p>
                )}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color:
                    categoryColor[exercise.category] || "var(--text-muted)",
                  border: `1px solid ${categoryColor[exercise.category] || "var(--border)"}`,
                  padding: "2px 8px",
                  borderRadius: "2px",
                }}
              >
                {exercise.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
