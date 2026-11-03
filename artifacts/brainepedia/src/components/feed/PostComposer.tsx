import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor, htmlToPlainText } from "@/components/editor/RichTextEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { isVideoMediaUrl, validateCoverFile } from "@/lib/feedMedia";
import { asList, text } from "@/lib/jobData";
import { isAbsoluteHttpUrl, isGuid, safeHttpUrl } from "@/lib/safeUrl";
import type { FeedPostCreateDto, FeedPostDto, FeedVisibility } from "@/lib/types/socialFeed";

type Option = { id: string; name: string };

const CONTENT_MAX = 8000;
const TITLE_MAX = 200;

export function PostComposer({
  mode = "create",
  initial,
  submitting,
  onSubmit,
  onCancel,
  variant = "card",
}: {
  mode?: "create" | "edit";
  initial?: FeedPostDto | null;
  submitting: boolean;
  onSubmit: (body: FeedPostCreateDto) => Promise<void>;
  onCancel?: () => void;
  variant?: "card" | "plain";
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [professionId, setProfessionId] = useState(initial?.professionId || "");
  const [topicId, setTopicId] = useState(initial?.topicId || "");
  const [visibility, setVisibility] = useState<FeedVisibility | "unchanged">(
    mode === "edit" ? "unchanged" : ((initial?.visibility as FeedVisibility) || "Public"),
  );
  const [error, setError] = useState("");
  const [professions, setProfessions] = useState<Option[]>([]);
  const [topics, setTopics] = useState<Option[]>([]);
  const existingCover = safeHttpUrl(initial?.mediaUrl) || safeHttpUrl(initial?.thumbnailUrl);

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

  const onFile = (file: File | null) => {
    if (!file) {
      setMediaFile(null);
      return;
    }
    const message = validateCoverFile(file);
    if (message) {
      setMediaFile(null);
      setError(message);
      return;
    }
    setError("");
    setMediaFile(file);
    setMediaUrl("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const plain = htmlToPlainText(content);
    if (!plain) {
      setError("Content is required.");
      return;
    }
    if (content.length > CONTENT_MAX) {
      setError(`Content must be ${CONTENT_MAX} characters or fewer.`);
      return;
    }
    if (title.trim().length > TITLE_MAX) {
      setError(`Title must be ${TITLE_MAX} characters or fewer.`);
      return;
    }
    if (mediaFile) {
      const fileError = validateCoverFile(mediaFile);
      if (fileError) {
        setError(fileError);
        return;
      }
    } else if (mediaUrl.trim() && !isAbsoluteHttpUrl(mediaUrl)) {
      setError("A hosted cover must be an absolute http or https URL.");
      return;
    }
    setError("");
    const body: FeedPostCreateDto = {
      title: title.trim() || null,
      content,
      professionId: professionId || null,
      topicId: topicId || null,
    };
    if (mediaFile) body.media = mediaFile;
    else if (mediaUrl.trim()) body.mediaUrl = mediaUrl.trim();
    if (visibility !== "unchanged") body.visibility = visibility;
    await onSubmit(body);
    if (mode === "create") {
      setTitle("");
      setContent("");
      setMediaUrl("");
      setMediaFile(null);
      setProfessionId("");
      setTopicId("");
      setVisibility("Public");
    }
  };

  const previewUrl = mediaFile ? URL.createObjectURL(mediaFile) : "";
  const previewIsVideo = mediaFile ? mediaFile.type.startsWith("video/") : isVideoMediaUrl(previewUrl);

  return (
    <form onSubmit={submit} className={variant === "card" ? "space-y-4 rounded-2xl border border-[#7C3AED]/30 bg-[#0d1119] p-5" : "space-y-4"}>
      {variant === "card" && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A78BFA]">{mode === "edit" ? "Edit post" : "Share an update"}</p>
          <h2 className="mt-1 text-lg font-bold">{mode === "edit" ? "Update your post" : "Post to the Brainepedia feed"}</h2>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="feed-title">Title</Label>
        <Input id="feed-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Hello Brainepedia" maxLength={TITLE_MAX} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="feed-content">Content</Label>
        <RichTextEditor
          id="feed-content"
          value={content}
          onChange={(html) => setContent(html)}
          placeholder="What did you ship, learn, or want to share?"
          minHeightClassName="min-h-[160px]"
        />
        <p className="text-xs text-muted-foreground">{content.length}/{CONTENT_MAX}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="feed-cover">Cover</Label>
        <Input
          id="feed-cover"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.m4v,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">Image up to 2 MB, or video up to 25 MB. A new file replaces the current cover.</p>
        {existingCover && !mediaFile && mode === "edit" && (
          <p className="text-xs text-muted-foreground">Current cover stays in place unless you attach a new file or paste a hosted URL.</p>
        )}
        {mediaFile && previewUrl && (
          previewIsVideo
            ? <video src={previewUrl} controls className="max-h-40 rounded-xl bg-black" />
            : <img src={previewUrl} alt="" className="max-h-40 rounded-xl object-cover" />
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="feed-media-url">Hosted cover URL</Label>
        <Input
          id="feed-media-url"
          value={mediaUrl}
          onChange={(event) => setMediaUrl(event.target.value)}
          placeholder="https:// — only when the file is already hosted"
          disabled={Boolean(mediaFile)}
        />
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
