import { isDemoDataControls } from "@aero-shield/domain";

import { useDemoProvider } from "./demo-context";

export const DemoControlSurface = ({
  visible,
  onToggle
}: {
  visible: boolean;
  onToggle: () => void;
}) => {
  const provider = useDemoProvider();
  const controls = isDemoDataControls(provider) ? provider : null;
  const runtime = controls?.getRuntimeState();

  if (!visible) {
    return null;
  }

  return (
    <div className={`demo-controls ${visible ? "demo-controls--visible" : ""}`}>
      <button className="demo-controls__toggle" onClick={onToggle} type="button">
        Demo Ops
      </button>
      {visible ? (
        <div className="demo-controls__panel">
          <label>
            Speed
            <select
              aria-label="Speed"
              value={runtime?.speedMultiplier ?? 1}
              onChange={(event) => {
                controls?.setSpeed(Number(event.target.value));
              }}
            >
              {[0.5, 1, 2, 4].map((speed) => (
                <option key={speed} value={speed}>
                  {speed}x
                </option>
              ))}
            </select>
          </label>

          <div className="demo-controls__actions">
            <button
              type="button"
              onClick={() => {
                if (runtime?.isRunning) {
                  provider.stop();
                  return;
                }
                provider.start();
              }}
            >
              {runtime?.isRunning ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => {
                controls?.reset();
              }}
            >
              Reset
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
