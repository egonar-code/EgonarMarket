const STAGE_BY_STATUS = {
  EN_ATTENTE_PAIEMENT: "PAYMENT",
  CONFIRMEE: "SUPPLIER_PREPARATION",
  PREPARATION: "SUPPLIER_SHIPMENT",
  EXPEDIEE: "LOGISTICS",
  EN_LIVRAISON: "COURIER"
};

const STAGE_LABELS = {
  PAYMENT: "Paiement",
  SUPPLIER_PREPARATION: "Préparation fournisseur",
  SUPPLIER_SHIPMENT: "Expédition fournisseur",
  LOGISTICS: "Logistique",
  COURIER: "Livraison"
};

function readMinutes(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

const DURATION_MINUTES = {
  PAYMENT: readMinutes("TIMER_PAYMENT_MINUTES", 15),
  SUPPLIER_PREPARATION: readMinutes("TIMER_SUPPLIER_PREPARATION_MINUTES", 45),
  SUPPLIER_SHIPMENT: readMinutes("TIMER_SUPPLIER_SHIPMENT_MINUTES", 30),
  LOGISTICS: readMinutes("TIMER_LOGISTICS_MINUTES", 45),
  COURIER: readMinutes("TIMER_COURIER_MINUTES", 90)
};

const WARNING_AT_PCT = 70;
const CRITICAL_AT_PCT = 90;

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function iso(value) {
  const date = toDate(value);
  return date ? date.toISOString() : null;
}

function stageForStatus(status) {
  return STAGE_BY_STATUS[String(status || "")] || null;
}

function durationMinutesForStatus(status) {
  const stage = stageForStatus(status);
  return stage ? DURATION_MINUTES[stage] : 0;
}

function startWorkflowTimer(status, startedAt = new Date()) {
  const stage = stageForStatus(status);
  if (!stage) return null;
  const durationMinutes = DURATION_MINUTES[stage];
  const started = new Date(toDate(startedAt) || Date.now());
  const due = new Date(started.getTime() + durationMinutes * 60 * 1000);
  return {
    stage,
    stage_label: STAGE_LABELS[stage],
    started_at: started,
    due_at: due,
    duration_minutes: durationMinutes,
    warning_at_pct: WARNING_AT_PCT,
    critical_at_pct: CRITICAL_AT_PCT
  };
}

function timerHistoryFor(order) {
  return Array.isArray(order?.workflow_timer_history) ? order.workflow_timer_history.slice(-20) : [];
}

function transitionWorkflowTimer(order, nextStatus, at = new Date()) {
  const history = timerHistoryFor(order);
  const previous = order?.workflow_timer;
  const now = new Date(toDate(at) || Date.now());

  if (previous?.started_at) {
    const started = toDate(previous.started_at);
    const durationSeconds = Number(previous.duration_minutes || 0) * 60;
    const elapsedSeconds = started ? Math.max(0, Math.floor((now.getTime() - started.getTime()) / 1000)) : 0;
    history.push({
      ...previous,
      status: "COMPLETED",
      completed_at: now,
      elapsed_seconds: elapsedSeconds,
      completion_delta_seconds: elapsedSeconds - durationSeconds
    });
  }

  return {
    current: startWorkflowTimer(nextStatus, now),
    history: history.slice(-20)
  };
}

function findStartedAtFromHistory(order) {
  const history = Array.isArray(order?.status_history) ? order.status_history : [];
  const current = String(order?.status || "");
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const item = history[i];
    if (String(item?.to || "") === current) {
      const date = toDate(item?.at);
      if (date) return date;
    }
  }
  return toDate(order?.created_at) || new Date();
}

function getWorkflowTimerView(order, at = new Date()) {
  const status = String(order?.status || "");
  const stage = stageForStatus(status);
  if (!stage) return null;

  const now = new Date(toDate(at) || Date.now());
  const stored = order?.workflow_timer;
  const storedStage = String(stored?.stage || "");
  const started = storedStage === stage ? toDate(stored.started_at) : null;
  const durationMinutes = storedStage === stage && Number(stored?.duration_minutes) > 0
    ? Number(stored.duration_minutes)
    : DURATION_MINUTES[stage];

  const startedAt = started || findStartedAtFromHistory(order);
  const dueAtStored = storedStage === stage ? toDate(stored.due_at) : null;
  const dueAt = dueAtStored || new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
  const durationSeconds = Math.max(1, Math.round(durationMinutes * 60));
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
  const remainingRaw = Math.floor((dueAt.getTime() - now.getTime()) / 1000);
  const remainingSeconds = Math.max(0, remainingRaw);
  const overdueSeconds = Math.max(0, -remainingRaw);
  const progressPct = Math.min(100, Math.max(0, Number(((elapsedSeconds / durationSeconds) * 100).toFixed(1))));

  let state = "ON_TIME";
  if (remainingRaw <= 0) state = "OVERDUE";
  else if (progressPct >= CRITICAL_AT_PCT) state = "CRITICAL";
  else if (progressPct >= WARNING_AT_PCT) state = "WARNING";

  return {
    stage,
    stage_label: STAGE_LABELS[stage],
    state,
    started_at: iso(startedAt),
    due_at: iso(dueAt),
    duration_minutes: durationMinutes,
    duration_seconds: durationSeconds,
    elapsed_seconds: elapsedSeconds,
    remaining_seconds: remainingSeconds,
    overdue_seconds: overdueSeconds,
    progress_pct: progressPct,
    warning_at_pct: WARNING_AT_PCT,
    critical_at_pct: CRITICAL_AT_PCT
  };
}

module.exports = {
  STAGE_BY_STATUS,
  STAGE_LABELS,
  DURATION_MINUTES,
  startWorkflowTimer,
  transitionWorkflowTimer,
  getWorkflowTimerView
};
