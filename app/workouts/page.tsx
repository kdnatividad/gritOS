"use client";

import ExerciseDetail from "@/components/workouts/ExerciseDetail";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useEffect, useState } from "react";

interface Exercise {
  id: string;
  name: string;
  category: string;
  isDefault: boolean;
}

interface PlanItem {
  id: string;
  exercise: Exercise;
  order: number;
}

interface Plan {
  id: string;
  name: string;
  type: string;
  items: PlanItem[];
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
  const isMobile = useIsMobile();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"exercises" | "plans">("exercises");

  // Exercise state
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("push");
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [renameTarget, setRenameTarget] = useState<Exercise | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [planDetail, setPlanDetail] = useState<Plan | null>(null);
  const [planSearch, setPlanSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/exercises").then((r) => r.json()).catch(() => []),
      fetch("/api/plans").then((r) => r.json()).catch(() => []),
    ]).then(([exData, plData]) => {
      setExercises(Array.isArray(exData) ? exData : []);
      setPlans(Array.isArray(plData) ? plData : []);
      setLoading(false);
    });
  }, []);

  // ── Exercise handlers ─────────────────────────────────────────────────────

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
    setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setRenameTarget(null);
    setRenameName("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/exercises/${deleteTarget.id}`, { method: "DELETE" });
    setExercises((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // ── Plan handlers ─────────────────────────────────────────────────────────

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) return;
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPlanName.trim() }),
    });
    const plan = await res.json();
    setPlans((prev) => [plan, ...prev]);
    setNewPlanName("");
    setShowNewPlan(false);
  };

  const handleDeletePlan = async (id: string) => {
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
    setPlans((prev) => prev.filter((p) => p.id !== id));
    if (planDetail?.id === id) setPlanDetail(null);
  };

  const handleAddExerciseToPlan = async (planId: string, exerciseId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (plan?.items.some((item) => item.exercise.id === exerciseId)) return;
    const res = await fetch(`/api/plans/${planId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId }),
    });
    const item = await res.json();
    const updatedPlan = { ...plan!, items: [...plan!.items, item] };
    setPlans((prev) => prev.map((p) => (p.id === planId ? updatedPlan : p)));
    setPlanDetail(updatedPlan);
  };

  const handleRemoveExerciseFromPlan = async (planId: string, itemId: string) => {
    await fetch(`/api/plans/${planId}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    const plan = plans.find((p) => p.id === planId)!;
    const updatedPlan = { ...plan, items: plan.items.filter((i) => i.id !== itemId) };
    setPlans((prev) => prev.map((p) => (p.id === planId ? updatedPlan : p)));
    setPlanDetail(updatedPlan);
  };

  const categories = ["all", "push", "pull", "legs", "core", "cardio"];
  const filteredExercises =
    filter === "all" ? exercises : exercises.filter((e) => e.category === filter);

  const planDetailSearched = exercises.filter((e) =>
    e?.name?.toLowerCase().includes(planSearch.toLowerCase())
  );

  // ── Exercise detail view ──────────────────────────────────────────────────

  if (detail) {
    return (
      <div style={{ height: isMobile ? "auto" : "100%", display: "flex", flexDirection: "column" }}>
        <ExerciseDetail exercise={detail} onClose={() => setDetail(null)} />
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "flex-start",
          gap: isMobile ? "14px" : "0",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: isMobile ? "24px" : undefined }}>Workouts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Manage exercises and plans
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", width: isMobile ? "100%" : "auto" }}>
          {tab === "exercises" && (
            <button
              className="btn-ghost"
              onClick={() => setShowAdd(true)}
              style={{ flex: isMobile ? 1 : undefined, fontSize: "14px", padding: "9px 16px" }}
            >
              + Add Exercise
            </button>
          )}
          {tab === "plans" && (
            <button
              className="btn-ghost"
              onClick={() => setShowNewPlan(true)}
              style={{ flex: isMobile ? 1 : undefined, fontSize: "14px", padding: "9px 16px" }}
            >
              + New Plan
            </button>
          )}
        </div>
      </div>

      {/* Tab toggle */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "18px" }}>
        {(["exercises", "plans"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px",
              fontSize: "13px",
              letterSpacing: "0.08em",
              fontFamily: "Inter, sans-serif",
              textTransform: "uppercase",
              border: "1px solid",
              borderColor: tab === t ? "var(--accent)" : "var(--border)",
              color: tab === t ? "var(--accent)" : "var(--text-secondary)",
              background: tab === t ? "var(--accent-glow)" : "transparent",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── EXERCISES TAB ── */}
      {tab === "exercises" && (
        <>
          {/* Category filter */}
          <div className="filter-scroll" style={{ marginBottom: "18px", paddingBottom: "2px" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: "7px 16px",
                  fontSize: "13px",
                  letterSpacing: "0.04em",
                  border: "1px solid",
                  borderColor: filter === cat ? "var(--accent)" : "var(--border)",
                  color: filter === cat ? "var(--accent)" : "var(--text-secondary)",
                  background: filter === cat ? "var(--accent-glow)" : "transparent",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "Inter, sans-serif",
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Exercise grid */}
          {loading ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading exercises...</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                gap: "8px",
              }}
            >
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="card"
                  onClick={() => setDetail(exercise)}
                  style={{
                    padding: isMobile ? "14px 16px" : "18px 22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {exercise.name}
                    </p>
                    {exercise.isDefault && (
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", letterSpacing: "0.08em" }}>
                        DEFAULT
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "8px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        color: CATEGORY_COLORS[exercise.category] || "var(--text-muted)",
                        border: `1px solid ${CATEGORY_COLORS[exercise.category] || "var(--border)"}`,
                        padding: "3px 9px",
                        borderRadius: "5px",
                        background: `${CATEGORY_COLORS[exercise.category] || "#888"}10`,
                        textTransform: "uppercase",
                      }}
                    >
                      {exercise.category}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenameTarget(exercise); setRenameName(exercise.name); }}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "6px", fontSize: "15px", lineHeight: 1 }}
                      title="Rename"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(exercise); }}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "6px", fontSize: "15px", lineHeight: 1 }}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── PLANS TAB ── */}
      {tab === "plans" && (
        <>
          {loading ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading plans...</p>
          ) : plans.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "var(--text-muted)",
                paddingTop: "60px",
              }}
            >
              <p style={{ fontSize: "28px" }}>◫</p>
              <p style={{ fontSize: "16px" }}>No plans yet</p>
              <button className="btn-ghost" onClick={() => setShowNewPlan(true)}>
                + Create your first plan
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                gap: "8px",
              }}
            >
              {plans.map((plan) => (
                <div key={plan.id} className="card" style={{ padding: isMobile ? "16px" : "20px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div
                      style={{ cursor: "pointer", flex: 1 }}
                      onClick={() => { setPlanDetail(plan); setPlanSearch(""); }}
                    >
                      <p style={{ fontSize: "16px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                        {plan.name}
                      </p>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>
                        {plan.items.length} exercise{plan.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px 6px", fontSize: "14px", lineHeight: 1 }}
                      title="Delete plan"
                    >
                      ✕
                    </button>
                  </div>

                  {plan.items.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {plan.items.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          onClick={() => { setPlanDetail(plan); setPlanSearch(""); }}
                          style={{
                            fontSize: "11px",
                            padding: "3px 9px",
                            borderRadius: "5px",
                            background: "var(--bg-hover)",
                            color: "var(--text-secondary)",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                        >
                          {item.exercise?.name}
                        </span>
                      ))}
                      {plan.items.length > 4 && (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", padding: "3px 6px" }}>
                          +{plan.items.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} isMobile={isMobile}>
          <h2 style={{ marginBottom: "24px" }}>New Exercise</h2>
          <div style={{ marginBottom: "18px" }}>
            <Label>EXERCISE NAME</Label>
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
          <div style={{ marginBottom: "24px" }}>
            <Label>CATEGORY</Label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["push", "pull", "legs", "core", "cardio"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNewCategory(cat)}
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    letterSpacing: "0.04em",
                    border: "1px solid",
                    borderColor: newCategory === cat ? CATEGORY_COLORS[cat] : "var(--border)",
                    color: newCategory === cat ? CATEGORY_COLORS[cat] : "var(--text-secondary)",
                    background: newCategory === cat ? `${CATEGORY_COLORS[cat]}18` : "transparent",
                    borderRadius: "8px",
                    cursor: "pointer",
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
            <button className="btn-primary" onClick={handleAdd} style={{ flex: 1 }}>Add Exercise</button>
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {showNewPlan && (
        <Modal onClose={() => setShowNewPlan(false)} isMobile={isMobile}>
          <h2 style={{ marginBottom: "20px" }}>New Plan</h2>
          <Label>PLAN NAME</Label>
          <input
            type="text"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreatePlan()}
            placeholder="e.g. Push Day"
            autoFocus
            style={{ ...INPUT, marginBottom: "20px" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn-primary" onClick={handleCreatePlan} style={{ flex: 1 }}>Create Plan</button>
            <button className="btn-ghost" onClick={() => setShowNewPlan(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Plan Detail Modal */}
      {planDetail && (
        <Modal onClose={() => setPlanDetail(null)} isMobile={isMobile} wide={!isMobile}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px" }}>
            <h2 style={{ fontSize: isMobile ? "18px" : undefined }}>{planDetail.name}</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Exercises in plan — tap to log */}
            <div>
              <Label>IN PLAN ({planDetail.items.length})</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                {planDetail.items.length === 0 && (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No exercises yet. Add from below.</p>
                )}
                {planDetail.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "9px 13px",
                      background: "var(--bg-hover)",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                    onClick={() => { setPlanDetail(null); setDetail(item.exercise); }}
                  >
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                        {item.exercise?.name}
                      </p>
                      <p style={{ fontSize: "11px", color: CATEGORY_COLORS[item.exercise?.category] || "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>
                        {item.exercise?.category}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Log →</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveExerciseFromPlan(planDetail.id, item.id); }}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px", padding: "4px 8px" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add exercises */}
            <div>
              <Label>ADD EXERCISES</Label>
              <input
                type="text"
                placeholder="Search exercises..."
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                style={{ ...INPUT, marginTop: "8px", marginBottom: "8px" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "220px", overflowY: "auto" }}>
                {planDetailSearched.map((ex) => {
                  const inPlan = planDetail.items.some((i) => i.exercise.id === ex.id);
                  return (
                    <div
                      key={ex.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 12px",
                        borderRadius: "7px",
                        background: inPlan ? "var(--accent-glow)" : "var(--bg-hover)",
                      }}
                    >
                      <p style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em", color: inPlan ? "var(--accent)" : "var(--text-primary)" }}>
                        {ex?.name}
                      </p>
                      {!inPlan ? (
                        <button
                          onClick={() => handleAddExerciseToPlan(planDetail.id, ex.id)}
                          style={{
                            background: "none",
                            border: "1px solid var(--border)",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            fontSize: "18px",
                            lineHeight: 1,
                            padding: "2px 10px",
                            borderRadius: "5px",
                          }}
                        >
                          +
                        </button>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--accent)" }}>✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {renameTarget && (
        <Modal onClose={() => setRenameTarget(null)} isMobile={isMobile}>
          <h2 style={{ marginBottom: "20px" }}>Rename Exercise</h2>
          <input
            type="text"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
            style={{ ...INPUT, marginBottom: "18px" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn-primary" onClick={handleRename} style={{ flex: 1 }}>Save</button>
            <button className="btn-ghost" onClick={() => setRenameTarget(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)} isMobile={isMobile}>
          <h2 style={{ marginBottom: "12px" }}>Delete Exercise</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "15px" }}>
            Delete <strong style={{ color: "var(--text-primary)" }}>{deleteTarget.name}</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleDelete}
              style={{
                flex: 1,
                padding: "11px",
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
            <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Shared UI helpers ──────────────────────────────────────────────────── */

function Modal({
  children,
  onClose,
  wide,
  isMobile,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
  isMobile?: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          padding: isMobile ? "24px 20px 32px" : "32px",
          width: isMobile ? "100%" : wide ? "680px" : "420px",
          maxWidth: "100%",
          maxHeight: isMobile ? "90vh" : "85vh",
          overflowY: "auto",
          borderRadius: isMobile ? "20px 20px 0 0" : "14px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "12px",
        color: "var(--text-muted)",
        letterSpacing: "0.1em",
        marginBottom: "8px",
      }}
    >
      {children}
    </p>
  );
}
