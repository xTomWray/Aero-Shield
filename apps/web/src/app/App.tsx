/**
 * @fileoverview Renders the top-level Aero Shield application with provider management and keyboard shortcuts.
 *
 * @module       web/app
 * @exports      AeroShieldApp
 * @dependsOn    react, @aero-shield/domain, @aero-shield/api-client, @aero-shield/mock-sim, ./dashboard, ./DemoControlSurface, ./SourcePicker, ./demo-context
 * @usedBy       main.tsx, App.test.tsx
 * @sideEffects  none — pure component (subscribes to context, manages provider lifecycle)
 * @stability    stable
 * @tests        App.test.tsx
 */
import { isDemoDataControls, scenarioCatalog } from "@aero-shield/domain";
import type { DemoDataProvider } from "@aero-shield/domain";
import { createApiDemoProvider } from "@aero-shield/api-client";
import { MockDemoProvider } from "@aero-shield/mock-sim";
import { useEffect, useState } from "react";

import { DemoControlSurface } from "./DemoControlSurface";
import { SourcePicker } from "./SourcePicker";
import {
  DashboardHeader,
  DetectionMatrix,
  SimulationCard,
  SummaryStats,
  ThreatTimelinePanel
} from "./dashboard";
import { DemoProviderContextRoot, useDemoProvider, useDemoSnapshot } from "./demo-context";

type DataSource = { kind: "demo" } | { kind: "api"; url: string };

const Dashboard = ({
  showControls,
  onToggleControls,
  sourceLabel,
  onSourceClick
}: {
  showControls: boolean;
  onToggleControls: () => void;
  sourceLabel: string;
  onSourceClick: () => void;
}) => {
  const provider = useDemoProvider();
  const snapshot = useDemoSnapshot();
  const runtime = isDemoDataControls(provider)
    ? provider.getRuntimeState()
    : { isRunning: false, speedMultiplier: 1 };

  return (
    <>
      <DemoControlSurface onToggle={onToggleControls} visible={showControls} />
      <main className="dashboard-shell">
        <div className="dashboard-grid">
          <DashboardHeader
            status={snapshot.status}
            sourceLabel={sourceLabel}
            onSourceClick={onSourceClick}
          />
          <SimulationCard simulation={snapshot.simulation} />
          <ThreatTimelinePanel timeline={snapshot.timeline} />
          <DetectionMatrix
            categories={snapshot.categories}
            refreshCadence={snapshot.status.refreshCadence}
          />
          <SummaryStats summary={snapshot.summary} />
        </div>
      </main>
      <div className="visually-hidden" data-testid="generated-at">
        {snapshot.generatedAt}
      </div>
      <div className="visually-hidden" data-testid="runtime-state">
        {runtime.isRunning ? "running" : "paused"}-{runtime.speedMultiplier}
      </div>
      <div className="visually-hidden" data-testid="scenario-name">
        {scenarioCatalog.find((scenario) => scenario.id === snapshot.scenarioId)?.name}
      </div>
    </>
  );
};

const getSourceLabel = (source: DataSource): string => {
  if (source.kind === "demo") return "Built-in Demo";
  return `API: ${source.url}`;
};

const API_URL = import.meta.env["VITE_API_BASE_URL"] as string | undefined;

const resolveInitialSource = (): DataSource => {
  if (API_URL) return { kind: "api", url: API_URL };
  return { kind: "demo" };
};

export const AeroShieldApp = ({ provider }: { provider?: DemoDataProvider }) => {
  const [dataSource, setDataSource] = useState<DataSource>(resolveInitialSource);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [resolvedProvider, setResolvedProvider] = useState<DemoDataProvider>(() => {
    if (provider) return provider;
    const source = resolveInitialSource();
    if (source.kind === "api") {
      return createApiDemoProvider({ baseUrl: source.url });
    }
    return new MockDemoProvider();
  });
  const [showControls, setShowControls] = useState(false);

  const handleSourceChange = (source: DataSource) => {
    setDataSource(source);

    if (source.kind === "demo") {
      const newProvider = new MockDemoProvider();
      setResolvedProvider(newProvider);
      newProvider.start();
    } else {
      const newProvider = createApiDemoProvider({ baseUrl: source.url });
      setResolvedProvider(newProvider);
      newProvider.start();
    }
  };

  useEffect(() => {
    resolvedProvider.start();
    return () => {
      resolvedProvider.stop();
    };
  }, [resolvedProvider]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "d" && event.shiftKey) {
        setShowControls((value) => !value);
      }
      if (event.key.toLowerCase() === "s" && event.shiftKey) {
        setShowSourcePicker((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <DemoProviderContextRoot value={resolvedProvider}>
      <SourcePicker
        isOpen={showSourcePicker}
        onClose={() => setShowSourcePicker(false)}
        onApply={handleSourceChange}
      />
      <Dashboard
        onToggleControls={() => {
          setShowControls((value) => !value);
        }}
        showControls={showControls}
        sourceLabel={getSourceLabel(dataSource)}
        onSourceClick={() => setShowSourcePicker(true)}
      />
    </DemoProviderContextRoot>
  );
};
