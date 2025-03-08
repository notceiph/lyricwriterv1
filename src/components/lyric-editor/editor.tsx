"use client";

import { useState, useEffect } from "react";
import { NavigationSidebar, LyricFile } from "./navigation-sidebar";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, FileText } from "lucide-react";

export function LyricEditor() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [files, setFiles] = useState<LyricFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load files from localStorage on component mount
  useEffect(() => {
    const savedFiles = localStorage.getItem("lyricFiles");
    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles).map((file: any) => ({
          ...file,
          lastModified: new Date(file.lastModified),
        }));
        setFiles(parsedFiles);

        // Set the most recently modified file as active if there's no active file
        if (parsedFiles.length > 0 && !activeFileId) {
          const sortedFiles = [...parsedFiles].sort(
            (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
          );
          setActiveFileId(sortedFiles[0].id);
          setContent(sortedFiles[0].content);
        }
      } catch (error) {
        console.error("Error parsing saved files:", error);
      }
    }
  }, []);

  // Save files to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("lyricFiles", JSON.stringify(files));
  }, [files]);

  // Update content when active file changes
  useEffect(() => {
    if (activeFileId) {
      const activeFile = files.find((file) => file.id === activeFileId);
      if (activeFile) {
        setContent(activeFile.content);
      }
    } else {
      setContent("");
    }
  }, [activeFileId, files]);

  const handleCreateFile = () => {
    const newFile: LyricFile = {
      id: uuidv4(),
      title: `Untitled Lyrics ${files.length + 1}`,
      content: "",
      lastModified: new Date(),
    };

    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    setContent("");
  };

  const handleDeleteFile = (fileId: string) => {
    const updatedFiles = files.filter((file) => file.id !== fileId);
    setFiles(updatedFiles);

    if (activeFileId === fileId) {
      if (updatedFiles.length > 0) {
        setActiveFileId(updatedFiles[0].id);
        setContent(updatedFiles[0].content);
      } else {
        setActiveFileId(null);
        setContent("");
      }
    }
  };

  const handleRenameFile = (fileId: string, newTitle: string) => {
    const updatedFiles = files.map((file) =>
      file.id === fileId
        ? { ...file, title: newTitle, lastModified: new Date() }
        : file,
    );
    setFiles(updatedFiles);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    if (activeFileId) {
      const updatedFiles = files.map((file) =>
        file.id === activeFileId
          ? { ...file, content: e.target.value, lastModified: new Date() }
          : file,
      );
      setFiles(updatedFiles);
    }
  };

  const handleSave = () => {
    if (activeFileId) {
      setIsSaving(true);

      // Simulate saving with a slight delay
      setTimeout(() => {
        setIsSaving(false);
      }, 800);
    }
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col relative">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h1 className="text-lg font-medium">Lyric Editor</h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={handleSave}
          disabled={!activeFileId}
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        <NavigationSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          files={files}
          activeFileId={activeFileId}
          onFileSelect={setActiveFileId}
          onFileCreate={handleCreateFile}
          onFileDelete={handleDeleteFile}
          onFileRename={handleRenameFile}
        />

        {/* Editor Area */}
        <motion.div
          className="flex-1 p-4 lg:p-6 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ marginLeft: sidebarOpen ? "16rem" : 0 }}
        >
          {activeFileId ? (
            <div className="h-full flex flex-col">
              <h2 className="text-xl font-medium mb-4">
                {files.find((file) => file.id === activeFileId)?.title}
              </h2>
              <Textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing your lyrics here..."
                className="flex-1 resize-none text-lg leading-relaxed p-4 focus-visible:ring-1 bg-card"
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <h2 className="text-xl font-medium mb-2">No file selected</h2>
              <p className="mb-4">
                Create a new file or select an existing one to start writing
              </p>
              <Button onClick={handleCreateFile}>Create New File</Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
