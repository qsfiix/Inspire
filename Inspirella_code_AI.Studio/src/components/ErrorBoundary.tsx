import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Top-level crash guard.
 *
 * Without this, an uncaught error anywhere in the component tree unmounts the
 * whole app and React renders nothing - a blank white screen with no
 * explanation. This is deliberately a class component (React's error boundary
 * API has no hook equivalent) with the smallest possible dependency surface:
 * no i18n, no theme, no app state - all of those could themselves be part of
 * what crashed, so the fallback must not depend on any of it to render safely.
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Inspirella crashed:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          backgroundColor: "#06040a",
          color: "#e2e8f0",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>🐦‍🔥</div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>Something went wrong</h1>
        <p style={{ fontSize: "0.875rem", color: "#a1a1aa", maxWidth: "28rem", margin: 0 }}>
          Inspirella hit an unexpected error. Your saved data is safe - reloading the page usually
          fixes this.
        </p>
        <button
          onClick={this.handleReload}
          style={{
            marginTop: "0.5rem",
            padding: "0.65rem 1.5rem",
            borderRadius: "0.75rem",
            border: "none",
            background: "linear-gradient(to right, #7c3aed, #4f46e5)",
            color: "white",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: "pointer"
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
