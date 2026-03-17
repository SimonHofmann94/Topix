"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileIcon, LinkIcon } from "lucide-react";

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Ablage({
  resources,
  currentUserId,
  isAdmin,
  onDelete,
}: {
  resources: Resource[];
  currentUserId: string;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="mt-8 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
          Ablage
        </h3>
        <span className="text-sm text-neutral-400">
          {resources.length} {resources.length === 1 ? "Datei" : "Dateien"}
        </span>
      </div>

      <Separator />

      {resources.length === 0 ? (
        <p className="text-neutral-400 text-sm py-4 text-center">
          Noch keine Dateien geteilt.
        </p>
      ) : (
        resources.map((resource) => (
          <Card key={resource.id}>
            <CardContent className="flex items-center gap-3 py-3">
              {/* Icon */}
              <div className="flex-shrink-0 text-neutral-400">
                {resource.type === "file" ? (
                  <FileIcon size={18} />
                ) : (
                  <LinkIcon size={18} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-neutral-900 hover:underline truncate"
                  >
                    {resource.name}
                  </a>
                  {resource.type === "file" && resource.fileSize && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {formatFileSize(resource.fileSize)}
                    </Badge>
                  )}
                  {resource.type === "link" && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      Link
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  von {resource.uploaderName}
                </p>
              </div>

              {/* Delete */}
              {(resource.uploadedBy === currentUserId || isAdmin) && (
                <button
                  onClick={() => onDelete(resource.id)}
                  className="text-neutral-300 hover:text-neutral-500 text-sm flex-shrink-0"
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
  );
}
