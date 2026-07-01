import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useArchive, ArchiveRecord } from "../../hooks/useArchive";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Plus, Trash2, Search, SlidersHorizontal, Image as ImageIcon, ChevronDown, Check, X, LayoutGrid, List, Smartphone, GripVertical, Loader2, Sidebar, Filter, MoreHorizontal, Pencil } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "./AdminLayout";
import { getPillColor } from "./adminTokens";

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

// getPillColor is now imported from adminTokens

const MultiSelect = ({ options, selected, onChange, onBlur }: { options: string[], selected: string[], onChange: (val: string[]) => void, onBlur: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (isOpen) { setIsOpen(false); onBlur(); setQuery(""); }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onBlur]);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className="w-full min-h-[36px] bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-sm cursor-pointer flex flex-wrap gap-1 items-center transition-colors hover:border-zinc-300 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 && <span className="text-zinc-400 text-xs">Select series...</span>}
        {selected.map(s => (
          <span key={s} className="bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1">
            {s}
            <button onClick={(e) => { e.stopPropagation(); onChange(selected.filter(x => x !== s)); }} className="hover:text-red-500 transition-colors ml-0.5">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <ChevronDown className="w-3 h-3 text-zinc-400 ml-auto shrink-0" />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 top-full left-0 mt-1.5 w-56 bg-white border border-zinc-200 shadow-lg rounded-xl py-1.5 overflow-hidden"
          >
            <div className="px-2 pb-1.5">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-50 rounded-lg border border-zinc-200">
                <Search className="w-3 h-3 text-zinc-400 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Filter..."
                  className="bg-transparent text-[12px] outline-none w-full placeholder:text-zinc-400"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map(opt => {
                const checked = selected.includes(opt);
                return (
                  <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 cursor-pointer">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      checked ? "bg-zinc-900 border-zinc-900" : "border-zinc-300"
                    }`}>
                      {checked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <input type="checkbox" checked={checked} onChange={(e) => {
                      onChange(e.target.checked ? [...selected, opt] : selected.filter(x => x !== opt));
                    }} className="sr-only" />
                    <span className="text-[12px] text-zinc-700">{opt}</span>
                  </label>
                );
              })}
              {filtered.length === 0 && <p className="text-center text-xs text-zinc-400 py-4">No matches</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SkeletonRows = () => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <tr key={i} className="border-b border-zinc-100">
        <td className="px-3 py-3"><div className="w-4 h-4 bg-zinc-100 rounded animate-pulse" /></td>
        <td className="px-3 py-3"><div className="w-12 h-12 bg-zinc-100 rounded-lg animate-pulse" /></td>
        <td className="px-3 py-3"><div className="h-3.5 bg-zinc-100 rounded animate-pulse" style={{ width: `${60 + (i * 17) % 40}%` }} /></td>
        <td className="px-3 py-3"><div className="w-16 h-5 bg-zinc-100 rounded-full animate-pulse" /></td>
        <td className="px-3 py-3"><div className="w-20 h-5 bg-zinc-100 rounded-full animate-pulse" /></td>
        <td className="px-3 py-3"><div className="w-14 h-5 bg-zinc-100 rounded-full animate-pulse" /></td>
        <td className="px-3 py-3"><div className="w-24 h-5 bg-zinc-100 rounded animate-pulse" /></td>
        <td className="px-3 py-3"><div className="w-10 h-3.5 bg-zinc-100 rounded animate-pulse" /></td>
        <td className="px-3 py-3"><div className="w-5 h-5 bg-zinc-100 rounded animate-pulse mx-auto" /></td>
        <td className="px-3 py-3"><div className="w-5 h-5 bg-zinc-100 rounded animate-pulse mx-auto" /></td>
        <td className="px-3 py-3"><div className="w-6 h-6 bg-zinc-100 rounded animate-pulse" /></td>
      </tr>
    ))}
  </>
);

const SortableRow = ({ record, index, setExpandedRecord, updateRecord, setRecords }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: record.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, opacity: isDragging ? 0.5 : 1, position: isDragging ? 'relative' : 'static' as any };
  const isSelected = false;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onClick={() => setExpandedRecord(record)}
      className="border-b border-zinc-100 hover:bg-zinc-50/60 group bg-white cursor-pointer transition-colors duration-75"
    >
      <td className="px-2 py-1.5 align-middle text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing" {...attributes} {...listeners} onClick={e => e.stopPropagation()}>
        <GripVertical className="w-3 h-3" />
      </td>
      <td className="px-2 py-1.5" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-10 rounded bg-zinc-100 overflow-hidden border border-zinc-200/60 cursor-pointer" onClick={() => setExpandedRecord(record)}>
          {record.thumbnail ? (
            <img src={record.thumbnail} alt={record.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-zinc-300" /></div>
          )}
        </div>
      </td>
      <td className="px-2 py-1.5 align-middle max-w-[200px]">
        <p className="text-[13px] font-medium text-zinc-800 truncate">{record.name}</p>
      </td>
      <td className="px-2 py-1.5 align-middle" onClick={e => e.stopPropagation()}>
        <select
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full outline-none appearance-none cursor-pointer transition-colors ${getPillColor(record.status)}`}
          value={record.status}
          onChange={(e) => { e.stopPropagation(); updateRecord(record.id, 'status', e.target.value); }}
        >
          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </td>
      <td className="px-2 py-1.5 align-middle" onClick={e => e.stopPropagation()}>
        <select
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full outline-none appearance-none cursor-pointer transition-colors ${getPillColor(record.medium)}`}
          value={record.medium || ""}
          onChange={(e) => { e.stopPropagation(); updateRecord(record.id, 'medium', e.target.value); }}
        >
          <option value="">—</option>
          {MEDIUM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </td>
      <td className="px-2 py-1.5 align-middle" onClick={e => e.stopPropagation()}>
        <select
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full outline-none appearance-none cursor-pointer transition-colors ${getPillColor(record.category)}`}
          value={record.category || ""}
          onChange={(e) => { e.stopPropagation(); updateRecord(record.id, 'category', e.target.value); }}
        >
          <option value="">—</option>
          {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </td>
      <td className="px-2 py-1.5 align-middle max-w-[130px]" onClick={e => e.stopPropagation()}>
        <div className="flex gap-1 overflow-hidden">
          {(record.series || []).slice(0, 1).map((s: string) => (
            <span key={s} className="text-[10px] bg-zinc-100 text-zinc-600 border border-zinc-200/60 px-1.5 py-0 rounded whitespace-nowrap overflow-hidden text-ellipsis max-w-[110px] block">{s}</span>
          ))}
          {(record.series || []).length > 1 && (
            <span className="text-[10px] text-zinc-400 whitespace-nowrap">+{record.series.length - 1}</span>
          )}
        </div>
      </td>
      <td className="px-2 py-1.5 align-middle text-[13px] text-zinc-500">{record.year || "—"}</td>
      <td className="px-2 py-1.5 align-middle text-center" onClick={e => e.stopPropagation()}>
        <input 
          type="checkbox" 
          checked={record.artSupplyPrint} 
          onChange={(e) => updateRecord(record.id, 'artSupplyPrint', e.target.checked)}
          className="w-3.5 h-3.5 rounded border-zinc-300 cursor-pointer accent-zinc-900"
        />
      </td>
      <td className="px-2 py-1.5 align-middle text-center" onClick={e => e.stopPropagation()}>
        <input 
          type="checkbox" 
          checked={record.pinterestPublished} 
          onChange={(e) => updateRecord(record.id, 'pinterestPublished', e.target.checked)}
          className="w-3.5 h-3.5 rounded border-zinc-300 cursor-pointer accent-zinc-900"
        />
      </td>
      <td className="px-2 py-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); setExpandedRecord(record); }}
          className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
};

const SortableTile = ({ record, setExpandedRecord }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: record.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, opacity: isDragging ? 0.5 : 1 };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      onClick={() => setExpandedRecord(record)}
      className="group relative bg-white border border-zinc-200 rounded-xl overflow-hidden hover:shadow-md hover:border-zinc-300 transition-all cursor-pointer"
    >
      <div className="aspect-square bg-zinc-100 flex items-center justify-center relative">
        {record.thumbnail ? (
          <img src={record.thumbnail} alt={record.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-7 h-7 text-zinc-300" />
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <div
            className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm cursor-grab active:cursor-grabbing transition-colors"
            {...attributes} {...listeners}
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="w-5 h-5" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="font-medium text-[13px] text-zinc-800 truncate" title={record.name}>{record.name}</p>
        <div className="flex justify-between items-center mt-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getPillColor(record.status)}`}>
            {record.status}
          </span>
          <span className="text-[11px] text-zinc-400">{record.year}</span>
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
  const [showInspector, setShowInspector] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMedium, setFilterMedium] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [savedPulse, setSavedPulse] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Close filters dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setShowFilters(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Escape key to close inspector
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expandedRecord) { setExpandedRecord(null); setShowQR(false); }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [expandedRecord]);

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

  const renderInspectorForm = (record: ArchiveRecord) => {
    return (
      <div className="p-6 space-y-6 flex-1">
        {/* Image Upload Area */}
        <div className="space-y-2">
          <div className="relative aspect-[4/3] bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center overflow-hidden group cursor-pointer hover:border-zinc-400 transition-colors">
            {record.image ? (
              <img src={record.image} alt={record.name} className="w-full h-full object-contain" />
            ) : (
              <div className="text-zinc-400 flex flex-col items-center">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs">Drag & Drop or Click to Upload</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-medium text-xs">Replace Image</span>
            </div>
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0], record.id);
              }}
            />
          </div>
          <button 
            onClick={() => setShowQR(!showQR)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg border border-zinc-200 transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-zinc-500" /> {showQR ? "Hide Mobile Upload" : "Upload from Phone"}
          </button>
          {showQR && (
            <div className="bg-white border border-zinc-200 rounded-lg p-6 flex flex-col items-center justify-center gap-3 animate-in slide-in-from-top-2">
              <p className="text-sm text-zinc-500 text-center mb-2 font-medium">Scan with iPhone to upload instantly</p>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-zinc-100">
                <QRCodeSVG value={`${window.location.origin}/admin/mobile-upload/${record.id}`} size={160} />
              </div>
              <a href={`${window.location.origin}/admin/mobile-upload/${record.id}`} target="_blank" rel="noreferrer" className="text-xs text-zinc-600 hover:underline mt-2 flex items-center gap-1">
                Open link on this device
              </a>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Name</label>
            <input 
              type="text" 
              value={record.name}
              onChange={(e) => setExpandedRecord({ ...record, name: e.target.value })}
              onBlur={(e) => updateRecord(record.id, 'name', e.target.value)}
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-colors"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Status</label>
              <select 
                value={record.status}
                onChange={(e) => {
                  setExpandedRecord({ ...record, status: e.target.value });
                  updateRecord(record.id, 'status', e.target.value);
                }}
                className="w-full p-2 border border-zinc-200 rounded-lg text-sm focus:border-zinc-500 outline-none transition-colors bg-white"
              >
                {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Medium</label>
              <select 
                value={record.medium || ""}
                onChange={(e) => {
                  setExpandedRecord({ ...record, medium: e.target.value });
                  updateRecord(record.id, 'medium', e.target.value);
                }}
                className="w-full p-2 border border-zinc-200 rounded-lg text-sm focus:border-zinc-500 outline-none transition-colors bg-white"
              >
                <option value="">None</option>
                {MEDIUM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Year</label>
              <input 
                type="number"
                value={record.year || ""}
                onChange={(e) => setExpandedRecord({ ...record, year: e.target.value })}
                onBlur={(e) => updateRecord(record.id, 'year', e.target.value)}
                className="w-full p-2 border border-zinc-200 rounded-lg text-sm focus:border-zinc-500 outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Series</label>
            <MultiSelect 
              options={SERIES_OPTIONS}
              selected={record.series || []}
              onChange={(val: string[]) => {
                setExpandedRecord({ ...record, series: val });
                updateRecord(record.id, 'series', val);
              }}
              onBlur={() => {}}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Notes</label>
            <textarea 
              value={record.notes || ""}
              onChange={(e) => setExpandedRecord({ ...record, notes: e.target.value })}
              onBlur={(e) => updateRecord(record.id, 'notes', e.target.value)}
              className="w-full p-2.5 border border-zinc-200 rounded-lg text-sm min-h-[100px] focus:border-zinc-500 outline-none transition-colors resize-none"
              placeholder="Add any internal notes here..."
            />
          </div>
          
          <div className="pt-4 border-t border-zinc-100 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
              <input 
                type="checkbox" 
                checked={record.artSupplyPrint}
                onChange={(e) => {
                  setExpandedRecord({ ...record, artSupplyPrint: e.target.checked });
                  updateRecord(record.id, 'artSupplyPrint', e.target.checked);
                }}
                className="w-4 h-4 rounded text-zinc-900 border-zinc-300 focus:ring-zinc-500"
              />
              <span className="text-xs font-medium">Art Supply Print</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
              <input 
                type="checkbox" 
                checked={record.pinterestPublished}
                onChange={(e) => {
                  setExpandedRecord({ ...record, pinterestPublished: e.target.checked });
                  updateRecord(record.id, 'pinterestPublished', e.target.checked);
                }}
                className="w-4 h-4 rounded text-zinc-900 border-zinc-300 focus:ring-zinc-500"
              />
              <span className="text-xs font-medium">Pinterest</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
              <input 
                type="checkbox" 
                checked={record.featured || false}
                onChange={(e) => {
                  setExpandedRecord({ ...record, featured: e.target.checked });
                  updateRecord(record.id, 'featured', e.target.checked);
                }}
                className="w-4 h-4 rounded text-zinc-900 border-zinc-300 focus:ring-zinc-500"
              />
              <span className="text-xs font-medium">Featured</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  const uniqueYears = ["All", ...Array.from(new Set(records.map(r => r.year).filter(Boolean))).sort().reverse()];
  const activeFilterCount = [filterStatus, filterMedium, filterYear].filter(f => f !== "All").length;

  const filteredRecords = records.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    const matchMedium = filterMedium === "All" || r.medium === filterMedium;
    const matchYear = filterYear === "All" || r.year === filterYear;
    return matchSearch && matchStatus && matchMedium && matchYear;
  });

  return (
    <AdminLayout>
      {/* Toolbar â€” slim, border-b only */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-zinc-200 bg-white shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-[15px] font-bold text-zinc-900 leading-tight">Archive Manager</h1>
            <p className="text-[11px] text-zinc-400 leading-none mt-0.5">{filteredRecords.length !== records.length ? `${filteredRecords.length} of ${records.length}` : `${records.length} records`}</p>
          </div>
          <div className="w-px h-8 bg-zinc-200" />
          <div className="flex bg-zinc-100 p-0.5 border border-zinc-200 rounded-md">
            <button onClick={() => setViewType("details")} className={`p-1 rounded transition-all duration-150 ${viewType === "details" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`} title="Table View">
              <List className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewType("tiles")} className={`p-1 rounded transition-all duration-150 ${viewType === "tiles" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`} title="Grid View">
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search artworks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none transition-all"
            />
          </div>

          {/* Filters */}
          <div className="relative" ref={filtersRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeFilterCount > 0
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[12px]">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-white text-zinc-900 text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-zinc-200 rounded-lg shadow-xl z-30 p-3 space-y-3"
                >
                  <div>
                    <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Status</p>
                    <div className="flex flex-wrap gap-1">
                      {["All", ...STATUS_OPTIONS].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                          className={`text-[11px] px-2 py-0.5 rounded-full border font-medium transition-colors ${
                            filterStatus === s ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                          }`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Medium</p>
                    <div className="flex flex-wrap gap-1">
                      {["All", ...MEDIUM_OPTIONS].map(m => (
                        <button key={m} onClick={() => setFilterMedium(m)}
                          className={`text-[11px] px-2 py-0.5 rounded-full border font-medium transition-colors ${
                            filterMedium === m ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                          }`}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Year</p>
                    <div className="flex flex-wrap gap-1">
                      {uniqueYears.map(y => (
                        <button key={y} onClick={() => setFilterYear(y)}
                          className={`text-[11px] px-2 py-0.5 rounded-full border font-medium transition-colors ${
                            filterYear === y ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                          }`}>{y}</button>
                      ))}
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <button onClick={() => { setFilterStatus("All"); setFilterMedium("All"); setFilterYear("All"); }}
                      className="w-full text-[11px] text-red-500 hover:text-red-700 py-0.5 transition-colors font-medium">
                      Clear all filters
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 border rounded-md text-sm transition-colors cursor-pointer ${showInspector ? 'bg-zinc-100 border-zinc-300 text-zinc-700' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}
            title={showInspector ? "Hide Inspector" : "Show Inspector"}
          >
            <Sidebar className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLocation('/admin/new-artwork')}
            className="flex items-center gap-1.5 bg-zinc-900 text-white px-3 py-1.5 rounded-md transition-colors text-sm font-semibold hover:bg-zinc-800 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Artwork
          </button>
        </div>
      </div>

      {/* Content â€” table + inspector side by side, separated by border-l */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table/grid area */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-auto bg-white">
            {viewType === "tiles" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
                <SortableContext items={filteredRecords.map(r => r.id)} strategy={rectSortingStrategy}>
                  {filteredRecords.map((record) => (
                    <SortableTile key={record.id} record={record} setExpandedRecord={setExpandedRecord} />
                  ))}
                </SortableContext>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-zinc-400 uppercase tracking-wider bg-zinc-50 sticky top-0 z-10 border-b border-zinc-200">
                  <tr>
                    <th className="w-7 px-2 py-2"></th>
                    <th className="w-14 px-2 py-2">Image</th>
                    <th className="px-2 py-2">Name</th>
                    <th className="w-24 px-2 py-2">Status</th>
                    <th className="w-28 px-2 py-2">Medium</th>
                    <th className="w-20 px-2 py-2">Category</th>
                    <th className="w-36 px-2 py-2">Series</th>
                    <th className="w-12 px-2 py-2">Year</th>
                    <th className="w-12 px-2 py-2 text-center">Print</th>
                    <th className="w-16 px-2 py-2 text-center">Pinterest</th>
                    <th className="w-8 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows />
                  ) : (
                    <SortableContext items={filteredRecords.map(r => r.id)} strategy={verticalListSortingStrategy}>
                      {filteredRecords.map((record, index) => (
                        <SortableRow key={record.id} record={record} index={index} setExpandedRecord={setExpandedRecord} updateRecord={updateRecord} setRecords={setRecords} />
                      ))}
                    </SortableContext>
                  )}
                </tbody>
              </table>
            )}
            {filteredRecords.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center mb-3">
                  <ImageIcon className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-700">{search || activeFilterCount > 0 ? "No artworks match" : "No artworks yet"}</p>
                <p className="text-xs text-zinc-400 mt-1">{search || activeFilterCount > 0 ? "Try adjusting your search or filters." : "Add your first artwork to get started."}</p>
                {activeFilterCount > 0 && (
                  <button onClick={() => { setFilterStatus("All"); setFilterMedium("All"); setFilterYear("All"); }} className="mt-3 text-xs text-zinc-600 hover:text-zinc-900 underline">Clear filters</button>
                )}
              </div>
            )}
          </div>
        </DndContext>

        {/* Desktop inspector â€” separated by border-l, no card */}
        {showInspector && (
          <div className="hidden lg:flex shrink-0 border-l border-zinc-200 w-[360px] overflow-y-auto flex-col bg-white">
            {expandedRecord ? (
              <div className="flex flex-col h-full">
                <div className="px-4 py-2.5 border-b border-zinc-100 flex justify-between items-center bg-white sticky top-0 z-10">
                  <h2 className="text-[13px] font-semibold text-zinc-900 truncate pr-4">{expandedRecord.name}</h2>
                  <div className="flex items-center gap-1">
                    <button onClick={() => deleteRecord(expandedRecord.id)} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setExpandedRecord(null); setShowQR(false); }} className="p-1.5 hover:bg-zinc-100 rounded" title="Close">
                      <X className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                </div>
                {renderInspectorForm(expandedRecord)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <SlidersHorizontal className="w-5 h-5 text-zinc-300 mb-3" />
                <p className="text-[13px] font-medium text-zinc-600">No artwork selected</p>
                <p className="text-[11px] text-zinc-400 mt-1">Click any row to inspect and edit metadata.</p>
              </div>
            )}
          </div>
        )}

        {/* Mobile backdrop */}
        {expandedRecord && (
          <div
            className="fixed inset-0 bg-zinc-900/10 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => { setExpandedRecord(null); setShowQR(false); }}
          />
        )}

        {/* Mobile slide-out drawer */}
        <AnimatePresence>
          {expandedRecord && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white h-full shadow-2xl overflow-y-auto flex flex-col border-l border-zinc-200 lg:hidden"
            >
              <div className="px-4 py-3 border-b border-zinc-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="text-[13px] font-semibold text-zinc-900 truncate pr-4">{expandedRecord.name}</h2>
                <div className="flex items-center gap-1">
                  <button onClick={() => deleteRecord(expandedRecord.id)} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setExpandedRecord(null); setShowQR(false); }} className="p-1.5 hover:bg-zinc-100 rounded">
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              </div>
              {renderInspectorForm(expandedRecord)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}

