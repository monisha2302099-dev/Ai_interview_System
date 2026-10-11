
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Login from "./login.jsx";
import DashboardPage from "./dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        console.error("Session error:", error.message);
      }

      setUser(data?.session?.user ?? null);
      setCheckingSession(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setCheckingSession(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
      alert("Could not log out: " + error.message);
    }
  }

  if (checkingSession) {
    return (
      <div className="app-loading">
        Checking your login...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <DashboardPage
      userId={user.id}
      userEmail={user.email}
      onLogout={handleLogout}
    />
  );
}
