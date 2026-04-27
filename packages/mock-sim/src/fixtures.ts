import type {
  AttackCategory,
  DashboardStatus,
  DashboardSummary,
  ScenarioId
} from "@aero-shield/domain";

export const baseStatus: DashboardStatus = {
  label: "Operational",
  live: true,
  reviewWindow: "30s centered on Now",
  monitoredSignatures: 37,
  refreshCadence: "updates every 5s",
  subtitle: "Real-time drone cyberattack detection · 37 attack signatures monitored"
};

export const baseCategories: AttackCategory[] = [
  {
    id: "dos",
    label: "DoS",
    tone: "dos",
    count: 7,
    peakConfidence: 88,
    attacks: [
      { label: "camera-feed-ros-topic-flooding", confidence: 88 },
      { label: "communication-link-flooding", confidence: 10 },
      { label: "denial-of-takeoff", confidence: 17 },
      { label: "flight-termination", confidence: 13 },
      { label: "geofencing-attack", confidence: 9 },
      { label: "gps-offset-glitching", confidence: 15 },
      { label: "wireless-deauthentication", confidence: 4 }
    ]
  },
  {
    id: "exfiltration",
    label: "Exfiltration",
    tone: "exfiltration",
    count: 6,
    peakConfidence: 17,
    attacks: [
      { label: "camera-feed-eavesdropping", confidence: 14 },
      { label: "flight-log-extraction", confidence: 17 },
      { label: "ftp-eavesdropping", confidence: 12 },
      { label: "mission-extraction", confidence: 11 },
      { label: "parameter-extraction", confidence: 12 },
      { label: "wifi-client-data-leak", confidence: 15 }
    ]
  },
  {
    id: "firmware",
    label: "Firmware",
    tone: "firmware",
    count: 2,
    peakConfidence: 13,
    attacks: [
      { label: "firmware-decompile", confidence: 13 },
      { label: "firmware-modding", confidence: 8 }
    ]
  },
  {
    id: "injection",
    label: "Injection",
    tone: "injection",
    count: 9,
    peakConfidence: 15,
    attacks: [
      { label: "camera-gimbal-takeover", confidence: 8 },
      { label: "companion-computer-exploitation", confidence: 10 },
      { label: "companion-computer-web-ui-login-brute-force", confidence: 15 },
      { label: "flight-mode-injection", confidence: 13 },
      { label: "ground-control-station-hijacking", confidence: 14 },
      { label: "mavlink-command-injection", confidence: 10 },
      { label: "return-to-home-override", confidence: 12 },
      { label: "sensor-data-injection", confidence: 8 },
      { label: "waypoint-injection", confidence: 15 }
    ]
  },
  {
    id: "recon",
    label: "Recon",
    tone: "recon",
    count: 7,
    peakConfidence: 14,
    attacks: [
      { label: "companion-computer-discovery", confidence: 8 },
      { label: "drone-discovery", confidence: 9 },
      { label: "gps-telemetry-analysis", confidence: 14 },
      { label: "ground-control-station-discovery", confidence: 14 },
      { label: "packet-sniffing", confidence: 12 },
      { label: "protocol-fingerprinting", confidence: 14 },
      { label: "wifi-analysis-cracking", confidence: 10 }
    ]
  },
  {
    id: "tampering",
    label: "Tampering",
    tone: "tampering",
    count: 8,
    peakConfidence: 18,
    attacks: [
      { label: "altitude-spoofing", confidence: 8 },
      { label: "battery-spoofing", confidence: 15 },
      { label: "critical-error-spoofing", confidence: 9 },
      { label: "emergency-status-spoofing", confidence: 14 },
      { label: "gps-spoofing", confidence: 18 },
      { label: "satellite-spoofing", confidence: 13 },
      { label: "system-status-spoofing", confidence: 7 },
      { label: "vfr-hud-spoofing", confidence: 7 }
    ]
  }
];

export const summaryByScenario: Record<ScenarioId, DashboardSummary> = {
  baseline: {
    averageDetectionRate: 94.2,
    averageChange: "+3% from last hour",
    topDetection: {
      title: "Top Detection",
      category: "DoS",
      label: "camera-feed-ros-topic-flooding",
      confidence: 88,
      icon: "alert"
    },
    runnersUp: [
      {
        title: "Runner-Up #2",
        category: "Tampering",
        label: "gps-spoofing",
        confidence: 18,
        icon: "bookmark"
      },
      {
        title: "Runner-Up #3",
        category: "DoS",
        label: "denial-of-takeoff",
        confidence: 17,
        icon: "bookmark"
      }
    ]
  },
  "storm-front": {
    averageDetectionRate: 92.8,
    averageChange: "+1% from last hour",
    topDetection: {
      title: "Top Detection",
      category: "DoS",
      label: "camera-feed-ros-topic-flooding",
      confidence: 84,
      icon: "alert"
    },
    runnersUp: [
      {
        title: "Runner-Up #2",
        category: "Tampering",
        label: "gps-spoofing",
        confidence: 20,
        icon: "bookmark"
      },
      {
        title: "Runner-Up #3",
        category: "Recon",
        label: "ground-control-station-discovery",
        confidence: 16,
        icon: "bookmark"
      }
    ]
  },
  intrusion: {
    averageDetectionRate: 95.4,
    averageChange: "+5% from last hour",
    topDetection: {
      title: "Top Detection",
      category: "DoS",
      label: "camera-feed-ros-topic-flooding",
      confidence: 91,
      icon: "alert"
    },
    runnersUp: [
      {
        title: "Runner-Up #2",
        category: "Tampering",
        label: "gps-spoofing",
        confidence: 21,
        icon: "bookmark"
      },
      {
        title: "Runner-Up #3",
        category: "DoS",
        label: "denial-of-takeoff",
        confidence: 18,
        icon: "bookmark"
      }
    ]
  },
  recovery: {
    averageDetectionRate: 90.9,
    averageChange: "-2% from last hour",
    topDetection: {
      title: "Top Detection",
      category: "DoS",
      label: "camera-feed-ros-topic-flooding",
      confidence: 81,
      icon: "alert"
    },
    runnersUp: [
      {
        title: "Runner-Up #2",
        category: "Tampering",
        label: "gps-spoofing",
        confidence: 16,
        icon: "bookmark"
      },
      {
        title: "Runner-Up #3",
        category: "Exfiltration",
        label: "flight-log-extraction",
        confidence: 15,
        icon: "bookmark"
      }
    ]
  }
};

export const confidenceBumpByScenario: Record<ScenarioId, number> = {
  baseline: 0,
  "storm-front": -4,
  intrusion: 3,
  recovery: -7
};

export const timelineTrackOrder = ["dos", "injection", "tampering", "recon", "exfiltration"] as const;
