import React from "react";

interface SourcePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (source: { kind: "demo" } | { kind: "api"; url: string }) => void;
}

export const SourcePicker = ({ isOpen, onClose, onApply }: SourcePickerProps) => {
  const defaultApiUrl = "http://localhost:3000";
  const [apiUrl, setApiUrl] = React.useState(defaultApiUrl);

  const handleDemoClick = () => {
    onApply({ kind: "demo" });
    onClose();
  };

  const handleApiApply = () => {
    if (apiUrl.trim()) {
      onApply({ kind: "api", url: apiUrl.trim() });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="source-picker-backdrop" onClick={onClose} />
      <div className="source-picker">
        <h2 className="source-picker-heading">Select Data Source</h2>

        <button className="source-picker-option" onClick={handleDemoClick}>
          <div className="source-picker-label">Built-in Demo</div>
          <div className="source-picker-description">
            Replay pre-recorded attack scenarios
          </div>
        </button>

        <div className="source-picker-option source-picker-option-active">
          <div className="source-picker-label">Live API</div>
          <div className="source-picker-description">
            Connect to running Aero Shield API server
          </div>
          <input
            type="text"
            className="source-picker-url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder={defaultApiUrl}
          />
        </div>

        <div className="source-picker-actions">
          <button className="source-picker-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="source-picker-apply" onClick={handleApiApply}>
            Apply API URL
          </button>
        </div>
      </div>
    </>
  );
};
