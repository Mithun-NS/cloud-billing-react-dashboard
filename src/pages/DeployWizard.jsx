import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Rocket,
  Globe,
  HardDrive,
  Cpu,
  Layers,
  Shield,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Server,
  Zap,
  Lock,
  Key,
  Info,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  Radio,
  FileText,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useCloud } from '../context/CloudContext';
import { cloudDeployProvisionFunction } from '../services/cloudApiService';

export default function DeployWizard() {
  const navigate = useNavigate();
  const { referenceData, deployService, organization } = useCloud();

  // Wizard active step (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [selectedRegion, setSelectedRegion] = useState('ap-south-1');
  const [selectedOs, setSelectedOs] = useState('ubuntu-24');
  const [selectedTier, setSelectedTier] = useState('c-standard');
  const [tierCategory, setTierCategory] = useState('all'); // 'all' | 'general' | 'cpu' | 'memory'

  // Storage and Add-ons
  const [nvmeStorage, setNvmeStorage] = useState(80);
  const [enableBackups, setEnableBackups] = useState(true);
  const [enableDdos, setEnableDdos] = useState(false);
  const [enableDedicatedIp, setEnableDedicatedIp] = useState(false);

  // Identity & Auth
  const [hostname, setHostname] = useState('prod-edge-node-01');
  const [authMethod, setAuthMethod] = useState('ssh'); // 'ssh' | 'password'
  const [sshKey, setSshKey] = useState('ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMithunCloudDeployKey2026');
  const [rootPassword, setRootPassword] = useState('InfraPulse@Secret2026!');
  const [showPassword, setShowPassword] = useState(false);

  // Provisioning Simulation State
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionProgress, setProvisionProgress] = useState(0);
  const [provisionStepText, setProvisionStepText] = useState('');
  const progressTimerRef = useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Reference lists from context with fallbacks
  const regions = useMemo(() => referenceData?.regions || [
    { id: 'ap-south-1', name: 'Mumbai, India', flag: '🇮🇳', latency: '18ms', tier: 'Tier-4 Datacenter' },
    { id: 'ap-southeast-1', name: 'Singapore', flag: '🇸🇬', latency: '45ms', tier: 'Tier-3 Datacenter' },
    { id: 'eu-central-1', name: 'Frankfurt, Germany', flag: '🇩🇪', latency: '112ms', tier: 'ISO 27001 Certified' },
    { id: 'us-east-1', name: 'N. Virginia, USA', flag: '🇺🇸', latency: '185ms', tier: 'Tier-4 Datacenter' },
  ], [referenceData]);

  const osImages = useMemo(() => referenceData?.osImages || [
    { id: 'ubuntu-24', name: 'Ubuntu 24.04 LTS', version: 'Noble Numbat', isPopular: true },
    { id: 'debian-12', name: 'Debian 12', version: 'Bookworm' },
    { id: 'rocky-9', name: 'Rocky Linux 9', version: 'RHEL-Compatible' },
    { id: 'windows-2022', name: 'Windows Server 2022', version: 'Standard Edition', licenseSurcharge: 800 },
  ], [referenceData]);

  const computeTiers = useMemo(() => referenceData?.computeTiers || [
    { id: 'c-nano', name: 'General Nano', vcpu: 1, ramGb: 1, diskGb: 25, bandwidthTb: 1.0, monthlyPrice: 450, hourlyPrice: 0.62 },
    { id: 'c-micro', name: 'General Micro', vcpu: 1, ramGb: 2, diskGb: 40, bandwidthTb: 2.0, monthlyPrice: 800, hourlyPrice: 1.11 },
    { id: 'c-standard', name: 'Compute Standard', vcpu: 2, ramGb: 4, diskGb: 80, bandwidthTb: 4.0, monthlyPrice: 1500, hourlyPrice: 2.08, isPopular: true },
    { id: 'c-pro', name: 'Compute Pro', vcpu: 4, ramGb: 8, diskGb: 160, bandwidthTb: 6.0, monthlyPrice: 2950, hourlyPrice: 4.10 },
    { id: 'c-enterprise', name: 'High-Memory Pro', vcpu: 8, ramGb: 16, diskGb: 320, bandwidthTb: 10.0, monthlyPrice: 5800, hourlyPrice: 8.05 },
    { id: 'c-max', name: 'Cluster-Max Heavy', vcpu: 8, ramGb: 32, diskGb: 500, bandwidthTb: 15.0, monthlyPrice: 9200, hourlyPrice: 12.78 },
  ], [referenceData]);

  // Current selections
  const currentRegion = useMemo(() => regions.find((r) => r.id === selectedRegion) || regions[0], [regions, selectedRegion]);
  const currentOs = useMemo(() => osImages.find((o) => o.id === selectedOs) || osImages[0], [osImages, selectedOs]);
  const currentTier = useMemo(() => computeTiers.find((t) => t.id === selectedTier) || computeTiers[2], [computeTiers, selectedTier]);

  // Adjust storage slider minimum when tier changes
  useEffect(() => {
    if (currentTier.diskGb && nvmeStorage < currentTier.diskGb) {
      setNvmeStorage(currentTier.diskGb);
    }
  }, [currentTier.diskGb, nvmeStorage]);

  // Filtered tiers based on category
  const filteredTiers = useMemo(() => {
    if (tierCategory === 'general') return computeTiers.filter((t) => t.ramGb <= 4);
    if (tierCategory === 'cpu') return computeTiers.filter((t) => t.vcpu >= 4 && t.ramGb <= 8);
    if (tierCategory === 'memory') return computeTiers.filter((t) => t.ramGb >= 16);
    return computeTiers;
  }, [computeTiers, tierCategory]);

  // Pricing Calculation
  const costBreakdown = useMemo(() => {
    const baseCompute = currentTier.monthlyPrice || 1500;
    const baseDisk = currentTier.diskGb || 80;
    const extraDiskGb = Math.max(0, nvmeStorage - baseDisk);
    const extraStorageCost = Math.round(extraDiskGb * 2.5); // ₹2.5/GB extra
    const osSurcharge = currentOs.licenseSurcharge || 0;
    const backupsCost = enableBackups ? 200 : 0;
    const ddosCost = enableDdos ? 450 : 0;
    const ipCost = enableDedicatedIp ? 300 : 0;

    const subtotal = baseCompute + extraStorageCost + osSurcharge + backupsCost + ddosCost + ipCost;
    const gstTax = Math.round(subtotal * 0.18); // 18% GST (CGST 9% + SGST 9%)
    const totalMonthly = subtotal + gstTax;
    const totalHourly = Number((totalMonthly / 720).toFixed(2));

    return {
      baseCompute,
      extraDiskGb,
      extraStorageCost,
      osSurcharge,
      backupsCost,
      ddosCost,
      ipCost,
      subtotal,
      gstTax,
      totalMonthly,
      totalHourly,
    };
  }, [currentTier, currentOs, nvmeStorage, enableBackups, enableDdos, enableDedicatedIp]);

  // Provisioning Submit Handler
  const handleDeploy = useCallback(() => {
    if (!hostname.trim()) {
      alert('Please enter a server hostname');
      setCurrentStep(5);
      return;
    }

    const deployPayload = {
      name: hostname.trim(),
      type: 'Compute VM',
      os: currentOs.name,
      region: currentRegion.id,
      regionLabel: currentRegion.name,
      monthlyCost: costBreakdown.totalMonthly,
      specs: {
        vcpu: currentTier.vcpu,
        ramGb: currentTier.ramGb,
        diskGb: nvmeStorage,
        bandwidthTb: currentTier.bandwidthTb,
      },
    };

    console.info('%c[CloudDeployFunction]%c Submitting provisioning payload to hypervisor:', 'color: #10b981; font-weight: bold;', 'color: #6ee7b7;', deployPayload);
    cloudDeployProvisionFunction(deployPayload);

    setIsProvisioning(true);
    setProvisionProgress(10);
    setProvisionStepText('Allocating dedicated hypervisor cores...');

    let progress = 10;
    progressTimerRef.current = setInterval(() => {
      progress += 22;
      if (progress >= 100) {
        clearInterval(progressTimerRef.current);
        setProvisionProgress(100);
        setProvisionStepText('Node active! Finalizing IP routes...');

        setTimeout(() => {
          // Commit to CloudContext
          deployService(deployPayload);
          navigate('/services');
        }, 800);
      } else {
        setProvisionProgress(progress);
        if (progress > 60) {
          setProvisionStepText('Partitioning NVMe volume and injecting cloud-init...');
        } else if (progress > 30) {
          setProvisionStepText('Binding public static IPv4 and establishing route...');
        }
      }
    }, 450);
  }, [hostname, currentOs, currentRegion, currentTier, nvmeStorage, costBreakdown.totalMonthly, deployService, navigate]);

  return (
    <div id="deploy-wizard-container" data-component="DeployWizard" className="space-y-6">
      {/* Page Header with dedicated Cloud SVG Icon */}
      <div id="deploy-wizard-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <img
            id="deploy-wizard-header-icon"
            src="/icons/cloud-deploy.svg"
            alt="Deploy Cloud Node"
            className="w-10 h-10 rounded-xl p-1.5 bg-emerald-950/40 border border-emerald-800/40 shrink-0 shadow-sm shadow-emerald-500/10"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Deploy Cloud Server
              </h1>
              <Badge variant="info" size="sm">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Automated Provisioning
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Configure region, OS distribution, CPU/RAM sizing, and storage add-ons with live price estimation.
            </p>
          </div>
        </div>
        <Link to="/services">
          <Button id="btn-cancel-deploy" variant="outline" size="sm" iconLeft={ArrowLeft}>
            Cancel & Back
          </Button>
        </Link>
      </div>

      {/* Step Indicator Bar */}
      <div id="deploy-wizard-stepper" className="glass-panel p-3 rounded-2xl border border-slate-800/80">
        <div className="grid grid-cols-5 gap-2 text-xs">
          {[
            { step: 1, label: 'Region', desc: currentRegion.name.split(',')[0] },
            { step: 2, label: 'OS Image', desc: currentOs.name.split(' ')[0] },
            { step: 3, label: 'Compute', desc: `${currentTier.vcpu} vCPU / ${currentTier.ramGb}GB` },
            { step: 4, label: 'Storage', desc: `${nvmeStorage} GB NVMe` },
            { step: 5, label: 'Security', desc: hostname },
          ].map((item) => (
            <button
              key={item.step}
              id={`step-nav-btn-${item.step}`}
              data-step-number={item.step}
              data-step-label={item.label}
              onClick={() => setCurrentStep(item.step)}
              className={`p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                currentStep === item.step
                  ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/10'
                  : currentStep > item.step
                  ? 'bg-slate-900/40 border border-slate-800 text-slate-300 hover:border-slate-700'
                  : 'bg-transparent text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                {currentStep > item.step ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      currentStep === item.step
                        ? 'bg-cyan-400 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.step}
                  </span>
                )}
                <span className="truncate">{item.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-1 pl-5">
                {item.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Content: Wizard Steps vs Sticky Cost Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Span 2): Active Step Components */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: Datacenter Location */}
          {currentStep === 1 && (
            <Card
              id="step-1-datacenter-location"
              data-step="region-selection"
              title="Step 1: Datacenter Location"
              subtitle="Select the geographic cluster closest to your audience for optimal network latency"
              icon={Globe}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {regions.map((region) => {
                  const isSelected = selectedRegion === region.id;
                  return (
                    <div
                      key={region.id}
                      id={`card-region-${region.id}`}
                      data-region-id={region.id}
                      data-region-name={region.name}
                      onClick={() => setSelectedRegion(region.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{region.flag}</span>
                          <div>
                            <h4 className="font-semibold text-sm text-white">
                              {region.name}
                            </h4>
                            <span className="text-xs font-mono text-cyan-400">
                              {region.id}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">{region.tier}</span>
                        <span className="font-mono font-semibold text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {region.latency}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  iconRight={ArrowRight}
                  onClick={() => setCurrentStep(2)}
                >
                  Continue to OS Selection
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 2: OS Image & Distribution */}
          {currentStep === 2 && (
            <Card
              title="Step 2: Operating System Distribution"
              subtitle="Choose Linux distribution or Windows Server. All images pre-configured with Cloud-Init"
              icon={Server}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {osImages.map((os) => {
                  const isSelected = selectedOs === os.id;
                  return (
                    <div
                      key={os.id}
                      onClick={() => setSelectedOs(os.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-white">
                              {os.name}
                            </h4>
                            {os.isPopular && (
                              <Badge variant="active" size="xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{os.version}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-400 text-[11px]">x86_64 Architecture</span>
                        {os.licenseSurcharge ? (
                          <span className="font-mono font-semibold text-amber-400">
                            +₹{os.licenseSurcharge}/mo License
                          </span>
                        ) : (
                          <span className="font-mono text-emerald-400 text-[11px]">
                            Open-Source (Free)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="md"
                  iconLeft={ArrowLeft}
                  onClick={() => setCurrentStep(1)}
                >
                  Back to Region
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  iconRight={ArrowRight}
                  onClick={() => setCurrentStep(3)}
                >
                  Continue to Compute Sizing
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 3: Compute Tier Selection */}
          {currentStep === 3 && (
            <Card
              title="Step 3: Sizing & Compute Plan"
              subtitle="Choose dedicated vCPU cores, RAM capacity, and initial bandwidth allocation"
              icon={Cpu}
              action={
                <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  {[
                    { id: 'all', label: 'All Tiers' },
                    { id: 'general', label: 'General' },
                    { id: 'cpu', label: 'Compute Pro' },
                    { id: 'memory', label: 'High-RAM' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setTierCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                        tierCategory === cat.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {filteredTiers.map((tier) => {
                  const isSelected = selectedTier === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-white">
                            {tier.name}
                          </h4>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="mt-3 space-y-1 font-mono text-xs">
                          <p className="text-slate-200 font-bold">
                            {tier.vcpu} vCPU <span className="font-normal text-slate-400">• {tier.ramGb} GB RAM</span>
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            {tier.diskGb} GB NVMe SSD
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            {tier.bandwidthTb} TB Bandwidth Pool
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <div className="font-mono">
                          <span className="text-lg font-bold text-white">
                            ₹{tier.monthlyPrice.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-400 font-sans">/mo</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ₹{tier.hourlyPrice}/hr
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="md"
                  iconLeft={ArrowLeft}
                  onClick={() => setCurrentStep(2)}
                >
                  Back to OS
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  iconRight={ArrowRight}
                  onClick={() => setCurrentStep(4)}
                >
                  Continue to Storage & Add-ons
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 4: Storage & Add-ons */}
          {currentStep === 4 && (
            <Card
              title="Step 4: Storage Scaling & High-Availability Add-ons"
              subtitle="Expand NVMe capacity and enable enterprise security and backup layers"
              icon={HardDrive}
            >
              <div className="space-y-6">
                {/* NVMe Storage Slider */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-white">NVMe SSD Disk Capacity</span>
                      <p className="text-[11px] text-slate-400">
                        Base includes {currentTier.diskGb} GB. Extra capacity billed at ₹2.5/GB/mo.
                      </p>
                    </div>
                    <span className="font-mono font-bold text-base text-cyan-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
                      {nvmeStorage} GB
                    </span>
                  </div>

                  <input
                    type="range"
                    min={currentTier.diskGb || 25}
                    max={500}
                    step={10}
                    value={nvmeStorage}
                    onChange={(e) => setNvmeStorage(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Base: {currentTier.diskGb} GB</span>
                    <span>250 GB</span>
                    <span>500 GB (Max)</span>
                  </div>
                </div>

                {/* Add-ons Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300">
                    Recommended Production Add-ons
                  </h4>

                  {/* Add-on 1: Automated Backups */}
                  <div
                    onClick={() => setEnableBackups(!enableBackups)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      enableBackups
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          enableBackups
                            ? 'bg-cyan-400 border-cyan-400 text-slate-950'
                            : 'border-slate-700'
                        }`}
                      >
                        {enableBackups && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Automated Daily Backup Snapshots
                        </p>
                        <p className="text-[11px] text-slate-400">
                          7-day rolling recovery points stored in redundant off-site vault
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-xs text-white">
                      +₹200/mo
                    </span>
                  </div>

                  {/* Add-on 2: Anti-DDoS Scrubbing */}
                  <div
                    onClick={() => setEnableDdos(!enableDdos)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      enableDdos
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          enableDdos
                            ? 'bg-cyan-400 border-cyan-400 text-slate-950'
                            : 'border-slate-700'
                        }`}
                      >
                        {enableDdos && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Enterprise Anti-DDoS Traffic Scrubbing Layer
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Automated mitigation up to 3.2 Tbps volumetric attacks
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-xs text-white">
                      +₹450/mo
                    </span>
                  </div>

                  {/* Add-on 3: Dedicated Static IPv4 */}
                  <div
                    onClick={() => setEnableDedicatedIp(!enableDedicatedIp)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      enableDedicatedIp
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          enableDedicatedIp
                            ? 'bg-cyan-400 border-cyan-400 text-slate-950'
                            : 'border-slate-700'
                        }`}
                      >
                        {enableDedicatedIp && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Dedicated Reserved Static Public IPv4
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Static clean-reputation IP with custom rDNS PTR records
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-xs text-white">
                      +₹300/mo
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="md"
                  iconLeft={ArrowLeft}
                  onClick={() => setCurrentStep(3)}
                >
                  Back to Compute
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  iconRight={ArrowRight}
                  onClick={() => setCurrentStep(5)}
                >
                  Continue to Security & Hostname
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 5: Hostname & Security Authentication */}
          {currentStep === 5 && (
            <Card
              title="Step 5: Hostname & Security Credentials"
              subtitle="Specify internal cluster hostname and configure SSH authentication or root password"
              icon={Lock}
            >
              <div className="space-y-5">
                {/* Server Hostname */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Server Hostname (RFC 1123 compliant)
                  </label>
                  <input
                    type="text"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                    placeholder="e.g. k8s-master-node-01"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-sm text-white font-mono focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Will be configured as system FQDN and visible in DNS reverse lookups.
                  </p>
                </div>

                {/* Authentication Method Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-2">
                    Root Authentication Method
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('ssh')}
                      className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                        authMethod === 'ssh'
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Key className="w-4 h-4 text-cyan-400" />
                      <span>SSH Public Key (Recommended)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('password')}
                      className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                        authMethod === 'password'
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-cyan-400" />
                      <span>Root Password</span>
                    </button>
                  </div>

                  {authMethod === 'ssh' ? (
                    <div>
                      <textarea
                        rows={3}
                        value={sshKey}
                        onChange={(e) => setSshKey(e.target.value)}
                        placeholder="ssh-ed25519 AAAA..."
                        className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Injected directly into <code className="text-cyan-400 font-mono">~/.ssh/authorized_keys</code> via Cloud-Init.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={rootPassword}
                          onChange={(e) => setRootPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-sm font-mono text-white focus:outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Must contain at least 12 characters, uppercase, and special symbols.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="md"
                  iconLeft={ArrowLeft}
                  onClick={() => setCurrentStep(4)}
                >
                  Back to Storage
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  iconLeft={Rocket}
                  onClick={handleDeploy}
                  className="shadow-lg shadow-cyan-500/25"
                >
                  Confirm & Deploy Node
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Sticky Live Cost Calculator Panel */}
        <div className="sticky top-20">
          <Card
            title="Live Cost Estimation"
            subtitle="Calculated dynamically per hour and month"
            icon={Zap}
          >
            <div className="space-y-4">
              {/* Selected Hardware Badges */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Datacenter:</span>
                  <span className="font-semibold text-white flex items-center gap-1">
                    <span>{currentRegion.flag}</span>
                    <span>{currentRegion.name.split(',')[0]}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">OS Image:</span>
                  <span className="font-semibold text-white">{currentOs.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Compute:</span>
                  <span className="font-mono font-semibold text-cyan-400">
                    {currentTier.vcpu} vCPU / {currentTier.ramGb} GB RAM
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">NVMe Disk:</span>
                  <span className="font-mono font-semibold text-white">
                    {nvmeStorage} GB SSD
                  </span>
                </div>
              </div>

              {/* Itemized Cost Breakdown */}
              <div className="space-y-2 text-xs border-b border-slate-800/80 pb-4">
                <div className="flex justify-between text-slate-300">
                  <span>Base Plan ({currentTier.name}):</span>
                  <span className="font-mono text-white">
                    ₹{costBreakdown.baseCompute.toLocaleString()}
                  </span>
                </div>

                {costBreakdown.extraStorageCost > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Extra NVMe (+{costBreakdown.extraDiskGb} GB):</span>
                    <span className="font-mono text-white">
                      ₹{costBreakdown.extraStorageCost.toLocaleString()}
                    </span>
                  </div>
                )}

                {costBreakdown.osSurcharge > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Windows License:</span>
                    <span className="font-mono text-white">
                      ₹{costBreakdown.osSurcharge.toLocaleString()}
                    </span>
                  </div>
                )}

                {costBreakdown.backupsCost > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Automated Backups:</span>
                    <span className="font-mono text-white">
                      ₹{costBreakdown.backupsCost}
                    </span>
                  </div>
                )}

                {costBreakdown.ddosCost > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Anti-DDoS Scrubbing:</span>
                    <span className="font-mono text-white">
                      ₹{costBreakdown.ddosCost}
                    </span>
                  </div>
                )}

                {costBreakdown.ipCost > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Static Dedicated IPv4:</span>
                    <span className="font-mono text-white">
                      ₹{costBreakdown.ipCost}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-850">
                  <span>Estimated 18% GST (CGST/SGST):</span>
                  <span className="font-mono text-slate-300">
                    ₹{costBreakdown.gstTax.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Total Monthly & Hourly Rate */}
              <div className="p-4 rounded-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950/30 border border-cyan-500/30 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Total Monthly Rate:
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-white">
                      ₹{costBreakdown.totalMonthly.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">/mo</span>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span>Metered Hourly Run-Rate:</span>
                  <span className="text-cyan-400 font-semibold">
                    ₹{costBreakdown.totalHourly}/hr
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="primary"
                size="lg"
                iconLeft={Rocket}
                onClick={handleDeploy}
                className="w-full shadow-lg shadow-cyan-500/20"
              >
                Deploy Server Now
              </Button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Pre-approved SLA
                </span>
                <span>Billed to Wallet</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Provisioning Progress Modal Simulation */}
      <Modal
        isOpen={isProvisioning}
        onClose={() => {}} // Cannot close while provisioning
        title="Provisioning KVM Cloud Server"
        subtitle={`Target node: ${hostname} in ${currentRegion.name}`}
        size="md"
      >
        <div className="py-6 space-y-6 text-center">
          <div className="relative flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30">
            <Rocket className="w-8 h-8 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              Booting Cloud Node ({provisionProgress}%)
            </h3>
            <p className="text-xs text-cyan-300 font-mono mt-1">
              {provisionStepText}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${provisionProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono text-left bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <span>Specs: </span>
              <span className="text-white">{currentTier.vcpu} vCPU / {currentTier.ramGb}GB</span>
            </div>
            <div>
              <span>Region: </span>
              <span className="text-white">{currentRegion.id}</span>
            </div>
            <div>
              <span>Image: </span>
              <span className="text-white">{currentOs.name.split(' ')[0]}</span>
            </div>
            <div>
              <span>Storage: </span>
              <span className="text-white">{nvmeStorage} GB NVMe</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
