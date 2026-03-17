"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function AddResource({
  eventId,
  onCreated,
}: {
  eventId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setName("");
    setUrl("");
    setFile(null);
    setLoading(false);
  }

  async function handleSubmitLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/events/${eventId}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url }),
    });

    setLoading(false);

    if (res.ok) {
      toast("Link hinzugefügt");
      reset();
      setOpen(false);
      onCreated();
    } else {
      const data = await res.json();
      toast.error(data.error || "Fehler");
    }
  }

  async function handleSubmitFile(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name || file.name);

    const res = await fetch(`/api/events/${eventId}/resources`, {
      method: "POST",
      body: formData,
    });

    setLoading(false);

    if (res.ok) {
      toast("Datei hochgeladen");
      reset();
      setOpen(false);
      onCreated();
    } else {
      const data = await res.json();
      toast.error(data.error || "Fehler beim Hochladen");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={<Button variant="outline" className="w-full" />}>
        + Datei oder Link teilen
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ressource teilen</DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === "file" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("file")}
          >
            Datei hochladen
          </Button>
          <Button
            variant={mode === "link" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("link")}
          >
            Link teilen
          </Button>
        </div>

        {mode === "file" ? (
          <form onSubmit={handleSubmitFile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resource-file">Datei</Label>
              <Input
                id="resource-file"
                type="file"
                accept=".pdf,.pptx,.docx,.xlsx,.png,.jpg,.jpeg,.zip"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  if (f && !name) setName(f.name);
                }}
                required
              />
              <p className="text-xs text-neutral-400">
                Max. 10 MB. PDF, PPTX, DOCX, XLSX, PNG, JPG, ZIP
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-file-name">Name</Label>
              <Input
                id="resource-file-name"
                placeholder="Anzeigename"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !file}>
              {loading ? "Wird hochgeladen..." : "Hochladen"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resource-url">URL</Label>
              <Input
                id="resource-url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-link-name">Name</Label>
              <Input
                id="resource-link-name"
                placeholder="z.B. Pitch Deck, Notion Board..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird hinzugefügt..." : "Link teilen"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
