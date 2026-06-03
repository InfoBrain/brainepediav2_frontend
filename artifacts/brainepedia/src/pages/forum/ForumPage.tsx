import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, Hash, ChevronRight, Users, LogIn, Plus, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { getUser, getUserRole } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { asList } from "@/lib/jobData";

interface ForumCategory {
  forumCategoryId: string;
  name: string;
  description: string;
}

export default function ForumPage() {
  usePageTitle("Community Forum");
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const user = getUser();
  const role = getUserRole();
  const isAdmin = role === "GlobalAdmin";

  // Create Category modal state
  const [showModal, setShowModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const fetchCategories = () => {
    setLoading(true);
    api.forum.getCategories().then((res) => {
      if (res.ok) setCategories(asList(res.data));
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (showModal) setTimeout(() => nameRef.current?.focus(), 60);
  }, [showModal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) { setCreateError("Name is required."); return; }
    setCreateError("");
    setCreating(true);
    const res = await api.forum.createCategory({ Name: catName.trim(), Description: catDesc.trim() });
    setCreating(false);
    if (!res.ok) {
      setCreateError(res.error || "Failed to create category. Please try again.");
      return;
    }
    // Success — close modal, clear form, refresh list
    setShowModal(false);
    setCatName("");
    setCatDesc("");
    fetchCategories();
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            ← Brainepedia
          </Link>
          {user ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">{user.firstName}</span>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 text-sm text-primary border border-primary/40 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Login to Participate
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-5 shadow-[0_0_20px_rgba(0,210,255,0.15)]">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Community Forum</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Discuss missions, share learning experiences, and grow with fellow professionals.
          </p>
        </motion.div>

        {/* Search + Admin button */}
        <div className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border/60 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => { setShowModal(true); setCreateError(""); }}
              className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-[0_0_12px_rgba(0,210,255,0.25)] whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Create Category
            </button>
          )}
        </div>

        {/* Categories */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-card/50 animate-pulse border border-border/30" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            {filtered.map((cat, i) => (
              <motion.div
                key={cat.forumCategoryId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/forum/category/${cat.forumCategoryId}`}>
                  <div className="flex items-center gap-4 p-5 bg-card border border-border/40 rounded-xl hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(0,210,255,0.08)] transition-all cursor-pointer group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No categories match "{search}"</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <footer className="text-center text-xs text-muted-foreground py-8 border-t border-border/20 mt-8">
        © 2026 Brainepedia. A product of Infobrainltd.com. All rights reserved.
      </footer>

      {/* ── Create Category Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-2xl p-6"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Create Category</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="cat-name">Name</label>
                  <input
                    ref={nameRef}
                    id="cat-name"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. DevOps & Infrastructure"
                    className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    maxLength={80}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="cat-desc">Description</label>
                  <textarea
                    id="cat-desc"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="What topics belong in this category?"
                    rows={3}
                    className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    maxLength={300}
                  />
                </div>

                {createError && (
                  <p className="text-destructive text-xs font-mono">{createError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-lg border border-border/60 text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                    {creating ? "Creating..." : "Create Category"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
