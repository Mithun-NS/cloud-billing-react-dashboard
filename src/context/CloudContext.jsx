import React, { createContext, useContext, useState, useEffect } from 'react';
import initialMockData from '../data/mockData.json';

const STORAGE_KEY = 'infrapulse_state_v1';

const defaultNotifications = [
  {
    _id: 'notif_1',
    title: 'Hypervisor Health Nominal',
    message: 'Mumbai (ap-south-1) KVM cluster running with 18ms latency and 99.99% SLA.',
    type: 'success', // 'success' | 'warning' | 'info' | 'alert'
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    link: '/services',
  },
  {
    _id: 'notif_2',
    title: 'Automated Snapshot Verified',
    message: 'Daily cryptographically signed backup completed for prod-db-postgres-cluster.',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    read: false,
    link: '/services',
  },
  {
    _id: 'notif_3',
    title: 'Monthly Run-Rate Statement',
    message: 'Current run-rate is ₹20,050/mo. Next automated statement on Nov 01, 2026.',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: false,
    link: '/billing',
  },
];

const CloudContext = createContext(null);

export function CloudProvider({ children }) {
  // Initialize state from localStorage or fallback to initialMockData
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.notifications || !Array.isArray(parsed.notifications)) {
          parsed.notifications = defaultNotifications;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
    return {
      ...initialMockData,
      notifications: defaultNotifications,
    };
  });

  // Sync to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to persist state to localStorage', e);
    }
  }, [data]);

  // Helper to add an audit log entry
  const logAudit = (action, target, details, status = 'success') => {
    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      target,
      actor: `${data.organization.contactName} (${data.organization.role})`,
      ip: '103.21.144.18',
      status,
      details,
    };
    return newLog;
  };

  // Helper to construct a notification object
  const createNotification = (title, message, type = 'info', link = null) => ({
    _id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title,
    message,
    type,
    timestamp: new Date().toISOString(),
    read: false,
    link,
  });

  // 1. Deploy / Provision a new instance
  const deployService = (serviceConfig) => {
    const randomIpSuffix = Math.floor(Math.random() * 200) + 20;
    const privateSuffix = Math.floor(Math.random() * 200) + 10;
    const now = new Date().toISOString();

    const newService = {
      _id: `srv_${Date.now().toString(36)}`,
      name: serviceConfig.name || `instance-${Math.floor(Math.random() * 1000)}`,
      type: serviceConfig.type || 'Compute VM',
      os: serviceConfig.os || 'Ubuntu 24.04 LTS',
      region: serviceConfig.region || 'ap-south-1',
      regionLabel: serviceConfig.regionLabel || 'Mumbai, India',
      ipAddress: `103.115.24.${randomIpSuffix}`,
      privateIp: `10.0.1.${privateSuffix}`,
      status: 'active',
      specs: {
        vcpu: serviceConfig.specs?.vcpu || 2,
        ramGb: serviceConfig.specs?.ramGb || 4,
        diskGb: serviceConfig.specs?.diskGb || 80,
        bandwidthTb: serviceConfig.specs?.bandwidthTb || 4.0,
      },
      metrics: {
        cpuPercent: Math.floor(Math.random() * 20) + 5,
        ramPercent: Math.floor(Math.random() * 30) + 15,
        uptimeDays: 0,
      },
      monthlyCost: serviceConfig.monthlyCost || 1500,
      hourlyCost: Number(((serviceConfig.monthlyCost || 1500) / 720).toFixed(2)),
      autoRenew: true,
      createdAt: now,
      updatedAt: now,
    };

    const auditEntry = logAudit(
      'SERVICE_PROVISION',
      newService.name,
      `Instance deployed in ${newService.regionLabel} (${newService.specs.vcpu} vCPU, ${newService.specs.ramGb}GB RAM)`
    );

    const notif = createNotification(
      'New Instance Provisioned',
      `${newService.name} is now live in ${newService.regionLabel} with IP ${newService.ipAddress}.`,
      'success',
      '/services'
    );

    setData((prev) => {
      const updatedServices = [newService, ...prev.services];
      const newMonthlyRunRate = updatedServices
        .filter((s) => s.status !== 'suspended')
        .reduce((sum, s) => sum + s.monthlyCost, 0);

      return {
        ...prev,
        services: updatedServices,
        organization: {
          ...prev.organization,
          totalMonthlyRunRate: newMonthlyRunRate,
        },
        auditLogs: [auditEntry, ...prev.auditLogs],
        notifications: [notif, ...(prev.notifications || [])],
      };
    });

    return newService;
  };

  // 2. Power operations & status updates (reboot, stop, start)
  const updateServiceStatus = (serviceId, newStatus) => {
    setData((prev) => {
      let targetName = 'Unknown Service';
      const updatedServices = prev.services.map((srv) => {
        if (srv._id === serviceId) {
          targetName = srv.name;
          return {
            ...srv,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return srv;
      });

      const auditEntry = logAudit(
        `SERVER_${newStatus.toUpperCase()}`,
        targetName,
        `Instance power state changed to: ${newStatus}`
      );

      const notif = createNotification(
        `Instance Power: ${targetName}`,
        `Node status transitioned to '${newStatus}' via hypervisor control.`,
        newStatus === 'active' ? 'success' : 'warning',
        '/services'
      );

      const newMonthlyRunRate = updatedServices
        .filter((s) => s.status !== 'suspended')
        .reduce((sum, s) => sum + s.monthlyCost, 0);

      return {
        ...prev,
        services: updatedServices,
        organization: {
          ...prev.organization,
          totalMonthlyRunRate: newMonthlyRunRate,
        },
        auditLogs: [auditEntry, ...prev.auditLogs],
        notifications: [notif, ...(prev.notifications || [])],
      };
    });
  };

  // 3. Dynamic Plan Resizing (CPU / RAM / Disk slider adjustments)
  const resizeService = (serviceId, newSpecs, newMonthlyCost) => {
    setData((prev) => {
      let targetName = 'Instance';
      const updatedServices = prev.services.map((srv) => {
        if (srv._id === serviceId) {
          targetName = srv.name;
          return {
            ...srv,
            specs: { ...srv.specs, ...newSpecs },
            monthlyCost: newMonthlyCost,
            hourlyCost: Number((newMonthlyCost / 720).toFixed(2)),
            updatedAt: new Date().toISOString(),
          };
        }
        return srv;
      });

      const auditEntry = logAudit(
        'SERVICE_RESIZE',
        targetName,
        `Specs dynamically scaled to: ${newSpecs.vcpu} vCPU, ${newSpecs.ramGb}GB RAM, ${newSpecs.diskGb}GB NVMe (₹${newMonthlyCost}/mo)`
      );

      const notif = createNotification(
        `Hardware Resized: ${targetName}`,
        `Scaled to ${newSpecs.vcpu} vCPU, ${newSpecs.ramGb}GB RAM, ${newSpecs.diskGb}GB NVMe (₹${newMonthlyCost.toLocaleString()}/mo).`,
        'info',
        '/services'
      );

      const newMonthlyRunRate = updatedServices
        .filter((s) => s.status !== 'suspended')
        .reduce((sum, s) => sum + s.monthlyCost, 0);

      return {
        ...prev,
        services: updatedServices,
        organization: {
          ...prev.organization,
          totalMonthlyRunRate: newMonthlyRunRate,
        },
        auditLogs: [auditEntry, ...prev.auditLogs],
        notifications: [notif, ...(prev.notifications || [])],
      };
    });
  };

  // 4. Terminate Service
  const terminateService = (serviceId) => {
    setData((prev) => {
      const srvToTerminate = prev.services.find((s) => s._id === serviceId);
      const updatedServices = prev.services.filter((s) => s._id !== serviceId);
      const auditEntry = logAudit(
        'SERVICE_TERMINATE',
        srvToTerminate?.name || serviceId,
        'Instance terminated and disk volumes wiped cleanly'
      );

      const notif = createNotification(
        `Instance Terminated`,
        `Node ${srvToTerminate?.name || serviceId} permanently wiped and IPv4 released.`,
        'alert',
        '/services'
      );

      const newMonthlyRunRate = updatedServices
        .filter((s) => s.status !== 'suspended')
        .reduce((sum, s) => sum + s.monthlyCost, 0);

      return {
        ...prev,
        services: updatedServices,
        organization: {
          ...prev.organization,
          totalMonthlyRunRate: newMonthlyRunRate,
        },
        auditLogs: [auditEntry, ...prev.auditLogs],
        notifications: [notif, ...(prev.notifications || [])],
      };
    });
  };

  // 5. Pay an invoice (deducts from wallet or marks settled)
  const payInvoice = (invoiceId) => {
    let success = false;
    let message = '';

    setData((prev) => {
      const invoice = prev.invoices.find((inv) => inv.invoiceId === invoiceId || inv._id === invoiceId);
      if (!invoice) return prev;
      if (invoice.status === 'paid') {
        message = 'Invoice is already paid';
        return prev;
      }

      const canDeductWallet = prev.organization.walletBalance >= invoice.amount;
      const newWalletBalance = canDeductWallet
        ? prev.organization.walletBalance - invoice.amount
        : prev.organization.walletBalance;

      const updatedInvoices = prev.invoices.map((inv) => {
        if (inv.invoiceId === invoice.invoiceId) {
          return {
            ...inv,
            status: 'paid',
            paidAt: new Date().toISOString(),
            paymentMethod: canDeductWallet ? 'Prepaid Wallet (Deduction)' : 'Direct Card Settlement',
          };
        }
        return inv;
      });

      const auditEntry = logAudit(
        'INVOICE_PAID',
        invoice.invoiceId,
        `Payment settled for amount ₹${invoice.amount.toLocaleString()} via ${
          canDeductWallet ? 'Wallet Balance' : 'Online Payment'
        }`
      );

      const notif = createNotification(
        `Invoice Paid: ${invoice.invoiceId}`,
        `Payment of ₹${invoice.amount.toLocaleString()} successfully processed.`,
        'success',
        '/billing'
      );

      success = true;
      message = `Invoice ${invoice.invoiceId} successfully paid!`;

      return {
        ...prev,
        organization: {
          ...prev.organization,
          walletBalance: newWalletBalance,
        },
        invoices: updatedInvoices,
        auditLogs: [auditEntry, ...prev.auditLogs],
        notifications: [notif, ...(prev.notifications || [])],
      };
    });

    return { success, message };
  };

  // 6. Top-up Wallet Balance
  const topUpWallet = (amount, method = 'UPI / NetBanking') => {
    const rechargeAmount = Number(amount);
    if (isNaN(rechargeAmount) || rechargeAmount <= 0) return false;

    setData((prev) => {
      const newBalance = prev.organization.walletBalance + rechargeAmount;
      const auditEntry = logAudit(
        'WALLET_TOPUP',
        'Wallet Balance',
        `Credited ₹${rechargeAmount.toLocaleString()} via ${method}`
      );

      const notif = createNotification(
        'Wallet Recharged',
        `Credited ₹${rechargeAmount.toLocaleString()} to prepaid balance via ${method}.`,
        'success',
        '/billing'
      );

      return {
        ...prev,
        organization: {
          ...prev.organization,
          walletBalance: newBalance,
        },
        auditLogs: [auditEntry, ...prev.auditLogs],
        notifications: [notif, ...(prev.notifications || [])],
      };
    });

    return true;
  };

  // 7. Notification Center Handlers
  const markAllNotificationsRead = () => {
    setData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) => ({ ...n, read: true })),
    }));
  };

  const dismissNotification = (notifId) => {
    setData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).filter((n) => n._id !== notifId),
    }));
  };

  const clearAllNotifications = () => {
    setData((prev) => ({
      ...prev,
      notifications: [],
    }));
  };

  // 8. Reset to default initial state (helpful for testing)
  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData({
      ...initialMockData,
      notifications: defaultNotifications,
    });
  };

  const value = {
    organization: data.organization,
    services: data.services,
    usageHistory: data.usageHistory,
    invoices: data.invoices,
    auditLogs: data.auditLogs,
    referenceData: data.referenceData,
    notifications: data.notifications || defaultNotifications,
    deployService,
    updateServiceStatus,
    resizeService,
    terminateService,
    payInvoice,
    topUpWallet,
    markAllNotificationsRead,
    dismissNotification,
    clearAllNotifications,
    resetToDefaults,
  };

  return (
    <CloudContext.Provider value={value}>{children}</CloudContext.Provider>
  );
}

export function useCloud() {
  const context = useContext(CloudContext);
  if (!context) {
    throw new Error('useCloud must be used within a CloudProvider');
  }
  return context;
}
