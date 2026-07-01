import React, { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

const STATUS_OPTIONS = ["Archive", "Private", "Hide"];
const MEDIUM_OPTIONS = ["Watercolor", "Oil", "Acrylic", "Ink", "Digital", "Mixed Media", "Graphite", "Charcoal", "Sketchbooks"];
const CATEGORY_OPTIONS = ["Painting", "Drawing", "Digital", "Sketch", "Study", "Commission"];

export default function NewArtwork() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [name, setName] = useState("Untitled");
  const [medium, setMedium] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState("Archive");
  const [category, setCategory] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [substrate, setSubstrate] = useState("");
  const [notes, setNotes] = useState("");
  
  // Image State
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      toast.info("Uploading image...");

      const fileType = file.type || 'application/octet-stream';
      
      const res = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: fileType })
      });
      
      const { signedUrl, publicUrl } = await res.json();
      if (!signedUrl) throw new Error("Failed to get upload URL");

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': fileType }
      });
      
      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error("R2 Upload Error Body:", errorText);
        throw new Error(`R2 Error (${uploadRes.status}): ${errorText.substring(0, 150)}`);
      }

      setImageUrl(publicUrl);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create record
      const dbRecord = {
        Name: name,
        Medium: medium || null,
        Year: year ? parseInt(year) : null,
        Status: status,
        Category: category || null,
        Dimensions: dimensions || null,
        Substrate: substrate || null,
        Notes: notes || null,
        Image_url: imageUrl,
        Thumbnail_url: imageUrl, // Optimization: Use same URL or a smaller version
        Filmstrip_url: imageUrl,
        // Defaults
        Series: [],
        Additional_Images: [],
        ShowAtEvent: false,
        ArtSupplyPrint: false,
        Pinterest: false,
        Featured: false,
        sort_order: 0 // Will float to the top
      };

      const { error } = await supabase.from('Archive').insert([dbRecord]);
      
      if (error) throw error;
      
      toast.success("Artwork created successfully!");
      setLocation('/admin/archive');
      
    } catch (err: any) {
      toast.error(`Failed to save artwork: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => setLocation('/admin/archive')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Archive
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-5 bg-gray-50/50 flex justify-between items-center">
            <h1 className="text-xl font-medium">Create New Artwork</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Image Upload */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Artwork Image</label>
                <div className="relative aspect-[4/3] bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden group hover:border-primary/50 transition-colors">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center p-6 text-center">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-8 h-8 mb-3 animate-spin text-primary" />
                          <span className="text-sm">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-3 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium text-gray-600 mb-1">Click to upload</span>
                          <span className="text-xs text-gray-400">JPG, PNG up to 10MB</span>
                        </>
                      )}
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingImage || isSubmitting}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                  />
                  
                  {imageUrl && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-white font-medium text-sm flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Replace Image
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Metadata */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary text-base py-2.5" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input 
                      type="text" 
                      value={year}
                      onChange={e => setYear(e.target.value)}
                      className="w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary text-base py-2.5" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary text-base py-2.5"
                    >
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
                    <select 
                      value={medium}
                      onChange={e => setMedium(e.target.value)}
                      className="w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary text-base py-2.5"
                    >
                      <option value="">Select Medium...</option>
                      {MEDIUM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary text-base py-2.5"
                    >
                      <option value="">Select Category...</option>
                      {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 24x36 in"
                      value={dimensions}
                      onChange={e => setDimensions(e.target.value)}
                      className="w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary text-base py-2.5" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Substrate</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Canvas"
                      value={substrate}
                      onChange={e => setSubstrate(e.target.value)}
                      className="w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary text-base py-2.5" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Private Notes</label>
                  <textarea 
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary text-base resize-none" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setLocation('/admin/archive')}
                className="px-6 py-2.5 text-gray-600 hover:bg-gray-50 font-medium rounded-lg transition-colors border border-gray-200"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting || uploadingImage}
                className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Publish Artwork"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
