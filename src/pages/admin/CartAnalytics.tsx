import { useState, useEffect, useMemo } from "react";
import AdminLayout from "./AdminLayout";
import { supabase } from "../../lib/supabase";
import {
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Clock,
  Globe,
  RefreshCw,
  Search,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Flame,
  Layers,
  Eye,
  Paintbrush,
  X,
  UserCheck,
  Filter,
  History,
  MapPin
} from "lucide-react";
import { formatDistanceToNow, parseISO, format } from "date-fns";

function safeFormatDistance(dateStr?: string | null): string {
  if (!dateStr) return "Recently";
  try {
    const d = parseISO(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "Recently";
  }
}

function safeFormatDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    const d = parseISO(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return format(d, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return dateStr;
  }
}

export interface ActiveCartRecord {
  id: string;
  session_id: string;
  product_id: string | null;
  title: string;
  price: number;
  quantity: number;
  category: string | null;
  image_url: string | null;
  ip_address: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  user_agent: string | null;
  last_active_at: string;
  created_at: string;
}

export interface CartEventRecord {
  id: string;
  session_id: string;
  event_type: string;
  product_id: string | null;
  title: string;
  price: number;
  quantity: number;
  category: string | null;
  image_url: string | null;
  ip_address: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function CartAnalytics() {
  const [records, setRecords] = useState<ActiveCartRecord[]>([]);
  const [eventRecords, setEventRecords] = useState<CartEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"painting-ips" | "event-history" | "sessions" | "products">("painting-ips");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [paintingsOnlyFilter, setPaintingsOnlyFilter] = useState(true);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<{
    sessionId: string;
    ipAddress: string;
    city: string | null;
    region: string | null;
    country: string | null;
    postalCode: string | null;
    userAgent: string | null;
    lastActive: string;
    items: ActiveCartRecord[];
  } | null>(null);

  async function fetchCartAnalytics() {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Active Carts (Live state)
      let { data: activeData, error: dbError } = await supabase
        .from("ActiveCarts")
        .select("*")
        .order("last_active_at", { ascending: false });

      if (dbError && (dbError.code === "42P01" || dbError.message?.includes("does not exist"))) {
        const fallback = await supabase
          .from("active_carts")
          .select("*")
          .order("last_active_at", { ascending: false });
        activeData = fallback.data;
        dbError = fallback.error;
      }

      if (dbError) {
        console.warn("Supabase ActiveCarts query note:", dbError.message);
        setRecords([]);
      } else {
        setRecords(activeData || []);
      }

      // 2. Fetch Permanent History Log from CartEvents
      let { data: eventData, error: evDbErr } = await supabase
        .from("CartEvents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (evDbErr && (evDbErr.code === "42P01" || evDbErr.message?.includes("does not exist"))) {
        const fallbackEv = await supabase
          .from("cart_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        eventData = fallbackEv.data;
      }

      if (!eventData || eventData.length === 0) {
        eventData = (activeData || []).map((r: any) => ({
          id: r.id,
          session_id: r.session_id,
          event_type: "add_to_cart",
          product_id: r.product_id,
          title: r.title,
          price: r.price,
          quantity: r.quantity,
          category: r.category,
          image_url: r.image_url,
          ip_address: r.ip_address,
          city: r.city,
          region: r.region,
          postal_code: r.postal_code,
          country: r.country,
          user_agent: r.user_agent,
          created_at: r.created_at || r.last_active_at,
        }));
      }

      setEventRecords(eventData || []);
    } catch (err: any) {
      console.error("Failed to load cart analytics:", err);
      setError(err.message || "Failed to load active cart data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCartAnalytics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchCartAnalytics();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  function copyToClipboard(ip: string) {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  }

  // Group records by Session ID
  const sessionGroups = useMemo(() => {
    const map = new Map<string, ActiveCartRecord[]>();
    for (const r of records) {
      if (!map.has(r.session_id)) map.set(r.session_id, []);
      map.get(r.session_id)!.push(r);
    }
    return Array.from(map.entries()).map(([sessionId, items]) => {
      const first = items[0];
      const totalValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);
      const lastActive = items.reduce(
        (max, i) => (new Date(i.last_active_at) > new Date(max) ? i.last_active_at : max),
        items[0].last_active_at
      );
      
      const lastActiveMs = Date.now() - new Date(lastActive).getTime();
      const isLive = lastActiveMs < 5 * 60 * 1000;
      const isRecent = lastActiveMs < 60 * 60 * 1000;
      const isAbandoned = lastActiveMs > 24 * 60 * 60 * 1000;

      return {
        sessionId,
        items,
        totalValue,
        totalUnits,
        lastActive,
        isLive,
        isRecent,
        isAbandoned,
        ipAddress: first.ip_address || "Unknown / Pending IP",
        city: first.city,
        region: first.region,
        postalCode: first.postal_code,
        country: first.country,
        userAgent: first.user_agent,
      };
    });
  }, [records]);

  // Group records by Product
  const productGroups = useMemo(() => {
    const map = new Map<string, { title: string; category: string | null; image_url: string | null; price: number; sessions: Set<string>; totalQty: number }>();
    for (const r of records) {
      const key = r.product_id || r.title;
      if (!map.has(key)) {
        map.set(key, {
          title: r.title,
          category: r.category,
          image_url: r.image_url,
          price: r.price,
          sessions: new Set<string>(),
          totalQty: 0,
        });
      }
      const entry = map.get(key)!;
      entry.sessions.add(r.session_id);
      entry.totalQty += r.quantity;
    }

    return Array.from(map.entries()).map(([key, data]) => ({
      key,
      title: data.title,
      category: data.category,
      image_url: data.image_url,
      price: data.price,
      cartCount: data.sessions.size,
      totalQty: data.totalQty,
      totalValue: data.price * data.totalQty,
      isHighContest: data.sessions.size >= 2,
    })).sort((a, b) => b.cartCount - a.cartCount);
  }, [records]);

  // Group by Painting -> List of IP sessions holding that painting
  const paintingIpGroups = useMemo(() => {
    const map = new Map<string, {
      key: string;
      productId: string | null;
      title: string;
      category: string | null;
      image_url: string | null;
      price: number;
      ipSessions: Array<{
        sessionId: string;
        ipAddress: string;
        city: string | null;
        region: string | null;
        country: string | null;
        postalCode: string | null;
        userAgent: string | null;
        lastActive: string;
        quantity: number;
        isLive: boolean;
      }>;
    }>();

    for (const r of records) {
      const cat = (r.category || "").toLowerCase();
      const title = (r.title || "").toLowerCase();
      const isPainting =
        !r.category ||
        cat.includes("original") ||
        cat.includes("painting") ||
        cat.includes("canvas") ||
        cat.includes("aatman") ||
        title.includes("canvas") ||
        title.includes("original") ||
        title.includes("study") ||
        title.includes("oil") ||
        title.includes("acrylic") ||
        title.includes("watercolor") ||
        !cat.includes("print");

      if (paintingsOnlyFilter && !isPainting) continue;

      const key = r.product_id || r.title;
      if (!map.has(key)) {
        map.set(key, {
          key,
          productId: r.product_id,
          title: r.title,
          category: r.category,
          image_url: r.image_url,
          price: r.price,
          ipSessions: [],
        });
      }

      const group = map.get(key)!;
      const existingIndex = group.ipSessions.findIndex(s => s.sessionId === r.session_id);
      const lastActiveMs = Date.now() - new Date(r.last_active_at).getTime();
      const isLive = lastActiveMs < 5 * 60 * 1000;

      if (existingIndex >= 0) {
        group.ipSessions[existingIndex].quantity += r.quantity;
      } else {
        group.ipSessions.push({
          sessionId: r.session_id,
          ipAddress: r.ip_address || "Pending IP Detection",
          city: r.city,
          region: r.region,
          country: r.country,
          postalCode: r.postal_code,
          userAgent: r.user_agent,
          lastActive: r.last_active_at,
          quantity: r.quantity,
          isLive,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.ipSessions.length - a.ipSessions.length);
  }, [records, paintingsOnlyFilter]);

  // Filtered Permanent Cart Event History
  const filteredEventRecords = useMemo(() => {
    let list = eventRecords;
    if (paintingsOnlyFilter) {
      list = list.filter((r) => {
        const cat = (r.category || "").toLowerCase();
        const title = (r.title || "").toLowerCase();
        return (
          !r.category ||
          cat.includes("original") ||
          cat.includes("painting") ||
          cat.includes("canvas") ||
          cat.includes("aatman") ||
          title.includes("canvas") ||
          title.includes("original") ||
          title.includes("study") ||
          title.includes("oil") ||
          title.includes("acrylic") ||
          title.includes("watercolor") ||
          !cat.includes("print")
        );
      });
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.ip_address && r.ip_address.toLowerCase().includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q)) ||
        (r.region && r.region.toLowerCase().includes(q)) ||
        (r.country && r.country.toLowerCase().includes(q)) ||
        (r.postal_code && r.postal_code.toLowerCase().includes(q))
    );
  }, [eventRecords, paintingsOnlyFilter, searchQuery]);

  // Filtered Paintings & IP Groups
  const filteredPaintingIpGroups = useMemo(() => {
    if (!searchQuery.trim()) return paintingIpGroups;
    const q = searchQuery.toLowerCase();
    return paintingIpGroups.filter((group) => {
      const titleMatch = group.title.toLowerCase().includes(q);
      const ipMatch = group.ipSessions.some(
        (s) =>
          s.ipAddress.toLowerCase().includes(q) ||
          (s.city && s.city.toLowerCase().includes(q)) ||
          (s.country && s.country.toLowerCase().includes(q)) ||
          (s.postalCode && s.postalCode.toLowerCase().includes(q))
      );
      return titleMatch || ipMatch;
    });
  }, [paintingIpGroups, searchQuery]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessionGroups;
    const q = searchQuery.toLowerCase();
    return sessionGroups.filter(
      (s) =>
        s.sessionId.toLowerCase().includes(q) ||
        s.ipAddress.toLowerCase().includes(q) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.region && s.region.toLowerCase().includes(q)) ||
        (s.postalCode && s.postalCode.toLowerCase().includes(q)) ||
        (s.country && s.country.toLowerCase().includes(q)) ||
        s.items.some((i) => i.title.toLowerCase().includes(q))
    );
  }, [sessionGroups, searchQuery]);

  // Metrics
  const activeSessionsCount = sessionGroups.filter((s) => !s.isAbandoned).length;
  const totalInCartValue = sessionGroups
    .filter((s) => !s.isAbandoned)
    .reduce((sum, s) => sum + s.totalValue, 0);

  const totalUniquePaintingIPs = useMemo(() => {
    const ips = new Set<string>();
    for (const group of paintingIpGroups) {
      for (const session of group.ipSessions) {
        if (session.ipAddress && !session.ipAddress.includes("Pending")) {
          ips.add(session.ipAddress);
        }
      }
    }
    return ips.size;
  }, [paintingIpGroups]);

  const highContestPaintingsCount = useMemo(() => {
    return paintingIpGroups.filter((g) => g.ipSessions.length >= 2).length;
  }, [paintingIpGroups]);

  function handleInspectSession(sessionId: string) {
    const sessionObj = sessionGroups.find((s) => s.sessionId === sessionId);
    if (sessionObj) {
      setSelectedSessionForModal({
        sessionId: sessionObj.sessionId,
        ipAddress: sessionObj.ipAddress,
        city: sessionObj.city,
        region: sessionObj.region,
        country: sessionObj.country,
        postalCode: sessionObj.postalCode,
        userAgent: sessionObj.userAgent,
        lastActive: sessionObj.lastActive,
        items: sessionObj.items,
      });
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-sm">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-serif font-light text-zinc-900 tracking-tight">
                Cart Analytics & Painting IP Tracker
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Track visitor IP addresses (e.g. Toronto, Vancouver), geolocations, and full history whenever paintings are added to cart.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-colors flex items-center gap-1.5 ${
                autoRefresh
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
              {autoRefresh ? "Live Auto-Sync (15s)" : "Auto-Sync Paused"}
            </button>

            <button
              onClick={fetchCartAnalytics}
              disabled={loading}
              className="p-2 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-md text-zinc-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-zinc-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Painting IP Addresses */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase">Painting Cart IPs</span>
              <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                <Globe className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-light text-zinc-900">{totalUniquePaintingIPs}</span>
              <span className="text-xs text-purple-600 font-medium">Unique IPs</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">Active visitor IPs holding paintings</p>
          </div>

          {/* Card 2: Permanent Add-To-Cart Events */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase">All IP Cart Instances</span>
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <History className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-light text-zinc-900">{eventRecords.length}</span>
              <span className="text-xs text-blue-600 font-medium">Logged Instances</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">Historical add-to-cart IP records</p>
          </div>

          {/* Card 3: High Contest Paintings */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase">High Contest Pieces</span>
              <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-light text-zinc-900">{highContestPaintingsCount}</span>
              <span className="text-xs text-amber-600 font-medium">Paintings</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">Sitting in 2+ distinct visitor carts</p>
          </div>

          {/* Card 4: Total In-Cart Value */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase">In-Cart Pipeline Value</span>
              <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-light text-zinc-900">
                ${totalInCartValue.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-500">CAD</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">Combined active potential revenue</p>
          </div>

        </div>

        {/* Tab & Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("painting-ips")}
              className={`px-4 py-2 text-xs font-semibold tracking-wider uppercase rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === "painting-ips"
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
              Live Painting IP Tracker ({paintingIpGroups.length})
            </button>

            <button
              onClick={() => setActiveTab("event-history")}
              className={`px-4 py-2 text-xs font-semibold tracking-wider uppercase rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === "event-history"
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              All IP Cart Instances ({filteredEventRecords.length})
            </button>

            <button
              onClick={() => setActiveTab("sessions")}
              className={`px-4 py-2 text-xs font-semibold tracking-wider uppercase rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === "sessions"
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Active Sessions ({sessionGroups.length})
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 text-xs font-semibold tracking-wider uppercase rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === "products"
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Product Demand ({productGroups.length})
            </button>
          </div>

          {/* Right Controls: Filter Toggle & Search */}
          <div className="flex items-center gap-3">
            {(activeTab === "painting-ips" || activeTab === "event-history") && (
              <button
                onClick={() => setPaintingsOnlyFilter(!paintingsOnlyFilter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                  paintingsOnlyFilter
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
                title="Toggle Paintings vs All Store Items"
              >
                <Filter className="w-3.5 h-3.5" />
                {paintingsOnlyFilter ? "Paintings & Originals Only" : "All Products"}
              </button>
            )}

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Toronto, IP, painting..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="bg-white rounded-xl border border-zinc-200/80 p-12 text-center text-zinc-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
            <p className="text-xs font-medium">Fetching real-time active cart & IP tracking data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-xs">
            <p className="font-semibold mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Error loading active cart tracking
            </p>
            <p>{error}</p>
          </div>
        ) : activeTab === "painting-ips" ? (
          /* TAB 1: Live Painting IP Address Tracker */
          <div className="space-y-6">
            {filteredPaintingIpGroups.length === 0 ? (
              <div className="bg-white rounded-xl border border-zinc-200/80 p-12 text-center text-zinc-400">
                <Paintbrush className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-700">No active painting IP tracking sessions found</p>
                <p className="text-xs text-zinc-400 mt-1">
                  When visitors add paintings or original artworks to their cart, their IP address, city (e.g. Toronto), geolocation, and session details will automatically map here.
                </p>
              </div>
            ) : (
              filteredPaintingIpGroups.map((painting) => (
                <div key={painting.key} className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
                  
                  {/* Painting Header Bar */}
                  <div className="p-4 bg-zinc-50/80 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {painting.image_url ? (
                        <img
                          src={painting.image_url}
                          alt={painting.title}
                          className="w-12 h-12 rounded-lg object-cover border border-zinc-200 shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-serif text-zinc-400 border border-zinc-200 shrink-0">
                          Art
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base font-medium text-zinc-900">{painting.title}</h3>
                          <span className="px-2 py-0.5 text-[9px] uppercase font-semibold tracking-wider rounded bg-zinc-200/70 text-zinc-700">
                            {painting.category || "Original Painting"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">
                          ${painting.price.toLocaleString()} CAD
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {painting.ipSessions.length >= 2 ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          High Contest ({painting.ipSessions.length} Visitor IPs)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          1 Visitor IP Cart
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visitor IP Addresses Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          <th className="py-2.5 px-4">Visitor IP Address</th>
                          <th className="py-2.5 px-4">IP Geolocation</th>
                          <th className="py-2.5 px-4">Last Activity</th>
                          <th className="py-2.5 px-4">Device / Agent</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-xs">
                        {painting.ipSessions.map((session) => (
                          <tr key={session.sessionId} className="hover:bg-zinc-50/60 transition-colors">
                            
                            {/* Visitor IP Address */}
                            <td className="py-3 px-4 font-mono whitespace-nowrap">
                              <div className="flex items-center gap-2 text-zinc-900 font-medium">
                                <span>{session.ipAddress}</span>
                                {session.ipAddress && !session.ipAddress.includes("Pending") && (
                                  <button
                                    onClick={() => copyToClipboard(session.ipAddress)}
                                    className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 rounded hover:bg-zinc-100"
                                    title="Copy Visitor IP"
                                  >
                                    {copiedIp === session.ipAddress ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                Session: {session.sessionId.slice(0, 14)}...
                              </span>
                            </td>

                            {/* Location */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-zinc-800">
                                <Globe className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                <div>
                                  <div className="font-medium text-xs">
                                    {session.city ? `${session.city}, ` : ""}
                                    {session.region ? `${session.region}, ` : ""}
                                    {session.country || "Detecting Location..."}
                                  </div>
                                  {session.postalCode && (
                                    <div className="text-[10px] text-zinc-400 font-mono">
                                      ZIP: {session.postalCode}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Last Activity */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full inline-block ${
                                    session.isLive ? "bg-emerald-500 animate-pulse" : "bg-zinc-300"
                                  }`}
                                />
                                <span className="font-medium text-zinc-800">
                                  {safeFormatDistance(session.lastActive)}
                                </span>
                              </div>
                            </td>

                            {/* Device / Agent */}
                            <td className="py-3 px-4 text-zinc-600 max-w-xs truncate">
                              <div className="flex items-center gap-1.5">
                                {session.userAgent?.toLowerCase().includes("mobile") ? (
                                  <Smartphone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                ) : (
                                  <Monitor className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                )}
                                <span className="text-[11px] truncate text-zinc-500">
                                  {session.userAgent || "Standard Browser"}
                                </span>
                              </div>
                            </td>

                            {/* Inspect Session Action */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleInspectSession(session.sessionId)}
                                className="px-2.5 py-1 bg-white hover:bg-zinc-900 text-zinc-700 hover:text-white border border-zinc-200 hover:border-zinc-900 rounded-md text-[11px] font-medium transition-colors inline-flex items-center gap-1.5 shadow-xs"
                              >
                                <Eye className="w-3 h-3" />
                                Inspect Session Cart
                              </button>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              ))
            )}
          </div>
        ) : activeTab === "event-history" ? (
          /* TAB 2: Permanent All IP Add-to-Cart Instance Log */
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-900">
                  Permanent Add-To-Cart IP Instance Log ({filteredEventRecords.length} Instances)
                </span>
              </div>
              <span className="text-[11px] text-blue-700">
                Preserves every historical time a painting was added to cart with visitor IP & location
              </span>
            </div>

            {filteredEventRecords.length === 0 ? (
              <div className="p-12 text-center text-zinc-400">
                <History className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-700">No add-to-cart instances logged yet</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Whenever visitors add artworks to their cart on the store, every instance will be permanently logged here with their IP address and city (e.g. Toronto).
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      <th className="py-3 px-4">Artwork / Painting</th>
                      <th className="py-3 px-4">Visitor IP Address</th>
                      <th className="py-3 px-4">IP Geolocation & City</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4 text-right">Cart Item Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {filteredEventRecords.map((ev) => (
                      <tr key={ev.id} className="hover:bg-zinc-50/50 transition-colors">
                        
                        {/* Artwork */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="flex items-center gap-3">
                            {ev.image_url ? (
                              <img
                                src={ev.image_url}
                                alt={ev.title}
                                className="w-10 h-10 rounded-md object-cover border border-zinc-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-zinc-100 flex items-center justify-center text-xs text-zinc-400 shrink-0 font-serif">
                                Art
                              </div>
                            )}
                            <div>
                              <div className="font-serif font-medium text-sm text-zinc-900">
                                {ev.title}
                              </div>
                              <span className="text-[10px] uppercase font-semibold text-zinc-400">
                                {ev.category || "Original"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Visitor IP */}
                        <td className="py-3.5 px-4 align-middle font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium text-zinc-900">
                            <span>{ev.ip_address || "Detecting IP"}</span>
                            {ev.ip_address && (
                              <button
                                onClick={() => copyToClipboard(ev.ip_address!)}
                                className="text-zinc-400 hover:text-zinc-700 transition-colors p-0.5"
                                title="Copy IP"
                              >
                                {copiedIp === ev.ip_address ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400">
                            Session: {ev.session_id.slice(0, 12)}...
                          </span>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-zinc-800">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <div>
                              <div className="font-medium text-xs">
                                {ev.city ? `${ev.city}, ` : ""}
                                {ev.region ? `${ev.region}, ` : ""}
                                {ev.country || "Location Pending"}
                              </div>
                              {ev.postal_code && (
                                <div className="text-[10px] text-zinc-400 font-mono">
                                  ZIP: {ev.postal_code}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="font-medium text-zinc-900">
                            {safeFormatDate(ev.created_at)}
                          </div>
                          <span className="text-[10px] text-zinc-400">
                            ({safeFormatDistance(ev.created_at)})
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 align-middle text-right font-serif font-semibold text-zinc-900">
                          ${ev.price.toLocaleString()} CAD
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === "sessions" ? (
          /* TAB 3: Active Cart Sessions Table */
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
            {filteredSessions.length === 0 ? (
              <div className="p-12 text-center text-zinc-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-700">No active cart sessions found</p>
                <p className="text-xs text-zinc-400 mt-1">
                  When visitors add artworks to their cart on the store, their session and IP details will display here live.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      <th className="py-3 px-4">Status & Last Active</th>
                      <th className="py-3 px-4">Session ID & IP Address</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Cart Contents</th>
                      <th className="py-3 px-4 text-right">Cart Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {filteredSessions.map((session) => (
                      <tr key={session.sessionId} className="hover:bg-zinc-50/50 transition-colors">
                        
                        {/* Status & Time */}
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full inline-block ${
                                session.isLive
                                  ? "bg-emerald-500 animate-pulse"
                                  : session.isRecent
                                  ? "bg-amber-400"
                                  : "bg-zinc-300"
                              }`}
                            />
                            <span className="font-medium text-zinc-800">
                              {safeFormatDistance(session.lastActive)}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block mt-0.5 font-mono">
                            {session.isAbandoned ? "Abandoned (>24h)" : session.isLive ? "Active Now" : "Recent Visitor"}
                          </span>
                        </td>

                        {/* Session ID & IP */}
                        <td className="py-4 px-4 align-top font-mono">
                          <div className="text-zinc-900 font-medium">{session.sessionId.slice(0, 16)}...</div>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-500">
                            <span>{session.ipAddress}</span>
                            <button
                              onClick={() => copyToClipboard(session.ipAddress)}
                              className="text-zinc-400 hover:text-zinc-700 transition-colors p-0.5"
                              title="Copy IP Address"
                            >
                              {copiedIp === session.ipAddress ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-zinc-800">
                            <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <div>
                              <div className="font-medium text-xs">
                                {session.city ? `${session.city}, ` : ""}
                                {session.region ? `${session.region}, ` : ""}
                                {session.country || "Unknown Location"}
                              </div>
                              {session.postalCode && (
                                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                  ZIP/Postal: {session.postalCode}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Cart Contents */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-2">
                            {session.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.title}
                                    className="w-8 h-8 rounded object-cover border border-zinc-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-[9px] text-zinc-400 shrink-0">
                                    Art
                                  </div>
                                )}
                                <div>
                                  <div className="font-serif font-medium text-zinc-900 leading-tight">
                                    {item.title}
                                  </div>
                                  <div className="text-[10px] text-zinc-400">
                                    {item.quantity}x @ ${item.price.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Cart Total */}
                        <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                          <div className="font-serif text-base font-semibold text-zinc-900">
                            ${session.totalValue.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {session.totalUnits} {session.totalUnits === 1 ? "item" : "items"}
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* TAB 4: Product Demand Breakdown */
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
            {productGroups.length === 0 ? (
              <div className="p-12 text-center text-zinc-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-700">No product demand data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      <th className="py-3 px-4">Artwork / Product</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Active Carts</th>
                      <th className="py-3 px-4 text-center">Units in Carts</th>
                      <th className="py-3 px-4 text-right">In-Cart Value</th>
                      <th className="py-3 px-4 text-right">Demand Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {productGroups.map((prod) => (
                      <tr key={prod.key} className="hover:bg-zinc-50/50 transition-colors">
                        
                        {/* Artwork */}
                        <td className="py-4 px-4 align-middle">
                          <div className="flex items-center gap-3">
                            {prod.image_url ? (
                              <img
                                src={prod.image_url}
                                alt={prod.title}
                                className="w-10 h-10 rounded-md object-cover border border-zinc-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-zinc-100 flex items-center justify-center text-xs text-zinc-400 shrink-0 font-serif">
                                Art
                              </div>
                            )}
                            <div>
                              <div className="font-serif font-medium text-sm text-zinc-900">
                                {prod.title}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono">
                                ${prod.price.toLocaleString()} CAD
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4 align-middle">
                          <span className="px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded bg-zinc-100 text-zinc-600">
                            {prod.category || "Original"}
                          </span>
                        </td>

                        {/* Active Carts Count */}
                        <td className="py-4 px-4 align-middle text-center">
                          <span className="inline-flex items-center gap-1 font-serif text-lg font-semibold text-zinc-900">
                            {prod.cartCount}
                          </span>
                        </td>

                        {/* Units in Carts */}
                        <td className="py-4 px-4 align-middle text-center text-zinc-700 font-mono">
                          {prod.totalQty}
                        </td>

                        {/* In-Cart Value */}
                        <td className="py-4 px-4 align-middle text-right font-serif font-semibold text-zinc-900">
                          ${prod.totalValue.toLocaleString()}
                        </td>

                        {/* Demand Status & High Contest Badge */}
                        <td className="py-4 px-4 align-middle text-right whitespace-nowrap">
                          {prod.isHighContest ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> High Contest (2+ Carts)
                            </span>
                          ) : prod.cartCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ● In Active Cart
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-400">Low Interest</span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal: Inspect Session Cart Items */}
      {selectedSessionForModal && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 bg-zinc-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-medium">Session & IP Details</h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  IP: {selectedSessionForModal.ipAddress}
                </p>
              </div>
              <button
                onClick={() => setSelectedSessionForModal(null)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              
              {/* Geolocation Grid */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/80 space-y-2">
                <div className="flex items-center justify-between text-zinc-700">
                  <span className="text-zinc-400 font-medium">Location:</span>
                  <span className="font-semibold text-zinc-900">
                    {selectedSessionForModal.city ? `${selectedSessionForModal.city}, ` : ""}
                    {selectedSessionForModal.region ? `${selectedSessionForModal.region}, ` : ""}
                    {selectedSessionForModal.country || "Unknown"}
                  </span>
                </div>
                {selectedSessionForModal.postalCode && (
                  <div className="flex items-center justify-between text-zinc-700">
                    <span className="text-zinc-400 font-medium">Postal Code:</span>
                    <span className="font-mono text-zinc-800">{selectedSessionForModal.postalCode}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-zinc-700">
                  <span className="text-zinc-400 font-medium">Last Active:</span>
                  <span className="font-mono text-zinc-800">
                    {safeFormatDistance(selectedSessionForModal.lastActive)}
                  </span>
                </div>
              </div>

              {/* Items in Cart */}
              <div>
                <h4 className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500 mb-3">
                  Items currently in this visitor's cart ({selectedSessionForModal.items.length})
                </h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {selectedSessionForModal.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-50/50 p-3 rounded-lg border border-zinc-100">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-10 h-10 rounded object-cover border border-zinc-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-zinc-200 flex items-center justify-center text-[9px] font-serif text-zinc-500 shrink-0">
                            Art
                          </div>
                        )}
                        <div>
                          <p className="font-serif font-medium text-sm text-zinc-900 leading-tight">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-serif font-semibold text-sm text-zinc-900">
                        ${(item.price * item.quantity).toLocaleString()} CAD
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
              <button
                onClick={() => copyToClipboard(selectedSessionForModal.ipAddress)}
                className="px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg hover:bg-white transition-colors flex items-center gap-1.5 text-zinc-700"
              >
                {copiedIp === selectedSessionForModal.ipAddress ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> IP Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy IP Address
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedSessionForModal(null)}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </AdminLayout>
  );
}
