
import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import Login from "./login.jsx";

const Dashboard = lazy(() => import("./dashboard.jsx"));
const Chatbot = lazy(() => import("./chat.jsx"));
const InterviewPractice = lazy(() => import("./interview.jsx"));
const ResumeChecker = lazy(() => import("./resume.jsx"));

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
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
