import React from "react";
import ReactDOM from "react-dom/client";

import { AeroShieldApp } from "./app/App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AeroShieldApp />
  </React.StrictMode>
);
