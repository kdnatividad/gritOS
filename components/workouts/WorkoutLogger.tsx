"use client";

import { useState } from "react";
import { useWorkoutStore } from "@/store/useWorkoutStore";
import { usePrefsStore } from "@/store/usePrefsStore";

interface Exercise {
  id: string;
  name: string;
  category: string;
}

interface Props {
  exercises: Exercise[];
  sessionId: string;
  onFinish: () => void;
}

export default function WorkoutLogger({
  exercises,
  sessionId,
  onFinish,
}: Props) {
  const { sets, addSet, removeSet } = useWorkoutStore();
  const { unit, toggleUnit, increment, setIncrement } = usePrefsStore();

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(60);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );

  const categoryColor: Record<string, string> = {
    push: "#c8ff00",
    pull: "#00cfff",
    legs: "#ff6b35",
    core: "#ff3bff",
    cardio: "#ffcc00",
  };

  const handleLogSet = async () => {
    if (!selectedExercise) return;
    setSaving(true);
    const setNumber =
      sets.filter((s) => s.exerciseId === selectedExercise.id).length + 1;
    const res = await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        exerciseId: selectedExercise.id,
        reps,
        weight,
        unit,
        setNumber,
        notes: notes || null,
      }),
    });
    const saved = await res.json();
    addSet({
      id: saved.id,
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      reps,
      weight,
      unit,
      setNumber,
      notes,
    });
    setNotes("");
    setSaving(false);
  };

  const exerciseSets = selectedExercise
    ? sets.filter((s) => s.exerciseId === selectedExercise.id)
    : [];

  const btnStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontFamily: "Barlow Condensed, sans-serif",
    fontWeight: 700,
    fontSize: "14px",
    background: "var(--bg-hover)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    borderRadius: "2px",
    cursor: "pointer",
    minWidth: "48px",
  };

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    background: "var(--bg-hover)",
    border: "1px solid var(--border)",
    borderRadius: "2px",
    color: "var(--text-primary)",
    fontFamily: "Barlow Condensed, sans-serif",
    fontSize: "18px",
    fontWeight: 700,
    textAlign: "center",
    outline: "none",
    width: "80px",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: "16px",
        height: "600px",
      }}
    >
      {/* Exercise Selector */}
      <div
        className="card"
        style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div
          style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}
        >
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: "2px",
              color: "var(--text-primary)",
              fontFamily: "Barlow, sans-serif",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {filtered.map((ex) => {
            const isSelected = selectedExercise?.id === ex.id;
            const exSets = sets.filter((s) => s.exerciseId === ex.id).length;
            return (
              <div
                key={ex.id}
                onClick={() => setSelectedExercise(ex)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "2px",
                  cursor: "pointer",
                  background: isSelected
                    ? "var(--accent-glow)"
                    : "transparent",
                  borderLeft: isSelected
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                  marginBottom: "2px",
                  transition: "all 0.1s",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontWeight: 600,
                      fontSize: "13px",
                      letterSpacing: "0.04em",
                      color: isSelected
                        ? "var(--accent)"
                        : "var(--text-primary)",
                    }}
                  >
                    {ex.name}
                  </p>
                  <p
                    style={{
                      fontSize: "10px",
                      color: categoryColor[ex.category] || "var(--text-muted)",
                      marginTop: "1px",
                    }}
                  >
                    {ex.category.toUpperCase()}
                  </p>
                </div>
                {exSets > 0 && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontWeight: 700,
                      color: "var(--accent)",
                      background: "var(--accent-glow)",
                      padding: "2px 6px",
                      borderRadius: "2px",
                    }}
                  >
                    {exSets}s
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Logger Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {!selectedExercise ? (
          <div
            className="card"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "8px",
              color: "var(--text-muted)",
            }}
          >
            <p style={{ fontSize: "32px" }}>◈</p>
            <p>Select an exercise to start logging</p>
          </div>
        ) : (
          <>
            <div
              className="card"
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ fontSize: "22px", color: "var(--accent)" }}>
                  {selectedExercise.name}
                </h2>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  {exerciseSets.length} sets logged this session
                </p>
              </div>
              <button
                onClick={toggleUnit}
                style={{
                  padding: "6px 14px",
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontWeight: 700,
                  fontSize: "13px",
                  letterSpacing: "0.1em",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  background: "transparent",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                {unit.toUpperCase()}
              </button>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      letterSpacing: "0.1em",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    WEIGHT ({unit})
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() =>
                        setWeight((w) => Math.max(0, w - increment))
                      }
                      style={btnStyle}
                    >
                      −{increment}
                    </button>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      style={inputStyle}
                    />
                    <button
                      onClick={() => setWeight((w) => w + increment)}
                      style={btnStyle}
                    >
                      +{increment}
                    </button>
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      letterSpacing: "0.1em",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    REPS
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() => setReps((r) => Math.max(1, r - 1))}
                      style={btnStyle}
                    >
                      −1
                    </button>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(Number(e.target.value))}
                      style={inputStyle}
                    />
                    <button
                      onClick={() => setReps((r) => r + 1)}
                      style={btnStyle}
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    letterSpacing: "0.1em",
                  }}
                >
                  INCREMENT:
                </span>
                {[1, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setIncrement(val as 1 | 5)}
                    style={{
                      padding: "4px 12px",
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontWeight: 600,
                      fontSize: "12px",
                      letterSpacing: "0.08em",
                      border: "1px solid",
                      borderColor:
                        increment === val ? "var(--accent)" : "var(--border)",
                      color:
                        increment === val
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                      background: "transparent",
                      borderRadius: "2px",
                      cursor: "pointer",
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ ...inputStyle, width: "100%", marginBottom: "16px" }}
              />

              <button
                className="btn-primary"
                onClick={handleLogSet}
                disabled={saving}
                style={{ width: "100%", padding: "12px", fontSize: "16px" }}
              >
                {saving ? "SAVING..." : `LOG SET ${exerciseSets.length + 1}`}
              </button>
            </div>

            {exerciseSets.length > 0 && (
              <div className="card" style={{ padding: "16px 20px" }}>
                <h3
                  style={{
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    marginBottom: "12px",
                  }}
                >
                  LOGGED SETS
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {exerciseSets.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: "var(--bg-hover)",
                        borderRadius: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Barlow Condensed, sans-serif",
                          color: "var(--text-muted)",
                          fontSize: "13px",
                        }}
                      >
                        SET {s.setNumber}
                      </span>
                      <span
                        style={{
                          fontFamily: "Barlow Condensed, sans-serif",
                          fontWeight: 700,
                          color: "var(--accent)",
                        }}
                      >
                        {s.weight}
                        {s.unit} × {s.reps}
                      </span>
                      <button
                        onClick={() => removeSet(s.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "16px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <button
          className="btn-ghost"
          onClick={onFinish}
          style={{ marginTop: "auto" }}
        >
          FINISH SESSION
        </button>
      </div>
    </div>
  );
}
