/** Unique identifier for a demo scenario. */
export type ScenarioId = "baseline" | "storm-front" | "intrusion" | "recovery";

/** Severity level of threat activity in a timeline event. */
export type TimelineIntensity = "low" | "medium" | "high";

/**
 * Attack category identifier used for grouping and styling.
 * Maps 1-to-1 with the category id field in AttackCategory.
 */
export type CategoryTone =
  | "dos"
  | "exfiltration"
  | "firmware"
  | "injection"
  | "recon"
  | "tampering";

/** Dashboard operational status shown at the top of the UI. */
export interface DashboardStatus {
  /** Status label shown to the operator (e.g., "Operational", "Degraded"). */
  label: string;
  /** Whether the system is currently live and streaming data. */
  live: boolean;
  /** Human-readable time window label (e.g., "30s centered on Now"). */
  reviewWindow: string;
  /** Total number of attack signatures the detection engine monitors. */
  monitoredSignatures: number;
  /** Update frequency label (e.g., "updates every 5s"). */
  refreshCadence: string;
  /** Extended description or current system state message. */
  subtitle: string;
}

/** Tracks what attack was injected vs. what the system detected. */
export interface DashboardSimulation {
  /** Simulation mode name (e.g., "Live", "Replay"). */
  mode: string;
  /** The attack name that was injected into the simulation. */
  injectedAttack: string;
  /** The attack name that the detection engine identified. */
  detectedAttack: string;
  /** Confidence score for the detection (0–100). */
  confidence: number;
  /** Whether detectedAttack matches injectedAttack. */
  match: boolean;
  /** Detection status string (e.g., "detecting", "uncertain", "missed"). */
  detectionState: string;
  /** Whether this simulation step is currently running or queued. */
  executionState: "active" | "queued";
}

/** A single detected threat event within a timeline track. */
export interface TimelineEvent {
  /** Start time in seconds from the beginning of the timeline window. */
  startSecond: number;
  /** Duration of the event in seconds. */
  durationSeconds: number;
  /** Threat intensity during this event. */
  intensity: TimelineIntensity;
  /** Attack label or signature name. */
  label: string;
  /** Whether the event is in the past, currently active, or queued. */
  state: "past" | "active" | "queued";
}

/** Groups timeline events belonging to the same threat category. */
export interface TimelineTrack {
  /** Category identifier (matches AttackCategory.id). */
  id: string;
  /** Display label (e.g., "DoS", "Exfiltration"). */
  label: string;
  /** Visual tone for color coding. */
  tone: CategoryTone;
  /** Chronologically ordered events in this track. */
  events: TimelineEvent[];
}

/** Complete threat timeline shown in the dashboard visualization. */
export interface ThreatTimeline {
  /** Total time window in seconds (e.g., 30). */
  windowSeconds: number;
  /** Human-readable window label (e.g., "Last 30 seconds"). */
  windowLabel: string;
  /** Axis tick labels (e.g., ["0s", "10s", "20s", "30s"]). */
  ticks: string[];
  /** One track per threat category, displayed side-by-side. */
  tracks: TimelineTrack[];
}

/** A single attack detected within a category. */
export interface AttackDetection {
  /** Attack name or signature identifier. */
  label: string;
  /** Detection confidence (0–100). */
  confidence: number;
}

/** All attacks detected within a single threat category. */
export interface AttackCategory {
  /** Category identifier (e.g., "dos", "exfiltration"). */
  id: string;
  /** Display label (e.g., "DoS", "Exfiltration"). */
  label: string;
  /** Visual tone for color coding. */
  tone: CategoryTone;
  /** Number of distinct attack types detected in this category. */
  count: number;
  /** Full list of detected attacks with individual confidence scores. */
  attacks: AttackDetection[];
  /** Highest confidence score among all attacks in this category. */
  peakConfidence: number;
}

