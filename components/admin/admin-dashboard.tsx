"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Briefcase,
  User,
  Trophy,
  Users,
  Share2,
  Settings as SettingsIcon,
  Database,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Check,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Star,
  StarOff,
  X,
  Download,
  Shield,
} from "lucide-react";
import SortableList from "@/components/admin/sortable-list";
import AboutGalleryEditor from "@/components/admin/about-gallery-editor";
import { isCloudinaryImageUrl } from "@/lib/cloudinary/image-url";
import type {
  Project,
  Experience,
  Profile,
  Hackathon,
  CommunityEvent,
  ImageAsset,
  SocialLink,
  SiteSettings,
} from "@/lib/validators/schemas";

type Tab =
  | "projects"
  | "experience"
  | "profile"
  | "hackathons"
  | "events"
  | "socials"
  | "settings";

interface MongoStatus {
  success: boolean;
  message: string;
  dbName: string;
  uriMasked: string;
  collections: string[];
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Collections state
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Database connection status
  const [dbStatus, setDbStatus] = useState<MongoStatus | null>(null);
  const [testingDb, setTestingDb] = useState(false);

  // Modals state
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingExperience, setEditingExperience] = useState<Partial<Experience> | null>(null);
  const [editingHackathon, setEditingHackathon] = useState<Partial<Hackathon> | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<CommunityEvent> | null>(null);
  const [posterLoadError, setPosterLoadError] = useState<string | null>(null);
  const [editingSocial, setEditingSocial] = useState<Partial<SocialLink> | null>(null);

  // Lock body scroll and handle escape key when any modal is open
  const isModalOpen = Boolean(
    editingProject ||
    editingExperience ||
    editingHackathon ||
    editingEvent ||
    editingSocial
  );

  useEffect(() => {
    if (isModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setEditingProject(null);
          setEditingExperience(null);
          setEditingHackathon(null);
          setEditingEvent(null);
          setEditingSocial(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isModalOpen]);

  // Temporary tag inputs
  const [tempTag, setTempTag] = useState("");
  const [tempAchievement, setTempAchievement] = useState("");

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch all collections
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, expRes, profRes, hackRes, evRes, socRes, setRes, dbRes] =
        await Promise.all([
          fetch("/api/admin/content?collection=projects"),
          fetch("/api/admin/content?collection=experiences"),
          fetch("/api/admin/content?collection=profile"),
          fetch("/api/admin/content?collection=hackathons"),
          fetch("/api/admin/content?collection=events"),
          fetch("/api/admin/content?collection=socials"),
          fetch("/api/admin/content?collection=settings"),
          fetch("/api/admin/database"),
        ]);

      if (projRes.ok) setProjects(await projRes.json());
      if (expRes.ok) setExperiences(await expRes.json());
      if (profRes.ok) {
        const p = await profRes.json();
        setProfile(p[0] || null);
      }
      if (hackRes.ok) setHackathons(await hackRes.json());
      if (evRes.ok) setEvents(await evRes.json());
      if (socRes.ok) setSocials(await socRes.json());
      if (setRes.ok) {
        const s = await setRes.json();
        setSettings(s[0] || null);
      }
      if (dbRes.ok) setDbStatus(await dbRes.json());
    } catch {
      showToast("Error synchronizing with database", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Start the initial async synchronization; its state changes follow the fetch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllData();
  }, [loadAllData]);

  // Test MongoDB Connection
  const checkMongoStatus = async () => {
    setTestingDb(true);
    try {
      const res = await fetch("/api/admin/database");
      const data = await res.json();
      setDbStatus(data);
      if (data.success) {
        showToast("Connected to MongoDB cluster!");
      } else {
        showToast(data.message || "MongoDB connection failed", "error");
      }
    } catch {
      showToast("Could not verify database status", "error");
    } finally {
      setTestingDb(false);
    }
  };

  // Generic Save (Create or Update)
  const saveItem = async <T extends { id?: string }>(collection: string, item: T, isNew: boolean) => {
    setLoading(true);
    try {
      const method = isNew ? "POST" : "PATCH";
      const body = isNew
        ? { collection, item }
        : {
            collection,
            id: item.id,
            patch: collection === "events"
              ? { ...item, image: (item as T & { image?: ImageAsset }).image ?? null }
              : item,
          };

      const res = await fetch("/api/admin/content", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const fieldErrors = err?.details?.fieldErrors as Record<string, string[]> | undefined;
        const validationMessage = fieldErrors
          ? Object.entries(fieldErrors)
              .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
              .join("; ")
          : "";
        throw new Error(
          [err?.error || "Save operation failed", validationMessage].filter(Boolean).join(" — "),
        );
      }

      showToast("Saved to MongoDB! Live website updated.");
      await loadAllData();
      return true;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Save operation failed", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Generic Delete
  const deleteItem = async (collection: string, id: string, name: string) => {
    if (!confirm(`Confirm deletion of "${name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      showToast(`Removed "${name}". Live site updated.`);
      await loadAllData();
    } catch {
      showToast("Could not complete delete operation", "error");
    } finally {
      setLoading(false);
    }
  };

  // Toggle boolean fields
  const toggleField = async (collection: string, id: string, field: string, currentValue: boolean) => {
    await saveItem(collection, { id, [field]: !currentValue }, false);
  };

  return (
    <main className="admin-shell-modern admin-dashboard">
      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          aria-live={toast.type === "error" ? "assertive" : "polite"}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            gap: 12,
            backgroundColor: toast.type === "success" ? "#0a2e1d" : "#3b0c10",
            border: `1px solid ${toast.type === "success" ? "#00ff88" : "var(--spidey-red)"}`,
            color: toast.type === "success" ? "#00ff88" : "#ff9498",
            padding: "14px 24px",
            borderRadius: "var(--radius-pill)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.7)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {toast.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP BAR / CONTROL ROOM */}
      <header className="admin-header-card" style={{ marginTop: "4rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: "var(--theme-red-surface)",
              display: "grid",
              placeItems: "center",
              color: "#ffffff",
              border: "1px solid var(--line-active)",
            }}
          >
            <Shield size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 className="display" style={{ fontSize: "clamp(24px, 3.5vw, 36px)", margin: 0 }}>
                Portfolio studio
              </h1>
            </div>
            <p style={{ color: "var(--spidey-muted)", fontSize: 13, margin: "4px 0 0" }}>
              Manage the content that appears on your portfolio.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/" target="_blank" className="button button-secondary" style={{ minHeight: 42, padding: "0 18px", fontSize: 12 }}>
            Preview Site <ExternalLink size={15} />
          </Link>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="admin-nav-tabs" aria-label="Admin Navigation Tabs">
        <button
          onClick={() => setActiveTab("projects")}
          className={`admin-nav-tab ${activeTab === "projects" ? "active" : ""}`}
        >
          <FolderKanban size={16} /> Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab("experience")}
          className={`admin-nav-tab ${activeTab === "experience" ? "active" : ""}`}
        >
          <Briefcase size={16} /> Experience ({experiences.length})
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`admin-nav-tab ${activeTab === "profile" ? "active" : ""}`}
        >
          <User size={16} /> Profile & Hero
        </button>
        <button
          onClick={() => setActiveTab("hackathons")}
          className={`admin-nav-tab ${activeTab === "hackathons" ? "active" : ""}`}
        >
          <Trophy size={16} /> Hackathons ({hackathons.length})
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`admin-nav-tab ${activeTab === "events" ? "active" : ""}`}
        >
          <Users size={16} /> Community Events ({events.length})
        </button>
        <button
          onClick={() => setActiveTab("socials")}
          className={`admin-nav-tab ${activeTab === "socials" ? "active" : ""}`}
        >
          <Share2 size={16} /> Social Links ({socials.length})
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`admin-nav-tab ${activeTab === "settings" ? "active" : ""}`}
        >
          <SettingsIcon size={16} /> Settings
        </button>
      </nav>

      {/* ==================== TAB 1: PROJECTS ==================== */}
      {activeTab === "projects" && (
        <section className="admin-content-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2 className="display" style={{ fontSize: 24, margin: 0 }}>
                Projects & Work
              </h2>
              <p style={{ color: "var(--spidey-muted)", fontSize: 13, margin: "4px 0 0" }}>
                Add new projects, update screenshots, manage tags, or remove entries.
              </p>
            </div>
            <button
              onClick={() => {
                setTempTag("");
                setEditingProject({
                  title: "",
                  slug: "",
                  category: "Web Application",
                  description: "",
                  year: String(new Date().getFullYear()),
                  cover: {
                    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=85",
                    alt: "Project cover",
                  },
                  gallery: [],
                  tags: ["Next.js", "TypeScript"],
                  featured: false,
                  isPublished: true,
                  liveUrl: "",
                  githubUrl: "",
                });
              }}
              className="button button-primary"
            >
              <Plus size={16} /> Add Project
            </button>
          </div>

          <SortableList collection="projects" items={projects} onChange={setProjects} onNotify={showToast} renderItem={(p) => (
              <div
                className="timeline-card"
                style={{
                  margin: 0,
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 260 }}>
                  <div
                    style={{
                      width: 64,
                      height: 48,
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      position: "relative",
                      backgroundColor: "var(--spidey-dark-900)",
                      flexShrink: 0,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.cover.url}
                      alt={p.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 2px", color: "#ffffff" }}>
                      {p.title}
                    </h3>
                    <div style={{ fontSize: 12, color: "var(--spidey-muted)" }}>
                      {p.category} · {p.year} · <span style={{ color: "var(--spidey-blue)" }}>/{p.slug}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {/* Featured Toggle */}
                  <button
                    onClick={() => toggleField("projects", p.id, "featured", p.featured)}
                    className="tag-pill"
                    style={{
                      backgroundColor: p.featured ? "rgba(255, 30, 39, 0.2)" : "var(--spidey-dark-700)",
                      color: p.featured ? "var(--spidey-red)" : "var(--spidey-muted)",
                      borderColor: p.featured ? "var(--spidey-red)" : "var(--line)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                    }}
                    title="Toggle Featured"
                  >
                    {p.featured ? <Star size={13} fill="currentColor" /> : <StarOff size={13} />}
                    {p.featured ? "Featured" : "Standard"}
                  </button>

                  {/* Published Toggle */}
                  <button
                    onClick={() => toggleField("projects", p.id, "isPublished", p.isPublished !== false)}
                    className="tag-pill"
                    style={{
                      backgroundColor: p.isPublished !== false ? "rgba(0, 255, 136, 0.15)" : "rgba(255, 255, 255, 0.05)",
                      color: p.isPublished !== false ? "#00ff88" : "var(--spidey-muted)",
                      borderColor: p.isPublished !== false ? "#00ff88" : "var(--line)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                    }}
                    title="Toggle Publish / Draft"
                  >
                    {p.isPublished !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                    {p.isPublished !== false ? "Published" : "Draft"}
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={() => setEditingProject({ ...p })}
                    className="button button-secondary"
                    style={{ minHeight: 36, padding: "0 14px", fontSize: 12 }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteItem("projects", p.id, p.title)}
                    className="button button-secondary"
                    style={{
                      minHeight: 36,
                      padding: "0 14px",
                      fontSize: 12,
                      borderColor: "rgba(255, 30, 39, 0.4)",
                      color: "var(--spidey-red)",
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            )} />
        </section>
      )}

      {/* ==================== TAB 2: EXPERIENCE ==================== */}
      {activeTab === "experience" && (
        <section className="admin-content-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2 className="display" style={{ fontSize: 24, margin: 0 }}>
                Experience Timeline
              </h2>
              <p style={{ color: "var(--spidey-muted)", fontSize: 13, margin: "4px 0 0" }}>
                Manage roles, achievements, timeline periods, and technologies.
              </p>
            </div>
            <button
              onClick={() => {
                setTempTag("");
                setTempAchievement("");
                setEditingExperience({
                  role: "",
                  company: "",
                  period: "2024 — Present",
                  location: "Mumbai, India",
                  description: "",
                  achievements: [],
                  tech: ["Next.js", "TypeScript"],
                  isPublished: true,
                });
              }}
              className="button button-primary"
            >
              <Plus size={16} /> Add Experience
            </button>
          </div>

          <SortableList collection="experiences" items={experiences} onChange={setExperiences} onNotify={showToast} renderItem={(exp) => (
              <div
                className="timeline-card"
                style={{
                  margin: 0,
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px", color: "#ffffff" }}>
                    {exp.role} <span style={{ color: "var(--spidey-red)" }}>@ {exp.company}</span>
                  </h3>
                  <div style={{ fontSize: 12, color: "var(--spidey-muted)", marginBottom: 8 }}>
                    {exp.period} · {exp.location}
                  </div>
                  <p style={{ color: "var(--spidey-text-dim)", fontSize: 14, margin: "0 0 10px 0", maxWidth: 640 }}>
                    {exp.description}
                  </p>
                  <div className="tags-row" style={{ marginTop: 6 }}>
                    {exp.tech.map((t) => (
                      <span className="tag-pill" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      setTempTag("");
                      setTempAchievement("");
                      setEditingExperience({ ...exp });
                    }}
                    className="button button-secondary"
                    style={{ minHeight: 36, padding: "0 14px", fontSize: 12 }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => deleteItem("experiences", exp.id, `${exp.role} at ${exp.company}`)}
                    className="button button-secondary"
                    style={{
                      minHeight: 36,
                      padding: "0 14px",
                      fontSize: 12,
                      borderColor: "rgba(255, 30, 39, 0.4)",
                      color: "var(--spidey-red)",
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            )} />
        </section>
      )}

      {/* ==================== TAB 3: PROFILE & HERO ==================== */}
      {activeTab === "profile" && profile && (
        <section className="admin-content-card">
          <div style={{ marginBottom: 24 }}>
            <h2 className="display" style={{ fontSize: 24, margin: 0 }}>
              Profile & Hero Customization
            </h2>
            <p style={{ color: "var(--spidey-muted)", fontSize: 13, margin: "4px 0 0" }}>
              Edit your name, headline, bio, contact details, and hero metric numbers.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await saveItem("profile", profile, false);
            }}
            style={{ display: "grid", gap: 20 }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label className="form-label">Full Name</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Professional Role</label>
                <input
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Hero Headline Title</label>
              <input
                value={profile.heroTitle}
                onChange={(e) => setProfile({ ...profile, heroTitle: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Tagline Summary</label>
              <input
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">About Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="form-textarea"
                rows={3}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              <div>
                <label className="form-label">Location</label>
                <input
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="form-input"
                  type="email"
                  required
                />
              </div>
              <div>
                <label className="form-label">Resume URL (Optional)</label>
                <input
                  value={profile.resumeUrl || ""}
                  onChange={(e) => setProfile({ ...profile, resumeUrl: e.target.value })}
                  className="form-input"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Dynamic Hero Stats */}
            <div style={{ marginTop: 8 }}>
              <label className="form-label">Hero Metric Numbers</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                {profile.stats.map((stat, idx) => (
                  <div key={idx} className="timeline-card" style={{ margin: 0, padding: 16 }}>
                    <div style={{ fontSize: 12, color: "var(--spidey-muted)", marginBottom: 6 }}>
                      Metric #{idx + 1}
                    </div>
                    <input
                      type="number"
                      value={stat.value}
                      onChange={(e) => {
                        const newStats = [...profile.stats];
                        newStats[idx].value = Number(e.target.value);
                        setProfile({ ...profile, stats: newStats });
                      }}
                      className="form-input"
                      style={{ marginBottom: 8 }}
                    />
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const newStats = [...profile.stats];
                        newStats[idx].label = e.target.value;
                        setProfile({ ...profile, stats: newStats });
                      }}
                      className="form-input"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="button button-primary" style={{ marginTop: 12 }}>
              {loading ? "Saving..." : "Save Profile Details"} <Check size={16} />
            </button>
          </form>
        </section>
      )}

      {/* ==================== TAB 4: HACKATHONS ==================== */}
      {activeTab === "hackathons" && (
        <section className="admin-content-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2 className="display" style={{ fontSize: 24, margin: 0 }}>
                Hackathons & Mentorship
              </h2>
              <p style={{ color: "var(--spidey-muted)", fontSize: 13, margin: "4px 0 0" }}>
                Manage your judging and mentorship participation.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingHackathon({
                  name: "",
                  role: "Judge",
                  date: "2024",
                  organizer: "",
                  description: "",
                  teams: 20,
                  link: "",
                  isPublished: true,
                });
              }}
              className="button button-primary"
            >
              <Plus size={16} /> Add Hackathon
            </button>
          </div>

          <SortableList collection="hackathons" items={hackathons} onChange={setHackathons} onNotify={showToast} renderItem={(h) => (
              <div
                className="timeline-card"
                style={{
                  margin: 0,
                  padding: "18px 22px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span className="tag-pill" style={{ backgroundColor: "var(--spidey-red)", color: "#fff" }}>
                      {h.role}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--spidey-muted)" }}>{h.date}</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: "4px 0", color: "#ffffff" }}>
                    {h.name}
                  </h3>
                  <div style={{ fontSize: 13, color: "var(--spidey-text-dim)" }}>
                    Hosted by {h.organizer} · {h.teams} Teams
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setEditingHackathon({ ...h })}
                    className="button button-secondary"
                    style={{ minHeight: 36, padding: "0 14px", fontSize: 12 }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => deleteItem("hackathons", h.id, h.name)}
                    className="button button-secondary"
                    style={{
                      minHeight: 36,
                      padding: "0 14px",
                      fontSize: 12,
                      borderColor: "rgba(255, 30, 39, 0.4)",
                      color: "var(--spidey-red)",
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            )} />
        </section>
      )}

      {/* ==================== TAB 5: COMMUNITY EVENTS ==================== */}
      {activeTab === "events" && (
        <section className="admin-content-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2 className="display" style={{ fontSize: 24, margin: 0 }}>
                Community Events & HackShastra
              </h2>
              <p style={{ color: "var(--spidey-muted)", fontSize: 13, margin: "4px 0 0" }}>
                Manage community gatherings, summits, and attendee statistics.
              </p>
            </div>
            <button
              onClick={() => {
                setPosterLoadError(null);
                setEditingEvent({
                  title: "",
                  date: "2025",
                  venue: "Mumbai",
                  status: "upcoming",
                  description: "",
                  attendees: 50,
                  link: "",
                  isPublished: true,
                });
              }}
              className="button button-primary"
            >
              <Plus size={16} /> Add Event
            </button>
          </div>

          <SortableList collection="events" items={events} onChange={setEvents} onNotify={showToast} renderItem={(e) => (
              <div
                className="timeline-card"
                style={{
                  margin: 0,
                  padding: "18px 22px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span
                      className="tag-pill"
                      style={{
                        backgroundColor: e.status === "upcoming" ? "var(--spidey-red)" : "var(--spidey-dark-700)",
                        color: "#fff",
                      }}
                    >
                      {e.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--spidey-muted)" }}>{e.date} · {e.venue}</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: "4px 0", color: "#ffffff" }}>
                    {e.title}
                  </h3>
                  <div style={{ fontSize: 13, color: "var(--spidey-text-dim)" }}>
                    {e.attendees} Attendees
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      setPosterLoadError(null);
                      setEditingEvent({ ...e });
                    }}
                    className="button button-secondary"
                    style={{ minHeight: 36, padding: "0 14px", fontSize: 12 }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => deleteItem("events", e.id, e.title)}
                    className="button button-secondary"
                    style={{
                      minHeight: 36,
                      padding: "0 14px",
                      fontSize: 12,
                      borderColor: "rgba(255, 30, 39, 0.4)",
                      color: "var(--spidey-red)",
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            )} />
        </section>
      )}

      {/* ==================== TAB 6: SOCIAL LINKS ==================== */}
      {activeTab === "socials" && (
        <section className="admin-content-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2 className="display" style={{ fontSize: 24, margin: 0 }}>
                Social Channels & Links
              </h2>
              <p style={{ color: "var(--spidey-muted)", fontSize: 13, margin: "4px 0 0" }}>
                Add or edit your GitHub, LinkedIn, X, and communication links.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSocial({
                  label: "GitHub",
                  href: "https://github.com/",
                  handle: "@username",
                  icon: "code",
                  isPublished: true,
                });
              }}
              className="button button-primary"
            >
              <Plus size={16} /> Add Social Link
            </button>
          </div>

          <SortableList collection="socials" items={socials} onChange={setSocials} onNotify={showToast} renderItem={(s) => (
              <div
                className="timeline-card"
                style={{
                  margin: 0,
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      backgroundColor: "var(--spidey-dark-700)",
                      border: "1px solid var(--line)",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--spidey-red)",
                    }}
                  >
                    <Share2 size={16} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "var(--spidey-muted)" }}>{s.handle} — {s.href}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setEditingSocial({ ...s })}
                    className="button button-secondary"
                    style={{ minHeight: 36, padding: "0 14px", fontSize: 12 }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => deleteItem("socials", s.id, s.label)}
                    className="button button-secondary"
                    style={{
                      minHeight: 36,
                      padding: "0 14px",
                      fontSize: 12,
                      borderColor: "rgba(255, 30, 39, 0.4)",
                      color: "var(--spidey-red)",
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            )} />
        </section>
      )}

      {/* ==================== TAB 7: SETTINGS ==================== */}
      {activeTab === "settings" && settings && (
        <section className="admin-content-card">
          <div style={{ marginBottom: 24 }}>
            <h2 className="display" style={{ fontSize: 24, margin: 0 }}>
              Global Site Settings & SEO
            </h2>
            <p style={{ color: "var(--spidey-muted)", fontSize: 13, margin: "4px 0 0" }}>
              Update default page title, meta description, and theme accent color.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await saveItem("settings", settings, false);
            }}
            style={{ display: "grid", gap: 20, maxWidth: 640 }}
          >
            <div>
              <label className="form-label">Default Site Title</label>
              <input
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">SEO Meta Description</label>
              <textarea
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                className="form-textarea"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="form-label">Theme Accent Hex Color</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="color"
                  value={settings.accent || "#ff1e27"}
                  onChange={(e) => setSettings({ ...settings, accent: e.target.value })}
                  style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", background: "none" }}
                />
                <input
                  value={settings.accent || "#ff1e27"}
                  onChange={(e) => setSettings({ ...settings, accent: e.target.value })}
                  className="form-input"
                  style={{ width: 140 }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="button button-primary" style={{ marginTop: 10 }}>
              {loading ? "Saving..." : "Save Settings"} <Check size={16} />
            </button>
          </form>

          <AboutGalleryEditor
            key={settings.updatedAt}
            value={settings.aboutPopOut}
            moments={settings.aboutMoments}
            profileImage={profile?.avatar}
            onSave={(aboutPopOut, aboutMoments) => saveItem("settings", { ...settings, aboutPopOut, aboutMoments }, false)}
          />
        </section>
      )}

      {/* ==================== PROJECT EDIT/CREATE MODAL ==================== */}
      {editingProject && (
        <div
          className="admin-modal-overlay"
          data-lenis-prevent="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingProject(null);
          }}
        >
          <div className="admin-modal-box" data-lenis-prevent="true">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="display" style={{ fontSize: 22, margin: 0 }}>
                {editingProject.id ? "Edit Project" : "Add Project"}
              </h2>
              <button
                onClick={() => setEditingProject(null)}
                style={{ background: "none", border: "none", color: "var(--spidey-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const isNew = !editingProject.id;
                const success = await saveItem("projects", editingProject, isNew);
                if (success) setEditingProject(null);
              }}
              style={{ display: "grid", gap: 16 }}
            >
              <div>
                <label className="form-label">Project Title</label>
                <input
                  value={editingProject.title || ""}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = editingProject.slug || title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                    setEditingProject({ ...editingProject, title, slug });
                  }}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">URL Slug</label>
                  <input
                    value={editingProject.slug || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Year</label>
                  <input
                    value={editingProject.year || "2025"}
                    onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Category</label>
                <input
                  value={editingProject.category || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                  placeholder="Web Application · 2025"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={editingProject.description || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="form-textarea"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="form-label">Cover Image URL</label>
                <input
                  value={editingProject.cover?.url || ""}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      cover: {
                        url: e.target.value,
                        alt: editingProject.title || "Cover",
                      },
                    })
                  }
                  className="form-input"
                  placeholder="https://images.unsplash.com/..."
                  required
                />
                {editingProject.cover?.url && (
                  <div style={{ marginTop: 10, width: "100%", height: 160, borderRadius: "var(--radius-md)", overflow: "hidden", position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editingProject.cover.url}
                      alt="Cover Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}
              </div>

              {/* Tags Manager */}
              <div>
                <label className="form-label">Tags / Technologies</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    value={tempTag}
                    onChange={(e) => setTempTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (tempTag.trim()) {
                          const currentTags = editingProject.tags || [];
                          if (!currentTags.includes(tempTag.trim())) {
                            setEditingProject({
                              ...editingProject,
                              tags: [...currentTags, tempTag.trim()],
                            });
                          }
                          setTempTag("");
                        }
                      }
                    }}
                    placeholder="Type a tag (e.g. Next.js, MongoDB) and press Enter"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempTag.trim()) {
                        const currentTags = editingProject.tags || [];
                        if (!currentTags.includes(tempTag.trim())) {
                          setEditingProject({
                            ...editingProject,
                            tags: [...currentTags, tempTag.trim()],
                          });
                        }
                        setTempTag("");
                      }
                    }}
                    className="button button-secondary"
                  >
                    Add
                  </button>
                </div>

                <div className="tags-row">
                  {(editingProject.tags || []).map((t, tidx) => (
                    <span
                      key={tidx}
                      className="tag-pill"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      {t}
                      <X
                        size={12}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setEditingProject({
                            ...editingProject,
                            tags: (editingProject.tags || []).filter((_, i) => i !== tidx),
                          });
                        }}
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Live Site URL (Optional)</label>
                  <input
                    value={editingProject.liveUrl || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, liveUrl: e.target.value })}
                    placeholder="https://..."
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">GitHub URL (Optional)</label>
                  <input
                    value={editingProject.githubUrl || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={editingProject.featured || false}
                    onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                  />
                  Featured on Homepage
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={editingProject.isPublished !== false}
                    onChange={(e) => setEditingProject({ ...editingProject, isPublished: e.target.checked })}
                  />
                  Published (Live)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="button button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="button button-primary">
                  {loading ? "Saving..." : "Save Project"} <Check size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EXPERIENCE EDIT/CREATE MODAL ==================== */}
      {editingExperience && (
        <div
          className="admin-modal-overlay"
          data-lenis-prevent="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingExperience(null);
          }}
        >
          <div className="admin-modal-box" data-lenis-prevent="true">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="display" style={{ fontSize: 22, margin: 0 }}>
                {editingExperience.id ? "Edit Experience" : "Add Experience"}
              </h2>
              <button
                onClick={() => setEditingExperience(null)}
                style={{ background: "none", border: "none", color: "var(--spidey-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const isNew = !editingExperience.id;
                const success = await saveItem("experiences", editingExperience, isNew);
                if (success) setEditingExperience(null);
              }}
              style={{ display: "grid", gap: 16 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Role Title</label>
                  <input
                    value={editingExperience.role || ""}
                    onChange={(e) => setEditingExperience({ ...editingExperience, role: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Company Name</label>
                  <input
                    value={editingExperience.company || ""}
                    onChange={(e) => setEditingExperience({ ...editingExperience, company: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Time Period</label>
                  <input
                    value={editingExperience.period || ""}
                    onChange={(e) => setEditingExperience({ ...editingExperience, period: e.target.value })}
                    placeholder="2023 — Present"
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <input
                    value={editingExperience.location || ""}
                    onChange={(e) => setEditingExperience({ ...editingExperience, location: e.target.value })}
                    placeholder="Mumbai, India"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={editingExperience.description || ""}
                  onChange={(e) => setEditingExperience({ ...editingExperience, description: e.target.value })}
                  className="form-textarea"
                  rows={3}
                  required
                />
              </div>

              {/* Achievements Manager */}
              <div>
                <label className="form-label">Key Achievements / Bullet Points</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    value={tempAchievement}
                    onChange={(e) => setTempAchievement(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (tempAchievement.trim()) {
                          const list = editingExperience.achievements || [];
                          setEditingExperience({
                            ...editingExperience,
                            achievements: [...list, tempAchievement.trim()],
                          });
                          setTempAchievement("");
                        }
                      }
                    }}
                    placeholder="Add an achievement bullet point..."
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempAchievement.trim()) {
                        const list = editingExperience.achievements || [];
                        setEditingExperience({
                          ...editingExperience,
                          achievements: [...list, tempAchievement.trim()],
                        });
                        setTempAchievement("");
                      }
                    }}
                    className="button button-secondary"
                  >
                    Add
                  </button>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {(editingExperience.achievements || []).map((ach, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "var(--spidey-dark-850)",
                        padding: "8px 14px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 13,
                      }}
                    >
                      <span>{ach}</span>
                      <X
                        size={14}
                        style={{ cursor: "pointer", color: "var(--spidey-red)" }}
                        onClick={() => {
                          setEditingExperience({
                            ...editingExperience,
                            achievements: (editingExperience.achievements || []).filter((_, i) => i !== idx),
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack Manager */}
              <div>
                <label className="form-label">Technologies Used</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    value={tempTag}
                    onChange={(e) => setTempTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (tempTag.trim()) {
                          const list = editingExperience.tech || [];
                          if (!list.includes(tempTag.trim())) {
                            setEditingExperience({
                              ...editingExperience,
                              tech: [...list, tempTag.trim()],
                            });
                          }
                          setTempTag("");
                        }
                      }
                    }}
                    placeholder="Type technology and press Enter"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempTag.trim()) {
                        const list = editingExperience.tech || [];
                        if (!list.includes(tempTag.trim())) {
                          setEditingExperience({
                            ...editingExperience,
                            tech: [...list, tempTag.trim()],
                          });
                        }
                        setTempTag("");
                      }
                    }}
                    className="button button-secondary"
                  >
                    Add
                  </button>
                </div>

                <div className="tags-row">
                  {(editingExperience.tech || []).map((t, idx) => (
                    <span key={idx} className="tag-pill" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {t}
                      <X
                        size={12}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setEditingExperience({
                            ...editingExperience,
                            tech: (editingExperience.tech || []).filter((_, i) => i !== idx),
                          });
                        }}
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setEditingExperience(null)}
                  className="button button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="button button-primary">
                  {loading ? "Saving..." : "Save Experience"} <Check size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== HACKATHON EDIT/CREATE MODAL ==================== */}
      {editingHackathon && (
        <div
          className="admin-modal-overlay"
          data-lenis-prevent="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingHackathon(null);
          }}
        >
          <div className="admin-modal-box" data-lenis-prevent="true">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="display" style={{ fontSize: 22, margin: 0 }}>
                {editingHackathon.id ? "Edit Hackathon" : "Add Hackathon"}
              </h2>
              <button
                onClick={() => setEditingHackathon(null)}
                style={{ background: "none", border: "none", color: "var(--spidey-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const isNew = !editingHackathon.id;
                const success = await saveItem("hackathons", editingHackathon, isNew);
                if (success) setEditingHackathon(null);
              }}
              style={{ display: "grid", gap: 16 }}
            >
              <div>
                <label className="form-label">Hackathon Name</label>
                <input
                  value={editingHackathon.name || ""}
                  onChange={(e) => setEditingHackathon({ ...editingHackathon, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Your Role</label>
                  <select
                    value={editingHackathon.role || "Judge"}
                    onChange={(e) => setEditingHackathon({ ...editingHackathon, role: e.target.value as Hackathon["role"] })}
                    className="form-select"
                  >
                    <option value="Judge">Judge</option>
                    <option value="Mentor">Mentor</option>
                    {editingHackathon.role === "Organizer" && <option value="Organizer" disabled>Legacy Organizer — choose a new role</option>}
                  </select>
                </div>
                <div>
                  <label className="form-label">Date / Year</label>
                  <input
                    value={editingHackathon.date || ""}
                    onChange={(e) => setEditingHackathon({ ...editingHackathon, date: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Organizer</label>
                  <input
                    value={editingHackathon.organizer || ""}
                    onChange={(e) => setEditingHackathon({ ...editingHackathon, organizer: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Teams Mentored / Evaluated</label>
                  <input
                    type="number"
                    value={editingHackathon.teams ?? 15}
                    onChange={(e) => setEditingHackathon({ ...editingHackathon, teams: Number(e.target.value) })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={editingHackathon.description || ""}
                  onChange={(e) => setEditingHackathon({ ...editingHackathon, description: e.target.value })}
                  className="form-textarea"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="form-label">Link (Optional)</label>
                <input
                  value={editingHackathon.link || ""}
                  onChange={(e) => setEditingHackathon({ ...editingHackathon, link: e.target.value })}
                  placeholder="https://..."
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setEditingHackathon(null)}
                  className="button button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="button button-primary">
                  {loading ? "Saving..." : "Save Hackathon"} <Check size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EVENT EDIT/CREATE MODAL ==================== */}
      {editingEvent && (
        <div
          className="admin-modal-overlay"
          data-lenis-prevent="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingEvent(null);
          }}
        >
          <div className="admin-modal-box" data-lenis-prevent="true">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="display" style={{ fontSize: 22, margin: 0 }}>
                {editingEvent.id ? "Edit Community Event" : "Add Community Event"}
              </h2>
              <button
                onClick={() => setEditingEvent(null)}
                style={{ background: "none", border: "none", color: "var(--spidey-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const isNew = !editingEvent.id;
                const success = await saveItem("events", editingEvent, isNew);
                if (success) setEditingEvent(null);
              }}
              style={{ display: "grid", gap: 16 }}
            >
              <div>
                <label className="form-label">Event Title</label>
                <input
                  value={editingEvent.title || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Date</label>
                  <input
                    value={editingEvent.date || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={editingEvent.status || "upcoming"}
                    onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as CommunityEvent["status"] })}
                    className="form-select"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Venue / Location</label>
                  <input
                    value={editingEvent.venue || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Attendees Count</label>
                  <input
                    type="number"
                    value={editingEvent.attendees ?? 60}
                    onChange={(e) => setEditingEvent({ ...editingEvent, attendees: Number(e.target.value) })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={editingEvent.description || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="form-textarea"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="form-label">Registration / Details Link</label>
                <input
                  value={editingEvent.link || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, link: e.target.value })}
                  placeholder="https://..."
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="event-poster-url">
                  Event Poster Image URL <span className="form-label-optional">Optional</span>
                </label>
                <input
                  id="event-poster-url"
                  type="url"
                  value={editingEvent.image?.url || ""}
                  onChange={(e) => {
                    const url = e.target.value.trim();
                    setPosterLoadError(null);
                    setEditingEvent({
                      ...editingEvent,
                      image: url ? { ...editingEvent.image, url, alt: editingEvent.image?.alt || `${editingEvent.title || "Event"} poster` } : undefined,
                    });
                  }}
                  placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
                  className="form-input"
                  aria-describedby="event-poster-help"
                />
                <p id="event-poster-help" className="form-help-text">
                  Paste an HTTPS image URL from res.cloudinary.com. Leave blank for no poster.
                </p>
                {editingEvent.image?.url && !isCloudinaryImageUrl(editingEvent.image.url) && (
                  <p className="form-error-text" role="alert">Enter a valid HTTPS Cloudinary image URL.</p>
                )}
                {editingEvent.image?.url && isCloudinaryImageUrl(editingEvent.image.url) && (
                  <div className="event-poster-preview">
                    {posterLoadError === editingEvent.image.url ? (
                      <p className="form-error-text" role="alert">This poster could not be loaded. Check that the Cloudinary URL is public and points to an image.</p>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={editingEvent.image.url}
                        alt={`${editingEvent.title || "Event"} poster preview`}
                        onLoad={() => setPosterLoadError(null)}
                        onError={() => setPosterLoadError(editingEvent.image?.url || null)}
                      />
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="button button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading || Boolean(editingEvent.image?.url && (!isCloudinaryImageUrl(editingEvent.image.url) || posterLoadError === editingEvent.image.url))} className="button button-primary">
                  {loading ? "Saving..." : "Save Event"} <Check size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== SOCIAL EDIT/CREATE MODAL ==================== */}
      {editingSocial && (
        <div
          className="admin-modal-overlay"
          data-lenis-prevent="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingSocial(null);
          }}
        >
          <div className="admin-modal-box" data-lenis-prevent="true">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="display" style={{ fontSize: 22, margin: 0 }}>
                {editingSocial.id ? "Edit Social Link" : "Add Social Link"}
              </h2>
              <button
                onClick={() => setEditingSocial(null)}
                style={{ background: "none", border: "none", color: "var(--spidey-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const isNew = !editingSocial.id;
                const success = await saveItem("socials", editingSocial, isNew);
                if (success) setEditingSocial(null);
              }}
              style={{ display: "grid", gap: 16 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Platform Label</label>
                  <input
                    value={editingSocial.label || ""}
                    onChange={(e) => setEditingSocial({ ...editingSocial, label: e.target.value })}
                    placeholder="GitHub"
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Handle / Username</label>
                  <input
                    value={editingSocial.handle || ""}
                    onChange={(e) => setEditingSocial({ ...editingSocial, handle: e.target.value })}
                    placeholder="@username"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Full Profile Link URL</label>
                <input
                  value={editingSocial.href || ""}
                  onChange={(e) => setEditingSocial({ ...editingSocial, href: e.target.value })}
                  placeholder="https://..."
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setEditingSocial(null)}
                  className="button button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="button button-primary">
                  {loading ? "Saving..." : "Save Social Link"} <Check size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE DATABASE HEALTH STATUS BAR */}
      <div
        className="timeline-card"
        style={{
          padding: "18px 24px",
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          borderColor: dbStatus?.success ? "#00ff8840" : "var(--line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              backgroundColor: dbStatus?.success ? "rgba(0, 255, 136, 0.15)" : "rgba(255, 30, 39, 0.15)",
              border: `1px solid ${dbStatus?.success ? "#00ff88" : "var(--spidey-red)"}`,
              display: "grid",
              placeItems: "center",
              color: dbStatus?.success ? "#00ff88" : "var(--spidey-red)",
            }}
          >
            <Database size={18} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#ffffff" }}>
                MongoDB Atlas: {dbStatus?.dbName || "portfolio"}
              </span>
              <span
                className="tag-pill"
                style={{
                  backgroundColor: dbStatus?.success ? "rgba(0, 255, 136, 0.15)" : "rgba(255, 180, 0, 0.15)",
                  color: dbStatus?.success ? "#00ff88" : "#ffb400",
                  borderColor: "transparent",
                  fontSize: 10,
                }}
              >
                {dbStatus?.success ? "CONNECTED & SEEDED" : "FALLBACK ACTIVE"}
              </span>
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--spidey-muted)" }}>
              {dbStatus?.collections ? `${dbStatus.collections.length} Collections Active (${dbStatus.collections.join(", ")})` : "Monitoring live connection"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={checkMongoStatus}
            disabled={testingDb}
            className="button button-secondary"
            style={{ minHeight: 36, padding: "0 14px", fontSize: 11 }}
          >
            <RefreshCw size={13} className={testingDb ? "animate-spin" : ""} />
            {testingDb ? "Checking..." : "Verify DB"}
          </button>
          <a
            href="/api/admin/export"
            className="button button-secondary"
            style={{ minHeight: 36, padding: "0 14px", fontSize: 11 }}
          >
            <Download size={13} /> Export Backup
          </a>
        </div>
      </div>
    </main>
  );
}
