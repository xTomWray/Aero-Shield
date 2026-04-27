# UI Plan

## Component inventory

- `AppShell`: persistent navigation and content frame
- `ScenarioSidebar`: scenario picker and runtime summary
- `Masthead`: timestamp and threat posture
- `DashboardHero`: headline narrative plus top-level KPI summary
- `MetricStrip`: compact metric cards with deltas
- `ThreatFeedPanel`: live synthetic event stream
- `AssetGridPanel`: asset health and coverage tiles
- `MissionTimelinePanel`: mission readiness and ETA
- `DemoControlSurface`: hidden operator controls for demo mode

## Responsive behavior

- Desktop uses a two-column shell with sidebar separation.
- Tablet collapses the sidebar above the main content.
- Mobile keeps every panel as a single-column card stack with preserved controls access.

## Visual direction

- Cold, aviation-inspired palette with cyan accents and warm alert tones
- Display typography for headings, technical sans for body copy
- Layered gradients and translucent panels instead of flat card stacks
