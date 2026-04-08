"use client";

import WorkoutLogger from "@/components/workouts/WorkoutLogger";
import ExerciseOverview from "@/components/workouts/ExerciseOverview";
import { useWorkoutStore } from "@/store/useWorkoutStore";
import { useEffect, useState } from "react";

interface Exercise {
  id: string;
  name: string;
  category: string;
  isDefault: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  push: "#c8ff00",
  pull: "#00cfff",
  legs: "#ff6b35",
  core: "#ff3bff",
  cardio: "#ffcc00",
};

const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "var(--bg-hover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text-primary)",
  fontFamily: "Unica One, sans-serif",
  fontSize: "14px",
  outline: "none",
};

export default function WorkoutsPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("push");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"list" | "logger">("list");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [overview, setOverview] = useState<Exercise | null>(null);
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

  if (view === "logger" && sessionId) {
    return (
      <div style={{ maxWidth: "1000px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "24px" }}>Active Session</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "4px" }}>
              Select an exercise and log your sets
            </p>
          </div>
          <div
            style={{
              padding: "6px 16px",
              background: "var(--accent-glow)",
              border: "1px solid rgba(224,90,27,0.35)",
              borderRadius: "20px",
              fontSize: "12px",
              color: "var(--accent)",
              letterSpacing: "0.06em",
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
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px" }}>Workouts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "4px" }}>
            Manage exercises and start sessions
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-ghost" onClick={() => setShowAdd(true)}>
            + Add Exercise
          </button>
          <button className="btn-primary" onClick={handleStartSession}>
            ▶ Start Session
          </button>
        </div>
      </div>

      {/* Add Exercise Modal */}
      {showAdd && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="card"
            style={{ padding: "32px", width: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "20px", marginBottom: "28px" }}>
              New Exercise
            </h2>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  display: "block",
                  marginBottom: "8px",
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
                style={INPUT}
              />
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  display: "block",
                  marginBottom: "10px",
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
                      padding: "7px 16px",
                      fontSize: "12px",
                      letterSpacing: "0.04em",
                      border: "1px solid",
                      borderColor:
                        newCategory === cat
                          ? CATEGORY_COLORS[cat]
                          : "var(--border)",
                      color:
                        newCategory === cat
                          ? CATEGORY_COLORS[cat]
                          : "var(--text-secondary)",
                      background:
                        newCategory === cat
                          ? `${CATEGORY_COLORS[cat]}18`
                          : "transparent",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontFamily: "Unica One, sans-serif",
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
                Add Exercise
              </button>
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "22px" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: "7px 18px",
              fontSize: "12px",
              letterSpacing: "0.04em",
              border: "1px solid",
              borderColor: filter === cat ? "var(--accent)" : "var(--border)",
              color:
                filter === cat ? "var(--accent)" : "var(--text-secondary)",
              background:
                filter === cat ? "var(--accent-glow)" : "transparent",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "Unica One, sans-serif",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise Grid */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Loading exercises...
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
          }}
        >
          {filtered.map((exercise) => (
            <div
              key={exercise.id}
              className="card"
              onClick={() => setOverview(exercise)}
              style={{
                padding: "18px 22px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
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
              <div>
                <p style={{ fontSize: "15px", letterSpacing: "0.02em" }}>
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
                  letterSpacing: "0.1em",
                  color: CATEGORY_COLORS[exercise.category] || "var(--text-muted)",
                  border: `1px solid ${CATEGORY_COLORS[exercise.category] || "var(--border)"}`,
                  padding: "3px 10px",
                  borderRadius: "6px",
                  background: `${CATEGORY_COLORS[exercise.category] || "#888"}10`,
                }}
              >
                {exercise.category.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {overview && (
        <ExerciseOverview
          exerciseId={overview.id}
          exerciseName={overview.name}
          onClose={() => setOverview(null)}
        />
      )}
    </div>
  );
}
