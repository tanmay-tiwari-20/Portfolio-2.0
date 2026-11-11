"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EditorDialog from "./editor-dialog";
import {
  FolderKanban,
  Briefcase,
  Image as ImageIcon,
  Trophy,
  Users,
  Share2,
  Database,
  Plus,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Star,
  StarOff,
  X,
  Download,
  Menu,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import SortableList from "@/components/admin/sortable-list";
import AboutGalleryEditor from "@/components/admin/about-gallery-editor";
import EventEditor from "@/components/admin/event-editor";
import ProjectScreenshotsEditor from "@/components/admin/project-screenshots-editor";
import { prepareEventPatch } from "@/lib/event-admin";
import type {
  Project,
  Experience,
  Profile,
  Hackathon,
  CommunityEvent,
  SocialLink,
  SiteSettings,
} from "@/lib/validators/schemas";

type Tab =
  "projects" | "experience" | "hackathons" | "events" | "socials" | "about";

interface MongoStatus {
  success: boolean;
  message: string;
  dbName: string;
  uriMasked: string;
  collections: string[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [aboutDirty, setAboutDirty] = useState(false);
  const [aboutBusy, setAboutBusy] = useState(false);
  const [editorRevision, setEditorRevision] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const mutation = useRef(false);
  const initialDraft = useRef<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebar = useRef<HTMLElement>(null);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    action: string;
    resolve: (answer: boolean) => void;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(
    null,
  );
  const [projectUploading, setProjectUploading] = useState(false);
  const projectUploadBusy = useRef(false);
  const [editingExperience, setEditingExperience] =
    useState<Partial<Experience> | null>(null);
  const [editingHackathon, setEditingHackathon] =
    useState<Partial<Hackathon> | null>(null);
  const [editingEvent, setEditingEvent] =
    useState<Partial<CommunityEvent> | null>(null);
  const [editingSocial, setEditingSocial] =
    useState<Partial<SocialLink> | null>(null);

  const draft =
    editingProject ||
    editingExperience ||
    editingHackathon ||
    editingEvent ||
    editingSocial;
  const isModalOpen = Boolean(draft);
  const draftText = draft ? JSON.stringify(draft) : null;
  useEffect(() => {
    if (draftText !== null && initialDraft.current === null)
      initialDraft.current = draftText;
    if (draftText === null) initialDraft.current = null;
  }, [draftText]);

  function ask(title: string, message: string, action: string) {
    return new Promise<boolean>((resolve) =>
      setConfirmation({ title, message, action, resolve }),
    );
  }
  function answerConfirmation(answer: boolean) {
    confirmation?.resolve(answer);
    setConfirmation(null);
  }
  function clearEditors() {
    setFormError("");
    setEditingProject(null);
    projectUploadBusy.current = false;
    setProjectUploading(false);
    setEditingExperience(null);
    setEditingHackathon(null);
    setEditingEvent(null);
    setEditingSocial(null);
    setTempTag("");
    setTempAchievement("");
  }
  async function closeEditor() {
    if (mutation.current || projectUploadBusy.current) return;
    if (
      draftText !== initialDraft.current &&
      !(await ask(
        "Discard changes?",
        "Your unsaved edits will be lost. Keep editing to save them first.",
        "Discard changes",
      ))
    )
      return;
    clearEditors();
  }

  useEffect(() => {
    if (!isModalOpen && !aboutDirty && !aboutBusy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isModalOpen, aboutDirty, aboutBusy]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const nav = sidebar.current!;
    nav.querySelector<HTMLButtonElement>(".admin-sidebar-close")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
      if (event.key !== "Tab") return;
      const items = Array.from(
        nav.querySelectorAll<HTMLElement>("button:not(:disabled),a[href]"),
      ).filter((item) => item.getClientRects().length);
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const resize = () => {
      if (window.innerWidth >= 1024) setDrawerOpen(false);
    };
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", resize);
      previous?.focus();
    };
  }, [drawerOpen]);

  // Temporary tag inputs
  const [tempTag, setTempTag] = useState("");
  const [tempAchievement, setTempAchievement] = useState("");

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(
        () => setToast(null),
        type === "error" ? 12000 : 5000,
      );
    },
    [],
  );

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  // Fetch all collections
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const collections = [
        "projects",
        "experiences",
        "profile",
        "hackathons",
        "events",
        "socials",
        "settings",
      ];
      const results = await Promise.all(
        collections.map(async (collection) => {
          const response = await fetch(
            "/api/admin/content?collection=" + collection,
          );
          if (!response.ok)
            throw new Error(
              response.status === 401
                ? "Your session has expired. Sign in again to continue."
                : "Content could not be loaded. Please try again.",
            );
          return response.json();
        }),
      );
      setProjects(results[0]);
      setExperiences(results[1]);
      setProfile(results[2][0] || null);
      setHackathons(results[3]);
      setEvents(results[4]);
      setSocials(results[5]);
      setSettings(results[6][0] || null);
      setLoaded(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Content could not be loaded.";
      setLoadError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Start the initial async synchronization; its state changes follow the fetch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAllData();
    void fetch("/api/admin/database")
      .then((response) => (response.ok ? response.json() : null))
      .then(setDbStatus)
      .catch(() => {});
  }, [loadAllData]);

  // Test MongoDB Connection
  const checkMongoStatus = async () => {
    setTestingDb(true);
    try {
      const res = await fetch("/api/admin/database");
      const data = await res.json();
      setDbStatus(data);
      if (!res.ok) throw new Error();
      if (data.success || data.uriMasked === "Not configured") {
        showToast(
          data.success
            ? "Database connection verified."
            : "Local content storage is active.",
        );
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
  const saveItem = async <T extends { id?: string }>(
    collection: string,
    item: T,
    isNew: boolean,
  ) => {
    if (mutation.current) return false;
    mutation.current = true;
    setFormError("");
    setLoading(true);
    try {
      const method = isNew ? "POST" : "PATCH";
      const body = isNew
        ? { collection, item }
        : {
            collection,
            id: item.id,
            patch:
              collection === "events"
                ? prepareEventPatch(item as Partial<CommunityEvent>)
                : item,
          };

      const res = await fetch("/api/admin/content", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const fieldErrors = err?.details?.fieldErrors as
          Record<string, string[]> | undefined;
        const validationMessage = fieldErrors
          ? Object.entries(fieldErrors)
              .flatMap(([field, messages]) =>
                messages.map((message) => `${field}: ${message}`),
              )
              .join("; ")
          : "";
        throw new Error(
          [err?.error || "Save operation failed", validationMessage]
            .filter(Boolean)
            .join(" — "),
        );
      }

      const saved = await res.json();
      const merge = <T extends { id: string }>(rows: T[]) =>
        isNew
          ? [...rows, saved]
          : rows.map((row) => (row.id === saved.id ? saved : row));
      if (collection === "projects") setProjects(merge);
      if (collection === "experiences") setExperiences(merge);
      if (collection === "hackathons") setHackathons(merge);
      if (collection === "events") setEvents(merge);
      if (collection === "socials") setSocials(merge);
      if (collection === "settings") setSettings(saved);
      showToast("Saved. Your portfolio is up to date.");
      return true;
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Save operation failed",
      );
      showToast(
        err instanceof Error ? err.message : "Save operation failed",
        "error",
      );
      return false;
    } finally {
      mutation.current = false;
      setLoading(false);
    }
  };

  // Generic Delete
  const deleteItem = async (collection: string, id: string, name: string) => {
    if (
      mutation.current ||
      !(await ask(
        "Delete this item?",
        `“${name}” will be removed from your portfolio. This cannot be undone.`,
        "Delete item",
      ))
    )
      return;
    mutation.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      showToast(`Removed "${name}". Live site updated.`);
      const remove = <T extends { id: string }>(rows: T[]) =>
        rows.filter((row) => row.id !== id);
      if (collection === "projects") setProjects(remove);
      if (collection === "experiences") setExperiences(remove);
      if (collection === "hackathons") setHackathons(remove);
      if (collection === "events") setEvents(remove);
      if (collection === "socials") setSocials(remove);
    } catch {
      showToast("Could not complete delete operation", "error");
    } finally {
      mutation.current = false;
      setLoading(false);
    }
  };

  // Toggle boolean fields
  const toggleField = async (
    collection: string,
    id: string,
    field: string,
    currentValue: boolean,
  ) => {
    await saveItem(collection, { id, [field]: !currentValue }, false);
  };

  const sections: {
    id: Tab;
    label: string;
    icon: typeof FolderKanban;
    count?: number;
  }[] = [
    {
      id: "projects",
      label: "Projects",
      icon: FolderKanban,
      count: projects.length,
    },
    {
      id: "experience",
      label: "Experience",
      icon: Briefcase,
      count: experiences.length,
    },
    {
      id: "hackathons",
      label: "Hackathons",
      icon: Trophy,
      count: hackathons.length,
    },
    {
      id: "events",
      label: "Community events",
      icon: Users,
      count: events.length,
    },
    {
      id: "socials",
      label: "Social links",
      icon: Share2,
      count: socials.length,
    },
    { id: "about", label: "About & images", icon: ImageIcon },
  ];
  async function canLeave() {
    if (mutation.current || aboutBusy) return false;
    if (
      (aboutDirty || (draftText && draftText !== initialDraft.current)) &&
      !(await ask(
        "Discard changes?",
        "You have unsaved edits. Save them before leaving, or discard them to continue.",
        "Discard changes",
      ))
    )
      return false;
    clearEditors();
    setAboutDirty(false);
    return true;
  }
  async function navigate(tab: Tab) {
    if (tab === activeTab) {
      setDrawerOpen(false);
      return;
    }
    if (!(await canLeave())) return;
    setActiveTab(tab);
    setDrawerOpen(false);
    window.history.pushState(null, "", "#" + tab);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  useEffect(() => {
    const valid = [
      "projects",
      "experience",
      "hackathons",
      "events",
      "socials",
      "about",
    ];
    const initial = window.location.hash.slice(1);
    if (valid.includes(initial)) {
      // Restore a directly opened section without introducing a second route.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(initial as Tab);
    }
  }, []);
  useEffect(() => {
    const onBack = () => {
      const requested = window.location.hash.slice(1);
      const next = [
        "projects",
        "experience",
        "hackathons",
        "events",
        "socials",
        "about",
      ].includes(requested)
        ? (requested as Tab)
        : "projects";
      if (next === activeTab) return;
      if (aboutBusy || mutation.current || aboutDirty || isModalOpen) {
        window.history.pushState(null, "", "#" + activeTab);
        showToast(
          "Save or close your current editor before navigating back.",
          "error",
        );
        return;
      }
      setActiveTab(next);
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [activeTab, aboutBusy, aboutDirty, isModalOpen, showToast]);
  async function refreshContent() {
    if (loading || !(await canLeave())) return;
    setEditorRevision((revision) => revision + 1);
    await loadAllData();
  }
  async function logout() {
    if (loggingOut || !(await canLeave())) return;
    setLoggingOut(true);
    try {
      const response = await fetch("/api/admin/login", { method: "DELETE" });
      if (!response.ok) throw new Error();
      router.replace("/secret-admin/login");
      router.refresh();
    } catch {
      showToast("Could not sign out. Please try again.", "error");
      setLoggingOut(false);
    }
  }

  return (
    <div className="admin-dashboard admin-frame">
      {toast && (
        <div
          className={
            "admin-toast " + (toast.type === "error" ? "is-error" : "")
          }
          role={toast.type === "error" ? "alert" : "status"}
        >
          {toast.type === "success" ? (
            <Check size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {drawerOpen && (
        <button
          className="admin-drawer-backdrop"
          aria-label="Close navigation"
          tabIndex={-1}
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        ref={sidebar}
        id="admin-navigation"
        className={"admin-sidebar " + (drawerOpen ? "is-open" : "")}
        role={drawerOpen ? "dialog" : undefined}
        aria-modal={drawerOpen || undefined}
        aria-label="Workspace navigation"
      >
        <div className="admin-brand">
          <span className="admin-brand-mark">
            TT<span>.</span>
          </span>
          <div>
            <strong>Portfolio</strong>
            <span>Content studio</span>
          </div>
          <button
            className="admin-sidebar-close admin-icon-button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <p className="admin-nav-label">Workspace</p>
        <nav aria-label="Content sections">
          {sections.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => void navigate(id)}
              className={"admin-nav-link " + (activeTab === id ? "active" : "")}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {count !== undefined && (
                <span className="admin-nav-count">{loaded ? count : "—"}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <a href="/api/admin/export" className="admin-nav-link">
            <Download size={18} />
            <span>Export backup</span>
          </a>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={loggingOut || loading || aboutBusy}
            className="admin-nav-link"
          >
            <LogOut size={18} />
            <span>{loggingOut ? "Signing out…" : "Sign out"}</span>
          </button>
          <p className="mt-5 px-3 text-xs text-[#a4a4ae]">
            Your work, thoughtfully presented.
          </p>
        </div>
      </aside>
      <div className="admin-main" inert={drawerOpen || undefined}>
        <header className="admin-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="admin-mobile-menu admin-icon-button"
              aria-label="Open navigation"
              aria-controls="admin-navigation"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="hidden text-sm text-[#a4a4ae] sm:inline">
              Workspace <span className="mx-3 text-[#55555e]">/</span>
            </span>
            <h1 className="truncate text-sm font-medium">
              {sections.find((section) => section.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="admin-icon-button"
              title="Refresh content"
              aria-label="Refresh content"
              disabled={loading || aboutBusy}
              onClick={() => void refreshContent()}
            >
              <RefreshCw size={17} className={loading ? "admin-spin" : ""} />
            </button>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-secondary"
            >
              <span className="hidden sm:inline">View portfolio</span>
              <ArrowUpRight size={17} />
              <span className="sr-only sm:hidden">View portfolio</span>
            </Link>
          </div>
        </header>
        <div className="admin-page-content" aria-busy={loading}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-xs text-[#a4a4ae]">
            <span>PORTFOLIO / CONTENT STUDIO</span>
            <span>
              {loading
                ? "Syncing content…"
                : aboutDirty
                  ? "Unsaved changes"
                  : "Changes go live when saved"}
            </span>
          </div>
          {loadError && (
            <div role="alert" className="admin-empty mb-6">
              <AlertCircle size={22} />
              <p>{loadError}</p>
              <button
                type="button"
                className="button button-secondary"
                disabled={loading}
                onClick={() => void refreshContent()}
              >
                Retry
              </button>
              <Link
                className="text-link"
                href="/secret-admin/login"
                target="_blank"
              >
                Sign in again
              </Link>
            </div>
          )}
          {!loaded && !loadError && (
            <div role="status" className="admin-empty">
              <RefreshCw className="admin-spin" size={24} />
              <p>Loading your portfolio content…</p>
            </div>
          )}
          {loaded && (
            <>
              {/* ==================== TAB 1: PROJECTS ==================== */}
              {activeTab === "projects" && (
                <section className="admin-content-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 24,
                      flexWrap: "wrap",
                      gap: 16,
                    }}
                  >
                    <div>
                      <h2
                        className="display"
                        style={{ fontSize: 24, margin: 0 }}
                      >
                        Projects & Work
                      </h2>
                      <p
                        style={{
                          color: "var(--spidey-muted)",
                          fontSize: 13,
                          margin: "4px 0 0",
                        }}
                      >
                        Add new projects, update screenshots, manage tags, or
                        remove entries.
                      </p>
                    </div>
                    <button
                      disabled={loading}
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

                  <SortableList
                    disabled={loading}
                    collection="projects"
                    items={projects}
                    onChange={setProjects}
                    onNotify={showToast}
                    renderItem={(p) => (
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                            minWidth: 260,
                          }}
                        >
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
                              loading="lazy"
                              decoding="async"
                              src={p.cover.url}
                              alt={p.title}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                          <div>
                            <h3
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                margin: "0 0 2px",
                                color: "#ffffff",
                              }}
                            >
                              {p.title}
                            </h3>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--spidey-muted)",
                              }}
                            >
                              {p.category} · {p.year} ·{" "}
                              <span style={{ color: "var(--spidey-blue)" }}>
                                /{p.slug}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          {/* Featured Toggle */}
                          <button
                            disabled={loading}
                            onClick={() =>
                              toggleField(
                                "projects",
                                p.id,
                                "featured",
                                p.featured,
                              )
                            }
                            className="tag-pill"
                            style={{
                              backgroundColor: p.featured
                                ? "rgba(255, 30, 39, 0.2)"
                                : "var(--spidey-dark-700)",
                              color: p.featured
                                ? "var(--spidey-red)"
                                : "var(--spidey-muted)",
                              borderColor: p.featured
                                ? "var(--spidey-red)"
                                : "var(--line)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                            }}
                            title="Toggle Featured"
                            aria-pressed={p.featured}
                          >
                            {p.featured ? (
                              <Star size={13} fill="currentColor" />
                            ) : (
                              <StarOff size={13} />
                            )}
                            {p.featured ? "Featured" : "Standard"}
                          </button>

                          {/* Published Toggle */}
                          <button
                            disabled={loading}
                            onClick={() =>
                              toggleField(
                                "projects",
                                p.id,
                                "isPublished",
                                p.isPublished !== false,
                              )
                            }
                            className="tag-pill"
                            style={{
                              backgroundColor:
                                p.isPublished !== false
                                  ? "rgba(0, 255, 136, 0.15)"
                                  : "rgba(255, 255, 255, 0.05)",
                              color:
                                p.isPublished !== false
                                  ? "#00ff88"
                                  : "var(--spidey-muted)",
                              borderColor:
                                p.isPublished !== false
                                  ? "#00ff88"
                                  : "var(--line)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                            }}
                            title="Toggle Publish / Draft"
                          >
                            {p.isPublished !== false ? (
                              <Eye size={13} />
                            ) : (
                              <EyeOff size={13} />
                            )}
                            {p.isPublished !== false ? "Published" : "Draft"}
                          </button>

                          {/* Edit button */}
                          <button
                            disabled={loading}
                            onClick={() => setEditingProject({ ...p })}
                            className="button button-secondary"
                            style={{
                              minHeight: 36,
                              padding: "0 14px",
                              fontSize: 12,
                            }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>

                          {/* Delete button */}
                          <button
                            disabled={loading}
                            onClick={() =>
                              deleteItem("projects", p.id, p.title)
                            }
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
                    )}
                  />
                </section>
              )}

              {/* ==================== TAB 2: EXPERIENCE ==================== */}
              {activeTab === "experience" && (
                <section className="admin-content-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 24,
                      flexWrap: "wrap",
                      gap: 16,
                    }}
                  >
                    <div>
                      <h2
                        className="display"
                        style={{ fontSize: 24, margin: 0 }}
                      >
                        Experience Timeline
                      </h2>
                      <p
                        style={{
                          color: "var(--spidey-muted)",
                          fontSize: 13,
                          margin: "4px 0 0",
                        }}
                      >
                        Manage roles, achievements, timeline periods, and
                        technologies.
                      </p>
                    </div>
                    <button
                      disabled={loading}
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

                  <SortableList
                    disabled={loading}
                    collection="experiences"
                    items={experiences}
                    onChange={setExperiences}
                    onNotify={showToast}
                    renderItem={(exp) => (
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
                          <h3
                            style={{
                              fontSize: 17,
                              fontWeight: 700,
                              margin: "0 0 4px",
                              color: "#ffffff",
                            }}
                          >
                            {exp.role}{" "}
                            <span style={{ color: "var(--spidey-red)" }}>
                              @ {exp.company}
                            </span>
                          </h3>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--spidey-muted)",
                              marginBottom: 8,
                            }}
                          >
                            {exp.period} · {exp.location}
                          </div>
                          <p
                            style={{
                              color: "var(--spidey-text-dim)",
                              fontSize: 14,
                              margin: "0 0 10px 0",
                              maxWidth: 640,
                            }}
                          >
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
                            disabled={loading}
                            onClick={() => {
                              setTempTag("");
                              setTempAchievement("");
                              setEditingExperience({ ...exp });
                            }}
                            className="button button-secondary"
                            style={{
                              minHeight: 36,
                              padding: "0 14px",
                              fontSize: 12,
                            }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            disabled={loading}
                            onClick={() =>
                              deleteItem(
                                "experiences",
                                exp.id,
                                `${exp.role} at ${exp.company}`,
                              )
                            }
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
                    )}
                  />
                </section>
              )}

              {/* ==================== TAB 3: HACKATHONS ==================== */}
              {activeTab === "hackathons" && (
                <section className="admin-content-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 24,
                      flexWrap: "wrap",
                      gap: 16,
                    }}
                  >
                    <div>
                      <h2
                        className="display"
                        style={{ fontSize: 24, margin: 0 }}
                      >
                        Hackathons & Mentorship
                      </h2>
                      <p
                        style={{
                          color: "var(--spidey-muted)",
                          fontSize: 13,
                          margin: "4px 0 0",
                        }}
                      >
                        Manage your judging and mentorship participation.
                      </p>
                    </div>
                    <button
                      disabled={loading}
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

                  <SortableList
                    disabled={loading}
                    collection="hackathons"
                    items={hackathons}
                    onChange={setHackathons}
                    onNotify={showToast}
                    renderItem={(h) => (
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 4,
                            }}
                          >
                            <span
                              className="tag-pill"
                              style={{
                                backgroundColor: "var(--spidey-red)",
                                color: "#fff",
                              }}
                            >
                              {h.role}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--spidey-muted)",
                              }}
                            >
                              {h.date}
                            </span>
                          </div>
                          <h3
                            style={{
                              fontSize: 17,
                              fontWeight: 700,
                              margin: "4px 0",
                              color: "#ffffff",
                            }}
                          >
                            {h.name}
                          </h3>
                          <div
                            style={{
                              fontSize: 13,
                              color: "var(--spidey-text-dim)",
                            }}
                          >
                            Hosted by {h.organizer} · {h.teams} Teams
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            disabled={loading}
                            onClick={() => setEditingHackathon({ ...h })}
                            className="button button-secondary"
                            style={{
                              minHeight: 36,
                              padding: "0 14px",
                              fontSize: 12,
                            }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            disabled={loading}
                            onClick={() =>
                              deleteItem("hackathons", h.id, h.name)
                            }
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
                    )}
                  />
                </section>
              )}

              {/* ==================== TAB 4: COMMUNITY EVENTS ==================== */}
              {activeTab === "events" && (
                <section className="admin-content-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 24,
                      flexWrap: "wrap",
                      gap: 16,
                    }}
                  >
                    <div>
                      <h2
                        className="display"
                        style={{ fontSize: 24, margin: 0 }}
                      >
                        Community Events & HackShastra
                      </h2>
                      <p
                        style={{
                          color: "var(--spidey-muted)",
                          fontSize: 13,
                          margin: "4px 0 0",
                        }}
                      >
                        Add, edit and publish the events shown on your
                        HackShastra page. Drag rows or use the arrows to change
                        their order.
                      </p>
                    </div>
                    <button
                      disabled={loading}
                      onClick={() => {
                        setEditingEvent({
                          title: "",
                          date: "",
                          venue: "",
                          status: "upcoming",
                          description: "",
                          attendees: 0,
                          link: "",
                          isPublished: true,
                        });
                      }}
                      className="button button-primary"
                    >
                      <Plus size={16} /> Add Event
                    </button>
                  </div>

                  <SortableList
                    disabled={loading}
                    collection="events"
                    items={events}
                    onChange={setEvents}
                    onNotify={showToast}
                    renderItem={(e) => (
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 4,
                            }}
                          >
                            <span
                              className="tag-pill"
                              style={{
                                backgroundColor:
                                  e.status === "upcoming"
                                    ? "var(--spidey-red)"
                                    : "var(--spidey-dark-700)",
                                color: "#fff",
                              }}
                            >
                              {e.status.toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--spidey-muted)",
                              }}
                            >
                              {e.date} · {e.venue}
                            </span>
                          </div>
                          <h3
                            style={{
                              fontSize: 17,
                              fontWeight: 700,
                              margin: "4px 0",
                              color: "#ffffff",
                            }}
                          >
                            {e.title}
                          </h3>
                          <div
                            style={{
                              fontSize: 13,
                              color: "var(--spidey-text-dim)",
                            }}
                          >
                            {e.isPublished !== false
                              ? "Visible on the HackShastra page"
                              : "Draft — hidden from the website"}
                          </div>
                        </div>

                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                        >
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              toggleField(
                                "events",
                                e.id,
                                "isPublished",
                                e.isPublished !== false,
                              )
                            }
                            className="button button-secondary"
                            style={{
                              minHeight: 36,
                              padding: "0 14px",
                              fontSize: 12,
                            }}
                            aria-label={`${e.isPublished !== false ? "Hide" : "Publish"} ${e.title}`}
                          >
                            {e.isPublished !== false ? (
                              <Eye size={13} />
                            ) : (
                              <EyeOff size={13} />
                            )}
                            {e.isPublished !== false ? "Published" : "Draft"}
                          </button>
                          <button
                            disabled={loading}
                            onClick={() => {
                              setEditingEvent({ ...e });
                            }}
                            className="button button-secondary"
                            style={{
                              minHeight: 36,
                              padding: "0 14px",
                              fontSize: 12,
                            }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            disabled={loading}
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
                    )}
                  />
                </section>
              )}

              {/* ==================== TAB 5: SOCIAL LINKS ==================== */}
              {activeTab === "socials" && (
                <section className="admin-content-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 24,
                      flexWrap: "wrap",
                      gap: 16,
                    }}
                  >
                    <div>
                      <h2
                        className="display"
                        style={{ fontSize: 24, margin: 0 }}
                      >
                        Social Channels & Links
                      </h2>
                      <p
                        style={{
                          color: "var(--spidey-muted)",
                          fontSize: 13,
                          margin: "4px 0 0",
                        }}
                      >
                        Add or edit your GitHub, LinkedIn, X, and communication
                        links.
                      </p>
                    </div>
                    <button
                      disabled={loading}
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

                  <SortableList
                    disabled={loading}
                    collection="socials"
                    items={socials}
                    onChange={setSocials}
                    onNotify={showToast}
                    renderItem={(s) => (
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                          }}
                        >
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
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 15,
                                color: "#fff",
                              }}
                            >
                              {s.label}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--spidey-muted)",
                              }}
                            >
                              {s.handle} — {s.href}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            disabled={loading}
                            onClick={() => setEditingSocial({ ...s })}
                            className="button button-secondary"
                            style={{
                              minHeight: 36,
                              padding: "0 14px",
                              fontSize: 12,
                            }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            disabled={loading}
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
                    )}
                  />
                </section>
              )}

              {/* ==================== ABOUT PAGE ==================== */}
              {activeTab === "about" && settings && (
                <AboutGalleryEditor
                  key={`${settings.updatedAt}-${editorRevision}`}
                  onDirtyChange={setAboutDirty}
                  onBusyChange={setAboutBusy}
                  value={settings.aboutPopOut}
                  moments={settings.aboutMoments}
                  practiceImage={settings.aboutPracticeImage}
                  practiceImage2={settings.aboutPracticeImage2}
                  aboutPage={settings.aboutPage}
                  projects={projects}
                  profileImage={profile?.avatar}
                  onSave={(
                    aboutPopOut,
                    aboutMoments,
                    aboutPracticeImage,
                    aboutPracticeImage2,
                    aboutPage,
                  ) =>
                    saveItem(
                      "settings",
                      {
                        ...settings,
                        aboutPopOut,
                        aboutMoments,
                        aboutPracticeImage,
                        aboutPracticeImage2,
                        aboutPage,
                      },
                      false,
                    )
                  }
                />
              )}

              {/* ==================== PROJECT EDIT/CREATE MODAL ==================== */}
              {editingProject && (
                <EditorDialog
                  title={editingProject.id ? "Edit Project" : "Add Project"}
                  onClose={() => void closeEditor()}
                  busy={loading || projectUploading}
                >
                  {formError && (
                    <p
                      role="alert"
                      className="mb-5 rounded-lg border border-red-400/25 bg-red-400/5 p-3 text-sm text-[#ffaaa5]"
                    >
                      {formError}
                    </p>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (projectUploadBusy.current) return;
                      const isNew = !editingProject.id;
                      const success = await saveItem(
                        "projects",
                        editingProject,
                        isNew,
                      );
                      if (success) setEditingProject(null);
                    }}
                    aria-busy={loading || projectUploading}
                  >
                    <fieldset
                      disabled={loading}
                      className="grid min-w-0 gap-4 border-0 p-0"
                    >
                      <div>
                        <label className="form-label" htmlFor="editor-field-1">
                          Project Title
                        </label>
                        <input
                          id="editor-field-1"
                          value={editingProject.title || ""}
                          onChange={(e) => {
                            const title = e.target.value;
                            const slug = title
                              .toLowerCase()
                              .trim()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, "");
                            setEditingProject({
                              ...editingProject,
                              title,
                              ...(!editingProject.id ? { slug } : {}),
                            });
                          }}
                          className="form-input"
                          required
                        />
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                        }}
                      >
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-2"
                          >
                            URL Slug
                          </label>
                          <input
                            id="editor-field-2"
                            value={editingProject.slug || ""}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                slug: e.target.value,
                              })
                            }
                            className="form-input"
                            required
                          />
                        </div>
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-3"
                          >
                            Year
                          </label>
                          <input
                            id="editor-field-3"
                            value={editingProject.year || ""}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                year: e.target.value,
                              })
                            }
                            className="form-input"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label" htmlFor="editor-field-4">
                          Category
                        </label>
                        <input
                          id="editor-field-4"
                          value={editingProject.category || ""}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              category: e.target.value,
                            })
                          }
                          placeholder="Web Application · 2025"
                          className="form-input"
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label" htmlFor="editor-field-5">
                          Description
                        </label>
                        <textarea
                          id="editor-field-5"
                          value={editingProject.description || ""}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              description: e.target.value,
                            })
                          }
                          className="form-textarea"
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label" htmlFor="editor-field-6">
                          Cover Image URL
                        </label>
                        <input
                          id="editor-field-6"
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
                          <div
                            style={{
                              marginTop: 10,
                              width: "100%",
                              height: 160,
                              borderRadius: "var(--radius-md)",
                              overflow: "hidden",
                              position: "relative",
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              loading="lazy"
                              decoding="async"
                              src={editingProject.cover.url}
                              alt="Cover Preview"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <ProjectScreenshotsEditor
                        key={editingProject.id || "new-project"}
                        assets={editingProject.gallery || []}
                        onUploadingChange={(uploading) => {
                          projectUploadBusy.current = uploading;
                          setProjectUploading(uploading);
                        }}
                        onChange={(gallery) =>
                          setEditingProject((current) =>
                            current ? { ...current, gallery } : null,
                          )
                        }
                      />

                      {/* Tags Manager */}
                      <div>
                        <label className="form-label">
                          Tags / Technologies
                        </label>
                        <div
                          style={{ display: "flex", gap: 8, marginBottom: 8 }}
                        >
                          <input
                            aria-label="Add technology tag"
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
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              {t}
                              <button
                                type="button"
                                className="admin-icon-button"
                                aria-label="Remove item"
                                onClick={() => {
                                  setEditingProject({
                                    ...editingProject,
                                    tags: (editingProject.tags || []).filter(
                                      (_, i) => i !== tidx,
                                    ),
                                  });
                                }}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                        }}
                      >
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-7"
                          >
                            Live Site URL (Optional)
                          </label>
                          <input
                            id="editor-field-7"
                            value={editingProject.liveUrl || ""}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                liveUrl: e.target.value,
                              })
                            }
                            placeholder="https://..."
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-8"
                          >
                            GitHub URL (Optional)
                          </label>
                          <input
                            id="editor-field-8"
                            value={editingProject.githubUrl || ""}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                githubUrl: e.target.value,
                              })
                            }
                            placeholder="https://github.com/..."
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={editingProject.featured || false}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                featured: e.target.checked,
                              })
                            }
                          />
                          Featured on Homepage
                        </label>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={editingProject.isPublished !== false}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                isPublished: e.target.checked,
                              })
                            }
                          />
                          Published (Live)
                        </label>
                      </div>

                      <div className="admin-modal-actions">
                        <button
                          type="button"
                          onClick={() => void closeEditor()}
                          disabled={loading || projectUploading}
                          className="button button-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading || projectUploading}
                          className="button button-primary"
                        >
                          {loading
                            ? "Saving..."
                            : projectUploading
                              ? "Uploading screenshots..."
                              : "Save Project"}{" "}
                          <Check size={16} />
                        </button>
                      </div>
                    </fieldset>
                  </form>
                </EditorDialog>
              )}

              {/* ==================== EXPERIENCE EDIT/CREATE MODAL ==================== */}
              {editingExperience && (
                <EditorDialog
                  title={
                    editingExperience.id ? "Edit Experience" : "Add Experience"
                  }
                  onClose={() => void closeEditor()}
                  busy={loading}
                >
                  {formError && (
                    <p
                      role="alert"
                      className="mb-5 rounded-lg border border-red-400/25 bg-red-400/5 p-3 text-sm text-[#ffaaa5]"
                    >
                      {formError}
                    </p>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const isNew = !editingExperience.id;
                      const success = await saveItem(
                        "experiences",
                        editingExperience,
                        isNew,
                      );
                      if (success) setEditingExperience(null);
                    }}
                    aria-busy={loading}
                  >
                    <fieldset
                      disabled={loading}
                      className="grid min-w-0 gap-4 border-0 p-0"
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                        }}
                      >
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-9"
                          >
                            Role Title
                          </label>
                          <input
                            id="editor-field-9"
                            value={editingExperience.role || ""}
                            onChange={(e) =>
                              setEditingExperience({
                                ...editingExperience,
                                role: e.target.value,
                              })
                            }
                            className="form-input"
                            required
                          />
                        </div>
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-10"
                          >
                            Company Name
                          </label>
                          <input
                            id="editor-field-10"
                            value={editingExperience.company || ""}
                            onChange={(e) =>
                              setEditingExperience({
                                ...editingExperience,
                                company: e.target.value,
                              })
                            }
                            className="form-input"
                            required
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                        }}
                      >
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-11"
                          >
                            Time Period
                          </label>
                          <input
                            id="editor-field-11"
                            value={editingExperience.period || ""}
                            onChange={(e) =>
                              setEditingExperience({
                                ...editingExperience,
                                period: e.target.value,
                              })
                            }
                            placeholder="2023 — Present"
                            className="form-input"
                            required
                          />
                        </div>
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-12"
                          >
                            Location
                          </label>
                          <input
                            id="editor-field-12"
                            value={editingExperience.location || ""}
                            onChange={(e) =>
                              setEditingExperience({
                                ...editingExperience,
                                location: e.target.value,
                              })
                            }
                            placeholder="Mumbai, India"
                            className="form-input"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label" htmlFor="editor-field-13">
                          Description
                        </label>
                        <textarea
                          id="editor-field-13"
                          value={editingExperience.description || ""}
                          onChange={(e) =>
                            setEditingExperience({
                              ...editingExperience,
                              description: e.target.value,
                            })
                          }
                          className="form-textarea"
                          rows={3}
                          required
                        />
                      </div>

                      {/* Achievements Manager */}
                      <div>
                        <label className="form-label">
                          Key Achievements / Bullet Points
                        </label>
                        <div
                          style={{ display: "flex", gap: 8, marginBottom: 8 }}
                        >
                          <input
                            aria-label="Add achievement"
                            value={tempAchievement}
                            onChange={(e) => setTempAchievement(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (tempAchievement.trim()) {
                                  const list =
                                    editingExperience.achievements || [];
                                  setEditingExperience({
                                    ...editingExperience,
                                    achievements: [
                                      ...list,
                                      tempAchievement.trim(),
                                    ],
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
                                const list =
                                  editingExperience.achievements || [];
                                setEditingExperience({
                                  ...editingExperience,
                                  achievements: [
                                    ...list,
                                    tempAchievement.trim(),
                                  ],
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
                          {(editingExperience.achievements || []).map(
                            (ach, idx) => (
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
                                <button
                                  type="button"
                                  className="admin-icon-button"
                                  aria-label="Remove item"
                                  onClick={() => {
                                    setEditingExperience({
                                      ...editingExperience,
                                      achievements: (
                                        editingExperience.achievements || []
                                      ).filter((_, i) => i !== idx),
                                    });
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Tech Stack Manager */}
                      <div>
                        <label className="form-label">Technologies Used</label>
                        <div
                          style={{ display: "flex", gap: 8, marginBottom: 8 }}
                        >
                          <input
                            aria-label="Add technology tag"
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
                            <span
                              key={idx}
                              className="tag-pill"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              {t}
                              <button
                                type="button"
                                className="admin-icon-button"
                                aria-label="Remove item"
                                onClick={() => {
                                  setEditingExperience({
                                    ...editingExperience,
                                    tech: (editingExperience.tech || []).filter(
                                      (_, i) => i !== idx,
                                    ),
                                  });
                                }}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="admin-modal-actions">
                        <button
                          type="button"
                          onClick={() => void closeEditor()}
                          className="button button-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="button button-primary"
                        >
                          {loading ? "Saving..." : "Save Experience"}{" "}
                          <Check size={16} />
                        </button>
                      </div>
                    </fieldset>
                  </form>
                </EditorDialog>
              )}

              {/* ==================== HACKATHON EDIT/CREATE MODAL ==================== */}
              {editingHackathon && (
                <EditorDialog
                  title={
                    editingHackathon.id ? "Edit Hackathon" : "Add Hackathon"
                  }
                  onClose={() => void closeEditor()}
                  busy={loading}
                >
                  {formError && (
                    <p
                      role="alert"
                      className="mb-5 rounded-lg border border-red-400/25 bg-red-400/5 p-3 text-sm text-[#ffaaa5]"
                    >
                      {formError}
                    </p>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const isNew = !editingHackathon.id;
                      const success = await saveItem(
                        "hackathons",
                        editingHackathon,
                        isNew,
                      );
                      if (success) setEditingHackathon(null);
                    }}
                    aria-busy={loading}
                  >
                    <fieldset
                      disabled={loading}
                      className="grid min-w-0 gap-4 border-0 p-0"
                    >
                      <div>
                        <label className="form-label" htmlFor="editor-field-14">
                          Hackathon Name
                        </label>
                        <input
                          id="editor-field-14"
                          value={editingHackathon.name || ""}
                          onChange={(e) =>
                            setEditingHackathon({
                              ...editingHackathon,
                              name: e.target.value,
                            })
                          }
                          className="form-input"
                          required
                        />
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                        }}
                      >
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-15"
                          >
                            Your Role
                          </label>
                          <select
                            id="editor-field-15"
                            value={editingHackathon.role || "Judge"}
                            onChange={(e) =>
                              setEditingHackathon({
                                ...editingHackathon,
                                role: e.target.value as Hackathon["role"],
                              })
                            }
                            className="form-select"
                          >
                            <option value="Judge">Judge</option>
                            <option value="Mentor">Mentor</option>
                            {editingHackathon.role === "Organizer" && (
                              <option value="Organizer" disabled>
                                Legacy Organizer — choose a new role
                              </option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-16"
                          >
                            Date / Year
                          </label>
                          <input
                            id="editor-field-16"
                            value={editingHackathon.date || ""}
                            onChange={(e) =>
                              setEditingHackathon({
                                ...editingHackathon,
                                date: e.target.value,
                              })
                            }
                            className="form-input"
                            required
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                        }}
                      >
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-17"
                          >
                            Organizer
                          </label>
                          <input
                            id="editor-field-17"
                            value={editingHackathon.organizer || ""}
                            onChange={(e) =>
                              setEditingHackathon({
                                ...editingHackathon,
                                organizer: e.target.value,
                              })
                            }
                            className="form-input"
                            required
                          />
                        </div>
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-18"
                          >
                            Teams Mentored / Evaluated
                          </label>
                          <input
                            id="editor-field-18"
                            type="number"
                            value={editingHackathon.teams ?? 15}
                            onChange={(e) =>
                              setEditingHackathon({
                                ...editingHackathon,
                                teams: Number(e.target.value),
                              })
                            }
                            className="form-input"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label" htmlFor="editor-field-19">
                          Description
                        </label>
                        <textarea
                          id="editor-field-19"
                          value={editingHackathon.description || ""}
                          onChange={(e) =>
                            setEditingHackathon({
                              ...editingHackathon,
                              description: e.target.value,
                            })
                          }
                          className="form-textarea"
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label" htmlFor="editor-field-20">
                          Link (Optional)
                        </label>
                        <input
                          id="editor-field-20"
                          value={editingHackathon.link || ""}
                          onChange={(e) =>
                            setEditingHackathon({
                              ...editingHackathon,
                              link: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="form-input"
                        />
                      </div>

                      <div className="admin-modal-actions">
                        <button
                          type="button"
                          onClick={() => void closeEditor()}
                          className="button button-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="button button-primary"
                        >
                          {loading ? "Saving..." : "Save Hackathon"}{" "}
                          <Check size={16} />
                        </button>
                      </div>
                    </fieldset>
                  </form>
                </EditorDialog>
              )}

              {/* ==================== EVENT EDIT/CREATE MODAL ==================== */}
              {editingEvent && (
                <EventEditor
                  value={editingEvent}
                  onChange={setEditingEvent}
                  onClose={() => void closeEditor()}
                  saving={loading}
                  onSave={async () => {
                    const success = await saveItem(
                      "events",
                      editingEvent,
                      !editingEvent.id,
                    );
                    if (success) setEditingEvent(null);
                  }}
                />
              )}

              {/* ==================== SOCIAL EDIT/CREATE MODAL ==================== */}
              {editingSocial && (
                <EditorDialog
                  title={
                    editingSocial.id ? "Edit Social Link" : "Add Social Link"
                  }
                  onClose={() => void closeEditor()}
                  busy={loading}
                >
                  {formError && (
                    <p
                      role="alert"
                      className="mb-5 rounded-lg border border-red-400/25 bg-red-400/5 p-3 text-sm text-[#ffaaa5]"
                    >
                      {formError}
                    </p>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const isNew = !editingSocial.id;
                      const success = await saveItem(
                        "socials",
                        editingSocial,
                        isNew,
                      );
                      if (success) setEditingSocial(null);
                    }}
                    aria-busy={loading}
                  >
                    <fieldset
                      disabled={loading}
                      className="grid min-w-0 gap-4 border-0 p-0"
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                        }}
                      >
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-21"
                          >
                            Platform Label
                          </label>
                          <input
                            id="editor-field-21"
                            value={editingSocial.label || ""}
                            onChange={(e) =>
                              setEditingSocial({
                                ...editingSocial,
                                label: e.target.value,
                              })
                            }
                            placeholder="GitHub"
                            className="form-input"
                            required
                          />
                        </div>
                        <div>
                          <label
                            className="form-label"
                            htmlFor="editor-field-22"
                          >
                            Handle / Username
                          </label>
                          <input
                            id="editor-field-22"
                            value={editingSocial.handle || ""}
                            onChange={(e) =>
                              setEditingSocial({
                                ...editingSocial,
                                handle: e.target.value,
                              })
                            }
                            placeholder="@username"
                            className="form-input"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label" htmlFor="editor-field-23">
                          Full Profile Link URL
                        </label>
                        <input
                          id="editor-field-23"
                          value={editingSocial.href || ""}
                          onChange={(e) =>
                            setEditingSocial({
                              ...editingSocial,
                              href: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="form-input"
                          required
                        />
                      </div>

                      <div className="admin-modal-actions">
                        <button
                          type="button"
                          onClick={() => void closeEditor()}
                          className="button button-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="button button-primary"
                        >
                          {loading ? "Saving..." : "Save Social Link"}{" "}
                          <Check size={16} />
                        </button>
                      </div>
                    </fieldset>
                  </form>
                </EditorDialog>
              )}
            </>
          )}
          <footer className="admin-statusbar">
            <div className="flex min-w-0 items-center gap-3">
              <Database size={18} />
              <div>
                <span className="block text-sm font-medium">
                  {!dbStatus
                    ? "Storage status unavailable"
                    : dbStatus.success
                      ? "Database connected"
                      : dbStatus.uriMasked === "Not configured"
                        ? "Local content storage"
                        : "Database unavailable"}
                </span>
                <span className="text-xs text-[#a4a4ae]">
                  {dbStatus?.success
                    ? dbStatus.dbName
                    : dbStatus?.uriMasked === "Not configured"
                      ? "Content is saved to the server’s data directory."
                      : "Check your connection before making changes."}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={checkMongoStatus}
              disabled={testingDb}
              className="button button-secondary"
            >
              <RefreshCw size={14} className={testingDb ? "admin-spin" : ""} />
              {testingDb ? "Checking…" : "Check connection"}
            </button>
          </footer>
        </div>
      </div>
      {confirmation && (
        <EditorDialog
          title={confirmation.title}
          onClose={() => answerConfirmation(false)}
          compact
        >
          <p className="mb-6 text-sm leading-relaxed text-[#b8b8c1]">
            {confirmation.message}
          </p>
          <div className="admin-modal-actions">
            <button
              type="button"
              autoFocus
              className="button button-secondary"
              onClick={() => answerConfirmation(false)}
            >
              Keep editing
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => answerConfirmation(true)}
            >
              {confirmation.action}
            </button>
          </div>
        </EditorDialog>
      )}
    </div>
  );
}
