"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function ProposeTopic({
  eventId,
  onCreated,
}: {
  eventId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("15");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/events/${eventId}/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        durationMinutes: Number(duration),
      }),
    });

    setLoading(false);

    if (res.ok) {
      toast("Thema hinzugefügt");
      setTitle("");
      setDescription("");
      setDuration("15");
      setOpen(false);
      onCreated();
    } else {
      const data = await res.json();
      toast.error(data.error || "Fehler beim Erstellen");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full" />}>
        + Neues Thema vorschlagen
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thema vorschlagen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic-title">Titel</Label>
            <Input
              id="topic-title"
              placeholder="z.B. AI Tools im Startup-Alltag"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-desc">Beschreibung (optional)</Label>
            <Textarea
              id="topic-desc"
              placeholder="Worum geht es genau?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-duration">Dauer (Minuten)</Label>
            <div className="flex gap-2">
              {["5", "10", "15", "20", "30"].map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={duration === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDuration(d)}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Wird erstellt..." : "Thema einreichen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
