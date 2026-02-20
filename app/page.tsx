"use client";
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Epub from "epubjs";
import type { Rendition } from "epubjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Upload } from "lucide-react";

export default function Home() {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [rendition, setRendition] = useState<Rendition | null>(null);
  const [location, setLocation] = useState<string>("");
  const [error, setError] = useState<string>("");
  // Touch state for swipe navigation
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Touch event handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null && rendition) {
      const delta = touchStartX.current - touchEndX.current;
      if (Math.abs(delta) > 50) {
        if (delta > 0) {
          // Swipe left: next page
          rendition.next();
        } else {
          // Swipe right: previous page
          rendition.prev();
        }
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Keyboard navigation for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!rendition) return;
      if (e.key === "ArrowLeft") {
        rendition.prev();
      } else if (e.key === "ArrowRight") {
        rendition.next();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rendition]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const result = event.target?.result;
        if (result == null) {
          setError("Failed to read file data.");
          return;
        }
        const epub = Epub(result);
        setError("");
        setTimeout(() => {
          if (viewerRef.current) {
            epub.renderTo(viewerRef.current, { width: "100%", height: "100%" });
            epub.ready.then(() => {
              // Always inject white background and black text for EPUB content
              epub.rendition.themes.default({
                body: {
                  color: "#111 !important",
                  background: "#fff !important"
                },
                p: {
                  color: "#111 !important",
                  background: "#fff !important"
                },
                h1: { color: "#111 !important" },
                h2: { color: "#111 !important" },
                h3: { color: "#111 !important" },
                h4: { color: "#111 !important" },
                h5: { color: "#111 !important" },
                h6: { color: "#111 !important" }
              });
              epub.rendition.display();
              setRendition(epub.rendition);
              epub.rendition.on("relocated", (loc: { start?: { displayed?: { page?: string } } }) => {
                setLocation(loc?.start?.displayed?.page || "");
              });
            });
          }
        }, 100);
      } catch {
        setError("Failed to load EPUB file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black p-0 sm:p-0">
      <motion.div
        className="w-full h-full flex flex-col items-center p-0 sm:p-4 sm:pt-6 border-none sm:border border-zinc-200 dark:border-zinc-800 sm:rounded-xl shadow-none sm:shadow-sm bg-white dark:bg-zinc-950 relative"
        style={{ minHeight: '100vh', minWidth: '100vw' }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.22 }}
      >
        <motion.h1
          className="text-xl font-bold mb-4 text-center text-black dark:text-white tracking-tight"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, type: 'spring' }}
        >
          EPUB Reader
        </motion.h1>
        <div className="absolute top-3 right-3">
          <Input
            id="epub-upload"
            type="file"
            accept=".epub"
            onChange={handleFile}
            className="w-7 h-7 p-0 border-none bg-transparent file:w-7 file:h-7 file:p-0 file:bg-transparent file:border-none file:opacity-0 cursor-pointer"
            title="Select an EPUB file"
            aria-label="Upload EPUB file"
            style={{ opacity: 0, position: 'absolute', inset: 0, zIndex: 2 }}
          />
          <Button size="icon-xs" variant="outline" asChild className="bg-white dark:bg-black border-zinc-200 dark:border-zinc-800">
            <label htmlFor="epub-upload" className="cursor-pointer flex items-center justify-center">
              <Upload className="size-4 text-black dark:text-white" />
            </label>
          </Button>
        </div>
        {error && <motion.div className="text-red-500 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>}
        <motion.div
          ref={viewerRef}
          className="w-full h-[70vh] min-h-75 border border-zinc-200 rounded-lg bg-white mb-2 overflow-auto sm:w-full sm:h-[80vh] sm:min-h-125 sm:rounded-lg sm:border sm:bg-white shadow-md"
          style={{ height: '80vh', minHeight: 500 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        ></motion.div>
        {rendition && (
          <motion.div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            Page: {location || "-"}
          </motion.div>
        )}
        {/* Bottom navigation bar */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-full shadow-md px-4 py-2">
          <Button
            size="icon-xs"
            variant="outline"
            onClick={() => rendition && rendition.prev()}
            disabled={!rendition}
            aria-label="Previous Page"
            className="bg-white dark:bg-black border-zinc-200 dark:border-zinc-800"
          >
            <ArrowLeft className="size-4 text-black dark:text-white" />
          </Button>
          <Button
            size="icon-xs"
            variant="outline"
            onClick={() => rendition && rendition.next()}
            disabled={!rendition}
            aria-label="Next Page"
            className="bg-white dark:bg-black border-zinc-200 dark:border-zinc-800"
          >
            <ArrowRight className="size-4 text-black dark:text-white" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
