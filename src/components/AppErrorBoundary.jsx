import React from "react";

// Wenn irgendwo etwas schiefgeht, soll die Seite nicht einfach weiß bleiben.
// Hier steht dann, was passiert ist — mit einem Knopf zum Neuladen.
// Die Farben sind absichtlich direkt gesetzt: Diese Meldung muss auch dann
// lesbar sein, wenn das Design gar nicht geladen wurde.
export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Fehler in der App:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = String(this.state.error?.message || this.state.error || "Unbekannter Fehler");

    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "40px",
          background: "#121316",
          color: "#f5f5f7",
          fontFamily: "Montserrat, system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>
          Da ist etwas schiefgelaufen
        </h1>
        <p style={{ fontSize: "14px", opacity: 0.75, marginBottom: "18px", maxWidth: "640px", lineHeight: 1.6 }}>
          Diese Meldung steht hier statt einer weißen Seite. Bitte einmal neu laden. Wenn sie wiederkommt, schick mir
          genau diesen Text — dann finde ich die Stelle.
        </p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: "12px",
            background: "#1b1c20",
            border: "1px solid #33353c",
            padding: "16px",
            borderRadius: "12px",
            maxWidth: "900px",
          }}
        >
          {message}
        </pre>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "18px",
            padding: "12px 24px",
            borderRadius: "999px",
            background: "#E29578",
            color: "#121316",
            fontWeight: 700,
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Neu laden
        </button>
      </div>
    );
  }
}