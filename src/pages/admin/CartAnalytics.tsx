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
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

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

export default function CartAnalytics() {
  const [records, setRecords] = useState<ActiveCartRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sessions" | "products">("sessions");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function fetchCartAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from("ActiveCarts")
        .select("*")
        .order("last_active_at", { ascending: false });

      if (dbError) {
        // If table doesn't exist yet, show clean state with mock data demo indicator
        console.warn("Supabase ActiveCarts table query note:", dbError.message);
        setRecords([]);
      } else {
        setRecords(data || []);
      }
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
      const isLive = lastActiveMs < 5 * 60 * 1000; // < 5 mins
      const isRecent = lastActiveMs < 60 * 60 * 1000; // < 1 hour
      const isAbandoned = lastActiveMs > 24 * 60 * 60 * 1000; // > 24 hours

      return {
        sessionId,
        items,
        totalValue,
        totalUnits,
        lastActive,
        isLive,
        isRecent,
        isAbandoned,
        ipAddress: first.ip_address || "127.0.0.1",
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
  const abandonedSessionsCount = sessionGroups.filter((s) => s.isAbandoned).length;
  const totalInCartValue = sessionGroups
    .filter((s) => !s.isAbandoned)
    .reduce((sum, s) => sum + s.totalValue, 0);
  const mostInDemandProduct = productGroups[0]?.title || "None";

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
                Cart Analytics & Active Sessions
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Monitor active visitor shopping carts, in-demand products, and IP geolocation in real-time.
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
          
          {/* Card 1: Active Carts */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase">Active Carts (24h)</span>
              <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-light text-zinc-900">{activeSessionsCount}</span>
              <span className="text-xs text-emerald-600 font-medium">Sessions</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">Active within the last 24 hours</p>
          </div>

          {/* Card 2: Total In-Cart Value */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase">In-Cart Pipeline Value</span>
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
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

          {/* Card 3: Most In-Demand Product */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase">Top In-Demand Item</span>
              <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="truncate">
              <span className="text-lg font-serif font-medium text-zinc-900 truncate block">
                {mostInDemandProduct}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">Sitting in most active carts</p>
          </div>

          {/* Card 4: Abandoned Carts */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase">Abandoned Carts</span>
              <div className="w-7 h-7 rounded-md bg-red-50 text-red-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-light text-zinc-900">{abandonedSessionsCount}</span>
              <span className="text-xs text-red-600 font-medium">Sessions (&gt;24h)</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">No activity in over 24 hours</p>
          </div>

        </div>

        {/* Tab & Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
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

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search session ID, IP, city, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="bg-white rounded-xl border border-zinc-200/80 p-12 text-center text-zinc-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
            <p className="text-xs font-medium">Fetching real-time active cart data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-xs">
            <p className="font-semibold mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Error loading active carts
            </p>
            <p>{error}</p>
          </div>
        ) : activeTab === "sessions" ? (
          /* TAB 1: Active Cart Sessions Table */
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
                              {formatDistanceToNow(parseISO(session.lastActive), { addSuffix: true })}
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
          /* TAB 2: Product Demand Breakdown */
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
    </AdminLayout>
  );
}
