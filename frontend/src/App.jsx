
import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { supabase, supabaseConfigured } from "./supabaseClient";
import Login from "./login.jsx";

const Dashboard = lazy(() => import("./dashboard.jsx"));
const Chatbot = lazy(() => import("./chat.jsx"));
const InterviewPractice = lazy(() => import("./interview.jsx"));
const ResumeChecker = lazy(() => import("./resume.jsx"));

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (!supabase) return undefined;

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Session error:", error);
      }

      if (mounted) {
        setSession(data?.session ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!supabaseConfigured) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/resume-checker" element={<ResumeChecker />} />
          <Route
            path="*"
            element={
              <main
                style={{
                  minHeight: "100vh",
                  display: "grid",
                  placeItems: "center",
                  padding: "24px",
                  background: "#080d1d",
                  color: "#f1f5ff",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                <section
                  style={{
                    width: "min(100%, 620px)",
                    padding: "32px",
                    border: "1px solid #334155",
                    borderRadius: "16px",
                    background: "#111a30",
                    lineHeight: 1.6,
                  }}
                >
                  <h1 style={{ marginTop: 0 }}>Supabase setup required</h1>
                  <p>
                    Login and the dashboard need Supabase project settings.
                    The app could not find them, so it stopped before rendering
                    the login screen.
                  </p>
                  <p>
                    Add <code>VITE_SUPABASE_URL</code> and{" "}
                    <code>VITE_SUPABASE_ANON_KEY</code> to{" "}
                    <code>frontend/.env.local</code>, then restart Vite.
                    See <code>frontend/README.md</code> for setup steps.
                  </p>
                  <p>
                    You can still use the resume checker locally:{" "}
                    <Link
                      to="/resume-checker"
                      style={{ color: "#93c5fd" }}
                    >
                      Open Resume Checker
                    </Link>
                    . Start the FastAPI backend on port 8000 first.
                  </p>
                </section>
              </main>
            }
          />
        </Routes>
      </BrowserRouter>
    );
  }

  if (session === undefined) {
    return <p className="app-loading">Loading...</p>;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<p className="app-loading">Loading...</p>}>
        {!session ? (
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard session={session} />} />

            <Route
              path="/interview/technical"
              element={
                <InterviewPractice session={session} mode="technical" />
              }
            />

            <Route
              path="/interview/general"
              element={
                <InterviewPractice session={session} mode="general" />
              }
            />

            <Route
              path="/resume-checker"
              element={<ResumeChecker session={session} />}
            />

            <Route
              path="/chatbot"
              element={<Chatbot userId={session.user.id} />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Suspense>
    </BrowserRouter>
  );
}