/** A highlighted attack shown in the summary stats section. */
export interface SummaryHighlight {
  /** Display title (e.g., "Top Detection", "Runner-Up #2"). */
  title: string;
  /** Category name (e.g., "DoS"). */
  category: string;
  /** Attack name or description. */
  label: string;
  /** Confidence score (0–100). */
  confidence: number;
  /** Icon variant: "alert" for the top detection, "bookmark" for runners-up. */
  icon: "alert" | "bookmark";
}

/** High-level metrics displayed in the dashboard footer. */
export interface DashboardSummary {
  /** Overall detection rate across all categories (0–100). */
  averageDetectionRate: number;
  /** Change description (e.g., "+3% from last hour"). */
  averageChange: string;
  /** The highest-confidence detected attack, shown with an alert icon. */
  topDetection: SummaryHighlight;
  /** Secondary detections shown with bookmark icons. */
  runnersUp: SummaryHighlight[];
}

/**
 * Complete snapshot of dashboard state at a point in time.
 *
 * This is the data contract between the backend and the frontend.
 * When implementing a real API, ensure each response from GET /snapshot
 * conforms to this shape exactly. See docs/INTEGRATION.md for full details.
 */
export interface DemoSnapshot {
  /** Which scenario this snapshot belongs to. */
  scenarioId: ScenarioId;
  /** Monotonically increasing counter; starts at 0 for each scenario. */
  tick: number;
  /** ISO 8601 timestamp of when this snapshot was generated or fetched. */
  generatedAt: string;
  /** Operational status display data. */
  status: DashboardStatus;
  /** Current simulation/detection state. */
  simulation: DashboardSimulation;
  /** Threat timeline visualization data. */
  timeline: ThreatTimeline;
  /** Detected attacks grouped by category. */
  categories: AttackCategory[];
  /** Summary statistics for the footer. */
  summary: DashboardSummary;
}

/** A single class prediction from the IDS model. */
export interface ConfidenceUpdatePrediction {
  /** Attack label or "normal". */
  label: string;
  /** Model confidence for this label (0.0–1.0). */
  confidence: number;
}

/**
 * Real-time inference event emitted by the IDS model.
 *
 * This is the canonical input format for POST /ingest.
 * In demo mode the server replays pre-recorded events in this same format.
 */
export interface ConfidenceUpdate {
  type: "confidence_update";
  /** ISO 8601 timestamp of the detection window. */
  timestamp: string;
  /** Monotonically increasing event counter. */
  sequence: number;
  /** UAV or sensor identifier (e.g., "uav_01"). */
  source_id: string;
  /** Detection window identifier. */
  window_id: string;
  /** Model identifier (e.g., "mavlink_ids_rf_v1"). */
  model_id: string;
  /** Model version string. */
  model_version: string;
  /** Full label probability distribution from the model. */
  predictions: ConfidenceUpdatePrediction[];
  /** Label with the highest confidence. */
  top_label: string;
  /** Confidence of top_label (0.0–1.0). */
  top_confidence: number;
  /** Alert threshold; top_confidence >= threshold triggers an alert. */
  threshold: number;
  /** System status derived from top_confidence vs threshold. */
  status: "normal" | "alert" | "warning";
}

/** Playback state returned by DemoDataControls.getRuntimeState(). */
export interface DemoRuntimeState {
  /** Whether the provider is currently generating or fetching snapshots. */
  isRunning: boolean;
  /** Current playback speed multiplier (0.5–4.0). */
  speedMultiplier: number;
}

/** Metadata describing a scenario for display in the scenario picker. */
export interface ScenarioDescriptor {
  /** Unique scenario identifier. */
  id: ScenarioId;
  /** Display name (e.g., "Baseline", "Intrusion"). */
  name: string;
  /** One-sentence description of what this scenario demonstrates. */
  summary: string;
  /** Attack activity tempo: steady (low rate), elevated (medium), surge (high). */
  tempo: "steady" | "elevated" | "surge";
}
