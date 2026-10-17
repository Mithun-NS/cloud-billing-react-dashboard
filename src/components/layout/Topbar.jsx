import React, { useState } from 'react';
import {
  Menu,
  Bell,
  ChevronDown,
  Building2,
  CheckCircle2,
  Plus,
  Radio,
  ExternalLink,
  Shield,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';

export default function Topbar({
  onOpenSidebar,
  currentOrg = 'Apex Cloud MSP (Prod)',
  onOrgChange,
}) {
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [activeOrg, setActiveOrg] = useState(currentOrg);

  const orgs = [
    { id: 'org_1', name: 'Apex Cloud MSP (Prod)', tier: 'Enterprise Tier', region: 'Mumbai' },
    { id: 'org_2', name: 'DevOps Staging Cluster', tier: 'Scale Tier', region: 'Singapore' },
    { id: 'org_3', name: 'Internal Sandbox', tier: 'Developer Tier', region: 'Frankfurt' },
  ];

  const handleSelectOrg = (org) => {
    setActiveOrg(org.name);
    setShowOrgDropdown(false);
    if (onOrgChange) onOrgChange(org);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      {/* Left section: Mobile toggle & Org Switcher */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Organization Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all text-left text-xs sm:text-sm"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-semibold text-slate-200 leading-none truncate max-w-[160px]">
                {activeOrg}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono mt-0.5">
                Multi-Tenant Org
              </span>
            </div>
            <span className="sm:hidden font-semibold text-slate-200 text-xs">
              Apex Cloud
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Org Dropdown menu */}
          {showOrgDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowOrgDropdown(false)}
              />
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-medium text-slate-400">
                  Switch Tenant / Organization
                </div>
                {orgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrg(org)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                      activeOrg === org.name ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold">{org.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {org.tier} • {org.region}
                      </p>
                    </div>
                    {activeOrg === org.name && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Global Cluster Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Cluster: ap-south-1</span>
          <span className="text-[10px] text-emerald-500/70 font-mono">18ms</span>
        </div>
      </div>

      {/* Right section: Quick actions, notifications, user profile */}
      <div className="flex items-center gap-3">
        {/* Quick Deploy Button */}
        <Link to="/deploy" className="hidden sm:block">
          <Button
            size="sm"
            variant="primary"
            iconLeft={Plus}
            className="shadow-sm shadow-cyan-500/20"
          >
            Deploy VM
          </Button>
        </Link>

        {/* Notifications Icon Button */}
        <button
          className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="View notifications"
          title="Cluster Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
        </button>

        {/* User Profile Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-bold text-xs ring-2 ring-slate-800">
              MN
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-none">
                Mithun N S
              </span>
              <span className="text-[10px] text-cyan-400 font-medium mt-0.5">
                Tenant Owner
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Menu */}
          {showUserDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <p className="text-xs font-semibold text-white">Mithun N S</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    admin@infrapulse.cloud
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    RBAC: Owner
                  </span>
                </div>
                <div className="py-1 text-xs text-slate-300">
                  <Link
                    to="/billing"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 hover:text-white"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    Billing & Tax Profiles
                  </Link>
                  <Link
                    to="/services"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 hover:text-white"
                  >
                    <Radio className="w-3.5 h-3.5 text-slate-400" />
                    Active Compute Nodes
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
