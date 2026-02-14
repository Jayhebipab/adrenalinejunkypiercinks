"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
import {
  Activity,
  BarChart3,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Menu,
  Percent,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Eye,
} from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  description?: string;
}

interface ChartCardProps {
  title: string;
  description: string;
  data: Array<{ name: string; value: number }>;
  dataKey: string;
  height?: number;
}

interface DetailItem {
  label: string;
  value: string;
  subtitle: string;
}

interface DetailedCardProps {
  title: string;
  items: DetailItem[];
}

// ============================================================================
// STATIC CHART DATA
// ============================================================================

const USER_GROWTH_DATA = [
  { name: "Jan", value: 2400 },
  { name: "Feb", value: 3210 },
  { name: "Mar", value: 2290 },
  { name: "Apr", value: 2780 },
  { name: "May", value: 3181 },
  { name: "Jun", value: 3500 },
  { name: "Jul", value: 4100 },
  { name: "Aug", value: 4200 },
  { name: "Sep", value: 3890 },
  { name: "Oct", value: 4500 },
  { name: "Nov", value: 4800 },
  { name: "Dec", value: 5200 },
];

const REVENUE_TREND_DATA = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 4500 },
  { name: "Mar", value: 4200 },
  { name: "Apr", value: 5780 },
  { name: "May", value: 5890 },
  { name: "Jun", value: 6390 },
  { name: "Jul", value: 7490 },
  { name: "Aug", value: 8200 },
  { name: "Sep", value: 7800 },
  { name: "Oct", value: 9200 },
  { name: "Nov", value: 9800 },
  { name: "Dec", value: 10500 },
];

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Enhanced Metric Card
function MetricCard({ label, value, change, trend, icon, description }: MetricCardProps) {
  const isPositive = trend === "up";
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl transition-all hover:border-border/60 hover:shadow-2xl hover:shadow-primary/5"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 -z-10" />

      {/* Animated shine effect */}
      <div className="absolute inset-0 -translate-x-full transition-transform duration-1000 group-hover:translate-x-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />

      <div className="relative space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 backdrop-blur-sm ring-1 ring-border/50">
            <div className="text-orange-500 dark:text-orange-400">{icon}</div>
          </div>
          
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-sm ${
              isPositive
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                : "bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/20"
            }`}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {change}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-black tracking-tight text-foreground">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground/70">{description}</p>
          )}
        </div>
      </div>

      {/* Corner accent */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-orange-500/10 to-purple-500/10 blur-2xl transition-all duration-500 group-hover:scale-150" />
    </motion.div>
  );
}

// Enhanced Chart Card
function ChartCard({ title, description, data, dataKey, height = 320 }: ChartCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/50 p-8 backdrop-blur-xl transition-all hover:border-border/60 hover:shadow-2xl hover:shadow-primary/5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 -z-10" />

      <div className="relative space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/70">
                {title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground backdrop-blur-sm ring-1 ring-border/50 transition-all hover:bg-muted hover:text-foreground">
            <Eye className="h-4 w-4" />
          </button>
        </div>

        <div style={{ width: "100%", height: height }} className="relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradient-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgb(249, 115, 22)" />
                  <stop offset="100%" stopColor="rgb(168, 85, 247)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/30" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="currentColor"
                className="text-muted-foreground"
                style={{ fontSize: "11px", fontWeight: "600" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="currentColor"
                className="text-muted-foreground"
                style={{ fontSize: "11px", fontWeight: "600" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  backdropFilter: "blur(12px)",
                  padding: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                cursor={{ stroke: "rgb(249, 115, 22)", strokeOpacity: 0.2, strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="url(#gradient-line)"
                strokeWidth={3}
                fill={`url(#gradient-${title})`}
                dot={false}
                activeDot={{ r: 6, fill: "rgb(249, 115, 22)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

// Enhanced Detailed Card
function DetailedCard({ title, items }: DetailedCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl transition-all hover:border-border/60 hover:shadow-2xl hover:shadow-primary/5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 -z-10" />

      <div className="relative space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-500" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/70">
            {title}
          </h3>
        </div>

        <div className="space-y-2.5">
          {items.map((item, index) => (
            <motion.button
              key={`${item.label}-${index}`}
              whileHover={{ x: 6 }}
              transition={{ duration: 0.2 }}
              className="group/item w-full text-left"
            >
              <div className="flex items-center justify-between rounded-2xl border border-border/30 bg-muted/20 p-4 backdrop-blur-sm transition-all hover:border-border/50 hover:bg-muted/40">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-bold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-black text-orange-500 dark:text-orange-400">{item.value}</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-all group-hover/item:translate-x-1 group-hover/item:text-orange-500" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export function DashboardHome() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Enhanced background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[140px]" />
        <div className="absolute top-1/2 left-1/4 h-[400px] w-[400px] rounded-full bg-pink-500/5 dark:bg-pink-500/3 blur-[130px]" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Main Content */}
      <div className="relative px-6 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl">
          
          {/* Compact header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
                Analytics
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">Real-time performance insights</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:border-border hover:bg-muted"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:border-border hover:bg-muted"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Dashboard Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Total Users"
                value="24,582"
                change="+12.5%"
                trend="up"
                icon={<Users className="h-5 w-5" />}
                description="Active this month"
              />
              <MetricCard
                label="Active Now"
                value="8,924"
                change="+8.2%"
                trend="up"
                icon={<Zap className="h-5 w-5" />}
                description="Live sessions"
              />
              <MetricCard
                label="Conversion"
                value="3.47%"
                change="-1.3%"
                trend="down"
                icon={<Percent className="h-5 w-5" />}
                description="Last 30 days"
              />
              <MetricCard
                label="Revenue"
                value="$47,320"
                change="+24.8%"
                trend="up"
                icon={<DollarSign className="h-5 w-5" />}
                description="This month"
              />
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="User Growth"
                description="Monthly active users"
                data={USER_GROWTH_DATA}
                dataKey="value"
              />
              <ChartCard
                title="Revenue Trend"
                description="Monthly revenue performance"
                data={REVENUE_TREND_DATA}
                dataKey="value"
              />
            </div>

            {/* Details */}
            <div className="grid gap-6 lg:grid-cols-3">
              <DetailedCard
                title="Top Pages"
                items={[
                  { label: "Homepage", value: "12.5k", subtitle: "visits today" },
                  { label: "Dashboard", value: "8.3k", subtitle: "visits today" },
                  { label: "Settings", value: "4.1k", subtitle: "visits today" },
                ]}
              />
              <DetailedCard
                title="Traffic Sources"
                items={[
                  { label: "Organic Search", value: "68.5%", subtitle: "Google, Bing" },
                  { label: "Direct", value: "18.2%", subtitle: "URL entry" },
                  { label: "Referrals", value: "9.3%", subtitle: "External links" },
                ]}
              />
              <DetailedCard
                title="Recent Events"
                items={[
                  { label: "Login Spike", value: "Now", subtitle: "2.5k users online" },
                  { label: "Deploy v2.1", value: "2h ago", subtitle: "Production" },
                  { label: "Bug Fixed", value: "5h ago", subtitle: "Critical issue" },
                ]}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}