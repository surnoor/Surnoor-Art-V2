import React, { useState } from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, Move, RotateCcw, Save, Trash2, Maximize } from "lucide-react";
import AdminLayout from "./AdminLayout";

export default function Editor() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedProduct, setSelectedProduct] = useState("Silent River");

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif mb-2">Preview Editor</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Select a painting and adjust the focal point. This determines how your artwork is framed in the shop thumbnails.
          </p>
        </div>

        <button 
          className="flex items-center gap-2 px-8 py-3 bg-primary text-background text-[10px] tracking-[0.2em] uppercase hover:opacity-90 transition-opacity"
        >
          <Save className="w-3 h-3" /> Save Preview
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Selection Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4 font-medium">Select Artwork</p>
          {["Silent River", "Valley Mist", "Distant Peaks", "Morning Light"].map((title) => (
            <div 
              key={title}
              onClick={() => setSelectedProduct(title)}
              className={`
                px-4 py-3 text-xs tracking-wider cursor-pointer border transition-all
                ${selectedProduct === title ? "bg-card border-primary text-primary" : "border-border hover:border-muted-foreground"}
              `}
            >
              {title}
            </div>
          ))}
        </div>

        {/* Editor Main */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border p-8 md:p-12 flex flex-col items-center">
            
            <div className="relative w-full aspect-square md:w-[500px] bg-background border border-border overflow-hidden cursor-move">
              {/* Overlay Grid */}
              <div className="absolute inset-0 z-10 pointer-events-none opacity-20 flex flex-col">
                <div className="flex-1 border-b border-white" />
                <div className="flex-1 border-b border-white" />
                <div className="flex-1" />
              </div>
              <div className="absolute inset-0 z-10 pointer-events-none opacity-20 flex">
                <div className="flex-1 border-r border-white" />
                <div className="flex-1 border-r border-white" />
                <div className="flex-1" />
              </div>

              {/* The Image */}
              <motion.img 
                src="/web/AL1.jpg" 
                alt="Product"
                className="w-full h-full object-cover origin-center"
                animate={{ 
                  scale: zoom,
                  x: pan.x,
                  y: pan.y
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onDrag={(e, info) => {
                  setPan({ x: pan.x + info.delta.x, y: pan.y + info.delta.y });
                }}
                drag
                dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
              />

              {/* Viewport Frame */}
              <div className="absolute inset-0 border-[40px] border-card/80 pointer-events-none z-20 shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]" />
            </div>

            {/* Controls */}
            <div className="mt-8 w-full max-w-[500px] flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => setZoom(z => Math.max(1, z - 0.1))} className="p-3 bg-background border border-border hover:bg-card transition-colors"><ZoomOut className="w-4 h-4" /></button>
                <div className="px-6 flex items-center bg-background border border-border text-[10px] tracking-widest font-medium uppercase italic">
                  Zoom: {Math.round(zoom * 100)}%
                </div>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-3 bg-background border border-border hover:bg-card transition-colors"><ZoomIn className="w-4 h-4" /></button>
              </div>

              <div className="flex gap-2">
                <button onClick={reset} className="p-3 bg-background border border-border hover:bg-card transition-colors flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-[10px] tracking-widest uppercase font-medium">Reset</span>
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-background border border-border text-[10px] text-muted-foreground uppercase tracking-[0.2em] italic">
              Tip: Drag the image inside the frame to adjust the focal point.
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
