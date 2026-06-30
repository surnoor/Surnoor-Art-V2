import React, { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function MobileUpload() {
  const [match, params] = useRoute("/admin/mobile-upload/:id");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [recordName, setRecordName] = useState("Loading...");

  useEffect(() => {
    if (params?.id) {
      supabase.from('Archive').select('Name').eq('id', params.id).single().then(({ data }) => {
        if (data) setRecordName(data.Name || "Untitled Artwork");
      });
    }
  }, [params?.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !params?.id) return;
    const file = e.target.files[0];
    setUploading(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      // 1. Get presigned URL
      const res = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      });
      const { signedUrl, publicUrl } = await res.json();
      if (!signedUrl) throw new Error("Failed to get upload URL");

      // 2. Upload to R2
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });
      if (!uploadRes.ok) throw new Error("Failed to upload to Cloudflare R2");

      // 3. Update Supabase
      const { error } = await supabase
        .from('Archive')
        .update({ Image_url: publicUrl, Thumbnail_url: publicUrl })
        .eq('id', params.id);
      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!match) return <div className="p-8 text-center">Invalid link</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <h1 className="text-xl font-bold mb-2">Upload Artwork</h1>
        <p className="text-gray-500 mb-8 font-medium">{recordName}</p>

        {success ? (
          <div className="flex flex-col items-center text-green-600 gap-4">
            <CheckCircle className="w-16 h-16" />
            <p className="font-semibold text-lg">Upload complete!</p>
            <p className="text-sm text-gray-500">You can close this tab and check your desktop.</p>
          </div>
        ) : (
          <div className="relative">
            <input 
              type="file" 
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className={`w-full aspect-square rounded-2xl border-4 border-dashed flex flex-col items-center justify-center gap-4 transition-colors ${uploading ? 'border-gray-300 bg-gray-100' : 'border-primary/50 bg-primary/5 hover:bg-primary/10'}`}>
              {uploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <span className="font-medium text-gray-600">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-primary" />
                  <span className="font-medium text-primary">Tap to take photo or choose from library</span>
                </>
              )}
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="mt-6 text-red-500 text-sm font-medium">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
