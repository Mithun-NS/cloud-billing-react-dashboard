import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Server,
  Zap,
  Activity,
  ArrowUpRight,
  Plus,
  Wallet,
  Receipt,
  HelpCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Cpu,
  Globe,
  Radio,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useCloud } from '../context/CloudContext';

// Custom sleek Recharts Tooltip
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3.5 rounded-xl border border-slate-700/80 shadow-2xl text-xs space-y-2 min-w-[180px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-mono text-slate-400">Time: {label} UTC</span>
          <span className="text-[10px] text-cyan-400 font-semibold uppercase">Telemetry</span>
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300 font-medium">{entry.name}:</span>
            </div>
            <span className="font-mono font-bold text-white">
              {entry.value}
              {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const {
    organization,
    services,
    usageHistory,
    invoices,
    auditLogs,
    topUpWallet,
  } = useCloud();

  // Metrics calculation
  const totalServices = services.length;
  const activeServices = services.filter((s) => s.status === 'active').length;
  const suspendedServices = services.filter((s) => s.status === 'suspended').length;
  const provisioningServices = services.filter((s) => s.status === 'provisioning').length;

  const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid');
  const pendingInvoiceTotal = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  const monthlyRunRate = services
    .filter((s) => s.status !== 'suspended')
    .reduce((sum, s) => sum + s.monthlyCost, 0);

  // Bandwidth calculation
  const bandwidthQuota = organization.bandwidthQuotaTb || 25;
  const bandwidthUsed = organization.bandwidthUsedTb || 6.42;
  const bandwidthPercent = Math.min(100, Math.round((bandwidthUsed / bandwidthQuota) * 100));

  // State for Chart metric view filter
  const [metricView, setMetricView] = useState('combined'); // 'combined' | 'cpu' | 'bandwidth'

  // Quick Top-Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('5000');
  const [topUpMethod, setTopUpMethod] = useState('UPI Instant Transfer');
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  const handleTopUpSubmit = (e) => {
    e.preventDefault();
    const amount = Number(topUpAmount);
    if (amount > 0) {
      topUpWallet(amount, topUpMethod);
      setTopUpSuccess(true);
      setTimeout(() => {
        setTopUpSuccess(false);
        setIsTopUpOpen(false);
      }, 1200);
    }
  };

  const getActionBadgeVariant = (action) => {
    switch (action) {
      case 'SERVER_REBOOT':
        return 'info';
      case 'SERVER_SUSPEND':
      case 'SERVER_STOP':
        return 'danger';
      case 'AUTO_SNAPSHOT':
        return 'primary';
      case 'WALLET_TOPUP':
        return 'success';
      case 'SERVICE_PROVISION':
        return 'active';
      case 'SERVICE_RESIZE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatActionName = (action) => {
    return action
      .replace('SERVER_', '')
      .replace('SERVICE_', '')
      .replace('_', ' ');
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Cloud Infrastructure Overview
            </h1>
            <Badge variant="active" size="sm" dot>
              Live Telemetry
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multi-tenant resource utilization, billing run-rate, and hypervisor health.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            iconLeft={Wallet}
            onClick={() => setIsTopUpOpen(true)}
          >
            Top-up Credits
          </Button>
          <Link to="/deploy">
            <Button variant="primary" size="sm" iconLeft={Plus}>
              Deploy Instance
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Run Rate */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Monthly Run Rate</span>
            <span className="text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +4.2% MTD
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono flex items-baseline gap-1">
            <span>₹{monthlyRunRate.toLocaleString('en-IN')}</span>
            <span className="text-xs font-normal text-slate-400 font-sans">/mo</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Prepaid Balance:</span>
            <span className="font-mono font-semibold text-emerald-400">
              ₹{organization.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>

        {/* Card 2: Active Instances */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Compute Instances</span>
            <Badge variant="active" size="xs" dot>
              {activeServices} Online
            </Badge>
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono flex items-baseline gap-1.5">
            <span>{activeServices}</span>
            <span className="text-xs font-normal text-slate-400 font-sans">
              / {totalServices} total instances
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-3 text-[11px]">
            {provisioningServices > 0 && (
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-spin" />
                {provisioningServices} Provisioning
              </span>
            )}
            <span className="text-slate-400">
              {suspendedServices} suspended
            </span>
          </div>
        </Card>

        {/* Card 3: Bandwidth Consumed */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Bandwidth Transfer</span>
            <span className="text-cyan-400 font-mono text-[11px]">
              Pool: {bandwidthQuota} TB
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono flex items-baseline gap-1.5">
            <span>{bandwidthUsed}</span>
            <span className="text-xs font-normal text-slate-400 font-sans">
              TB used ({bandwidthPercent}%)
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${bandwidthPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{(bandwidthQuota - bandwidthUsed).toFixed(2)} TB left</span>
              <span>Resets on Nov 1</span>
            </div>
          </div>
        </Card>

        {/* Card 4: Outstanding Invoices */}
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Outstanding Invoices</span>
            {unpaidInvoices.length > 0 ? (
              <Badge variant="warning" size="xs">
                {unpaidInvoices.length} Due
              </Badge>
            ) : (
              <Badge variant="success" size="xs">
                Settled
              </Badge>
            )}
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            ₹{pendingInvoiceTotal.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <Link
              to="/billing"
              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Manage invoices</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
            <span className="text-slate-400 font-mono text-[10px]">Net 15 Terms</span>
          </div>
        </Card>
      </div>

      {/* Main Section: Interactive Recharts Graph */}
      <Card
        title="24-Hour Telemetry (CPU & Bandwidth)"
        subtitle="Aggregated time-series load from Proxmox/KVM hypervisors"
        icon={Zap}
        action={
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMetricView('combined')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                metricView === 'combined'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dual Axis
            </button>
            <button
              onClick={() => setMetricView('cpu')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                metricView === 'cpu'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CPU Load (%)
            </button>
            <button
              onClick={() => setMetricView('bandwidth')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                metricView === 'bandwidth'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bandwidth (GB)
            </button>
          </div>
        }
      >
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={usageHistory}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="bandwidthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="hour"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
                unit="%"
                domain={[0, 100]}
              />
              {metricView === 'combined' && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={{ stroke: '#334155' }}
                  unit="GB"
                  domain={[0, 100]}
                />
              )}
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
              />

              {(metricView === 'combined' || metricView === 'cpu') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="cpuPercent"
                  name="CPU Utilization"
                  unit="%"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cpuGradient)"
                  activeDot={{ r: 6, fill: '#06b6d4', stroke: '#083344', strokeWidth: 2 }}
                />
              )}

              {(metricView === 'combined' || metricView === 'bandwidth') && (
                <Area
                  yAxisId={metricView === 'combined' ? 'right' : 'left'}
                  type="monotone"
                  dataKey="bandwidthGb"
                  name="Network Traffic"
                  unit=" GB"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#bandwidthGradient)"
                  activeDot={{ r: 6, fill: '#818cf8', stroke: '#1e1b4b', strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Real-time telemetry footer stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400">Peak CPU (24h)</span>
            <p className="font-mono font-bold text-white mt-0.5">85.0% @ 15:00</p>
          </div>
          <div>
            <span className="text-slate-400">Avg Network Throughput</span>
            <p className="font-mono font-bold text-cyan-400 mt-0.5">38.4 GB/hr</p>
          </div>
          <div>
            <span className="text-slate-400">Total Active Connections</span>
            <p className="font-mono font-bold text-indigo-400 mt-0.5">5,820 peak</p>
          </div>
          <div>
            <span className="text-slate-400">Packet Drop Rate</span>
            <p className="font-mono font-bold text-emerald-400 mt-0.5">0.001% (Normal)</p>
          </div>
        </div>
      </Card>

      {/* Two Column Grid: Quick Actions & Cluster Regions vs Recent Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions + Datacenter Nodes */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <Card
            title="Quick Control Actions"
            subtitle="Frequent cluster management operations"
            icon={Zap}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              <Link to="/deploy" className="block">
                <div className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/30 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Deploy New VM</p>
                      <p className="text-[11px] text-slate-400">KVM Compute / DB</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
              </Link>

              <button
                onClick={() => setIsTopUpOpen(true)}
                className="w-full text-left p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Top-up Wallet Credits</p>
                    <p className="text-[11px] text-slate-400">Instant UPI / NetBanking</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              </button>

              <Link to="/billing" className="block">
                <div className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/30 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Download Invoices</p>
                      <p className="text-[11px] text-slate-400">GST-ready Tax Invoices</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </Link>

              <Link to="/services" className="block">
                <div className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/30 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Manage Servers</p>
                      <p className="text-[11px] text-slate-400">Power ops & scaling</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            </div>
          </Card>

          {/* Datacenter Regions Latency Card */}
          <Card
            title="Datacenter Edge Latency"
            subtitle="Multi-region hypervisor connectivity"
            icon={Globe}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🇮🇳</span>
                  <div>
                    <p className="text-xs font-semibold text-white">Mumbai, India</p>
                    <p className="text-[10px] text-slate-400 font-mono">ap-south-1</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    18ms
                  </span>
                  <p className="text-[10px] text-slate-400">Tier-4 DC</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🇸🇬</span>
                  <div>
                    <p className="text-xs font-semibold text-white">Singapore</p>
                    <p className="text-[10px] text-slate-400 font-mono">ap-southeast-1</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    45ms
                  </span>
                  <p className="text-[10px] text-slate-400">Tier-3 DC</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🇩🇪</span>
                  <div>
                    <p className="text-xs font-semibold text-white">Frankfurt, Germany</p>
                    <p className="text-[10px] text-slate-400 font-mono">eu-central-1</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-cyan-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    112ms
                  </span>
                  <p className="text-[10px] text-slate-400">ISO 27001</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (Span 2): Audit & Activity Logs Feed */}
        <div className="lg:col-span-2">
          <Card
            title="Security Audit & Activity Logs"
            subtitle="Immutable activity trails for provisioning, power, and finance"
            icon={Activity}
            action={
              <span className="text-[11px] font-mono text-slate-400">
                Live stream
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-3 font-semibold">Event</th>
                    <th className="pb-3 font-semibold">Target Resource</th>
                    <th className="pb-3 font-semibold">Details</th>
                    <th className="pb-3 font-semibold">Actor / IP</th>
                    <th className="pb-3 font-semibold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-850/50 transition-colors group"
                    >
                      <td className="py-3 pr-2">
                        <Badge
                          variant={getActionBadgeVariant(log.action)}
                          size="xs"
                        >
                          {formatActionName(log.action)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 font-mono font-medium text-slate-200">
                        {log.target}
                      </td>
                      <td className="py-3 px-2 text-slate-400 max-w-[200px] truncate">
                        {log.details}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="text-slate-300 font-medium">
                            {log.actor}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.ip}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pl-2 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {formatTimeAgo(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Audit logs encrypted & cryptographically chained
              </span>
              <span className="font-mono">Showing latest 5 entries</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Top-Up Wallet Modal */}
      <Modal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        title="Recharge Cloud Credit Balance"
        subtitle="Credits are immediately available to keep provisioned servers active"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTopUpOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft={CheckCircle2}
              onClick={handleTopUpSubmit}
              disabled={topUpSuccess}
            >
              {topUpSuccess ? 'Recharge Successful!' : `Confirm ₹${Number(topUpAmount || 0).toLocaleString()} Top-up`}
            </Button>
          </>
        }
      >
        <form onSubmit={handleTopUpSubmit} className="space-y-4">
          {topUpSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Wallet balance recharged successfully! State updated in localStorage.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Select Preset Recharge Amount (INR)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['2000', '5000', '10000'].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-semibold transition-all ${
                    topUpAmount === amt
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  ₹{Number(amt).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Or Custom Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">
                ₹
              </span>
              <input
                type="number"
                min="500"
                step="500"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                placeholder="Enter amount"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Payment Gateway Simulation
            </label>
            <select
              value={topUpMethod}
              onChange={(e) => setTopUpMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="UPI Instant Transfer">UPI Instant (GPay / PhonePe / QR)</option>
              <option value="HDFC Corporate NetBanking">HDFC Corporate NetBanking</option>
              <option value="ICICI Corporate NetBanking">ICICI Corporate NetBanking</option>
              <option value="Corporate Credit Card •••• 4829">Mastercard •••• 4829 (On File)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              18% GST input tax credit will be automatically generated and reflected on your next invoice statement.
            </span>
          </div>
        </form>
      </Modal>
    </div>
  );
}
