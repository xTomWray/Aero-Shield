/**
 * @fileoverview Renders dashboard panels: header, simulation card, threat timeline, detection matrix, and summary stats.
 *
 * @module       web/dashboard
 * @exports      DashboardHeader, SimulationCard, ThreatTimelinePanel, DetectionMatrix, SummaryStats
 * @dependsOn    react, @aero-shield/domain
 * @usedBy       App.tsx, dashboard.test.tsx
 * @sideEffects  none — pure components
 * @stability    stable
 * @tests        dashboard.test.tsx
 */
import type {
  AttackCategory,
  DashboardSimulation,
  DashboardStatus,
  DashboardSummary,
  ThreatTimeline
} from "@aero-shield/domain";

import logoSrc from "../assets/Aero Shield Enhanced_transparent.png";

const buildTimelineTicks = (ticks: string[]) =>
  ticks.map((tick, index) => ({
    label: tick,
    align: index === 0 ? "start" : index === ticks.length - 1 ? "end" : "center",
    isNow: tick === "Now",
    positionPercent: ticks.length === 1 ? 0 : (index / (ticks.length - 1)) * 100
  }));

const SectionAlertIcon = () => (
  <svg className="section-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3 21 20H3L12 3Z" />
    <path d="M12 8V13.5" />
    <circle cx="12" cy="17" r="1.2" />
  </svg>
);

const MatchIcon = () => (
  <svg className="match-icon-svg" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M5 10.3 8.3 13.6 15 7" />
  </svg>
);

const SummaryIcon = ({
  icon
}: {
  icon: "alert" | "bookmark" | "trend" | "silver-medal" | "bronze-medal";
}) => {
  if (icon === "trend") {
    return (
      <svg className="summary-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 16.5 10 11.5 13.5 15 19 9.5" />
        <path d="M14.5 9.5H19V14" />
      </svg>
    );
  }

  if (icon === "alert") {
    return (
      <svg className="summary-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4 20 19H4L12 4Z" />
        <path d="M12 9V13.5" />
        <circle cx="12" cy="17" r="1.1" />
      </svg>
    );
  }

  if (icon === "silver-medal" || icon === "bronze-medal") {
    return (
      <svg className="summary-icon-svg medal-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.4 4H11.1L12 6.2L12.9 4H15.6L14.3 9H9.7L8.4 4Z" />
        <circle cx="12" cy="14" r="5.2" />
        <path d="M12 11.2L12.9 13.1H14.9L13.3 14.4L13.9 16.5L12 15.3L10.1 16.5L10.7 14.4L9.1 13.1H11.1L12 11.2Z" />
      </svg>
    );
  }

  return (
    <svg className="summary-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5H16V19L12 15.6 8 19V5Z" />
    </svg>
  );
};

const resolveSummaryIcon = (
  title: string,
  icon: "alert" | "bookmark" | "trend"
): "alert" | "bookmark" | "trend" | "silver-medal" | "bronze-medal" => {
  if (title === "Runner-Up #2") {
    return "silver-medal";
  }

  if (title === "Runner-Up #3") {
    return "bronze-medal";
  }

  return icon;
};

interface DashboardHeaderProps {
  status: DashboardStatus;
  sourceLabel?: string;
  onSourceClick?: () => void;
}

export const DashboardHeader = ({ status, sourceLabel, onSourceClick }: DashboardHeaderProps) => (
  <header className="dashboard-header">
    <div className="brand-lockup dashboard-header-slot dashboard-header-slot-title">
      <div className="title-block">
        <div className="title-row">
          <h1>Aero Shield Dashboard</h1>
          <span className="live-badge">LIVE</span>
        </div>
        <p className="subtitle">{status.subtitle}</p>
        {sourceLabel && (
          <button className="source-chip" onClick={onSourceClick}>
            Source: {sourceLabel}
          </button>
        )}
      </div>
    </div>
    <div className="dashboard-header-slot dashboard-header-slot-logo">
      <img alt="Aero Shield logo" className="brand-mark" src={logoSrc} />
    </div>
    <div className="dashboard-header-slot dashboard-header-slot-reserved" aria-hidden="true" />
  </header>
);

export const SimulationCard = ({ simulation }: { simulation: DashboardSimulation }) => (
  <section className="dashboard-panel simulation-card">
    <div className="section-chip section-chip-alert">
      <SectionAlertIcon />
      <span>Active attack simulation</span>
      <span className="chip-dot" aria-hidden="true" />
    </div>
    <div className="simulation-row">
      <div className="signal-card">
        <span className="signal-label">
          {simulation.executionState === "active" ? "Executing attack" : "Queued attack"}
        </span>
        <div className="signal-line">
          <span className="signal-chip signal-chip-danger">{simulation.mode}</span>
          <strong className="signal-value">{simulation.injectedAttack}</strong>
        </div>
      </div>
      <div className="signal-arrow" aria-hidden="true">
        →
      </div>
      <div className="signal-card signal-card-detected">
        <span className="signal-label">
          {simulation.executionState === "active" ? "System detected" : "Next predicted"}
        </span>
        <div className="signal-line">
          <span className="signal-chip signal-chip-danger">{simulation.mode}</span>
          <strong className="signal-value">{simulation.detectedAttack}</strong>
        </div>
      </div>
      <div className="confidence-card">
        <span className="signal-label">Confidence</span>
        <strong>{simulation.confidence}%</strong>
      </div>
      <div
        className={
          simulation.executionState === "queued"
            ? "match-pill is-queued"
            : simulation.match
              ? "match-pill is-match"
              : "match-pill is-miss"
        }
      >
        <MatchIcon />
        <span>{simulation.detectionState}</span>
      </div>
    </div>
  </section>
);

