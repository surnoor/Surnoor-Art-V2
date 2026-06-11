import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ShoppingBag, Users, Eye } from "lucide-react";
import AdminLayout from "./AdminLayout";

const data = [
  { name: "Mon", revenue: 400 },
  { name: "Tue", revenue: 300 },
  { name: "Wed", revenue: 900 },
  { name: "Thu", revenue: 200 },
  { name: "Fri", revenue: 1500 },
  { name: "Sat", revenue: 1200 },
];

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <div className="bg-background border border-border p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-card rounded-sm">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <span className={`text-[10px] items-center flex gap-1 font-medium ${trend === 'up' ? 'text-green-600' : 'text-primary'}`}>
        {change} {trend === 'up' ? '↑' : '↓'}
      </span>
    </div>
    <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">{title}</p>
    <h3 className="text-3xl font-serif">{value}</h3>
  </div>
);

export default function Dashboard() {
  return (
    <AdminLayout>
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif mb-2">Morning, Surnoor.</h1>
        <p className="text-sm text-muted-foreground">Here is what happened with your gallery today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Revenue" value="$4,250" change="12%" trend="up" icon={TrendingUp} />
        <StatCard title="New Orders" value="12" change="5%" trend="up" icon={ShoppingBag} />
        <StatCard title="Site Visitors" value="2,450" change="3%" trend="down" icon={Users} />
        <StatCard title="Product Views" value="8,120" change="18%" trend="up" icon={Eye} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-background border border-border p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-serif">Revenue Overview</h2>
            <select className="bg-card text-[10px] px-3 py-1.5 uppercase tracking-widest border-none outline-none cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B6E4E" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8B6E4E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E3DC" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#7A7870'}} 
                  dy={10}
                />
                <YAxis 
                  hide={true} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#EFEDE6', 
                    border: 'none', 
                    fontSize: '10px', 
                    borderRadius: '0px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8B6E4E" 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-background border border-border p-8">
          <h2 className="text-xl font-serif mb-8">Recent Activity</h2>
          <div className="space-y-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-card flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">New purchase: "Silent River"</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
