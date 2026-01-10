"use client"

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis , Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 5390 },
  { name: 'Sun', sales: 3490 },
];

export default function SalesReports() {
  const [isMounted, setIsMounted] = useState(false);

  // Iwas hydration error sa Recharts + Next.js
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary">
        Sales Performance
      </h2>
      
      {/* Pinalitan ang h-[350px] ng h-96 para sa standard Tailwind class */}
      <div className="h-96 w-full bg-card p-4 rounded-2xl border shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 12, fontWeight: 'bold'}}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 12}}
              tickFormatter={(value) => `₱${value}`}
            />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Bar 
              dataKey="sales" 
              fill="hsl(var(--primary))" 
              radius={[6, 6, 0, 0]} 
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}