export const ThreatTimelinePanel = ({ timeline }: { timeline: ThreatTimeline }) => (
  (() => {
    const tickPositions = buildTimelineTicks(timeline.ticks);

    return (
      <section className="dashboard-panel timeline-panel">
        <div className="timeline-heading">
          <h2>Threat Activity Timeline</h2>
          <p>{timeline.windowLabel}</p>
        </div>
        <div className="timeline-scale" aria-hidden="true">
          <span>Attack</span>
          <div className="timeline-ticks">
            {tickPositions.map((tick) => (
              <span
                key={tick.label}
                className="timeline-tick"
                data-align={tick.align}
                data-now={tick.isNow ? "true" : undefined}
                style={{ left: `${tick.positionPercent}%` }}
              >
                <span className="timeline-tick-label">{tick.label}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="timeline-grid" role="table" aria-label="Threat activity timeline">
          {timeline.tracks.map((track) => (
            <div className="timeline-row" data-tone={track.tone} key={track.id} role="row">
              <div className="timeline-label" data-tone={track.tone} role="rowheader">
                <span className="timeline-dot" aria-hidden="true" />
                {track.label}
              </div>
              <div className="timeline-track" role="cell">
                {tickPositions.map((tick) => (
                  <span
                    key={`${track.id}-${tick.label}`}
                    className={tick.isNow ? "timeline-guide timeline-now-marker" : "timeline-guide"}
                    data-align={tick.align}
                    data-now={tick.isNow ? "true" : undefined}
                    style={{ left: `${tick.positionPercent}%` }}
                    aria-hidden="true"
                  />
                ))}
                {track.events.map((event, index) => (
                  <span
                    key={`${track.id}-${index}`}
                    className={`timeline-bar intensity-${event.intensity} state-${event.state}`}
                    style={{
                      left: `${((event.startSecond + timeline.windowSeconds / 2) / timeline.windowSeconds) * 100}%`,
                      width: `${(event.durationSeconds / timeline.windowSeconds) * 100}%`
                    }}
                  >
                    {event.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  })()
);

const DetectionCategoryRow = ({ category }: { category: AttackCategory }) => (
  <article className="category-row" data-tone={category.tone}>
    <div className="category-rail">
      <strong>{category.label}</strong>
      <span>{category.count}</span>
    </div>
    <div className="attack-grid">
      {category.attacks.map((attack) => (
        <div className="attack-tile" key={attack.label}>
          <div className="attack-copy">
            <span>{attack.label}</span>
            <strong>{attack.confidence}%</strong>
          </div>
          <div className="confidence-track" aria-hidden="true">
            <span style={{ width: `${attack.confidence}%` }} />
          </div>
        </div>
      ))}
    </div>
    <div className="category-peak">
      <span>Peak</span>
      <strong>{category.peakConfidence}%</strong>
    </div>
  </article>
);

export const DetectionMatrix = ({
  categories,
  refreshCadence
}: {
  categories: AttackCategory[];
  refreshCadence: string;
}) => (
  <section className="matrix-panel">
    <div className="matrix-heading">
      <h2>Individual Attack Detection</h2>
      <p>· {refreshCadence}</p>
    </div>
    <div className="matrix-rows">
      {categories.map((category) => (
        <DetectionCategoryRow category={category} key={category.id} />
      ))}
    </div>
  </section>
);

const SummaryCard = ({
  label,
  value,
  detail,
  category,
  icon,
  metric
}: {
  label: string;
  value: string;
  detail: string;
  category?: string;
  icon: "alert" | "bookmark" | "trend";
  metric?: boolean;
}) => (
  <article className={`dashboard-panel summary-card ${metric ? "is-metric" : ""}`}>
    <div className="summary-topline">
      <p className="summary-label">{label}</p>
      <span className={`summary-icon summary-icon-${resolveSummaryIcon(label, icon)}`} aria-hidden="true">
        <SummaryIcon icon={resolveSummaryIcon(label, icon)} />
      </span>
    </div>
    {category ? <p className="summary-category">{category}</p> : null}
    <h3>{value}</h3>
    <p className={metric ? "summary-positive" : undefined}>{detail}</p>
  </article>
);

export const SummaryStats = ({ summary }: { summary: DashboardSummary }) => (
  <section className="summary-grid">
    <SummaryCard
      detail={summary.averageChange}
      icon="trend"
      label="Average detection rate"
      metric
      value={`${summary.averageDetectionRate}%`}
    />
    <SummaryCard
      category={summary.topDetection.category}
      detail={`Confidence: ${summary.topDetection.confidence}%`}
      icon={summary.topDetection.icon}
      label={summary.topDetection.title}
      value={summary.topDetection.label}
    />
    {summary.runnersUp[0] != null && (
      <SummaryCard
        category={summary.runnersUp[0].category}
        detail={`Confidence: ${summary.runnersUp[0].confidence}%`}
        icon={summary.runnersUp[0].icon}
        label={summary.runnersUp[0].title}
        value={summary.runnersUp[0].label}
      />
    )}
    {summary.runnersUp[1] != null && (
      <SummaryCard
        category={summary.runnersUp[1].category}
        detail={`Confidence: ${summary.runnersUp[1].confidence}%`}
        icon={summary.runnersUp[1].icon}
        label={summary.runnersUp[1].title}
        value={summary.runnersUp[1].label}
      />
    )}
  </section>
);
