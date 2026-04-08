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
  fontFamily: "Inter, sans-serif",
  fontSize: "16px",
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
  const [renameTarget, setRenameTarget] = useState<Exercise | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
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

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;
    const res = await fetch(`/api/exercises/${renameTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameName.trim() }),
    });
    const updated = await res.json();
    setExercises((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
    setRenameTarget(null);
    setRenameName("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/exercises/${deleteTarget.id}`, { method: "DELETE" });
    setExercises((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const categories = ["all", "push", "pull", "legs", "core", "cardio"];
  const filtered =
    filter === "all"
      ? exercises
      : exercises.filter((e) => e.category === filter);

  if (view === "logger" && sessionId) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1>Active Session</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginTop: "4px" }}>
              Select an exercise and log your sets
            </p>
          </div>
          <div
            style={{
              padding: "8px 18px",
              background: "var(--accent-glow)",
              border: "1px solid rgba(216,31,53,0.35)",
              borderRadius: "20px",
              fontSize: "14px",
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
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
          <h1>Workouts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginTop: "4px" }}>
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
            <h2 style={{ marginBottom: "28px" }}>
              New Exercise
            </h2>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontSize: "12px",
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
                  fontSize: "12px",
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
                      padding: "8px 18px",
                      fontSize: "14px",
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
                      fontFamily: "Inter, sans-serif",
                      textTransform: "uppercase",
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
              padding: "8px 18px",
              fontSize: "14px",
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
              fontFamily: "Inter, sans-serif",
              textTransform: "uppercase",
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
                <p style={{ fontSize: "16px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                  {exercise.name}
                </p>
                {exercise.isDefault && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "3px",
                      letterSpacing: "0.08em",
                    }}
                  >
                    DEFAULT
                  </p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    color: CATEGORY_COLORS[exercise.category] || "var(--text-muted)",
                    border: `1px solid ${CATEGORY_COLORS[exercise.category] || "var(--border)"}`,
                    padding: "4px 12px",
                    borderRadius: "6px",
                    background: `${CATEGORY_COLORS[exercise.category] || "#888"}10`,
                    textTransform: "uppercase",
                  }}
                >
                  {exercise.category}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameTarget(exercise);
                    setRenameName(exercise.name);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px 6px",
                    fontSize: "14px",
                    borderRadius: "4px",
                    lineHeight: 1,
                  }}
                  title="Rename"
                >
                  ✎
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(exercise);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px 6px",
                    fontSize: "14px",
                    borderRadius: "4px",
                    lineHeight: 1,
                  }}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
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

      {/* Rename Modal */}
      {renameTarget && (
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
          onClick={() => setRenameTarget(null)}
        >
          <div
            className="card"
            style={{ padding: "32px", width: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "24px" }}>Rename Exercise</h2>
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
              style={{ ...INPUT, marginBottom: "20px" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn-primary" onClick={handleRename} style={{ flex: 1 }}>
                Save
              </button>
              <button className="btn-ghost" onClick={() => setRenameTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
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
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="card"
            style={{ padding: "32px", width: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "12px" }}>Delete Exercise</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "28px" }}>
              Delete <strong style={{ color: "var(--text-primary)" }}>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "rgba(216,31,53,0.15)",
                  border: "1px solid rgba(216,31,53,0.4)",
                  borderRadius: "8px",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                }}
              >
                Delete
              </button>
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
