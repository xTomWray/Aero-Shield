/**
 * @fileoverview Mounts the Aero Shield React application to the DOM with strict mode enabled.
 *
 * @module       web/entry
 * @exports      none — application entry point
 * @dependsOn    react, react-dom, ./app/App
 * @usedBy       entry point
 * @sideEffects  mounts React app to DOM
 * @stability    stable
 * @tests        no tests
 *
 * @invariants   Runs in React.StrictMode for development checks. Assumes #root element exists in HTML.
 */
import React from "react";
import ReactDOM from "react-dom/client";

import { AeroShieldApp } from "./app/App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AeroShieldApp />
  </React.StrictMode>
);
