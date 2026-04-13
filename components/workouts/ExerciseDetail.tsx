"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefsStore } from "@/store/usePrefsStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SetRow {
  id: string;
  setNumber: number;
  reps: number;
  weight: number;
  unit: string;
  notes: string | null;
  createdAt: string;
}

interface DateGroup {
  label: string;
  dateKey: string;
  sets: SetRow[];
}

type MainTab = "sets" | "analyze" | "1rm";
type ChartTab = "weight" | "volume" | "est1rm";

interface SessionPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  est1RM: number;
  unit: string;
}

interface HistoryStats {
  lastWeight: number;
  lastDate: string | null;
  allTimePR: number;
  sessionCount: number;
  totalVolume: number;
  est1RM: number;
  bestSessionVol: number;
  unit: string;
}

// ── Plates constants ──────────────────────────────────────────────────────────

const LB_PLATES = [2.5, 5, 10, 25, 45];
const KG_PLATES = [1.25, 2.5, 5, 10, 20];
const BAR_LB = 45;
const BAR_KG = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateLabel(d: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function convertWeight(weight: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return weight;
  if (fromUnit === "kg" && toUnit === "lbs") return Math.round(weight * 2.20462);
  if (fromUnit === "lbs" && toUnit === "kg") return Math.round(weight * 0.453592 * 10) / 10;
  return weight;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  exercise: { id: string; name: string; category: string };
  onClose: () => void;
}

export default function ExerciseDetail({ exercise, onClose }: Props) {
  const { unit, toggleUnit, increment, setIncrement } = usePrefsStore();
  const isMobile = useIsMobile();

  // Tab state
  const [mainTab, setMainTab] = useState<MainTab>("sets");
  const [chartTab, setChartTab] = useState<ChartTab>("weight");

  // Sets data
  const [sets, setSets] = useState<SetRow[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);

  // History / analyze data
  const [sessions, setSessions] = useState<SessionPoint[]>([]);
  const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Log form state
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState(() => unit === "lbs" ? 135 : 60);
  const [reps, setReps] = useState(10);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Plates state
  const [platesMode, setPlatesMode] = useState(false);
  const [plateCounts, setPlateCounts] = useState<Record<number, number>>({});
  const [platesHistory, setPlatesHistory] = useState<number[]>([]);

  const plates = unit === "lbs" ? LB_PLATES : KG_PLATES;
  const barWeight = unit === "lbs" ? BAR_LB : BAR_KG;
  const platesWeight = useMemo(
    () => barWeight + plates.reduce((acc, p) => acc + p * (plateCounts[p] || 0) * 2, 0),
    [plateCounts, plates, barWeight]
  );

  useEffect(() => { if (platesMode) setWeight(platesWeight); }, [platesMode, platesWeight]);

  // When unit toggles: convert normal-mode weight, or reset plates
  const prevUnitRef = useRef(unit);
  useEffect(() => {
    if (prevUnitRef.current === unit) return;
    const prev = prevUnitRef.current;
    prevUnitRef.current = unit;
    if (platesMode) {
      resetPlates();
    } else {
      setWeight((w) => convertWeight(w, prev, unit));
    }
  }, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchSets = async () => {
    const data = await fetch(`/api/sets?exerciseId=${exercise.id}`)
      .then((r) => r.json())
      .catch(() => []);
    setSets(Array.isArray(data) ? data : []);
    setLoadingSets(false);
  };

  useEffect(() => { fetchSets(); }, [exercise.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mainTab !== "analyze" && mainTab !== "1rm") return;
    if (historyLoaded) return;
    setLoadingHistory(true);
    fetch(`/api/exercises/${exercise.id}/history`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions ?? []);
        setHistoryStats(data.stats ?? null);
        setLoadingHistory(false);
        setHistoryLoaded(true);
      })
      .catch(() => setLoadingHistory(false));
  }, [mainTab, exercise.id, historyLoaded]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const dateGroups = useMemo<DateGroup[]>(() => {
    const map = new Map<string, DateGroup>();
    // sets are sorted desc from API; iterate to build groups in order
    for (const set of sets) {
      const d = new Date(set.createdAt);
      const key = d.toDateString();
      if (!map.has(key)) {
        map.set(key, { label: formatDateLabel(d), dateKey: key, sets: [] });
      }
      map.get(key)!.sets.push(set);
    }
    // Within each group, reverse so sets are ascending (1, 2, 3...)
    for (const g of map.values()) g.sets.reverse();
    return Array.from(map.values());
  }, [sets]);

  const todaySetCount = useMemo(() => {
    const todayKey = new Date().toDateString();
    return dateGroups.find((g) => g.dateKey === todayKey)?.sets.length ?? 0;
  }, [dateGroups]);

  // Chart data for Analyze tab
  const chartData = sessions.map((s) => ({
    date: fmtDate(s.date),
    value: chartTab === "weight" ? s.maxWeight : chartTab === "volume" ? s.totalVolume : s.est1RM,
  }));
  const peakIdx = chartData.reduce(
    (best, d, i) => (d.value > (chartData[best]?.value ?? -Infinity) ? i : best),
    0
  );
  const peak = chartData[peakIdx];

  // 1RM table
  const est1RM = historyStats?.est1RM ?? 0;
  const oneRMTable = Array.from({ length: 12 }, (_, i) => {
    const repCount = i + 1;
    const maxWeight = est1RM > 0 ? Math.round(est1RM / (1 + repCount / 30)) : 0;
    return { reps: repCount, maxWeight };
  });

  // ── Plates helpers ────────────────────────────────────────────────────────

  const resetPlates = () => { setPlateCounts({}); setPlatesHistory([]); };
  const enterPlatesMode = () => { resetPlates(); setWeight(barWeight); setPlatesMode(true); };
  const exitPlatesMode = () => { setPlatesMode(false); resetPlates(); };
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

  // ── Log set ───────────────────────────────────────────────────────────────

  const handleLogSet = async () => {
    setSaving(true);
    await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId: exercise.id,
        reps,
        weight: platesMode ? platesWeight : weight,
        unit,
        notes: notes || null,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setNotes("");
    setHistoryLoaded(false); // invalidate history cache
    await fetchSets();
  };

  // ── Style constants ───────────────────────────────────────────────────────

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

  const CHART_TAB_LABELS: Record<ChartTab, string> = {
    weight: "Weight",
    volume: "Volume",
    est1rm: "Est 1RM",
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "100%", position: "relative" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "14px",
            padding: "7px 12px",
            fontFamily: "Inter, sans-serif",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          ←
        </button>
        <h1 style={{ flex: 1, fontSize: isMobile ? "18px" : "22px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {exercise.name}
        </h1>
        {!isMobile && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
            style={{ fontSize: "14px", padding: "9px 18px", flexShrink: 0 }}
          >
            + Log Set
          </button>
        )}
        <button
          onClick={toggleUnit}
          style={{
            padding: "7px 14px",
            fontSize: "13px",
            letterSpacing: "0.06em",
            border: "1px solid rgba(216,31,53,0.4)",
            color: "var(--accent)",
            background: "var(--accent-glow)",
            borderRadius: "8px",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            flexShrink: 0,
          }}
        >
          {unit.toUpperCase()}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div
        className={isMobile ? undefined : "filter-scroll"}
        style={{
          marginBottom: "16px",
          gap: "6px",
          ...(isMobile
            ? { display: "flex", width: "100%" }
            : {}),
        }}
      >
        {(["sets", "analyze", "1rm"] as MainTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setMainTab(t)}
            style={{
              padding: "8px 20px",
              fontSize: "13px",
              letterSpacing: "0.08em",
              fontFamily: "Inter, sans-serif",
              textTransform: "uppercase",
              border: "1px solid",
              borderColor: mainTab === t ? "var(--accent)" : "var(--border)",
              color: mainTab === t ? "var(--accent)" : "var(--text-secondary)",
              background: mainTab === t ? "var(--accent-glow)" : "transparent",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.15s",
              ...(isMobile ? { flex: 1, flexShrink: 0 } : { flexShrink: 0 }),
            }}
          >
            {t === "1rm" ? "1RM" : t === "sets" ? "Sets" : "Analyze"}
          </button>
        ))}
      </div>

      {/* ── SETS TAB ── */}
      {mainTab === "sets" && (
        <div style={{ flex: 1 }}>
          {loadingSets ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading...</p>
          ) : dateGroups.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
              <p style={{ fontSize: "32px", marginBottom: "12px" }}>◎</p>
              <p style={{ fontSize: "15px" }}>No sets logged yet</p>
              <p style={{ fontSize: "13px", marginTop: "6px" }}>Tap + to log your first set</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: isMobile ? "80px" : "20px" }}>
              {dateGroups.map((group) => (
                <div key={group.dateKey}>
                  {/* Date header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
                      {group.label}
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {group.sets.length} set{group.sets.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Set rows */}
                  <div className="card" style={{ overflow: "hidden" }}>
                    {group.sets.map((set, i) => (
                      <div
                        key={set.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "32px 1fr auto auto",
                          alignItems: "center",
                          gap: "10px",
                          padding: "12px 16px",
                          borderBottom: i < group.sets.length - 1 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        {/* Set number */}
                        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
                          {set.setNumber}
                        </span>

                        {/* Time + notes */}
                        <div>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {formatTime(set.createdAt)}
                          </span>
                          {set.notes && (
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", fontStyle: "italic" }}>
                              {set.notes}
                            </p>
                          )}
                        </div>

                        {/* Reps */}
                        <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--success)" }}>
                          {set.reps} <span style={{ fontSize: "12px", fontWeight: 400 }}>rep</span>
                        </span>

                        {/* Weight — convert to active unit for display */}
                        <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--accent)" }}>
                          {convertWeight(set.weight, set.unit, unit)} <span style={{ fontSize: "12px", fontWeight: 400 }}>{unit}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYZE TAB ── */}
      {mainTab === "analyze" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Chart card */}
          <div className="card" style={{ padding: "20px 22px 14px" }}>
            {/* Chart tabs */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
              {(["weight", "volume", "est1rm"] as ChartTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setChartTab(t)}
                  style={{
                    padding: "6px 16px",
                    fontSize: "12px",
                    letterSpacing: "0.04em",
                    borderRadius: "20px",
                    border: "none",
                    cursor: "pointer",
                    background: chartTab === t ? "var(--accent)" : "var(--bg-hover)",
                    color: chartTab === t ? "#fff" : "var(--text-secondary)",
                    fontFamily: "Inter, sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {CHART_TAB_LABELS[t]}
                </button>
              ))}
            </div>

            {loadingHistory ? (
              <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Loading...</p>
              </div>
            ) : chartData.length < 2 ? (
              <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "6px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Not enough data yet</p>
                <p style={{ color: "var(--text-muted)", fontSize: "11px" }}>Log at least 2 days to see progression</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "Inter" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px", fontFamily: "Inter", color: "var(--text-primary)" }}
                    cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                    formatter={(v) => [`${v ?? 0} ${historyStats?.unit ?? unit}`, CHART_TAB_LABELS[chartTab]]}
                  />
                  <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ fill: "var(--accent)", r: 4, strokeWidth: 0 }} />
                  {peak && (
                    <ReferenceDot
                      x={peak.date}
                      y={peak.value}
                      r={4}
                      fill="var(--accent)"
                      stroke="none"
                      label={{ value: `${peak.value}`, position: "top", fontSize: 10, fontFamily: "Inter", fill: "var(--accent)" }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stats grid */}
          {historyStats && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)", borderRadius: "14px", overflow: "hidden", border: "1px solid var(--border)" }}>
              {[
                { label: "LAST SESSION", value: `${historyStats.lastWeight} ${historyStats.unit}`, sub: historyStats.lastDate ? fmtDate(historyStats.lastDate) : "—" },
                { label: "ALL-TIME PR", value: `${historyStats.allTimePR} ${historyStats.unit}`, sub: "Max weight" },
                { label: "DAYS TRAINED", value: String(historyStats.sessionCount), sub: "Total days" },
                { label: "TOTAL VOLUME", value: `${fmtNum(historyStats.totalVolume)} ${historyStats.unit}`, sub: "All time" },
                { label: "ESTIMATED 1RM", value: `${historyStats.est1RM} ${historyStats.unit}`, sub: "Epley formula" },
                { label: "BEST DAY VOL", value: `${fmtNum(historyStats.bestSessionVol)} ${historyStats.unit}`, sub: "Single day" },
              ].map(({ label, value, sub }) => (
                <div key={label} style={{ padding: "16px 18px", background: "var(--bg-card)" }}>
                  <p style={{ fontSize: "9px", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "6px" }}>{label}</p>
                  <p style={{ fontSize: "20px", color: "var(--text-primary)", lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>{sub}</p>
                </div>
              ))}
            </div>
          )}

          {!historyStats && !loadingHistory && (
            <div style={{ padding: "28px", textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Log this exercise to see analytics.</p>
            </div>
          )}
        </div>
      )}

      {/* ── 1RM TAB ── */}
      {mainTab === "1rm" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          {loadingHistory ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading...</p>
          ) : !historyStats ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
              <p style={{ fontSize: "13px" }}>Log this exercise to see your 1RM estimate.</p>
            </div>
          ) : (
            <>
              {/* Big 1RM display */}
              <div className="card" style={{ padding: "28px 24px", textAlign: "center" }}>
                <p style={{ fontSize: "11px", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "12px" }}>ESTIMATED 1RM</p>
                <p style={{ fontSize: "56px", fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>
                  {historyStats.est1RM}
                </p>
                <p style={{ fontSize: "16px", color: "var(--text-muted)", marginTop: "6px" }}>{historyStats.unit}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "10px", letterSpacing: "0.04em" }}>EPLEY FORMULA</p>
              </div>

              {/* Rep max table */}
              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "11px", letterSpacing: "0.1em", color: "var(--text-muted)" }}>REP MAXES</p>
                </div>
                {oneRMTable.map(({ reps: repCount, maxWeight }, i) => (
                  <div
                    key={repCount}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      padding: "11px 18px",
                      borderBottom: i < 11 ? "1px solid var(--border)" : "none",
                      background: repCount === 1 ? "var(--accent-glow)" : "transparent",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: repCount === 1 ? "var(--accent)" : "var(--text-secondary)" }}>
                      {repCount} rep{repCount !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: repCount === 1 ? "var(--accent)" : "var(--text-primary)", textAlign: "right" }}>
                      {maxWeight} {historyStats.unit}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── FAB (mobile, Sets tab) ── */}
      {isMobile && mainTab === "sets" && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            position: "fixed",
            bottom: "88px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "var(--accent)",
            border: "none",
            color: "#fff",
            fontSize: "30px",
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 24px rgba(216,31,53,0.45)",
            zIndex: 30,
            fontFamily: "Inter, sans-serif",
          }}
        >
          +
        </button>
      )}

      {/* ── Log form (bottom sheet / modal) ── */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="card"
            style={{
              width: isMobile ? "100%" : "420px",
              maxWidth: "100%",
              maxHeight: isMobile ? "90vh" : "85vh",
              overflowY: "auto",
              borderRadius: isMobile ? "20px 20px 0 0" : "14px",
              padding: isMobile ? "20px 18px 28px" : "28px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "15px" }}>Log Set {todaySetCount + 1}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={toggleUnit}
                  style={{
                    padding: "5px 12px",
                    fontSize: "12px",
                    letterSpacing: "0.06em",
                    border: "1px solid rgba(216,31,53,0.4)",
                    color: "var(--accent)",
                    background: "var(--accent-glow)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {unit.toUpperCase()}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "4px" }}
                >
                  ×
                </button>
              </div>
            </div>

            {!platesMode ? (
              /* Normal mode */
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>WEIGHT ({unit})</span>
                  <button
                    onClick={enterPlatesMode}
                    style={{ background: "none", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer", fontSize: "11px", padding: "2px 8px", fontFamily: "Inter, sans-serif", letterSpacing: "0.04em" }}
                  >
                    PLATES
                  </button>
                </div>
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
              </>
            ) : (
              /* Plates mode */
              <>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>WEIGHT ({unit})</span>
                <div style={{ textAlign: "center", padding: "9px", background: "var(--bg-hover)", borderRadius: "8px", border: "1px solid rgba(216,31,53,0.3)", marginBottom: "14px" }}>
                  <span style={{ fontSize: "26px", fontWeight: 700, color: "var(--accent)" }}>{platesWeight}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "5px" }}>{unit}</span>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", letterSpacing: "0.05em" }}>
                    BAR {barWeight} + {platesWeight - barWeight}
                  </p>
                </div>
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
              </>
            )}

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

            {/* Notes */}
            <input
              type="text"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !saving && handleLogSet()}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                outline: "none",
                marginBottom: "16px",
              }}
            />

            <button
              className="btn-primary"
              onClick={handleLogSet}
              disabled={saving}
              style={{ width: "100%", padding: "13px", fontSize: "16px" }}
            >
              {saving ? "Saving..." : `Log Set ${todaySetCount + 1}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
