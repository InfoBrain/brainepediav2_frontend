import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { asList, text } from "@/lib/jobData";
import { isAbsoluteHttpUrl, isGuid } from "@/lib/safeUrl";
import type { FeedPostCreateDto, FeedPostDto, FeedVisibility } from "@/lib/types/socialFeed";

type Option = { id: string; name: string };

export function PostComposer({
  mode = "create",
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  mode?: "create" | "edit";
  initial?: FeedPostDto | null;
  submitting: boolean;
  onSubmit: (body: FeedPostCreateDto) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [mediaUrl, setMediaUrl] = useState(initial?.mediaUrl || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl || "");
  const [professionId, setProfessionId] = useState(initial?.professionId || "");
  const [topicId, setTopicId] = useState(initial?.topicId || "");
  const [visibility, setVisibility] = useState<FeedVisibility | "unchanged">(
    mode === "edit" ? "unchanged" : ((initial?.visibility as FeedVisibility) || "Public"),
  );
  const [error, setError] = useState("");
  const [professions, setProfessions] = useState<Option[]>([]);
  const [topics, setTopics] = useState<Option[]>([]);

  useEffect(() => {
    api.professions.list().then((res) => {
      if (!res.ok) return;
      setProfessions(
        asList(res.data)
          .map((item) => ({
            id: text(item?.professionId ?? item?.id, ""),
            name: text(item?.name ?? item?.professionName ?? item?.title, ""),
          }))
          .filter((item) => isGuid(item.id) && item.name),
      );
    });
    api.forum.getCategories().then((res) => {
      if (!res.ok || !Array.isArray(res.data)) return;
      setTopics(
        res.data
          .map((item: any) => ({
            id: text(item?.forumCategoryId ?? item?.categoryId ?? item?.id, ""),
            name: text(item?.name ?? item?.title, ""),
          }))
          .filter((item: Option) => isGuid(item.id) && item.name),
      );
    });
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) {
      setError("Content is required.");
      return;
    }
    if (mediaUrl.trim() && !isAbsoluteHttpUrl(mediaUrl)) {
      setError("Media URL must be an absolute http or https URL.");
      return;
    }
    if (thumbnailUrl.trim() && !isAbsoluteHttpUrl(thumbnailUrl)) {
      setError("Thumbnail URL must be an absolute http or https URL.");
      return;
    }
    setError("");
    const body: FeedPostCreateDto = {
      title: title.trim() || null,
      content: content.trim(),
      mediaUrl: mediaUrl.trim() || null,
      thumbnailUrl: thumbnailUrl.trim() || null,
      professionId: professionId || null,
      topicId: topicId || null,
    };
    if (visibility !== "unchanged") body.visibility = visibility;
    await onSubmit(body);
    if (mode === "create") {
      setTitle("");
      setContent("");
      setMediaUrl("");
      setThumbnailUrl("");
      setProfessionId("");
      setTopicId("");
      setVisibility("Public");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#7C3AED]/30 bg-[#0d1119] p-5">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A78BFA]">{mode === "edit" ? "Edit post" : "Share an update"}</p>
        <h2 className="mt-1 text-lg font-bold">{mode === "edit" ? "Update your post" : "Post to the Brainepedia feed"}</h2>
      </div>
      <div className="space-y-2">
        <Label htmlFor="feed-title">Title</Label>
        <Input id="feed-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Hello Brainepedia" maxLength={160} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="feed-content">Content</Label>
        <Textarea id="feed-content" value={content} onChange={(event) => setContent(event.target.value)} placeholder="What did you ship, learn, or want to share?" rows={4} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="feed-media">Media URL</Label>
          <Input id="feed-media" value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https://" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feed-thumb">Thumbnail URL</Label>
          <Input id="feed-thumb" value={thumbnailUrl} onChange={(event) => setThumbnailUrl(event.target.value)} placeholder="https://" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Profession</Label>
          <Select value={professionId || "none"} onValueChange={(value) => setProfessionId(value === "none" ? "" : value)}>
            <SelectTrigger><SelectValue placeholder="Optional profession" /></SelectTrigger>
            <SelectContent className="max-h-72 border-white/15 bg-[#0d1119] text-white">
              <SelectItem value="none">No profession</SelectItem>
              {professions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Topic</Label>
          <Select value={topicId || "none"} onValueChange={(value) => setTopicId(value === "none" ? "" : value)}>
            <SelectTrigger><SelectValue placeholder="Optional topic" /></SelectTrigger>
            <SelectContent className="max-h-72 border-white/15 bg-[#0d1119] text-white">
              <SelectItem value="none">No topic</SelectItem>
              {topics.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select value={visibility} onValueChange={(value) => setVisibility(value as FeedVisibility | "unchanged")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="border-white/15 bg-[#0d1119] text-white">
              {mode === "edit" && <SelectItem value="unchanged">Leave unchanged</SelectItem>}
              <SelectItem value="Public">Public</SelectItem>
              <SelectItem value="Followers">Followers</SelectItem>
              <SelectItem value="Private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting} className="bg-[#7C3AED] text-white hover:bg-[#6D28D9]">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "edit" ? "Save post" : "Publish"}
        </Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
