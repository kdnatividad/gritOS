"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkoutStore } from "@/store/useWorkoutStore";
import { usePrefsStore } from "@/store/usePrefsStore";
import { useIsMobile } from "@/hooks/useIsMobile";

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

const LB_PLATES = [2.5, 5, 10, 25, 45];
const KG_PLATES = [1.25, 2.5, 5, 10, 20];
const BAR_LB = 45;
const BAR_KG = 20;

export default function WorkoutLogger({ exercises, sessionId, onFinish }: Props) {
  const { sets, addSet, removeSet } = useWorkoutStore();
  const { unit, toggleUnit, increment, setIncrement } = usePrefsStore();

  const isMobile = useIsMobile();

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(60);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Plates keyboard state
  const [platesMode, setPlatesMode] = useState(false);
  const [plateCounts, setPlateCounts] = useState<Record<number, number>>({});
  const [platesHistory, setPlatesHistory] = useState<number[]>([]);

  const plates = unit === "lbs" ? LB_PLATES : KG_PLATES;
  const barWeight = unit === "lbs" ? BAR_LB : BAR_KG;

  const platesWeight = useMemo(
    () => barWeight + plates.reduce((acc, p) => acc + p * (plateCounts[p] || 0) * 2, 0),
    [plateCounts, plates, barWeight]
  );

  // Sync plates weight → weight state when in plates mode
  useEffect(() => {
    if (platesMode) setWeight(platesWeight);
  }, [platesMode, platesWeight]);

  // Reset plates when exercise changes
  useEffect(() => {
    if (platesMode) resetPlates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExercise?.id]);

  // Reset plates when unit changes
  useEffect(() => {
    if (platesMode) resetPlates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  const resetPlates = () => {
    setPlateCounts({});
    setPlatesHistory([]);
  };

  const enterPlatesMode = () => {
    resetPlates();
    setWeight(unit === "lbs" ? BAR_LB : BAR_KG);
    setPlatesMode(true);
  };

  const exitPlatesMode = () => {
    setPlatesMode(false);
    resetPlates();
  };

  const addPlate = (plate: number) => {
    setPlateCounts((prev) => ({ ...prev, [plate]: (prev[plate] || 0) + 1 }));
    setPlatesHistory((prev) => [...prev, plate]);
  };

  const removePlate = (plate: number) => {
    setPlateCounts((prev) => {
      const count = prev[plate] || 0;
      if (count <= 0) return prev;
      return { ...prev, [plate]: count - 1 };
    });
  };

  const undoPlate = () => {
    const last = platesHistory[platesHistory.length - 1];
    if (last === undefined) return;
    removePlate(last);
    setPlatesHistory((prev) => prev.slice(0, -1));
  };

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

  // ── Style constants ───────────────────────────────────────────────────────

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

  // Mobile step button — no minWidth so it can't clip the card edge
  const mStepBtn: React.CSSProperties = {
    padding: "9px 12px",
    fontSize: "16px",
    background: "var(--bg-hover)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: "Inter, sans-serif",
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

  const iconBtn: React.CSSProperties = {
    background: "var(--bg-hover)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text-secondary)",
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: 1,
    padding: "7px 12px",
    fontFamily: "Inter, sans-serif",
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // On mobile: show exercise list OR logger panel, not both
  const showList = !isMobile || !selectedExercise;
  const showLogger = !isMobile || !!selectedExercise;

  return (
    <div
      style={{
        display: isMobile ? "flex" : "grid",
        flexDirection: isMobile ? "column" : undefined,
        gridTemplateColumns: isMobile ? undefined : "280px 1fr",
        gap: "12px",
        flex: isMobile ? "none" : 1,
        minHeight: isMobile ? "auto" : 0,
      }}
    >
      {/* Exercise Selector */}
      <div
        className="card"
        style={{
          display: showList ? "flex" : "none",
          flexDirection: "column",
          overflow: isMobile ? "visible" : "hidden",
          minHeight: isMobile ? "300px" : undefined,
        }}
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
        <div style={{ flex: isMobile ? "none" : 1, overflowY: isMobile ? "visible" : "auto", padding: "8px" }}>
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
      <div style={{ display: showLogger ? "flex" : "none", flexDirection: "column", gap: "12px" }}>
        {/* Mobile back button */}
        {isMobile && selectedExercise && (
          <button
            onClick={() => setSelectedExercise(null)}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "14px",
              padding: "7px 14px",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.04em",
            }}
          >
            ← Exercises
          </button>
        )}
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
                <h2 style={{ color: "var(--accent)" }}>{selectedExercise.name}</h2>
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

              {isMobile ? (
                /* ── Mobile: stacked, order depends on mode ───────────── */
                <>
                  {!platesMode ? (
                    /* Normal mode: Weight+Increment → Reps */
                    <>
                      {/* Weight label + PLATES toggle */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>WEIGHT ({unit})</span>
                        <button
                          onClick={enterPlatesMode}
                          style={{ background: "none", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer", fontSize: "11px", padding: "2px 8px", fontFamily: "Inter, sans-serif", letterSpacing: "0.04em" }}
                        >
                          PLATES
                        </button>
                      </div>
                      {/* Weight controls + increment in one row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                        <button onClick={() => setWeight((w) => Math.max(0, w - increment))} style={mStepBtn}>−{increment}</button>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(Number(e.target.value))}
                          style={{ ...numInput, flex: 1, width: 0, minWidth: 0 }}
                        />
                        <button onClick={() => setWeight((w) => w + increment)} style={mStepBtn}>+{increment}</button>
                        <div style={{ width: "1px", height: "28px", background: "var(--border)", flexShrink: 0 }} />
                        {[1, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => setIncrement(val as 1 | 5)}
                            style={{
                              padding: "8px 10px",
                              fontSize: "14px",
                              border: "1px solid",
                              borderColor: increment === val ? "var(--accent)" : "var(--border)",
                              color: increment === val ? "var(--accent)" : "var(--text-secondary)",
                              background: increment === val ? "var(--accent-glow)" : "transparent",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontFamily: "Inter, sans-serif",
                              flexShrink: 0,
                            }}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      {/* Reps */}
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>REPS</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                        <button onClick={() => setReps((r) => Math.max(1, r - 1))} style={mStepBtn}>−1</button>
                        <input
                          type="number"
                          value={reps}
                          onChange={(e) => setReps(Number(e.target.value))}
                          style={{ ...numInput, flex: 1, width: 0, minWidth: 0 }}
                        />
                        <button onClick={() => setReps((r) => r + 1)} style={mStepBtn}>+1</button>
                      </div>
                    </>
                  ) : (
                    /* Plates mode: Weight display → Plates grid → Reps */
                    <>
                      {/* Weight display */}
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>WEIGHT ({unit})</span>
                      <div style={{ textAlign: "center", padding: "9px", background: "var(--bg-hover)", borderRadius: "8px", border: "1px solid rgba(216,31,53,0.3)", marginBottom: "14px" }}>
                        <span style={{ fontSize: "26px", fontWeight: 700, color: "var(--accent)" }}>{platesWeight}</span>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "5px" }}>{unit}</span>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", letterSpacing: "0.05em" }}>
                          BAR {barWeight} + {platesWeight - barWeight}
                        </p>
                      </div>
                      {/* Plates grid */}
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(${plates.length}, 1fr)`, gap: "6px", marginBottom: "10px" }}>
                        {plates.map((plate) => {
                          const count = plateCounts[plate] || 0;
                          return (
                            <div key={plate} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                              <button onClick={() => addPlate(plate)} style={{ width: "100%", padding: "6px 0", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>+</button>
                              <div style={{ position: "relative", width: "100%" }}>
                                <div style={{ width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: plate >= 10 ? "14px" : "13px", fontWeight: 700, color: count > 0 ? "var(--accent)" : "var(--text-primary)", background: count > 0 ? "var(--accent-glow)" : "var(--bg-hover)", borderRadius: "8px", border: count > 0 ? "1px solid rgba(216,31,53,0.4)" : "1px solid var(--border)", transition: "all 0.1s" }}>
                                  {plate}
                                </div>
                                {count > 0 && (
                                  <div style={{ position: "absolute", top: "-6px", right: "-6px", background: "var(--accent)", borderRadius: "50%", width: "17px", height: "17px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff" }}>
                                    {count}
                                  </div>
                                )}
                              </div>
                              <button onClick={() => removePlate(plate)} disabled={count === 0} style={{ width: "100%", padding: "6px 0", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "6px", color: count === 0 ? "var(--text-muted)" : "var(--text-primary)", cursor: count === 0 ? "not-allowed" : "pointer", fontSize: "18px", lineHeight: 1, opacity: count === 0 ? 0.4 : 1 }}>−</button>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                        <button onClick={exitPlatesMode} style={iconBtn} title="Back to input">⌨</button>
                        <button onClick={undoPlate} disabled={platesHistory.length === 0} style={{ ...iconBtn, opacity: platesHistory.length === 0 ? 0.35 : 1, cursor: platesHistory.length === 0 ? "not-allowed" : "pointer" }} title="Undo last plate">↩</button>
                      </div>
                      {/* Reps */}
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>REPS</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                        <button onClick={() => setReps((r) => Math.max(1, r - 1))} style={mStepBtn}>−1</button>
                        <input
                          type="number"
                          value={reps}
                          onChange={(e) => setReps(Number(e.target.value))}
                          style={{ ...numInput, flex: 1, width: 0, minWidth: 0 }}
                        />
                        <button onClick={() => setReps((r) => r + 1)} style={mStepBtn}>+1</button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* ── Desktop: 2-col grid ──────────────────────────────── */
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "18px" }}>
                    {/* Weight */}
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em", display: "block", marginBottom: "10px" }}>
                        WEIGHT ({unit})
                        {!platesMode && (
                          <button
                            onClick={enterPlatesMode}
                            style={{ marginLeft: "10px", background: "none", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer", fontSize: "11px", padding: "1px 7px", fontFamily: "Inter, sans-serif", letterSpacing: "0.04em", verticalAlign: "middle" }}
                          >
                            PLATES
                          </button>
                        )}
                      </label>
                      {platesMode ? (
                        <div style={{ textAlign: "center", padding: "9px 8px", background: "var(--bg-hover)", borderRadius: "8px", border: "1px solid rgba(216,31,53,0.3)" }}>
                          <span style={{ fontSize: "26px", fontWeight: 700, color: "var(--accent)" }}>{platesWeight}</span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "5px" }}>{unit}</span>
                          <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", letterSpacing: "0.05em" }}>BAR {barWeight} + {platesWeight - barWeight}</p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button onClick={() => setWeight((w) => Math.max(0, w - increment))} style={stepBtn}>−{increment}</button>
                          <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} style={numInput} />
                          <button onClick={() => setWeight((w) => w + increment)} style={stepBtn}>+{increment}</button>
                        </div>
                      )}
                    </div>
                    {/* Reps */}
                    <div>
                      <label style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em", display: "block", marginBottom: "10px" }}>REPS</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button onClick={() => setReps((r) => Math.max(1, r - 1))} style={stepBtn}>−1</button>
                        <input type="number" value={reps} onChange={(e) => setReps(Number(e.target.value))} style={numInput} />
                        <button onClick={() => setReps((r) => r + 1)} style={stepBtn}>+1</button>
                      </div>
                    </div>
                  </div>

                  {/* Plates keyboard — desktop */}
                  {platesMode && (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(${plates.length}, 1fr)`, gap: "6px", marginBottom: "10px" }}>
                        {plates.map((plate) => {
                          const count = plateCounts[plate] || 0;
                          return (
                            <div key={plate} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                              <button onClick={() => addPlate(plate)} style={{ width: "100%", padding: "6px 0", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>+</button>
                              <div style={{ position: "relative", width: "100%" }}>
                                <div style={{ width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: plate >= 10 ? "14px" : "13px", fontWeight: 700, color: count > 0 ? "var(--accent)" : "var(--text-primary)", background: count > 0 ? "var(--accent-glow)" : "var(--bg-hover)", borderRadius: "8px", border: count > 0 ? "1px solid rgba(216,31,53,0.4)" : "1px solid var(--border)", transition: "all 0.1s" }}>
                                  {plate}
                                </div>
                                {count > 0 && (
                                  <div style={{ position: "absolute", top: "-6px", right: "-6px", background: "var(--accent)", borderRadius: "50%", width: "17px", height: "17px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff" }}>
                                    {count}
                                  </div>
                                )}
                              </div>
                              <button onClick={() => removePlate(plate)} disabled={count === 0} style={{ width: "100%", padding: "6px 0", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "6px", color: count === 0 ? "var(--text-muted)" : "var(--text-primary)", cursor: count === 0 ? "not-allowed" : "pointer", fontSize: "18px", lineHeight: 1, opacity: count === 0 ? 0.4 : 1 }}>−</button>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <button onClick={exitPlatesMode} style={iconBtn} title="Back to input">⌨</button>
                        <button onClick={undoPlate} disabled={platesHistory.length === 0} style={{ ...iconBtn, opacity: platesHistory.length === 0 ? 0.35 : 1, cursor: platesHistory.length === 0 ? "not-allowed" : "pointer" }} title="Undo last plate">↩</button>
                      </div>
                    </div>
                  )}

                  {/* Increment selector — desktop only, hidden in plates mode */}
                  {!platesMode && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>INCREMENT:</span>
                      {[1, 5].map((val) => (
                        <button key={val} onClick={() => setIncrement(val as 1 | 5)} style={{ padding: "6px 16px", fontSize: "14px", border: "1px solid", borderColor: increment === val ? "var(--accent)" : "var(--border)", color: increment === val ? "var(--accent)" : "var(--text-secondary)", background: increment === val ? "var(--accent-glow)" : "transparent", borderRadius: "6px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                          {val}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

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
                <h3 style={{ marginBottom: "14px" }}>Logged Sets</h3>
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

        <button className="btn-ghost" onClick={onFinish} style={{ marginTop: "auto" }}>
          Finish Session
        </button>
      </div>
    </div>
  );
}
