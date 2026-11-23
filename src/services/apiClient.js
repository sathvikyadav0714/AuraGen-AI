
/**
 * AuraGen API Client
 * Matches the Express backend routes exactly.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function safeFetch(endpoint, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok
        ? null
        : data?.message || data?.error || `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error:
        error.name === "AbortError"
          ? "Request timed out"
          : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

const jsonOptions = (method, body) => ({
  method,
  body: JSON.stringify(body),
});

// 1. Backend health
export async function checkBackendHealth() {
  return safeFetch("/health", { method: "GET" });
}

// 2. Create session
export async function createSessionApi(metadata = {}) {
  const res = await safeFetch(
    "/sessions",
    jsonOptions("POST", metadata)
  );

  const sessionId = res.data?.data?.sessionId;

  if (!res.ok || !sessionId) {
    return {
      ok: false,
      error: res.error || "Session creation failed",
    };
  }

  return {
    ok: true,
    sessionId,
    data: res.data.data,
  };
}

// 3. Save form data
export async function saveDraftApi(sessionId, formData) {
  if (!sessionId) {
    return { ok: false, error: "Missing session ID" };
  }

  const res = await safeFetch(
    `/sessions/${encodeURIComponent(sessionId)}/form`,
    jsonOptions("PATCH", formData)
  );

  return {
    ok: res.ok,
    status: res.status,
    data: res.data?.data,
    error: res.error,
  };
}

// 4. Restore form data
export async function loadDraftApi(sessionId) {
  if (!sessionId) {
    return {
      ok: false,
      formData: null,
      error: "Missing session ID",
    };
  }

  const res = await safeFetch(
    `/sessions/${encodeURIComponent(sessionId)}/form`,
    { method: "GET" }
  );

  return {
    ok: res.ok,
    formData: res.data?.data || null,
    error: res.error,
  };
}

// 5. Convert frontend events to backend-supported events
function normalizeEventType(type) {
  const key = String(type || "").toLowerCase();

  const mapping = {
    rage_click: "rage_click",
    rapid_clicks: "rage_click",
    click_burst: "rage_click",
    dead_click: "failed_interaction",
    disabled_click: "failed_interaction",
    failed_interaction: "failed_interaction",
    hesitation: "hesitation",
    input_hesitation: "hesitation",
    validation_error: "validation_error",
    field_validation_failed: "validation_error",
    mouse_movement: "mouse_movement",
  };

  return mapping[key] || null;
}

// 6. Send telemetry
export async function sendTelemetryEventApi(
  sessionId,
  rawEvent = {},
  cognitiveLoadScore = 0
) {
  if (!sessionId) {
    return { ok: false, error: "Missing session ID" };
  }

  const eventType = normalizeEventType(rawEvent.type);

  if (!eventType) {
    return {
      ok: false,
      error: `Unsupported telemetry event: ${rawEvent.type}`,
    };
  }

  const field = String(
    rawEvent.field || rawEvent.target || ""
  ).slice(0, 100);

  const score = Number(cognitiveLoadScore);

  const payload = {
    eventType,
    field,
    cognitiveLoadScore: Number.isFinite(score)
      ? Math.max(0, Math.min(100, score))
      : 0,
  };

  const res = await safeFetch(
    `/sessions/${encodeURIComponent(sessionId)}/telemetry`,
    jsonOptions("POST", payload)
  );

  return {
    ok: res.ok,
    status: res.status,
    data: res.data?.data,
    error: res.error,
  };
}

// 7. Request AI generation manually
export async function generateUIApi(sessionId) {
  if (!sessionId) {
    return { ok: false, error: "Missing session ID" };
  }

  const res = await safeFetch(
    `/sessions/${encodeURIComponent(sessionId)}/generate`,
    jsonOptions("POST", {})
  );

  return {
    ok: res.ok,
    status: res.status,
    data: res.data?.data,
    error: res.error,
  };
}

// 8. Application submission
// The current backend does not implement an application submission route.
// Do not report a successful submission until that route exists.
export async function submitFormApi() {
  return {
    ok: false,
    error: "Application submission endpoint is not implemented in the backend yet.",
  };
}
