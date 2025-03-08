"use client";

import { useState, useEffect, useRef } from "react";
import { NavigationSidebar, LyricFile } from "./navigation-sidebar";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import {
  Save,
  FileText,
  Lightbulb,
  Pen,
  X,
  Plus,
  Trash,
  Pencil,
  FileText as FileText2,
  PanelLeft,
} from "lucide-react";

interface BrainstormNote {
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
}

interface DrawingPoint {
  x: number;
  y: number;
}

interface DrawingPath {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
}

export function LyricEditor() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [files, setFiles] = useState<LyricFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("write");
  const [brainstormNotes, setBrainstormNotes] = useState<BrainstormNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const [penWidth, setPenWidth] = useState(2);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brainstormContainerRef = useRef<HTMLDivElement>(null);

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

    // Load brainstorm notes
    const savedNotes = localStorage.getItem("brainstormNotes");
    if (savedNotes) {
      try {
        setBrainstormNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error("Error parsing saved notes:", error);
      }
    }

    // Load drawing paths
    const savedPaths = localStorage.getItem("drawingPaths");
    if (savedPaths) {
      try {
        setDrawingPaths(JSON.parse(savedPaths));
      } catch (error) {
        console.error("Error parsing saved paths:", error);
      }
    }
  }, []);

  // Save files to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("lyricFiles", JSON.stringify(files));
  }, [files]);

  // Save brainstorm notes to localStorage
  useEffect(() => {
    localStorage.setItem("brainstormNotes", JSON.stringify(brainstormNotes));
  }, [brainstormNotes]);

  // Save drawing paths to localStorage
  useEffect(() => {
    localStorage.setItem("drawingPaths", JSON.stringify(drawingPaths));
  }, [drawingPaths]);

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

  // Draw paths on canvas when they change
  useEffect(() => {
    if (activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw all saved paths
        drawingPaths.forEach((path) => {
          if (path.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(path.points[0].x, path.points[0].y);
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.width;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            for (let i = 1; i < path.points.length; i++) {
              ctx.lineTo(path.points[i].x, path.points[i].y);
            }

            ctx.stroke();
          }
        });

        // Draw current path
        if (currentPath.length > 0) {
          ctx.beginPath();
          ctx.moveTo(currentPath[0].x, currentPath[0].y);
          ctx.strokeStyle = penColor;
          ctx.lineWidth = penWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          for (let i = 1; i < currentPath.length; i++) {
            ctx.lineTo(currentPath[i].x, currentPath[i].y);
          }

          ctx.stroke();
        }
      }
    }
  }, [drawingPaths, currentPath, activeTab, penColor, penWidth]);

  // Resize canvas when tab changes to draw
  useEffect(() => {
    if (activeTab === "draw" && canvasRef.current) {
      const resizeCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const container = canvas.parentElement;
          if (container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
          }
        }
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, [activeTab]);

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

  const addBrainstormNote = () => {
    if (newNoteContent.trim()) {
      const colors = ["#FFC107", "#4CAF50", "#2196F3", "#9C27B0", "#F44336"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      // Calculate a random position within the container
      const containerRect =
        brainstormContainerRef.current?.getBoundingClientRect();
      const maxX = containerRect ? containerRect.width - 200 : 400;
      const maxY = containerRect ? containerRect.height - 200 : 300;

      const randomX = Math.max(20, Math.floor(Math.random() * maxX));
      const randomY = Math.max(20, Math.floor(Math.random() * maxY));

      const newNote: BrainstormNote = {
        id: uuidv4(),
        content: newNoteContent,
        color: randomColor,
        position: { x: randomX, y: randomY },
      };

      setBrainstormNotes([...brainstormNotes, newNote]);
      setNewNoteContent("");
      setIsAddingNote(false);
    }
  };

  const deleteNote = (id: string) => {
    setBrainstormNotes(brainstormNotes.filter((note) => note.id !== id));
  };

  const updateNotePosition = (
    id: string,
    newPosition: { x: number; y: number },
  ) => {
    setBrainstormNotes(
      brainstormNotes.map((note) =>
        note.id === id ? { ...note, position: newPosition } : note,
      ),
    );
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setCurrentPath([{ x, y }]);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setCurrentPath([...currentPath, { x, y }]);
    }
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath.length > 0) {
      const newPath: DrawingPath = {
        id: uuidv4(),
        points: currentPath,
        color: penColor,
        width: penWidth,
      };

      setDrawingPaths([...drawingPaths, newPath]);
      setCurrentPath([]);
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    setDrawingPaths([]);
    setCurrentPath([]);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
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

        <div className="flex items-center gap-2">
          {activeTab === "write" && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
            >
              <FileText2 className="h-4 w-4" />
              {showMarkdownPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          )}

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
        </div>
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
          className="flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ marginLeft: sidebarOpen ? "16rem" : 0 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <TabsList className="mx-4 mt-4 justify-start bg-muted/50">
              <TabsTrigger value="write" className="gap-2">
                <Pencil className="h-4 w-4" />
                Write
              </TabsTrigger>
              <TabsTrigger value="brainstorm" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                Brainstorm
              </TabsTrigger>
              <TabsTrigger value="draw" className="gap-2">
                <Pen className="h-4 w-4" />
                Draw
              </TabsTrigger>
            </TabsList>

            {/* Write Tab */}
            <TabsContent value="write" className="flex-1 p-4 overflow-hidden">
              {activeFileId ? (
                <div className="h-full flex flex-col">
                  <h2 className="text-xl font-medium mb-4">
                    {files.find((file) => file.id === activeFileId)?.title}
                  </h2>

                  <div className="flex-1 flex gap-4 overflow-hidden">
                    <div
                      className={`flex-1 ${showMarkdownPreview ? "w-1/2" : "w-full"} overflow-hidden`}
                    >
                      <Textarea
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Start writing your lyrics here... (Markdown supported)"
                        className="h-full resize-none text-lg leading-relaxed p-4 focus-visible:ring-1 bg-card"
                      />
                    </div>

                    {showMarkdownPreview && (
                      <div className="flex-1 w-1/2 overflow-auto bg-card rounded-md p-4 border border-border">
                        <div>
                          <ReactMarkdown className="prose dark:prose-invert max-w-none">
                            {content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
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
            </TabsContent>

            {/* Brainstorm Tab */}
            <TabsContent
              value="brainstorm"
              className="flex-1 p-4 overflow-hidden"
            >
              <div
                ref={brainstormContainerRef}
                className="h-full relative bg-muted/20 rounded-lg overflow-auto"
              >
                {/* Sticky add note button */}
                <div className="absolute top-4 right-4 z-10">
                  <Button
                    onClick={() => setIsAddingNote(true)}
                    className="rounded-full h-12 w-12"
                    size="icon"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>

                {/* Notes */}
                {brainstormNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    className="absolute p-4 rounded-md shadow-md w-60"
                    style={{
                      backgroundColor: note.color,
                      color: "#000",
                      top: note.position.y,
                      left: note.position.x,
                      zIndex: 5,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    drag
                    dragConstraints={brainstormContainerRef}
                    onDragEnd={(_, info) => {
                      const newPosition = {
                        x: note.position.x + info.offset.x,
                        y: note.position.y + info.offset.y,
                      };
                      updateNotePosition(note.id, newPosition);
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-70 hover:opacity-100"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                    <p className="whitespace-pre-wrap text-sm">
                      {note.content}
                    </p>
                  </motion.div>
                ))}

                {/* Add note dialog */}
                <AnimatePresence>
                  {isAddingNote && (
                    <motion.div
                      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-card p-6 rounded-lg shadow-lg w-96 relative"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => setIsAddingNote(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>

                        <h3 className="text-lg font-medium mb-4">
                          Add Brainstorm Note
                        </h3>

                        <Textarea
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder="Write your idea here..."
                          className="min-h-[120px] mb-4"
                          autoFocus
                        />

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsAddingNote(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={addBrainstormNote}>Add Note</Button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty state */}
                {brainstormNotes.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mb-4 opacity-50" />
                    <h2 className="text-xl font-medium mb-2">
                      No brainstorm notes yet
                    </h2>
                    <p className="mb-4">
                      Add notes to brainstorm ideas for your lyrics
                    </p>
                    <Button onClick={() => setIsAddingNote(true)}>
                      Add First Note
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Draw Tab */}
            <TabsContent value="draw" className="flex-1 p-4 overflow-hidden">
              <div className="h-full flex flex-col">
                {/* Drawing tools */}
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Color:</label>
                    <input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="h-8 w-8 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Width:</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={penWidth}
                      onChange={(e) => setPenWidth(parseInt(e.target.value))}
                      className="w-24"
                    />
                  </div>

                  <Button variant="outline" size="sm" onClick={clearCanvas}>
                    Clear Canvas
                  </Button>
                </div>

                {/* Canvas */}
                <div className="flex-1 bg-card rounded-md border border-border overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
