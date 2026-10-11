
import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import "./dashboard.css";
import {
  BrainCircuit,
  Code2,
  Mic,
  FileText,
  Activity,
  UserRound,
  ChevronDown,
  ChevronRight,
  Bot,
  Send,
  Zap,
  Network,
  LayoutDashboard,
  Users,
  MessageCircle,
  AudioLines,
  Paperclip,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import "./App.css";

const modules = [
  {
    title: "Technical System",
    description: "DSA, System Design, Live Coding",
    subtitle: "18 Scenarios  •  Adaptive AI Evaluator",
    button: "Start Technical",
    theme: "cyan",
    icon: Code2,
  },
  {
    title: "General Interview",
    description: "Behavioral, STAR Method & Leadership",
    subtitle: "Voice & Tone Feedback  •  Real-time",
    button: "Practice General",
    theme: "purple",
    icon: Mic,
  },
  {
    title: "Resume Checker",
    description: "ATS Score & Keyword Optimizer",
    subtitle: "Last Scan: 92/100 ATS Match",
    button: "Upload & Check",
    theme: "mint",
    icon: FileText,
  },
];

const suggestions = [
  {
    icon: Zap,
    text: "Common Amazon LP questions?",
  },
  {
    icon: Network,
    text: "System design mock tips",
  },
  {
    icon: UserRound,
    text: "How to answer 'Tell me about yourself'?",
  },
];

const navigation = [
  { label: "Live Deck", icon: LayoutDashboard },
  { label: "Telemetry", icon: Activity },
  { label: "Roster", icon: Users },
  { label: "Neural", icon: BrainCircuit },
];

const welcomeMessages = [
  {
    id: "welcome",
    role: "ai",
    text: "Welcome! Ask a question or choose one of the suggestions to start an interview practice session.",
    time: "",
  },
];

function formatMessageTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getReply(question) {
  const q = question.toLowerCase();

  if (q.includes("amazon") || q.includes("leadership")) {
    return "Practice Amazon Leadership Principles using the STAR method: Situation, Task, Action, and Result. Prepare examples for ownership, customer obsession, and handling difficult challenges.";
  }

  if (q.includes("system design")) {
    return "Start by clarifying requirements, estimating scale, and identifying core components. Then discuss APIs, database design, caching, scalability, and trade-offs. Practice designing a URL shortener or a chat application.";
  }

  if (q.includes("tell me about yourself") || q.includes("introduce")) {
    return "Structure your introduction in three parts: your current education or role, your relevant skills and projects, and your career goal. Keep it concise, specific, and relevant to the job.";
  }

  if (q.includes("array") || q.includes("linked list")) {
    return "Arrays provide fast index-based access, usually O(1), while linked lists require traversal for access, usually O(n). Linked lists can insert or delete nodes efficiently when the relevant node is already known.";
  }

  return "Let's work through that together. Explain your current understanding first, and we'll break the topic into a clear definition, a simple example, and the key interview points.";
}

export default function DashboardPage({ userId, userEmail, onLogout }) {
  const [messages, setMessages] = useState(welcomeMessages);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState("");
  const [activeNav, setActiveNav] = useState("Live Deck");
  const [activeModule, setActiveModule] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const chatSectionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      try {
        const { data: savedSessions, error: sessionsError } = await supabase
          .from("interview_sessions")
          .select("id, title, updated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(50);

        if (sessionsError) throw sessionsError;
        if (cancelled) return;

        const history = savedSessions ?? [];
        setSessions(history);

        if (!history.length) {
          setSessionId("");
          setMessages(welcomeMessages);
          return;
        }

        const latestSession = history[0];
        const { data: savedMessages, error: messagesError } = await supabase
          .from("interview_messages")
          .select("id, role, content, created_at")
          .eq("session_id", latestSession.id)
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;
        if (cancelled) return;

        setSessionId(latestSession.id);
        setMessages(
          (savedMessages ?? []).map((savedMessage) => ({
            id: savedMessage.id,
            role: savedMessage.role,
            text: savedMessage.content,
            time: formatMessageTime(savedMessage.created_at),
          }))
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Could not load interview history:", error);
          setNotice(`Could not load saved interview history: ${error.message}`);
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function goToChatbot() {
    setNotice("Opening the AI interview mentor chat.");
    chatSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function loadSession(selectedSessionId) {
    if (!selectedSessionId) {
      setSessionId("");
      setMessages(welcomeMessages);
      return;
    }

    setHistoryLoading(true);
    setNotice("");
    try {
      const { data: savedMessages, error } = await supabase
        .from("interview_messages")
        .select("id, role, content, created_at")
        .eq("session_id", selectedSessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setSessionId(selectedSessionId);
      setMessages(
        (savedMessages ?? []).map((savedMessage) => ({
          id: savedMessage.id,
          role: savedMessage.role,
          text: savedMessage.content,
          time: formatMessageTime(savedMessage.created_at),
        }))
      );
    } catch (error) {
      console.error("Could not load interview session:", error);
      setNotice(`Could not load this interview session: ${error.message}`);
    } finally {
      setHistoryLoading(false);
    }
  }

  function startNewSession() {
    setSessionId("");
    setMessages(welcomeMessages);
    setInput("");
    setNotice("New practice session ready. It will be saved when you send a message.");
  }

  async function sendMessage(text = input) {
    const question = text.trim();
    if (!question || isSending || historyLoading) return;

    setIsSending(true);
    setNotice("");

    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const { data: newSession, error: sessionError } = await supabase
          .from("interview_sessions")
          .insert({
            user_id: userId,
            title: question.slice(0, 80),
          })
          .select("id, title, updated_at")
          .single();

        if (sessionError) throw sessionError;

        activeSessionId = newSession.id;
        setSessionId(activeSessionId);
        setSessions((current) => [newSession, ...current]);
      }

      const { data: savedUserMessage, error: userMessageError } = await supabase
        .from("interview_messages")
        .insert({
          session_id: activeSessionId,
          role: "user",
          content: question,
        })
        .select("id, role, content, created_at")
        .single();

      if (userMessageError) throw userMessageError;

      setMessages((current) => [
        ...current.filter((item) => item.id !== "welcome"),
        {
          id: savedUserMessage.id,
          role: savedUserMessage.role,
          text: savedUserMessage.content,
          time: formatMessageTime(savedUserMessage.created_at),
        },
      ]);
      setInput("");

      const reply = getReply(question);
      const { data: savedAssistantMessage, error: assistantMessageError } =
        await supabase
          .from("interview_messages")
          .insert({
            session_id: activeSessionId,
            role: "ai",
            content: reply,
          })
          .select("id, role, content, created_at")
          .single();

      if (assistantMessageError) throw assistantMessageError;

      setMessages((current) => [
        ...current,
        {
          id: savedAssistantMessage.id,
          role: savedAssistantMessage.role,
          text: savedAssistantMessage.content,
          time: formatMessageTime(savedAssistantMessage.created_at),
        },
      ]);

      const { data: updatedSession, error: updateError } = await supabase
        .from("interview_sessions")
        .update({ updated_at: savedAssistantMessage.created_at })
        .eq("id", activeSessionId)
        .select("id, title, updated_at")
        .single();

      if (updateError) throw updateError;

      setSessions((current) => [
        updatedSession,
        ...current.filter((session) => session.id !== updatedSession.id),
      ]);
    } catch (error) {
      console.error("Could not save interview message:", error);
      setNotice(`Could not save this message: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  }

  function openModule(title) {
    setActiveModule(title);
    const nextNotice =
      title === "Resume Checker"
        ? "Resume Checker selected. Connect your resume upload and ATS analysis feature here."
        : `${title} selected. Connect your interview session feature here.`;
    setNotice(nextNotice);
    if (title === "General Interview" || title === "Technical System") {
      goToChatbot();
    }
  }

  function selectNavigation(label) {
    setActiveNav(label);
    if (label === "Neural") {
      goToChatbot();
      setNotice("AI interview mentor is ready. Redirecting to the chatbot.");
    } else {
      setNotice(
        label === "Live Deck"
          ? ""
          : `${label} selected. Connect this section to your dashboard data.`
      );
    }
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="mobile-menu icon-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <div className="brand">
          <div className="brand-icon">
            <BrainCircuit size={29} />
          </div>
          <div className="brand-title">
            <strong>AI INTERVIEW SYSTEM</strong>
            <span className="brand-divider">/</span>
            <span className="feed-label">EVALUATION FEED</span>
          </div>
        </div>

        <div className="system-status">
          <span className="status-pill">
            <span className="status-dot" />
            NEURAL LINK ACTIVE
          </span>
          <span className="online-status">
            <AudioLines size={17} />
            ONLINE 99.8%
          </span>
        </div>

        <div className="profile-area">
          <button
            className="profile-button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="Open profile menu"
          >
            <UserRound size={20} />
            <ChevronDown size={15} />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <strong>Candidate Profile</strong>
              <span>{userEmail || "Interview candidate"}</span>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  setNotice("Profile details are ready to connect to your data source.");
                }}
              >
                View Profile
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  if (onLogout) {
                    onLogout();
                    return;
                  }
                  setNotice("Connect this action to Supabase signOut().");
                }}
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </header>

      {notice && (
        <div className="notice-bar">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      <main className="dashboard-content">
        <section className="quick-grid" aria-label="Quick actions">
          <button
            className="quick-card cyan"
            onClick={() => {
              openModule("Technical System");
              goToChatbot();
            }}
          >
            <span className="quick-icon"><Code2 size={31} /></span>
            <span className="quick-copy">
              <span className="quick-title">
                Technical <span className="tag">LIVE</span>
              </span>
              <span className="quick-description">Code. Design. Build.</span>
            </span>
            <AudioLines className="quick-signal" size={25} />
          </button>

          <button
            className="quick-card purple"
            onClick={() => {
              openModule("General Interview");
              goToChatbot();
            }}
          >
            <span className="quick-icon"><Mic size={30} /></span>
            <span className="quick-copy">
              <span className="quick-title">
                General <span className="tag">VOICE</span>
              </span>
              <span className="quick-description">Communicate. Express. Grow.</span>
            </span>
            <AudioLines className="quick-signal" size={25} />
          </button>

          <button
            className="quick-card mint"
            onClick={() => {
              openModule("Resume Checker");
              goToChatbot();
            }}
          >
            <span className="quick-icon"><FileText size={30} /></span>
            <span className="quick-copy">
              <span className="quick-title">
                Resume <span className="tag">ATS 9.4</span>
              </span>
              <span className="quick-description">Optimize. Match. Get Hired.</span>
            </span>
            <Activity className="quick-signal" size={25} />
          </button>
        </section>

        <section className="modules-section">
          <div className="section-heading">
            <span className="heading-accent" />
            <h2>Evaluation Modules</h2>
          </div>

          <div className="module-list">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <article
                  className={`module-card ${module.theme} ${
                    activeModule === module.title ? "module-selected" : ""
                  }`}
                  key={module.title}
                >
                  <div className="module-icon">
                    <Icon size={32} />
                  </div>

                  <div className="module-copy">
                    <h3>{module.title}</h3>
                    <p>{module.description}</p>
                    <span>{module.subtitle}</span>
                  </div>

                  <button
                    className="module-action"
                    onClick={() => {
                      openModule(module.title);
                      if (module.title !== "Resume Checker") {
                        goToChatbot();
                      }
                    }}
                  >
                    {module.button}
                    <ChevronRight size={19} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mentor-panel" ref={chatSectionRef}>
          <div className="mentor-header">
            <div className="mentor-title">
              <div className="bot-logo">
                <Bot size={32} />
              </div>
              <h2>
                AI Interview Mentor
                <span className="mentor-subtitle"> - Q&A Neural Engine</span>
              </h2>
              <span className="mentor-online">
                <span className="status-dot" /> ONLINE
              </span>
            </div>
            <div className="powered-by">
              <BrainCircuit size={21} />
              <span>Powered by Custom InterviewLLM</span>
            </div>
          </div>

          <div className="suggestion-list">
            {suggestions.map((suggestion) => {
              const Icon = suggestion.icon;
              return (
                <button
                  className="suggestion-pill"
                  key={suggestion.text}
                  onClick={() => sendMessage(suggestion.text)}
                  disabled={isSending || historyLoading}
                >
                  <Icon size={16} />
                  {suggestion.text}
                </button>
              );
            })}
          </div>

          <div className="session-toolbar">
            <label htmlFor="saved-session">Interview history</label>
            <select
              id="saved-session"
              value={sessionId}
              onChange={(event) => loadSession(event.target.value)}
              disabled={historyLoading || isSending}
            >
              <option value="">New session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="new-session-button"
              onClick={startNewSession}
              disabled={historyLoading || isSending}
            >
              New session
            </button>
          </div>

          <div className="chat-box">
            <div className="messages-list" aria-live="polite">
              {messages.map((message, index) => (
                <div
                  className={`message-row ${message.role}`}
                  key={message.id ?? `${index}-${message.time}`}
                >
                  {message.role === "ai" && (
                    <div className="message-avatar">
                      <Bot size={19} />
                    </div>
                  )}

                  <div className="message-bubble">
                    <p>{message.text}</p>
                    <span>{message.time}</span>
                  </div>

                  {message.role === "user" && (
                    <div className="message-avatar user-avatar">
                      <UserRound size={19} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form
              className="chat-input-row"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <button
                type="button"
                className="input-icon"
                title="Voice input can be connected here"
                onClick={() =>
                  setNotice("Voice input is not connected yet.")
                }
              >
                <Mic size={21} />
              </button>

              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask AI interview coach anything..."
                aria-label="Message the AI interview mentor"
                disabled={isSending || historyLoading}
              />

              <button
                type="submit"
                className="send-button"
                aria-label="Send message"
                disabled={!input.trim() || isSending || historyLoading}
              >
                <Send size={21} />
              </button>
            </form>
          </div>
        </section>
      </main>

      <nav className={`bottom-dock ${sidebarOpen ? "dock-open" : ""}`}>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`dock-item ${
                activeNav === item.label ? "active" : ""
              }`}
              onClick={() => selectNavigation(item.label)}
            >
              <Icon size={23} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
