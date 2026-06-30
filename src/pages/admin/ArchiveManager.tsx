import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useArchive, ArchiveRecord } from "../../hooks/useArchive";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Plus, Expand, Trash2, Search, SlidersHorizontal, Image as ImageIcon, ChevronDown, Check, X, LayoutGrid, List, Smartphone, GripVertical, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from "framer-motion";

const STATUS_OPTIONS = ["Available", "Sold", "Archive", "Hide", "Hold"];
const MEDIUM_OPTIONS = ["Watercolor", "Oil", "Acrylic", "Ink", "Digital", "Mixed Media", "Graphite", "Charcoal"];
const CATEGORY_OPTIONS = ["Original", "Print", "Sketch", "Study", "Other"];
const SERIES_OPTIONS = [
  "City Vingettes",
  "Iterations on Local Ecology",
  "Figurative",
  "Objects",
  "Abstract",
  "Drawing",
  "Commissions",
  "PleinAir experiments",
  "Aatman",
  "Instructional demo"
];

// Helper for pill colors
const getPillColor = (value: string | null) => {
  if (!value) return "bg-gray-100 text-gray-800";
  switch (value.toLowerCase()) {
    case "available": return "bg-green-100 text-green-800";
    case "sold": return "bg-red-100 text-red-800";
    case "archive": return "bg-purple-100 text-purple-800";
    case "hide": return "bg-gray-100 text-gray-500";
    case "watercolor": return "bg-blue-100 text-blue-800";
    case "oil": return "bg-amber-100 text-amber-800";
    case "original": return "bg-emerald-100 text-emerald-800";
    case "print": return "bg-cyan-100 text-cyan-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const MultiSelect = ({ options, selected, onChange, onBlur }: { options: string[], selected: string[], onChange: (val: string[]) => void, onBlur: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsOpen(false);
          onBlur();
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onBlur]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className="w-full min-h-[28px] bg-white border rounded px-2 py-1 text-xs cursor-pointer flex flex-wrap gap-1 items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 && <span className="text-gray-400">Select...</span>}
        {selected.map(s => (
          <span key={s} className="bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
            {s}
            <X className="w-3 h-3 hover:text-red-500" onClick={(e) => {
              e.stopPropagation();
              const newVal = selected.filter(x => x !== s);
              onChange(newVal);
            }} />
          </span>
        ))}
      </div>
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-48 max-h-64 overflow-y-auto bg-white border shadow-xl rounded-md py-1">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs">
              <input 
                type="checkbox" 
                checked={selected.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selected, opt]);
                  } else {
                    onChange(selected.filter(x => x !== opt));
                  }
                }}
                className="rounded text-primary"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const SortableRow = ({ record, index, getPillColor, setExpandedRecord, updateRecord, setRecords }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: record.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, opacity: isDragging ? 0.5 : 1, position: isDragging ? 'relative' : 'static' as any };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-100 hover:bg-gray-50/50 group bg-white">
      <td className="px-4 py-2 text-gray-400 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4" />
      </td>
      <td className="px-4 py-2">
        <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden cursor-pointer" onClick={() => setExpandedRecord(record)}>
          {record.thumbnail ? (
            <img src={record.thumbnail} alt={record.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-300 m-3" />
          )}
        </div>
      </td>
      <td className="px-4 py-2 font-medium">
        <input 
          className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-1 py-1"
          value={record.name}
          onChange={(e) => {
            const val = e.target.value;
            setRecords((prev: ArchiveRecord[]) => prev.map(r => r.id === record.id ? { ...r, name: val } : r));
          }}
          onBlur={(e) => updateRecord(record.id, 'name', e.target.value)}
        />
      </td>
      <td className="px-4 py-2">
        <select
          className={`text-xs font-semibold px-2 py-1 rounded-full outline-none appearance-none cursor-pointer border border-transparent hover:border-gray-300 ${getPillColor(record.status)}`}
          value={record.status}
          onChange={(e) => updateRecord(record.id, 'status', e.target.value)}
        >
          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <select
          className={`text-xs font-semibold px-2 py-1 rounded-full outline-none appearance-none cursor-pointer border border-transparent hover:border-gray-300 ${getPillColor(record.medium)}`}
          value={record.medium || ""}
          onChange={(e) => updateRecord(record.id, 'medium', e.target.value)}
        >
          <option value="">None</option>
          {MEDIUM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <select
          className={`text-xs font-semibold px-2 py-1 rounded-full outline-none appearance-none cursor-pointer border border-transparent hover:border-gray-300 ${getPillColor(record.category)}`}
          value={record.category || ""}
          onChange={(e) => updateRecord(record.id, 'category', e.target.value)}
        >
          <option value="">None</option>
          {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <MultiSelect 
          options={SERIES_OPTIONS}
          selected={record.series || []}
          onChange={(val: string[]) => {
            setRecords((prev: ArchiveRecord[]) => prev.map(r => r.id === record.id ? { ...r, series: val } : r));
            updateRecord(record.id, 'series', val);
          }}
          onBlur={() => {}}
        />
      </td>
      <td className="px-4 py-2">
        <input 
          className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-1 py-1"
          value={record.year || ""}
          onChange={(e) => {
            const val = e.target.value;
            setRecords((prev: ArchiveRecord[]) => prev.map(r => r.id === record.id ? { ...r, year: val } : r));
          }}
          onBlur={(e) => updateRecord(record.id, 'year', e.target.value)}
        />
      </td>
      <td className="px-4 py-2 text-center">
        <input 
          type="checkbox" 
          checked={record.artSupplyPrint} 
          onChange={(e) => updateRecord(record.id, 'artSupplyPrint', e.target.checked)}
          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
        />
      </td>
      <td className="px-4 py-2 text-center">
        <input 
          type="checkbox" 
          checked={record.pinterestPublished} 
          onChange={(e) => updateRecord(record.id, 'pinterestPublished', e.target.checked)}
          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
        />
      </td>
      <td className="px-4 py-2">
        <button 
          onClick={() => setExpandedRecord(record)}
          className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
        >
          <Expand className="w-4 h-4" /> <span className="text-xs">Expand</span>
        </button>
      </td>
    </tr>
  );
};

const SortableTile = ({ record, getPillColor, setExpandedRecord }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: record.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, opacity: isDragging ? 0.5 : 1 };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="group relative bg-white border rounded-lg overflow-hidden hover:shadow-md transition-all"
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
        {record.thumbnail ? (
          <img src={record.thumbnail} alt={record.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-gray-400" />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <button onClick={() => setExpandedRecord(record)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors">
            <Expand className="w-6 h-6" />
          </button>
          <div className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm cursor-grab active:cursor-grabbing transition-colors" {...attributes} {...listeners}>
            <GripVertical className="w-6 h-6" />
          </div>
        </div>
      </div>
      <div className="p-3 cursor-pointer" onClick={() => setExpandedRecord(record)}>
        <p className="font-medium text-sm truncate" title={record.name}>{record.name}</p>
        <div className="flex justify-between items-center mt-1">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getPillColor(record.status)}`}>
            {record.status}
          </span>
          <span className="text-xs text-gray-500">{record.year}</span>
        </div>
      </div>
    </div>
  );
};

export default function ArchiveManager() {
  const [, setLocation] = useLocation();
  const { archive, loading } = useArchive({ includeHidden: true });
      const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [search, setSearch] = useState("");
  const [expandedRecord, setExpandedRecord] = useState<ArchiveRecord | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewType, setViewType] = useState<"details" | "tiles">("details");

  useEffect(() => {
    if (!loading) {
      setRecords(archive);
    }
  }, [archive, loading]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = records.findIndex(r => r.id === active.id);
      const newIndex = records.findIndex(r => r.id === over.id);
      const newRecords = arrayMove(records, oldIndex, newIndex);
      
      setRecords(newRecords);

      // Batch update sort_order to Supabase
      try {
        const updates = newRecords.map((r, i) => supabase.from('Archive').update({ sort_order: i }).eq('id', r.id));
        await Promise.all(updates);
      } catch (err) {
        console.error('Failed to save order', err);
      }
    }
  };

  const updateRecord = async (id: string, field: string, value: any) => {
    // Optimistic UI update
    setRecords((prev) => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

    const fieldMapping: Record<string, string> = {
      name: 'Name',
      image: 'Image_url',
      thumbnail: 'Thumbnail_url',
      filmstrip: 'Filmstrip_url',
      additionalImages: 'Additional_Images',
      pinterestPublished: 'Pinterest'
    };
    
    const dbColumn = fieldMapping[field] || (field.charAt(0).toUpperCase() + field.slice(1));

    try {
      const { error } = await supabase
        .from('Archive')
        .update({ [dbColumn]: value })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Updated ${field}`);
    } catch (err: any) {
      toast.error(`Failed to update: ${err.message}`);
      // Revert optimistic update by refetching or just letting useArchive reload
      // A robust implementation would trigger a refetch here.
    }
  };

  const handleFileUpload = async (file: File, recordId: string) => {
    try {
      setUploading(true);
      toast.info("Preparing upload...");

      // Get presigned URL
      const res = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      });
      
      const { signedUrl, publicUrl } = await res.json();
      if (!signedUrl) throw new Error("Failed to get upload URL");

      toast.info("Uploading image...");
      
      // Upload to R2
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });
      
      if (!uploadRes.ok) throw new Error("Failed to upload file to storage");

      // Update recordawait updateRecord(recordId, 'image', publicUrl); await updateRecord(recordId, 'thumbnail', publicUrl); if (expandedRecord?.id === recordId) { setExpandedRecord({ ...expandedRecord, image: publicUrl, thumbnail: publicUrl }); }
      
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this artwork? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from('Archive').delete().eq('id', id);
      if (error) throw error;
      setRecords(records.filter(r => r.id !== id));
      if (expandedRecord?.id === id) {
        setExpandedRecord(null);
        setShowQR(false);
      }
      toast.success("Artwork deleted successfully");
    } catch (err: any) {
      toast.error(`Error deleting: ${err.message}`);
    }
  };

  const filteredRecords = records.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[100vw] overflow-hidden bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Archive Manager</h1>
          <p className="text-sm text-gray-500">{records.length} records found</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-gray-200 p-1 rounded-md">
            <button 
              onClick={() => setViewType("details")}
              className={`p-1.5 rounded-sm transition-colors ${viewType === "details" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              title="Details View"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewType("tiles")}
              className={`p-1.5 rounded-sm transition-colors ${viewType === "tiles" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              title="Tiles View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search artworks..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <button 
            onClick={() => setLocation('/admin/new-artwork')}
            className={`flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md transition-opacity text-sm font-medium hover:opacity-90 cursor-pointer`}
          >
            <Plus className="w-4 h-4" /> Add Artwork
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-auto h-[calc(100vh-160px)] p-4">
          {viewType === "tiles" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <SortableContext items={filteredRecords.map(r => r.id)} strategy={rectSortingStrategy}>
              {filteredRecords.map((record) => (
                <SortableTile key={record.id} record={record} getPillColor={getPillColor} setExpandedRecord={setExpandedRecord} />
              ))}
            </SortableContext>
          </div>
        ) : (
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10 border-b">
            <tr>
              <th className="w-12 px-4 py-3 text-center">#</th>
              <th className="w-24 px-4 py-3">Image</th>
              <th className="w-64 px-4 py-3">Name</th>
              <th className="w-32 px-4 py-3">Status</th>
              <th className="w-32 px-4 py-3">Medium</th>
              <th className="w-32 px-4 py-3">Category</th>
              <th className="w-48 px-4 py-3">Series</th>
              <th className="w-24 px-4 py-3">Year</th>
              <th className="w-24 px-4 py-3 text-center">Print</th>
              <th className="w-24 px-4 py-3 text-center">Pinterest</th>
              <th className="px-4 py-3">Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext items={filteredRecords.map(r => r.id)} strategy={verticalListSortingStrategy}>
              {filteredRecords.map((record, index) => (
                <SortableRow key={record.id} record={record} index={index} getPillColor={getPillColor} setExpandedRecord={setExpandedRecord} updateRecord={updateRecord} setRecords={setRecords} />
              ))}
            </SortableContext>
          </tbody>
        </table>
        )}
        {filteredRecords.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-500">No records found.</div>
        )}
        </div>
      </DndContext>

      {/* Slide-out Drawer */}
      <AnimatePresence>
        {expandedRecord && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-50 flex justify-end"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                if (isNewUnsavedRecord && !window.confirm("Discard unsaved artwork?")) return;
                setExpandedRecord(null);
                setShowQR(false);
                setIsNewUnsavedRecord(false);
              }
            }}
          >
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col"
            >
              <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="font-semibold text-lg">{isNewUnsavedRecord ? "New Artwork" : expandedRecord.name}</h2>
                <div className="flex items-center gap-2">
                  {isNewUnsavedRecord ? (
                    <button 
                      onClick={saveNewRecord} 
                      disabled={isAdding}
                      className={`flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md transition-opacity text-sm font-medium ${isAdding ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}
                    >
                      {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {isAdding ? "Saving..." : "Save Artwork"}
                    </button>
                  ) : (
                    <button onClick={() => deleteRecord(expandedRecord.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete Artwork">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={() => {
                    if (isNewUnsavedRecord && !window.confirm("Discard unsaved artwork?")) return;
                    setExpandedRecord(null); 
                    setShowQR(false); 
                    setIsNewUnsavedRecord(false);
                  }} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6 flex-1">
                {/* Image Upload Area */}
                <div className="space-y-2">
                  <div className="relative aspect-[4/3] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden group cursor-pointer">
                    {expandedRecord.image ? (
                      <img src={expandedRecord.image} alt={expandedRecord.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span>Drag & Drop or Click to Upload</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium">Replace Image</span>
                    </div>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0], expandedRecord.id);
                      }}
                    />
                  </div>
                  {isNewUnsavedRecord ? (
                    <div className="w-full py-2 px-3 text-xs text-amber-600 bg-amber-50 rounded border border-amber-100 flex items-center justify-center text-center">
                      Save this artwork first to enable mobile photo upload.
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => setShowQR(!showQR)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary hover:bg-primary/5 rounded border border-primary/20 transition-colors"
                      >
                        <Smartphone className="w-4 h-4" /> {showQR ? "Hide Mobile Upload" : "Upload from Phone"}
                      </button>
                      {showQR && (
                        <div className="bg-white border rounded-lg p-6 flex flex-col items-center justify-center gap-3 animate-in slide-in-from-top-2">
                          <p className="text-sm text-gray-500 text-center mb-2 font-medium">Scan with iPhone to upload instantly</p>
                          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                            <QRCodeSVG value={`${window.location.origin}/admin/mobile-upload/${expandedRecord.id}`} size={160} />
                          </div>
                          <a href={`${window.location.origin}/admin/mobile-upload/${expandedRecord.id}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-2 flex items-center gap-1">
                            Open link on this device
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                    <input 
                      type="text" 
                      value={expandedRecord.name}
                      onChange={(e) => setExpandedRecord({ ...expandedRecord, name: e.target.value })}
                      onBlur={(e) => updateRecord(expandedRecord.id, 'name', e.target.value)}
                      className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                      <select 
                        value={expandedRecord.status}
                        onChange={(e) => {
                          setExpandedRecord({ ...expandedRecord, status: e.target.value });
                          updateRecord(expandedRecord.id, 'status', e.target.value);
                        }}
                        className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-primary outline-none"
                      >
                        {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Medium</label>
                      <select 
                        value={expandedRecord.medium || ""}
                        onChange={(e) => {
                          setExpandedRecord({ ...expandedRecord, medium: e.target.value });
                          updateRecord(expandedRecord.id, 'medium', e.target.value);
                        }}
                        className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">None</option>
                        {MEDIUM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                      <input 
                        type="number"
                        value={expandedRecord.year || ""}
                        onChange={(e) => setExpandedRecord({ ...expandedRecord, year: e.target.value })}
                        onBlur={(e) => updateRecord(expandedRecord.id, 'year', e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Series</label>
                    <MultiSelect 
                      options={SERIES_OPTIONS}
                      selected={expandedRecord.series || []}
                      onChange={(val: string[]) => {
                        setExpandedRecord({ ...expandedRecord, series: val });
                        updateRecord(expandedRecord.id, 'series', val);
                      }}
                      onBlur={() => {}}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                    <textarea 
                      value={expandedRecord.notes || ""}
                      onChange={(e) => setExpandedRecord({ ...expandedRecord, notes: e.target.value })}
                      onBlur={(e) => updateRecord(expandedRecord.id, 'notes', e.target.value)}
                      className="w-full p-2 border rounded text-sm min-h-[100px] focus:ring-1 focus:ring-primary outline-none"
                      placeholder="Add any internal notes here..."
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={expandedRecord.artSupplyPrint}
                        onChange={(e) => {
                          setExpandedRecord({ ...expandedRecord, artSupplyPrint: e.target.checked });
                          updateRecord(expandedRecord.id, 'artSupplyPrint', e.target.checked);
                        }}
                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Art Supply Print</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={expandedRecord.pinterestPublished}
                        onChange={(e) => {
                          setExpandedRecord({ ...expandedRecord, pinterestPublished: e.target.checked });
                          updateRecord(expandedRecord.id, 'pinterestPublished', e.target.checked);
                        }}
                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Pinterest</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={expandedRecord.featured || false}
                        onChange={(e) => {
                          setExpandedRecord({ ...expandedRecord, featured: e.target.checked });
                          updateRecord(expandedRecord.id, 'featured', e.target.checked);
                        }}
                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Featured</span>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
