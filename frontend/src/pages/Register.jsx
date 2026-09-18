import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, login } from "../api";
import { saveAuth } from "../auth";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(email, password);
      const data = await login(email, password);
      saveAuth(data.access_token, email);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="surface p-8">
        <h1 className="text-base font-semibold tracking-tight text-paper-100 mb-1">
          Create account
        </h1>
        <p className="text-xs text-paper-400 mb-6">
          One account gives you access to the full analysis pipeline.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label block mb-1.5">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="label block mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-danger/30 bg-danger/5">
              <span className="w-1.5 h-1.5 rounded-full bg-danger" />
              <span className="text-xs text-danger">{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="divider my-6" />

        <p className="text-xs text-paper-400 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
