"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  File,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LyricFile {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
}

interface NavigationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  files: LyricFile[];
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
  onFileCreate: () => void;
  onFileDelete: (fileId: string) => void;
  onFileRename: (fileId: string, newTitle: string) => void;
}

export function NavigationSidebar({
  isOpen,
  onToggle,
  files,
  activeFileId,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
}: NavigationSidebarProps) {
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleRenameStart = (file: LyricFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFileId(file.id);
    setEditingTitle(file.title);
  };

  const handleRenameSubmit = (fileId: string) => {
    if (editingTitle.trim()) {
      onFileRename(fileId, editingTitle.trim());
    }
    setEditingFileId(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 left-4 z-30"
        onClick={onToggle}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </Button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-0 left-0 h-full w-64 bg-card border-r border-border z-20"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-medium">My Lyrics</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onFileCreate}
                title="Create new file"
              >
                <PlusCircle size={16} />
              </Button>
            </div>

            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                  <p>No lyrics files yet</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2"
                    onClick={onFileCreate}
                  >
                    Create your first file
                  </Button>
                </div>
              ) : (
                <ul className="p-2 space-y-1">
                  {files.map((file) => (
                    <motion.li
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "rounded-md overflow-hidden",
                        activeFileId === file.id
                          ? "bg-accent"
                          : "hover:bg-accent/50",
                      )}
                    >
                      <div
                        className="p-2 cursor-pointer flex items-start gap-2"
                        onClick={() => onFileSelect(file.id)}
                      >
                        <File
                          size={16}
                          className="mt-0.5 flex-shrink-0 text-muted-foreground"
                        />
                        <div className="flex-1 min-w-0">
                          {editingFileId === file.id ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1"
                            >
                              <Input
                                value={editingTitle}
                                onChange={(e) =>
                                  setEditingTitle(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleRenameSubmit(file.id);
                                  } else if (e.key === "Escape") {
                                    setEditingFileId(null);
                                  }
                                }}
                                onBlur={() => handleRenameSubmit(file.id)}
                                autoFocus
                                className="h-6 text-sm py-0"
                              />
                            </div>
                          ) : (
                            <>
                              <div
                                className="text-sm font-medium truncate"
                                onDoubleClick={(e) =>
                                  handleRenameStart(file, e)
                                }
                              >
                                {file.title}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {formatDate(file.lastModified)}
                              </div>
                            </>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFileDelete(file.id);
                          }}
                        >
                          <Trash2
                            size={14}
                            className="text-muted-foreground hover:text-destructive"
                          />
                        </Button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay when sidebar is open on mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
    </>
  );
}
