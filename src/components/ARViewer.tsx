import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { View, Box, Loader2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Register the <model-viewer> web component for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

// Ensure model-viewer is only imported on the client
if (typeof window !== "undefined") {
  import("@google/model-viewer").catch(console.error);
}

// Parses a loose dimension string like "16x20 inches" or "40 cm x 50cm"
function parseDimensionsToMeters(dimStr: string | null): { w: number; h: number } | null {
  if (!dimStr) return null;

  // Look for two numbers separated by an x, X, or "by"
  const match = dimStr.match(/(\d+(?:\.\d+)?)\s*(?:x|X|by)\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;

  let w = parseFloat(match[1]);
  let h = parseFloat(match[2]);

  // Determine units. Default to inches if not specified.
  const lowerStr = dimStr.toLowerCase();
  if (lowerStr.includes("cm") || lowerStr.includes("centimeter")) {
    w = w / 100;
    h = h / 100;
  } else {
    // Inches to meters
    w = w * 0.0254;
    h = h * 0.0254;
  }

  // Sanity check: if dimensions are bizarrely large or 0, return null
  if (w <= 0 || h <= 0 || w > 10 || h > 10) return null;

  return { w, h };
}

async function generatePaintingGLB(imageUrl: string, widthMeters: number, heightMeters: number): Promise<string> {
  const depthMeters = 0.0254; // 1 inch thick canvas

  return new Promise((resolve, reject) => {
    const scene = new THREE.Scene();

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";

    // To guarantee CORS availability for WebGL, proxy the image through a reliable image CDN.
    // This solves issues where Stripe/Custom CDNs don't attach Access-Control-Allow-Origin headers.
    const isDataUri = imageUrl.startsWith("data:") || imageUrl.startsWith("blob:");
    const safeUrl = isDataUri ? imageUrl : `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}`;

    textureLoader.load(
      safeUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;

        const geometry = new THREE.BoxGeometry(widthMeters, heightMeters, depthMeters);

        const edgeMaterial = new THREE.MeshStandardMaterial({
          color: 0xf5f5f5, // Off-white canvas edge
          roughness: 0.9,
        });

        const faceMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.5,
        });

        const materials = [
          edgeMaterial, // right
          edgeMaterial, // left
          edgeMaterial, // top
          edgeMaterial, // bottom
          faceMaterial, // front
          edgeMaterial, // back
        ];

        const mesh = new THREE.Mesh(geometry, materials);
        scene.add(mesh);

        const exporter = new GLTFExporter();
        exporter.parse(
          scene,
          (gltf) => {
            if (gltf instanceof ArrayBuffer) {
              const blob = new Blob([gltf], { type: "model/gltf-binary" });
              resolve(URL.createObjectURL(blob));
            } else {
              const blob = new Blob([JSON.stringify(gltf)], { type: "text/plain" });
              resolve(URL.createObjectURL(blob));
            }
          },
          (error) => {
            console.error("Error exporting GLTF", error);
            reject(error);
          },
          { binary: true }
        );
      },
      undefined,
      (err) => {
        reject(new Error("Failed to load texture: " + err));
      }
    );
  });
}

export function ARButton({
  imageUrl,
  dimensionsString,
  productName,
}: {
  imageUrl: string;
  dimensionsString: string | null;
  productName: string;
}) {
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(false);
  const [showDesktopQR, setShowDesktopQR] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  // Clear the cached GLB URL if the user navigates to a new product or selects a new image
  useEffect(() => {
    setGlbUrl(null);
    setError(false);
  }, [imageUrl, dimensionsString]);
  
  const parsedDims = parseDimensionsToMeters(dimensionsString);

  // If we can't safely parse the dimensions, don't show the button at all to prevent a broken experience.
  if (!parsedDims) return null;

  const handleARClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Simple user-agent check for mobile
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const inApp = /Instagram|FBAV|FBAN|Line|Twitter|MicroMessenger/i.test(ua);
    
    if (inApp) setIsInAppBrowser(true);

    if (!isMobile) {
      setShowDesktopQR(true);
      return;
    }

    setShowMobileModal(true);

    if (!glbUrl) {
      setIsGenerating(true);
      setError(false);
      try {
        const url = await generatePaintingGLB(imageUrl, parsedDims.w, parsedDims.h);
        setGlbUrl(url);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <>
      {/* Mobile Modal containing the interactive 3D model */}
      {showMobileModal && (
        <div 
          className="fixed inset-0 z-[200] bg-background flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 ">
            <h3 className="font-serif text-lg">3D Preview</h3>
            <button onClick={() => setShowMobileModal(false)} className="p-2 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center bg-card overflow-hidden">
            {isInAppBrowser && (
              <div className="absolute top-4 left-4 right-4 bg-primary/10 border border-primary/20 text-primary p-4 rounded-lg text-xs leading-relaxed text-center z-50 shadow-lg backdrop-blur-md">
                <span className="font-semibold block mb-1">AR is restricted in this app.</span>
                To place this artwork on your wall, tap the dots (•••) in the top corner and select <b>Open in Browser</b> or <b>Open in Safari</b>.
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs tracking-widest uppercase">Generating 3D Model...</span>
              </div>
            )}
            {error && <p className="text-red-500 text-sm">Failed to generate 3D model.</p>}
            
            {glbUrl && (
              <model-viewer
                src={glbUrl}
                ar
                ar-modes="webxr scene-viewer quick-look"
                ar-scale="fixed"
                camera-controls
                auto-rotate
                style={{ width: "100%", height: "100%" }}
                alt={`3D model of ${productName}`}
              >
                {/* Custom AR Button slot that perfectly triggers native Safari events */}
                <button 
                  slot="ar-button" 
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-primary text-background px-6 py-3.5 rounded-full text-xs tracking-[0.15em] uppercase shadow-2xl flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Box className="w-4 h-4" />
                  View in your space
                </button>
              </model-viewer>
            )}
          </div>
        </div>
      )}

      {/* The visible UI Button on the shop card */}
      <button
        onClick={handleARClick}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-background/80 backdrop-blur-md hover:bg-primary hover:text-background text-foreground px-3.5 py-2 rounded-full text-[10px] md:text-[11px] tracking-widest uppercase transition-all duration-300 shadow-md border border-border/40 group"
        title="View in 3D Space"
      >
        <Box className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
        <span className="hidden md:inline-block font-medium">View in 3D</span>
      </button>

      {/* Desktop QR Modal */}
      {showDesktopQR && (
        <div 
          className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { e.stopPropagation(); setShowDesktopQR(false); }}
        >
          <div 
            className="bg-card border border-border shadow-2xl p-8 max-w-sm w-full text-center relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowDesktopQR(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <Box className="w-8 h-8 mx-auto text-primary mb-4" />
            <h3 className="font-serif text-2xl mb-2">View in AR</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Scan this QR code with your phone's camera to project this painting onto your wall in Augmented Reality.
            </p>
            <div className="bg-white p-4 inline-block rounded-lg mx-auto border border-border/50">
              <QRCodeSVG value={window.location.href} size={200} />
            </div>
            <p className="text-xs text-muted-foreground mt-6 italic">
              Works on iOS (Safari) and Android (Chrome) without any apps.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
