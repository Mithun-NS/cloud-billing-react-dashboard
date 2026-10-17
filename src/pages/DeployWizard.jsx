import React from 'react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { Rocket, Globe, HardDrive, Cpu, ShieldCheck } from 'lucide-react';

export default function DeployWizard() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Deploy New Cloud Instance
          </h1>
          <Badge variant="info">4-Step Provisioning</Badge>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Select datacenter location, operating system image, compute specs, and storage add-ons.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Interactive Provisioning Wizard"
            subtitle="Datacenter Location, OS Distribution, Compute Tier & Storage"
            icon={Rocket}
          >
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-center p-6">
              <Rocket className="w-10 h-10 text-cyan-400 mb-3" />
              <h4 className="text-base font-semibold text-slate-200">
                Deploy Wizard Route Active
              </h4>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                4-step wizard with real-time recalculation of hourly & monthly billing will be implemented in `feat/deploy-wizard`.
              </p>
            </div>
          </Card>
        </div>

        <div>
          <Card
            title="Live Cost Calculator"
            subtitle="Summary & Run Rate"
            icon={HardDrive}
          >
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Base Compute:</span>
                <span className="text-white font-mono">₹1,200/mo</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>NVMe Storage:</span>
                <span className="text-white font-mono">₹240/mo</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-semibold text-white">
                <span>Estimated Total:</span>
                <span className="text-cyan-400 font-mono">₹1,440/mo</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
