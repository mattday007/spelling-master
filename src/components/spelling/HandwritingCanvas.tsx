"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { recogniseStrokes } from "@/lib/handwriting/recognise";

interface HandwritingCanvasProps {
  onRecognised: (text: string) => void;
  lexicon?: string[];
  disabled?: boolean;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

interface Stroke {
  points: Point[];
}

export function HandwritingCanvas({ onRecognised, disabled = false }: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
  const [text, setText] = useState("");
  const [recognising, setRecognising] = useState(false);
  const recogniseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  const getPoint = useCallback((e: React.TouchEvent | React.MouseEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
        time: Date.now(),
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
      time: Date.now(),
    };
  }, []);

  const drawStroke = useCallback((points: Point[], ctx: CanvasRenderingContext2D) => {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }, []);

  const redraw = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw guide line
    ctx.beginPath();
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 4]);
    const y = canvas.height * 0.7;
    ctx.moveTo(20, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw strokes
    for (const stroke of strokes) {
      drawStroke(stroke.points, ctx);
    }
    if (currentStroke) {
      drawStroke(currentStroke, ctx);
    }
  }, [strokes, currentStroke, getCtx, drawStroke]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    // Reset scale for drawing
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
  }, []);

  // Clear input when re-enabled (i.e. moving to next word)
  const prevDisabledRef = useRef(disabled);
  useEffect(() => {
    if (prevDisabledRef.current && !disabled) {
      clear();
    }
    prevDisabledRef.current = disabled;
  }, [disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePointerDown = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    const point = getPoint(e);
    setCurrentStroke([point]);
  }, [disabled, getPoint]);

  const handlePointerMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    setCurrentStroke((prev) => {
      if (!prev) return null;
      const point = getPoint(e);
      return [...prev, point];
    });
  }, [disabled, getPoint]);

  const handlePointerUp = useCallback(() => {
    setCurrentStroke((prev) => {
      if (!prev) return null;
      setStrokes((s) => [...s, { points: prev }]);
      return null;
    });
    if (recogniseTimeoutRef.current) clearTimeout(recogniseTimeoutRef.current);
  }, []);

  // Attach non-passive touch listeners so preventDefault() works on iOS.
  // This stops the stylus from triggering text selection, scrolling, or
  // accidentally selecting surrounding UI elements.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handlePointerDown(e as unknown as React.TouchEvent);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handlePointerMove(e as unknown as React.TouchEvent);
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handlePointerUp();
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  const clear = () => {
    setStrokes([]);
    setCurrentStroke(null);
    setText("");
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSubmit = async () => {
    if (text.trim()) {
      onRecognised(text.trim());
      return;
    }

    if (strokes.length > 0) {
      setRecognising(true);
      try {
        const canvas = canvasRef.current;
        const w = canvas?.width ?? 800;
        const h = canvas?.height ?? 400;
        const recognised = await recogniseStrokes(strokes, w, h);
        onRecognised(recognised || "");
      } catch (err) {
        console.warn("Handwriting recognition failed:", err);
        onRecognised("");
      } finally {
        setRecognising(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-3 select-none"
    >
      <div className="relative glass-card overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-48 sm:h-56 handwriting-canvas cursor-crosshair touch-none select-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
        />
        {strokes.length === 0 && !currentStroke && !recognising && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted/50 text-lg font-semibold">
              Write the word here or type below
            </p>
          </div>
        )}
        {recognising && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted text-lg font-semibold animate-pulse">
              Reading your writing...
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={disabled || recognising || (!text.trim() && strokes.length === 0)}
          className="w-14 h-14 rounded-full bg-green text-white flex items-center justify-center shadow-lg disabled:opacity-50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clear}
          disabled={disabled}
          className="w-14 h-14 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shadow disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
}
