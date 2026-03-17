"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";

type Event = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  location: string | null;
  durationMinutes: number;
  status: string;
};

export default function EventsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("120");
  const [loading, setLoading] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (session && !isAdmin) router.push("/");
  }, [session, isAdmin, router]);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const res = await fetch("/api/events");
    if (res.ok) setEvents(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        date,
        startTime,
        location: location || undefined,
        durationMinutes: Number(duration),
      }),
    });

    setLoading(false);

    if (res.ok) {
      toast("Event erstellt");
      setTitle("");
      setDate("");
      setStartTime("19:00");
      setLocation("");
      setDuration("120");
      setOpen(false);
      fetchEvents();
    } else {
      const data = await res.json();
      toast.error(data.error || "Fehler");
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchEvents();
  }

  async function handleDelete(id: string, eventTitle: string) {
    if (!confirm(`"${eventTitle}" wirklich löschen?`)) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Event gelöscht");
      fetchEvents();
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("de-DE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const statusLabel: Record<string, string> = {
    open: "Offen",
    locked: "Gesperrt",
    archived: "Archiviert",
  };

  const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
    open: "default",
    locked: "secondary",
    archived: "outline",
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <h1 className="text-xl font-bold tracking-tight">Topix</h1>
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-sm text-neutral-500">Events</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold tracking-tight">Events</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              + Neues Event
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Event erstellen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="event-title">Titel</Label>
                  <Input
                    id="event-title"
                    placeholder="z.B. Startup Stammtisch - Mai 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-date">Datum</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-time">Uhrzeit</Label>
                    <Input
                      id="event-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-location">Ort</Label>
                  <Input
                    id="event-location"
                    placeholder="z.B. WeWork München, Neuturmstraße 5"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-duration">Dauer (Minuten)</Label>
                  <div className="flex gap-2">
                    {["60", "90", "120"].map((d) => (
                      <Button
                        key={d}
                        type="button"
                        variant={duration === d ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDuration(d)}
                      >
                        {d} min
                      </Button>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Wird erstellt..." : "Event erstellen"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Separator className="mb-4" />

        {events.length === 0 ? (
          <p className="text-neutral-400 text-sm py-4 text-center">
            Noch keine Events erstellt.
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.title}</span>
                      <Badge variant={statusVariant[event.status]}>
                        {statusLabel[event.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-500">
                      {formatDate(event.date)} um {event.startTime} Uhr
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {event.status === "open" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(event.id, "locked")}
                      >
                        Sperren
                      </Button>
                    )}
                    {event.status === "locked" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(event.id, "open")}
                        >
                          Öffnen
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(event.id, "archived")}
                        >
                          Archivieren
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(event.id, event.title)}
                    >
                      Löschen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
