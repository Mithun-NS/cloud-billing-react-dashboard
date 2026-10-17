import React, { useState, useCallback } from 'react';
import {
  Menu,
  Bell,
  BellOff,
  ChevronDown,
  Building2,
  CheckCircle2,
  Plus,
  Radio,
  ExternalLink,
  Shield,
  User,
  Wallet,
  CheckCheck,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Trash2,
  X,
  ArrowRight,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { useCloud } from '../../context/CloudContext';

export default function Topbar({
  onOpenSidebar,
  currentOrg,
  onOrgChange,
}) {
  const navigate = useNavigate();
  const {
    organization,
    notifications,
    markAllNotificationsRead,
    dismissNotification,
    clearAllNotifications,
  } = useCloud();

  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeOrg, setActiveOrg] = useState(currentOrg || organization.name);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  const formatTimeAgo = (timestamp) => {
    const diff = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (diff < 60) return `${Math.max(1, diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Explicit Named Handlers for Chrome DevTools Inspect & Debugging
  const cloudNotificationToggleFunction = useCallback(() => {
    setShowNotifications((prev) => {
      const next = !prev;
      console.info(
        `%c[CloudNotifications]%c ${next ? 'Opened' : 'Closed'} notification center (${unreadCount} unread)`,
        'color: #06b6d4; font-weight: bold;',
        'color: #67e8f9;'
      );
      return next;
    });
  }, [unreadCount]);

  const cloudNotificationMarkAllReadFunction = useCallback(() => {
    console.info('%c[CloudNotifications]%c Marked all notifications as read', 'color: #10b981; font-weight: bold;', 'color: #6ee7b7;');
    markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  const cloudNotificationDismissFunction = useCallback(
    (notifId, e) => {
      e.stopPropagation();
      console.info(`%c[CloudNotifications]%c Dismissed alert: ${notifId}`, 'color: #f59e0b; font-weight: bold;', 'color: #fde68a;');
      dismissNotification(notifId);
    },
    [dismissNotification]
  );

  const cloudNotificationClearAllFunction = useCallback(() => {
    console.info('%c[CloudNotifications]%c Cleared all alerts from history', 'color: #ef4444; font-weight: bold;', 'color: #fca5a5;');
    clearAllNotifications();
  }, [clearAllNotifications]);

  const cloudNotificationItemClickFunction = useCallback(
    (notif) => {
      if (notif.link) {
        navigate(notif.link);
      }
      setShowNotifications(false);
    },
    [navigate]
  );

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'alert':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      default:
        return <Activity className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <header
      id="infrapulse-topbar"
      data-component="Topbar"
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80"
    >
      {/* Left section: Mobile toggle & Org Switcher */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          id="btn-toggle-mobile-menu"
          onClick={onOpenSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 lg:hidden transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Organization Switcher Dropdown */}
        <div className="relative">
          <button
            id="btn-org-switcher"
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-xs text-slate-200 transition-all cursor-pointer shadow-sm shadow-slate-950/50"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-100 max-w-[130px] sm:max-w-[180px] truncate">
                {activeOrg}
              </span>
              <span className="text-[10px] text-slate-400">
                {orgs.find((o) => o.name === activeOrg)?.region || 'Mumbai'} Region
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Org Switcher Menu */}
          {showOrgDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowOrgDropdown(false)}
              />
              <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Select Tenant Cluster
                  </p>
                </div>
                <div className="py-1">
                  {orgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleSelectOrg(org)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                        activeOrg === org.name
                          ? 'bg-cyan-500/10 text-cyan-300'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{org.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {org.tier} • {org.region}
                        </p>
                      </div>
                      {activeOrg === org.name && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Global Cluster Status Pill */}
        <div
          id="pill-cluster-status"
          className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
        >
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
        {/* Wallet Balance Pill */}
        <Link
          id="pill-wallet-balance"
          to="/billing"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium transition-all cursor-pointer"
          title="Prepaid Credit Balance"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span className="font-mono font-bold">
            ₹{organization.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </Link>

        {/* Quick Deploy Button */}
        <Link to="/deploy" id="btn-quick-deploy-vm" className="hidden sm:block">
          <Button
            size="sm"
            variant="primary"
            iconLeft={Plus}
            className="shadow-sm shadow-cyan-500/20"
          >
            Deploy VM
          </Button>
        </Link>

        {/* Notifications Icon Button & Interactive Dropdown */}
        <div className="relative">
          <button
            id="btn-cluster-notifications"
            data-action="toggle-notifications"
            data-function="cloudNotificationToggleFunction"
            onClick={cloudNotificationToggleFunction}
            className={`relative p-2 rounded-xl transition-all cursor-pointer ${
              showNotifications
                ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-850 border border-transparent'
            }`}
            aria-label="View notifications"
            title="Cluster Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            )}
          </button>

          {/* Interactive Notifications Center Dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div
                id="dropdown-cluster-notifications"
                data-component="NotificationCenter"
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">
                      Cluster Alerts & Events
                    </span>
                    {unreadCount > 0 ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {unreadCount} New
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">All caught up</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      id="btn-mark-all-read"
                      data-action="mark-all-read"
                      data-function="cloudNotificationMarkAllReadFunction"
                      onClick={cloudNotificationMarkAllReadFunction}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-850/60 font-sans">
                  {notifications.length === 0 ? (
                    <div className="py-10 px-4 text-center text-slate-400">
                      <BellOff className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-300">No active cluster alerts</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        All hypervisor telemetry and billing streams are running normally.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        id={`notif-item-${notif._id}`}
                        data-function="cloudNotificationItemClickFunction"
                        onClick={() => cloudNotificationItemClickFunction(notif)}
                        className={`p-3.5 flex items-start gap-3 hover:bg-slate-900/60 transition-colors cursor-pointer group relative ${
                          !notif.read ? 'bg-cyan-950/20' : ''
                        }`}
                      >
                        {/* Type Icon */}
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                          {getNotifIcon(notif.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate block">
                              {notif.title}
                            </span>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            {formatTimeAgo(notif.timestamp)}
                          </span>
                        </div>

                        {/* Dismiss Button */}
                        <button
                          id={`btn-dismiss-notif-${notif._id}`}
                          data-action="dismiss-notif"
                          data-function="cloudNotificationDismissFunction"
                          onClick={(e) => cloudNotificationDismissFunction(notif._id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all absolute right-3 top-3 cursor-pointer"
                          title="Dismiss notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      id="btn-clear-all-notifs"
                      data-action="clear-all-notifs"
                      data-function="cloudNotificationClearAllFunction"
                      onClick={cloudNotificationClearAllFunction}
                      className="text-slate-400 hover:text-rose-400 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear all
                    </button>
                    <Link
                      to="/"
                      onClick={() => setShowNotifications(false)}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium flex items-center gap-1"
                    >
                      View Audit Log
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* User Profile Switcher */}
        <div className="relative">
          <button
            id="btn-user-profile-menu"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-bold text-xs ring-2 ring-slate-800">
              {organization.contactName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-none">
                {organization.contactName}
              </span>
              <span className="text-[10px] text-cyan-400 font-medium mt-0.5">
                Tenant {organization.role}
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
                  <p className="text-xs font-semibold text-white">{organization.contactName}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {organization.billingEmail}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    RBAC: {organization.role}
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
