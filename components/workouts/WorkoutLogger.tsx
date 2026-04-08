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

const CATEGORY_COLORS: Record<string, string> = {
  push: "#c8ff00",
  pull: "#00cfff",
  legs: "#ff6b35",
  core: "#ff3bff",
  cardio: "#ffcc00",
};

export default function WorkoutLogger({ exercises, sessionId, onFinish }: Props) {
  const { sets, addSet, removeSet } = useWorkoutStore();
  const { unit, toggleUnit, increment, setIncrement } = usePrefsStore();

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(60);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const stepBtn: React.CSSProperties = {
    padding: "9px 14px",
    fontSize: "16px",
    background: "var(--bg-hover)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    cursor: "pointer",
    minWidth: "52px",
    fontFamily: "Inter, sans-serif",
    transition: "border-color 0.15s",
  };

  const numInput: React.CSSProperties = {
    padding: "9px 12px",
    background: "var(--bg-hover)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text-primary)",
    fontFamily: "Inter, sans-serif",
    fontSize: "20px",
    fontWeight: 600,
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
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Exercise Selector */}
      <div
        className="card"
        style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 13px",
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
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
                  padding: "10px 13px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: isSelected ? "var(--accent-glow)" : "transparent",
                  border: isSelected
                    ? "1px solid rgba(216,31,53,0.3)"
                    : "1px solid transparent",
                  marginBottom: "3px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.1s",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                      textTransform: "uppercase",
                      color: isSelected ? "var(--accent)" : "var(--text-primary)",
                    }}
                  >
                    {ex.name}
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: CATEGORY_COLORS[ex.category] || "var(--text-muted)",
                      marginTop: "2px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {ex.category}
                  </p>
                </div>
                {exSets > 0 && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--accent)",
                      background: "var(--accent-glow)",
                      padding: "2px 8px",
                      borderRadius: "6px",
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
              gap: "10px",
              color: "var(--text-muted)",
            }}
          >
            <p style={{ fontSize: "28px" }}>◈</p>
            <p style={{ fontSize: "13px" }}>Select an exercise to start logging</p>
          </div>
        ) : (
          <>
            {/* Exercise header */}
            <div
              className="card"
              style={{
                padding: "16px 22px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ color: "var(--accent)" }}>
                  {selectedExercise.name}
                </h2>
                <p style={{ fontSize: "16px", color: "var(--text-muted)", marginTop: "3px" }}>
                  {exerciseSets.length} sets logged this session
                </p>
              </div>
              <button
                onClick={toggleUnit}
                style={{
                  padding: "9px 18px",
                  fontSize: "16px",
                  letterSpacing: "0.06em",
                  border: "1px solid rgba(216,31,53,0.4)",
                  color: "var(--accent)",
                  background: "var(--accent-glow)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {unit.toUpperCase()}
              </button>
            </div>

            {/* Input panel */}
            <div className="card" style={{ padding: "22px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  marginBottom: "18px",
                }}
              >
                {/* Weight */}
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      letterSpacing: "0.1em",
                      display: "block",
                      marginBottom: "10px",
                    }}
                  >
                    WEIGHT ({unit})
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => setWeight((w) => Math.max(0, w - increment))}
                      style={stepBtn}
                    >
                      −{increment}
                    </button>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      style={numInput}
                    />
                    <button
                      onClick={() => setWeight((w) => w + increment)}
                      style={stepBtn}
                    >
                      +{increment}
                    </button>
                  </div>
                </div>

                {/* Reps */}
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      letterSpacing: "0.1em",
                      display: "block",
                      marginBottom: "10px",
                    }}
                  >
                    REPS
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => setReps((r) => Math.max(1, r - 1))}
                      style={stepBtn}
                    >
                      −1
                    </button>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(Number(e.target.value))}
                      style={numInput}
                    />
                    <button onClick={() => setReps((r) => r + 1)} style={stepBtn}>
                      +1
                    </button>
                  </div>
                </div>
              </div>

              {/* Increment selector */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                  INCREMENT:
                </span>
                {[1, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setIncrement(val as 1 | 5)}
                    style={{
                      padding: "6px 16px",
                      fontSize: "14px",
                      border: "1px solid",
                      borderColor: increment === val ? "var(--accent)" : "var(--border)",
                      color: increment === val ? "var(--accent)" : "var(--text-secondary)",
                      background: increment === val ? "var(--accent-glow)" : "transparent",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Notes */}
              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  ...numInput,
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: 400,
                  marginBottom: "16px",
                  textAlign: "left",
                  padding: "10px 14px",
                }}
              />

              <button
                className="btn-primary"
                onClick={handleLogSet}
                disabled={saving}
                style={{ width: "100%", padding: "13px", fontSize: "16px" }}
              >
                {saving ? "Saving..." : `Log Set ${exerciseSets.length + 1}`}
              </button>
            </div>

            {/* Logged sets */}
            {exerciseSets.length > 0 && (
              <div className="card" style={{ padding: "18px 22px" }}>
                <h3 style={{ marginBottom: "14px" }}>
                  Logged Sets
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {exerciseSets.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 14px",
                        background: "var(--bg-hover)",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                        Set {s.setNumber}
                      </span>
                      <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--accent)" }}>
                        {s.weight}{s.unit} × {s.reps}
                      </span>
                      <button
                        onClick={() => removeSet(s.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "16px",
                          lineHeight: 1,
                          padding: "2px 4px",
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
          Finish Session
        </button>
      </div>
    </div>
  );
}
