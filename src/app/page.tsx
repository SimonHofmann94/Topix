"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProposeTopic } from "@/components/propose-topic";
import { AddResource } from "@/components/add-resource";
import { Ablage } from "@/components/ablage";
import { toast } from "sonner";
import Link from "next/link";

type Resource = {
  id: string;
  type: string;
  name: string;
  url: string;
  mimeType: string | null;
  fileSize: number | null;
  uploadedBy: string;
  uploaderName: string;
  createdAt: string;
};

type Topic = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  proposerName: string;
  proposedBy: string;
  voteCount: number;
  hasVoted: boolean;
};

type Event = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  location: string | null;
  durationMinutes: number;
  status: string;
};

export default function Home() {
  const { data: session } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/events/current");
    const data = await res.json();
    setEvent(data.event);
    setTopics(data.topics || []);
    setResources(data.resources || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleVote(topicId: string) {
    const res = await fetch(`/api/topics/${topicId}/vote`, { method: "POST" });
    if (res.ok) {
      fetchData();
    }
  }

  async function handleDelete(topicId: string) {
    const res = await fetch(`/api/topics/${topicId}`, { method: "DELETE" });
    if (res.ok) {
      toast("Thema entfernt");
      fetchData();
    }
  }

  async function handleDeleteResource(resourceId: string) {
    const res = await fetch(`/api/resources/${resourceId}`, { method: "DELETE" });
    if (res.ok) {
      toast("Ressource entfernt");
      fetchData();
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const totalMinutes = topics.reduce((sum, t) => sum + t.durationMinutes, 0);
  const isAdmin = session?.user?.role === "admin";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="text-neutral-400">Laden...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">Topix</h1>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <Link href="/admin/events">
                  <Button variant="ghost" size="sm">
                    Events
                  </Button>
                </Link>
                <Link href="/admin/members">
                  <Button variant="ghost" size="sm">
                    Mitglieder
                  </Button>
                </Link>
              </>
            )}
            <span className="text-sm font-medium text-neutral-500">{session?.user?.name}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {!event ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-500">Kein kommendes Event gefunden.</p>
              {isAdmin && (
                <p className="text-sm text-neutral-400 mt-2">
                  Erstelle ein neues Event im Admin-Bereich.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Event Info */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight">{event.title}</h2>
              <p className="text-neutral-500 mt-1">
                {formatDate(event.date)} um {event.startTime} Uhr
              </p>
              {event.location && (
                <p className="text-neutral-400 text-sm mt-0.5">
                  {event.location}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <div className="flex-1">
                <ProposeTopic eventId={event.id} onCreated={fetchData} />
              </div>
              <div className="flex-1">
                <AddResource eventId={event.id} onCreated={fetchData} />
              </div>
            </div>

            {/* Agenda */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                  Agenda
                </h3>
                <span className="text-sm text-neutral-400">
                  {totalMinutes} / {event.durationMinutes} min
                </span>
              </div>

              <Separator />

              {topics.length === 0 ? (
                <p className="text-neutral-400 text-sm py-4 text-center">
                  Noch keine Themen vorgeschlagen. Sei der Erste!
                </p>
              ) : (
                topics.map((topic) => (
                  <Card key={topic.id}>
                    <CardContent className="flex items-start gap-4 py-4">
                      {/* Vote */}
                      <button
                        onClick={() => handleVote(topic.id)}
                        className="flex flex-col items-center gap-0.5 min-w-[40px] pt-0.5"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className={topic.hasVoted ? "text-neutral-900" : "text-neutral-300"}
                        >
                          <path
                            d="M8 3L13 9H3L8 3Z"
                            fill="currentColor"
                          />
                        </svg>
                        <span
                          className={`text-sm font-semibold ${
                            topic.hasVoted ? "text-neutral-900" : "text-neutral-400"
                          }`}
                        >
                          {topic.voteCount}
                        </span>
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900">
                            {topic.title}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {topic.durationMinutes} min
                          </Badge>
                        </div>
                        {topic.description && (
                          <p className="text-sm text-neutral-500 mt-1">
                            {topic.description}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 mt-1.5">
                          von {topic.proposerName}
                        </p>
                      </div>

                      {/* Delete */}
                      {(topic.proposedBy === session?.user?.id || isAdmin) && (
                        <button
                          onClick={() => handleDelete(topic.id)}
                          className="text-neutral-300 hover:text-neutral-500 text-sm"
                          title="Entfernen"
                        >
                          ✕
                        </button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Ablage */}
            <Ablage
              resources={resources}
              currentUserId={session?.user?.id || ""}
              isAdmin={isAdmin}
              onDelete={handleDeleteResource}
            />
          </>
        )}
      </main>
    </div>
  );
}
