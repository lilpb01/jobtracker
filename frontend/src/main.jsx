import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";      // <- must point to .jsx
import "./styles.css";            // or whatever your css file is named

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
