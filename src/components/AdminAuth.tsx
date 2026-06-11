import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react";

export function AdminAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  // Read from env, fallback if not set
  const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || "surnooradmin";

  useEffect(() => {
    const auth = localStorage.getItem("adminAuth");
    if (auth === correctPassword) {
      setIsAuthenticated(true);
    }
  }, [correctPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      localStorage.setItem("adminAuth", password);
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex flex-col items-center justify-center p-6 selection:bg-primary/20">
      <div className="max-w-md w-full bg-background border border-border p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6 rounded-full">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="font-serif text-3xl mb-2">Restricted Access</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Please enter the administrative password to continue to the backend.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-left">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={`w-full p-3 text-sm bg-card border outline-none transition-colors ${
                error ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
              }`}
            />
            {error && <p className="text-destructive text-xs mt-2">Incorrect password.</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-background text-xs tracking-[0.15em] uppercase font-medium py-3.5 hover:opacity-90 transition-opacity"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
