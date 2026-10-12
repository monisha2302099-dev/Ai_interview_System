
import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./login.css";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function changeMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    // Validate email
    if (!cleanEmail) {
      setMessage("Please enter your email address.");
      return;
    }

    // Validate password
    if (mode !== "forgot" && !password) {
      setMessage("Please enter your password.");
      return;
    }

    // Signup validation
    if (mode === "signup") {
      if (!fullName.trim()) {
        setMessage("Please enter your full name.");
        return;
      }

      if (password.length < 8) {
        setMessage("Password must contain at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      // SIGN UP
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.user && data.session) {
          setMessage("Account created successfully! You are now logged in.");
        } else if (data.user) {
          setMessage(
            "Account created! Please check your email to confirm your account."
          );
        } else {
          setMessage("Unable to create your account. Please try again.");
        }
      }

      // LOGIN
      else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          throw error;
        }

        // App.jsx listens for the Supabase session
        // and displays the dashboard after successful login.
      }

      // FORGOT PASSWORD
      else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo: window.location.origin,
          }
        );

        if (error) {
          throw error;
        }

        setMessage(
          "If an account exists for this email, a password reset link will be sent."
        );
      }
    } catch (error) {
      console.error("Authentication error:", error);

      setMessage(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">AI INTERVIEW SYSTEM</div>

        <h1>
          {mode === "login"
            ? "Welcome back"
            : mode === "signup"
              ? "Create your account"
              : "Reset password"}
        </h1>

        <p className="login-subtitle">
          {mode === "login"
            ? "Sign in to continue your interview preparation."
            : mode === "signup"
              ? "Create an account to start your journey."
              : "Enter your email to receive a reset link."}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label>
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          {mode !== "forgot" && (
            <label>
              Password

              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete={
                    mode === "signup"
                      ? "new-password"
                      : "current-password"
                  }
                  minLength={mode === "signup" ? 8 : undefined}
                  required
                />

                <button
                  type="button"
                  className="eye-button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  title={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </label>
          )}

          {mode === "signup" && (
            <label>
              Confirm password

              <div className="password-field">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="eye-button"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  title={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? "🙈" : "👁"}
                </button>
              </div>
            </label>
          )}

          {mode === "login" && (
            <button
              type="button"
              className="text-button forgot-button"
              onClick={() => changeMode("forgot")}
            >
              Forgot password?
            </button>
          )}

          {message && (
            <p className="login-message" role="status" aria-live="polite">
              {message}
            </p>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : mode === "signup"
                  ? "Create Account"
                  : "Send Reset Link"}
          </button>
        </form>

        <p className="login-switch">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => changeMode("signup")}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              {mode === "forgot"
                ? "Remember your password?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => changeMode("login")}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </section>
    </main>
  );
}
