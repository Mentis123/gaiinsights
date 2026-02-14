import { useState } from "react";

interface LoginScreenProps {
  onSuccess: () => void;
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(false);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      onSuccess();
    } else {
      setAuthError(true);
      setPassword("");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="fade-in w-full max-w-sm">
        <div className="glass-strong rounded-2xl p-10 glow-border glow-purple relative">
          <div className="scanline" />

          {/* Logo */}
          <div className="flex justify-center mb-10">
            <div className="logo-mark">
              <div className="logo-mark-inner">
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#0AACDC", fontFamily: "Syne, sans-serif" }}
                >
                  G
                </span>
              </div>
              <div className="logo-dot" />
            </div>
          </div>

          <h1 className="heading-display text-2xl text-center mb-1">
            GAI Insights
          </h1>
          <p className="text-center text-subtle text-sm mb-8">
            Deck Builder
          </p>

          <div className="glow-line mb-8" />

          <form onSubmit={handleLogin}>
            <input
              type="password"
              className="password-input"
              placeholder="Enter access code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              aria-label="Access code"
              autoComplete="current-password"
            />

            {authError && (
              <p
                className="text-center mt-4 text-sm font-medium fade-in"
                style={{ color: "#D200F5" }}
              >
                Invalid code. Try again.
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full mt-6"
              disabled={!password}
            >
              <span>Enter</span>
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-xs text-subtle">
          Powered by Claude Sonnet 4.5
        </p>
      </div>
    </main>
  );
}
