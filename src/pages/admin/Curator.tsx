import React, { useState } from "react";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import { GripVertical, Save, RefreshCw, Eye } from "lucide-react";
import AdminLayout from "./AdminLayout";

// Mock data representing your current shop products
const INITIAL_PRODUCTS = [
  { id: "1", title: "Silent River", price: "$1,200", image: "/web/AL1.jpg", category: "Original" },
  { id: "2", title: "Valley Mist", price: "$950", image: "/web/AL3.jpg", category: "Original" },
  { id: "3", title: "Distant Peaks", price: "$45", image: "/web/AL4.jpg", category: "Print" },
  { id: "4", title: "Morning Light", price: "$1,100", image: "/web/AL5.jpg", category: "Original" },
  { id: "5", title: "Forest Study", price: "$800", image: "/web/AL7.jpg", category: "Original" },
  { id: "6", title: "Golden Hour", price: "$35", image: "/web/Chilliwack%20River%20Plein%20Air.jpg", category: "Print" },
];

export default function Curator() {
  const [items, setItems] = useState(INITIAL_PRODUCTS);
  const [isSaving, setIsSaving] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call to Airtable
    setTimeout(() => {
      setIsSaving(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }, 1200);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif mb-2">Visual Curator</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Drag and drop your paintings to change their order in the shop. 
            The first 6 items will also appear in your homepage "Selected Works" section.
          </p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setItems(INITIAL_PRODUCTS)}
            className="flex items-center gap-2 px-6 py-3 border border-border text-[10px] tracking-[0.2em] uppercase hover:bg-card transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-background text-[10px] tracking-[0.2em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <Reorder.Group 
        axis="y" 
        values={items} 
        onReorder={setItems}
        className="space-y-4"
      >
        {items.map((item, index) => (
          <Reorder.Item 
            key={item.id} 
            value={item}
            className="group"
          >
            <motion.div 
              className={`
                bg-background border border-border p-4 flex items-center gap-6 
                hover:border-primary transition-colors cursor-grab active:cursor-grabbing
                shadow-[0_4px_20px_rgb(0,0,0,0.02)]
              `}
              whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
            >
              <div className="text-[10px] font-medium text-muted-foreground w-6">
                {String(index + 1).padStart(2, '0')}
              </div>
              
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              
              <div className="w-16 h-16 bg-card flex-shrink-0 overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150'}
                />
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-medium">{item.title}</h3>
                <div className="flex gap-3 items-center mt-1">
                  <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 bg-card text-muted-foreground border border-border">
                    {item.category}
                  </span>
                  <span className="text-xs text-primary font-medium">{item.price}</span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-8 px-8  h-12">
                <div className="text-center">
                  <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-0.5">Views</p>
                  <p className="text-sm font-medium">1.2k</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-0.5">Clicks</p>
                  <p className="text-sm font-medium">84</p>
                </div>
              </div>

              <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Persistence Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 right-12 bg-secondary text-background px-8 py-4 text-[10px] tracking-[0.2em] uppercase shadow-2xl z-50"
          >
            Sort order synced successfully
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
