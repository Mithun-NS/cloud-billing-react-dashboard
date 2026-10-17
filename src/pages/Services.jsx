import React from 'react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { Server, Plus, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Services() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Cloud Services & Compute Nodes
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage provisioned virtual machines, database clusters, and block storage instances.
          </p>
        </div>
        <Link to="/deploy">
          <Button variant="primary" iconLeft={Plus}>
            New Server Instance
          </Button>
        </Link>
      </div>

      <Card
        title="Compute Instances Grid"
        subtitle="Searchable and filterable data plane"
        icon={Server}
      >
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-center p-6">
          <Server className="w-10 h-10 text-cyan-400 mb-3" />
          <h4 className="text-base font-semibold text-slate-200">
            Services Hub Route Active
          </h4>
          <p className="text-xs text-slate-400 max-w-md mt-1">
            Data table with power operations (Reboot, Stop, Terminate) and dynamic plan modification slider will populate in `feat/services-hub`.
          </p>
        </div>
      </Card>
    </div>
  );
}
