import React, { useId, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const DEMO_EMAIL = "admin@dairyops.com";
const DEMO_PASSWORD = "Admin@123";

function EyeIcon({ hidden = false }) {
  return hidden ? (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c5.2 0 8.7 4.7 9.7 7-.4.9-1.2 2.1-2.4 3.3M6.1 6.1C4.2 7.5 2.9 9.5 2.3 11c1 2.3 4.5 7 9.7 7 1.1 0 2.2-.2 3.2-.6" />
    </svg>
  ) : (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.3 12S5.8 5 12 5s9.7 7 9.7 7-3.5 7-9.7 7-9.7-7-9.7-7Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 20 6v5c0 5.2-3.4 8.8-8 10-4.6-1.2-8-4.8-8-10V6l8-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-4.8" />
    </svg>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [validationError, setValidationError] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailId = useId();
  const passwordId = useId();

  const from = location.state?.from?.pathname || "/dashboard";

  const validate = () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return "Please enter a valid email address.";
    if (!password) return "Please enter your password.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    const validationMessage = validate();
    setValidationError(validationMessage);
    if (validationMessage) return;

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message || "Invalid email or password. Please try again.");
    }
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setValidationError("");
    setErrorMsg("");
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setValidationError("");
    setErrorMsg("");
  };

  return (
    <main id="login-page" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-ds-lg lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-600/20 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" aria-hidden="true" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold shadow-lg">DO</div>
                <div>
                  <p className="text-sm font-bold tracking-tight">DairyOps</p>
                  <p className="text-xs text-slate-400">Predictive Operations</p>
                </div>
              </div>

              <div className="mt-20 max-w-lg">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-300">Operations command center</p>
                <h1 className="mt-5 text-4xl font-bold tracking-tight xl:text-5xl">Run dairy operations with confidence.</h1>
                <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
                  Monitor workflows, forecasts, predictions, anomalies and operational actions from one secure workspace.
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-3 text-xs text-slate-400">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-primary-300"><ShieldIcon /></span>
              Secure role-aware access
            </div>
          </section>

          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-14">
            <div className="w-full max-w-md">
              <div className="mb-8 lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white">DO</div>
                  <div>
                    <p className="text-sm font-bold tracking-tight text-slate-950">DairyOps</p>
                    <p className="text-xs text-slate-500">Predictive Operations</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-primary-600">Welcome back</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Sign in to DairyOps</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Use your account to access the operations command center.</p>
              </div>

              {(errorMsg || validationError) && (
                <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3" role="alert" aria-live="assertive">
                  <p className="text-sm font-semibold text-rose-800">Unable to sign in</p>
                  <p className="mt-1 text-sm leading-5 text-rose-700">{validationError || errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
                <div>
                  <label htmlFor={emailId} className="ds-label">Email address</label>
                  <input
                    id={emailId}
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={handleEmailChange}
                    disabled={loading}
                    aria-invalid={Boolean(validationError && !email.trim())}
                    className="ds-input mt-2 h-11"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor={passwordId} className="ds-label">Password</label>
                  </div>
                  <div className="relative mt-2">
                    <input
                      id={passwordId}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={handlePasswordChange}
                      disabled={loading}
                      aria-invalid={Boolean(validationError && !password)}
                      className="ds-input h-11 pr-12"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      disabled={loading}
                      className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <EyeIcon hidden={showPassword} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="ds-btn ds-btn-primary h-11 w-full text-sm"
                  aria-busy={loading}
                >
                  {loading ? <><Spinner /> Signing you in...</> : "Sign in"}
                </button>
              </form>

              <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4" aria-label="Demo login credentials">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><ShieldIcon /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Demo login credentials</p>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4 sm:gap-y-2">
                      <span className="font-medium text-slate-500">E-mail</span>
                      <code className="break-all rounded bg-white px-2 py-1 font-mono text-xs text-slate-800 ring-1 ring-slate-200">{DEMO_EMAIL}</code>
                      <span className="font-medium text-slate-500">Password</span>
                      <code className="rounded bg-white px-2 py-1 font-mono text-xs text-slate-800 ring-1 ring-slate-200">{DEMO_PASSWORD}</code>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-center text-xs leading-5 text-slate-400">DairyOps · Predictive Operations Command Center</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
