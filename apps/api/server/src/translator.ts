import type {
  ConfidenceUpdate,
  DemoSnapshot,
  AttackCategory,
  CategoryTone,
  ScenarioId,
  TimelineTrack,
  TimelineEvent,
} from "@aero-shield/domain";
import { labelToCategory } from "@aero-shield/domain";

export function translateEvent(
  event: ConfidenceUpdate,
  history: ConfidenceUpdate[],
  scenarioId: ScenarioId,
): DemoSnapshot {
  const confidence100 = Math.round(event.top_confidence * 100);
  const isAlert = event.status === "alert" || event.status === "warning";

  const categoryMap = new Map<string, { label: string; confidence: number }[]>();
  for (const pred of event.predictions) {
    if (pred.label === "normal") continue;
    const cat = labelToCategory(pred.label);
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push({
      label: pred.label,
      confidence: Math.round(pred.confidence * 100),
    });
  }

  const CATEGORY_LABELS: Record<string, string> = {
    dos: "DoS", exfiltration: "Exfiltration", firmware: "Firmware",
    injection: "Injection", recon: "Recon", tampering: "Tampering",
  };

  const categories: AttackCategory[] = [
    "dos", "exfiltration", "firmware", "injection", "recon", "tampering",
  ].map((id) => {
    const attacks = categoryMap.get(id) ?? [];
    return {
      id,
      label: CATEGORY_LABELS[id] ?? id,
      tone: id as CategoryTone,
      count: attacks.length,
      attacks,
      peakConfidence: attacks.length > 0 ? Math.max(...attacks.map((a) => a.confidence)) : 0,
    };
  });

  const now = new Date(event.timestamp).getTime();
  const windowMs = 30_000;
  const tracks = buildTracks(history, now, windowMs);

  const topCat = categories[0];
  const runnersUp = categories.slice(1, 3).map((c, i) => ({
    title: `Runner-Up #${i + 1}`,
    category: c.label,
    label: c.attacks[0]?.label ?? c.id,
    confidence: c.peakConfidence,
    icon: "bookmark" as const,
  }));

  const avgConf =
    history.length > 0
      ? Math.round(
          (history.reduce((s, e) => s + e.top_confidence, 0) / history.length) * 100,
        )
      : confidence100;

  return {
    scenarioId,
    tick: event.sequence,
    generatedAt: event.timestamp,
    status: {
      label: isAlert ? "Alert" : "Operational",
      live: true,
      reviewWindow: "30s centered on Now",
      monitoredSignatures: event.predictions.length,
      refreshCadence: "real-time stream",
      subtitle: `Source: ${event.source_id} · model: ${event.model_id} v${event.model_version}`,
    },
    simulation: {
      mode: "Live",
      injectedAttack: event.top_label,
      detectedAttack: event.top_label,
      confidence: confidence100,
      match: event.top_confidence >= event.threshold,
      detectionState: event.status,
      executionState: "active",
    },
    timeline: {
      windowSeconds: 30,
      windowLabel: "30s centered on Now",
      ticks: ["-15s", "-10s", "-5s", "Now", "+5s", "+10s", "+15s"],
      tracks,
    },
    categories,
    summary: {
      averageDetectionRate: avgConf,
      averageChange: "+0% (live)",
      topDetection: {
        title: "Top Detection",
        category: topCat?.label ?? "—",
        label: topCat?.attacks[0]?.label ?? "—",
        confidence: topCat?.peakConfidence ?? 0,
        icon: "alert",
      },
      runnersUp,
    },
  };
}

function buildTracks(
  history: ConfidenceUpdate[],
  now: number,
  windowMs: number,
): TimelineTrack[] {
  const half = windowMs / 2;
  const trackMap = new Map<string, TimelineEvent[]>();

  for (const evt of history) {
    const t = new Date(evt.timestamp).getTime();
    if (!evt.top_label || t < now - half || t > now + half || evt.top_label === "normal") continue;
    const cat = labelToCategory(evt.top_label);
    if (!trackMap.has(cat)) trackMap.set(cat, []);
    // startSecond is relative to Now: negative = past, 0 = now, positive = future
    const startSecond = Math.round((t - now) / 1000);
    const state: TimelineEvent["state"] = t < now ? "past" : "active";
    const existing = trackMap.get(cat)!;
    const last = existing[existing.length - 1];
    if (last && last.startSecond + last.durationSeconds >= startSecond) {
      last.durationSeconds = startSecond - last.startSecond + 1;
    } else {
      existing.push({
        startSecond,
        durationSeconds: 1,
        intensity: intensityOf(evt.top_confidence),
        label: evt.top_label,
        state,
      });
    }
  }

  return Array.from(trackMap.entries()).map(([id, events]) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    tone: id as CategoryTone,
    events,
  }));
}

function intensityOf(conf: number): TimelineEvent["intensity"] {
  if (conf >= 0.8) return "high";
  if (conf >= 0.5) return "medium";
  return "low";
}
