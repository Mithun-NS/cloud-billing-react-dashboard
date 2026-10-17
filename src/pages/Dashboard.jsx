import React from 'react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { LayoutDashboard, Plus, ArrowUpRight, Server, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Cloud Infrastructure Overview
            </h1>
            <Badge variant="active" dot>
              Live Telemetry
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-tenant resource utilization, billing run-rate, and hypervisor health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/deploy">
            <Button variant="primary" iconLeft={Plus}>
              Deploy Instance
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metric Cards Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Monthly Run Rate</span>
            <span className="text-emerald-400 font-mono flex items-center">
              +4.2% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            ₹18,450<span className="text-sm font-normal text-slate-400">/mo</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            MTD Projected: ₹21,800
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Cloud Instances</span>
            <Badge variant="active" size="xs" dot>Operational</Badge>
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            14 <span className="text-sm font-normal text-slate-400">/ 16 total</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            2 instances suspended
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Bandwidth Transfer</span>
            <span className="text-cyan-400 font-mono text-xs">Pool: 25 TB</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            6.42 <span className="text-sm font-normal text-slate-400">TB used</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            25.6% of monthly quota
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Outstanding Invoices</span>
            <Badge variant="warning" size="xs">1 Pending</Badge>
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            ₹3,240
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Due in 5 days (Net 15)
          </div>
        </Card>
      </div>

      {/* Main Graph & Feeds skeleton for Branch 1 */}
      <Card
        title="24-Hour Telemetry (CPU & Bandwidth)"
        subtitle="Aggregated time-series data from Proxmox/KVM hypervisors"
        icon={Zap}
      >
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-center p-6">
          <Server className="w-10 h-10 text-cyan-400 mb-3 animate-pulse" />
          <h4 className="text-base font-semibold text-slate-200">
            Telemetry Graph & Analytics Ready
          </h4>
          <p className="text-xs text-slate-400 max-w-md mt-1">
            Router and Layout shell verified. In the upcoming branch (`feat/overview-dashboard`), this section connects directly to interactive Recharts time-series data.
          </p>
        </div>
      </Card>
    </div>
  );
}
