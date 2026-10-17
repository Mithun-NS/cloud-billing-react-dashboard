import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  Database,
  HardDrive,
  Plus,
  Search,
  Filter,
  Play,
  Square,
  RotateCw,
  Sliders,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Radio,
  Cpu,
  Layers,
  Globe,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useCloud } from '../context/CloudContext';

// Pure pricing calculator utility
const calculateDynamicCost = (specs) => {
  const vcpuCost = (specs.vcpu || 1) * 400;
  const ramCost = (specs.ramGb || 1) * 150;
  const diskCost = Math.round((specs.diskGb || 20) * 2.2);
  return vcpuCost + ramCost + diskCost;
};

// Pure icon selector utility
const getServiceIcon = (type) => {
  switch (type) {
    case 'Managed Database':
      return Database;
    case 'Block Storage':
      return HardDrive;
    default:
      return Server;
  }
};

export default function Services() {
  const {
    services,
    updateServiceStatus,
    resizeService,
    terminateService,
  } = useCloud();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'suspended' | 'provisioning'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'Compute VM' | 'Managed Database' | 'Block Storage'

  // Clipboard copy state
  const [copiedIp, setCopiedIp] = useState(null);
  const copyTimeoutRef = useRef(null);

  // Temporary rebooting instances tracker (for realistic 2.5s ACPI reboot simulation)
  const [rebootingIds, setRebootingIds] = useState(new Set());
  const rebootTimeoutsRef = useRef({});

  // Clean up all pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      Object.values(rebootTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  // Modal States
  const [selectedService, setSelectedService] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);

  // Resize Slider State
  const [resizeSpecs, setResizeSpecs] = useState({
    vcpu: 2,
    ramGb: 4,
    diskGb: 80,
  });

  // Optimized single-pass cluster metrics calculation
  const clusterStats = useMemo(() => {
    let active = 0;
    let suspended = 0;
    let totalVcpu = 0;
    let totalRam = 0;

    for (let i = 0; i < services.length; i++) {
      const s = services[i];
      if (s.status === 'active') active++;
      else if (s.status === 'suspended') suspended++;
      totalVcpu += s.specs?.vcpu || 0;
      totalRam += s.specs?.ramGb || 0;
    }

    return { active, suspended, totalVcpu, totalRam };
  }, [services]);

  // Memoized Filtered Services List
  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.ipAddress.includes(query) ||
        (service.privateIp && service.privateIp.includes(query)) ||
        service.regionLabel.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' || service.status === statusFilter;

      const matchesType =
        typeFilter === 'all' || service.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [services, searchQuery, statusFilter, typeFilter]);

  // Memoized Handlers
  const handleCopyIp = useCallback((ip) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedIp(null), 2000);
  }, []);

  const handlePowerToggle = useCallback((service) => {
    if (service.status === 'active') {
      updateServiceStatus(service._id, 'suspended');
    } else {
      updateServiceStatus(service._id, 'active');
    }
  }, [updateServiceStatus]);

  const handleReboot = useCallback((service) => {
    if (rebootingIds.has(service._id)) return;

    setRebootingIds((prev) => new Set(prev).add(service._id));

    if (rebootTimeoutsRef.current[service._id]) {
      clearTimeout(rebootTimeoutsRef.current[service._id]);
    }

    rebootTimeoutsRef.current[service._id] = setTimeout(() => {
      setRebootingIds((prev) => {
        const next = new Set(prev);
        next.delete(service._id);
        return next;
      });
      delete rebootTimeoutsRef.current[service._id];
      updateServiceStatus(service._id, 'active');
    }, 2400);
  }, [rebootingIds, updateServiceStatus]);

  const openResizeModal = useCallback((service) => {
    setSelectedService(service);
    setResizeSpecs({
      vcpu: service.specs?.vcpu || 2,
      ramGb: service.specs?.ramGb || 4,
      diskGb: service.specs?.diskGb || 80,
    });
    setIsResizeOpen(true);
  }, []);

  const handleApplyResize = useCallback(() => {
    if (!selectedService) return;
    const newMonthlyCost = calculateDynamicCost(resizeSpecs);
    resizeService(selectedService._id, resizeSpecs, newMonthlyCost);
    setIsResizeOpen(false);
  }, [selectedService, resizeSpecs, resizeService]);

  const openDetailsModal = useCallback((service) => {
    setSelectedService(service);
    setIsDetailsOpen(true);
  }, []);

  const openTerminateModal = useCallback((service) => {
    setSelectedService(service);
    setIsTerminateOpen(true);
  }, []);

  const handleConfirmTerminate = useCallback(() => {
    if (!selectedService) return;
    terminateService(selectedService._id);
    setIsTerminateOpen(false);
  }, [selectedService, terminateService]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Cloud Services & Compute Nodes
            </h1>
            <Badge variant="primary" size="sm">
              {services.length} Total Nodes
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage provisioned virtual machines, database clusters, and block storage instances.
          </p>
        </div>
        <Link to="/deploy">
          <Button variant="primary" size="sm" iconLeft={Plus}>
            New Server Instance
          </Button>
        </Link>
      </div>

      {/* Quick Summary Strip (Single-pass memoized) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400">Active Instances</span>
          <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
            {clusterStats.active}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400">Suspended / Stopped</span>
          <p className="text-xl font-bold text-rose-400 font-mono mt-0.5">
            {clusterStats.suspended}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400">Total vCPU Cores</span>
          <p className="text-xl font-bold text-white font-mono mt-0.5">
            {clusterStats.totalVcpu} Cores
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400">Total Allocated RAM</span>
          <p className="text-xl font-bold text-cyan-400 font-mono mt-0.5">
            {clusterStats.totalRam} GB
          </p>
        </div>
      </div>

      {/* Main Services Card */}
      <Card
        title="Compute Instances Grid"
        subtitle="Searchable and filterable data plane with remote power operations"
        icon={Server}
        action={
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredServices.length} of {services.length}
          </span>
        }
      >
        {/* Search & Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by server name, public IP, region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status and Type Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Pills */}
            <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              {['all', 'active', 'suspended', 'provisioning'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors font-medium text-[11px] ${
                    statusFilter === st
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Type Filter Select */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Service Types</option>
              <option value="Compute VM">Compute VM</option>
              <option value="Managed Database">Managed Database</option>
              <option value="Block Storage">Block Storage</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-3 font-semibold">Instance & OS</th>
                <th className="pb-3 font-semibold">IP Address</th>
                <th className="pb-3 font-semibold">Region</th>
                <th className="pb-3 font-semibold">Specifications</th>
                <th className="pb-3 font-semibold">Monthly Cost</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Power & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Server className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-medium text-slate-300">No compute instances match your filter</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting the search terms or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => {
                  const Icon = getServiceIcon(service.type);
                  const isRebooting = rebootingIds.has(service._id);

                  return (
                    <tr
                      key={service._id}
                      className="hover:bg-slate-850/40 transition-colors group"
                    >
                      {/* 1. Instance & OS */}
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 group-hover:border-cyan-500/30 transition-colors shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <button
                              onClick={() => openDetailsModal(service)}
                              className="font-semibold text-slate-200 hover:text-cyan-400 text-left transition-colors font-mono truncate max-w-[170px] block cursor-pointer"
                            >
                              {service.name}
                            </button>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {service.os} • {service.type}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. IP Addresses */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col font-mono text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <span>{service.ipAddress}</span>
                            <button
                              onClick={() => handleCopyIp(service.ipAddress)}
                              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Copy Public IP"
                            >
                              {copiedIp === service.ipAddress ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          {service.privateIp && (
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Int: {service.privateIp}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Region */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {service.region === 'ap-south-1'
                              ? '🇮🇳'
                              : service.region === 'ap-southeast-1'
                              ? '🇸🇬'
                              : service.region === 'eu-central-1'
                              ? '🇩🇪'
                              : '🇺🇸'}
                          </span>
                          <div>
                            <p className="text-slate-300 font-medium">{service.regionLabel}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{service.region}</p>
                          </div>
                        </div>
                      </td>

                      {/* 4. Specifications */}
                      <td className="py-3.5 px-3 font-mono text-[11px]">
                        <div className="space-y-0.5">
                          <span className="text-slate-200 font-medium">
                            {service.specs?.vcpu || 0} vCPU • {service.specs?.ramGb || 0} GB RAM
                          </span>
                          <p className="text-slate-400 text-[10px]">
                            {service.specs?.diskGb || 0} GB NVMe • {service.specs?.bandwidthTb || 0} TB Net
                          </p>
                        </div>
                      </td>

                      {/* 5. Monthly Cost */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono">
                          <span className="text-white font-bold text-xs">
                            ₹{service.monthlyCost.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            ₹{service.hourlyCost}/hr
                          </span>
                        </div>
                      </td>

                      {/* 6. Status Badge */}
                      <td className="py-3.5 px-3">
                        {isRebooting ? (
                          <Badge variant="info" size="xs">
                            <RotateCw className="w-3 h-3 animate-spin mr-1 text-cyan-400" />
                            Rebooting...
                          </Badge>
                        ) : (
                          <Badge
                            variant={service.status}
                            size="xs"
                            dot={service.status === 'active'}
                          >
                            <span className="capitalize">{service.status}</span>
                          </Badge>
                        )}
                      </td>

                      {/* 7. Action Buttons */}
                      <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Power Start/Stop */}
                          <button
                            onClick={() => handlePowerToggle(service)}
                            disabled={isRebooting || service.status === 'provisioning'}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              service.status === 'active'
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20 hover:border-rose-500/40'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40'
                            }`}
                            title={service.status === 'active' ? 'Power Off / Stop' : 'Power On / Start'}
                          >
                            {service.status === 'active' ? (
                              <Square className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                          </button>

                          {/* Reboot Button */}
                          <button
                            onClick={() => handleReboot(service)}
                            disabled={service.status !== 'active' || isRebooting}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Graceful ACPI Reboot"
                          >
                            <RotateCw
                              className={`w-3.5 h-3.5 ${isRebooting ? 'animate-spin text-cyan-400' : ''}`}
                            />
                          </button>

                          {/* Dynamic Scaling Slider Modal */}
                          <button
                            onClick={() => openResizeModal(service)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer"
                            title="Modify Plan & Scale Specs"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* Technical Specs Info */}
                          <button
                            onClick={() => openDetailsModal(service)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer"
                            title="View Technical Specs"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          {/* Terminate Instance */}
                          <button
                            onClick={() => openTerminateModal(service)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                            title="Terminate Node"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 1. Dynamic Plan Scaling Slider Modal */}
      <Modal
        isOpen={isResizeOpen}
        onClose={() => setIsResizeOpen(false)}
        title="Dynamic Plan Modification & Scaling"
        subtitle={`Live hardware resizing for node: ${selectedService?.name || ''}`}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResizeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft={CheckCircle2}
              onClick={handleApplyResize}
            >
              Apply Scaled Specs
            </Button>
          </>
        }
      >
        {selectedService && (
          <div className="space-y-6">
            {/* Live Pricing Comparison Banner */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Current Cost:</span>
                <p className="text-base font-bold text-slate-300 font-mono">
                  ₹{selectedService.monthlyCost.toLocaleString()}/mo
                </p>
              </div>
              <div className="text-center font-mono text-slate-500">➔</div>
              <div className="text-right">
                <span className="text-xs text-cyan-400 font-semibold">New Scaled Cost:</span>
                <p className="text-xl font-bold text-cyan-300 font-mono">
                  ₹{calculateDynamicCost(resizeSpecs).toLocaleString()}/mo
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  ₹{(calculateDynamicCost(resizeSpecs) / 720).toFixed(2)}/hr
                </span>
              </div>
            </div>

            {/* Slider 1: vCPU Cores */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Compute Cores (vCPU)
                </label>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                  {resizeSpecs.vcpu} vCPU
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                step="1"
                value={resizeSpecs.vcpu}
                onChange={(e) =>
                  setResizeSpecs((prev) => ({ ...prev, vcpu: Number(e.target.value) }))
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1 vCPU (Nano)</span>
                <span>8 vCPU (Enterprise)</span>
                <span>16 vCPU (Max)</span>
              </div>
            </div>

            {/* Slider 2: RAM Allocation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  System Memory (RAM)
                </label>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                  {resizeSpecs.ramGb} GB RAM
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="64"
                step="1"
                value={resizeSpecs.ramGb}
                onChange={(e) =>
                  setResizeSpecs((prev) => ({ ...prev, ramGb: Number(e.target.value) }))
                }
                className="w-full accent-indigo-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1 GB</span>
                <span>16 GB</span>
                <span>32 GB</span>
                <span>64 GB</span>
              </div>
            </div>

            {/* Slider 3: NVMe Storage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-200 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  NVMe SSD Disk Volume
                </label>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                  {resizeSpecs.diskGb} GB
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="1000"
                step="10"
                value={resizeSpecs.diskGb}
                onChange={(e) =>
                  setResizeSpecs((prev) => ({ ...prev, diskGb: Number(e.target.value) }))
                }
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>20 GB</span>
                <span>250 GB</span>
                <span>500 GB</span>
                <span>1000 GB (1 TB)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Hot-plug CPU and RAM scaling applied with zero downtime. Storage expansions will automatically expand the root filesystem.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. Technical Specs Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Technical Specifications & Diagnostics"
        subtitle={`KVM Virtual Machine Configuration — ${selectedService?.name || ''}`}
        size="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>
            Close Diagnostics
          </Button>
        }
      >
        {selectedService && (
          <div className="space-y-5">
            {/* Top overview chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Virtualization</span>
                <p className="font-mono font-semibold text-white mt-0.5">KVM / QEMU 8.2</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Architecture</span>
                <p className="font-mono font-semibold text-white mt-0.5">x86_64 (AVX-512)</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Uptime</span>
                <p className="font-mono font-semibold text-emerald-400 mt-0.5">
                  {selectedService.metrics?.uptimeDays || 0} days continuous
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Auto-Renew</span>
                <p className="font-mono font-semibold text-cyan-400 mt-0.5">Enabled</p>
              </div>
            </div>

            {/* Network Configuration */}
            <div>
              <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Network Interfaces & Routes
              </h4>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Public IPv4:</span>
                  <span className="text-white font-semibold">{selectedService.ipAddress}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Internal VPC Subnet:</span>
                  <span className="text-slate-300">{selectedService.privateIp || '10.0.1.15'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Gateway:</span>
                  <span className="text-slate-400">103.115.24.1 (Next-Hop)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">DNS Resolvers:</span>
                  <span className="text-slate-400">1.1.1.1, 8.8.8.8</span>
                </div>
              </div>
            </div>

            {/* Hardware allocation */}
            <div>
              <h4 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Hypervisor Resource Guarantees
              </h4>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Dedicated vCPUs:</span>
                  <span className="text-white">{selectedService.specs?.vcpu || 0} Cores (1:1 Allocation)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">ECC DDR5 RAM:</span>
                  <span className="text-white">{selectedService.specs?.ramGb || 0} GB Locked</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">IOPS Limit:</span>
                  <span className="text-white">15,000 Read / 10,000 Write IOPS</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Snapshot Schedule:</span>
                  <span className="text-emerald-400">Daily Automated at 04:00 UTC</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. Safe Terminate Confirmation Modal */}
      <Modal
        isOpen={isTerminateOpen}
        onClose={() => setIsTerminateOpen(false)}
        title="Confirm Instance Termination"
        subtitle="This action is permanent and cannot be undone"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTerminateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              iconLeft={Trash2}
              onClick={handleConfirmTerminate}
            >
              Permanently Terminate Node
            </Button>
          </>
        }
      >
        {selectedService && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">
                  You are terminating node: {selectedService.name}
                </p>
                <p className="mt-1 text-slate-300">
                  The virtual disk ({selectedService.specs?.diskGb || 0} GB NVMe) will be cryptographically erased and the public IPv4 ({selectedService.ipAddress}) will be released to the pool.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Instance Name:</span>
                <span className="text-white">{selectedService.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Monthly Run-rate Savings:</span>
                <span className="text-emerald-400 font-bold">-₹{selectedService.monthlyCost.toLocaleString()}/mo</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
