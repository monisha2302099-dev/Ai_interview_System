
import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./login.css";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);

  function changeMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setCanResendConfirmation(false);
    setPassword("");
    setConfirmPassword("");
  }

  async function resendConfirmation() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || loading) return;

    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      setCanResendConfirmation(false);
      setMessage("Confirmation email sent. Open its link to verify your account.");
    } catch (error) {
      console.error("Could not resend confirmation email:", error);
      setMessage(error.message || "Could not resend the confirmation email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setCanResendConfirmation(false);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

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
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error("Account was not created. Please try again.");
        }

        if (data.session) {
          // App.jsx will detect the new session and open the dashboard.
          setMessage("Account created successfully!");
        } else {
          // Email confirmation is enabled in Supabase.
          setMessage(
            "Account submitted! Confirm your email using the link we sent. You’ll be redirected to the dashboard after confirmation. If you aren’t signed in automatically, return here and sign in."
          );
          setMode("login");
          setPassword("");
          setConfirmPassword("");
        }
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        // App.jsx listens for the Supabase session and opens the dashboard.
        setMessage("Login successful!");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo: window.location.origin,
          }
        );

        if (error) throw error;

        setMessage("If the account exists, a password reset email will be sent.");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setMessage(error.message || "Something went wrong. Please try again.");
      setCanResendConfirmation(
        mode === "login" &&
          (error.code === "email_not_confirmed" ||
            /email not confirmed/i.test(error.message || ""))
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                minLength={mode === "signup" ? 8 : undefined}
                required
              />
            </label>
          )}

          {mode === "signup" && (
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
              />
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
            <p className="login-message" role="status">
              {message}
            </p>
          )}

          {canResendConfirmation && (
            <button
              type="button"
              className="text-button confirmation-resend"
              onClick={resendConfirmation}
              disabled={loading}
            >
              {loading ? "Sending..." : "Resend confirmation email"}
            </button>
          )}

          <button className="login-submit" type="submit" disabled={loading}>
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
              Already have an account?{" "}
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
