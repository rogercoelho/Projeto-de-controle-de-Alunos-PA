import React from "react";

const Puter = () => (
  <div style={{ width: "100%", height: "100%", minHeight: 600 }}>
    <iframe
      src="https://js.puter.com/v2/"
      title="Puter Online OS"
      style={{ width: "100%", height: "100%", border: "none" }}
      allow="clipboard-write; clipboard-read; fullscreen"
    />
  </div>
);

export default Puter;
