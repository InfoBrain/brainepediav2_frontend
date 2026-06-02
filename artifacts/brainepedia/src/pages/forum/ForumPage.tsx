import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { MessageSquare, Search, Hash, ChevronRight, Users, LogIn } from "lucide-react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";

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

  useEffect(() => {
    api.forum.getCategories().then((res) => {
      if (res.ok && Array.isArray(res.data)) setCategories(res.data);
      setLoading(false);
    });
  }, []);

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

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border/60 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
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
    </div>
  );
}
