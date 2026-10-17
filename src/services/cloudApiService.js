/**
 * InfraPulse Cloud API Service
 * Dispatches simulated cloud telemetry, microservices management, and RPC events.
 * Provides explicit function declarations for Chrome DevTools Inspect, Console,
 * Sources, and Network debugging.
 */

// Debug Logger Helper
const logCloudAction = (functionName, message, payload = {}) => {
  console.groupCollapsed(
    `%c[CloudFunction]%c ${functionName}() - ${message}`,
    'background: #0284c7; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-family: monospace;',
    'color: #38bdf8; font-weight: 600;'
  );
  console.info('Timestamp:', new Date().toISOString());
  console.info('Invoked By:', functionName);
  if (Object.keys(payload).length > 0) {
    console.info('Payload / Context:', payload);
  }
  console.groupEnd();
};

/**
 * 1. Fetch all cloud services
 * Explicitly triggers GET /api/v1/cloud/services
 */
export async function cloudServicesFunction() {
  logCloudAction('cloudServicesFunction', 'Fetching multi-region cloud services');
  try {
    const response = await fetch('/api/v1/cloud/services');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('[cloudServicesFunction] Network request skipped (offline mode):', err.message);
  }
  return null;
}

/**
 * 2. Fetch specific cloud service telemetry / metrics
 * Explicitly triggers GET /api/v1/cloud/services/:id/metrics
 */
export async function cloudServiceMetricsFunction(serviceId) {
  logCloudAction('cloudServiceMetricsFunction', `Retrieving real-time telemetry for ${serviceId}`, { serviceId });
  try {
    const response = await fetch(`/api/v1/cloud/services/${serviceId}/metrics`);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('[cloudServiceMetricsFunction] Network request skipped:', err.message);
  }
  return null;
}

/**
 * 3. Update cloud power state (Start / Stop / ACPI Reboot)
 * Explicitly triggers POST /api/v1/cloud/services/:id/power
 */
export async function cloudServicePowerFunction(serviceId, powerAction) {
  logCloudAction('cloudServicePowerFunction', `Executing power op '${powerAction}' on ${serviceId}`, {
    serviceId,
    powerAction,
  });
  try {
    const response = await fetch(`/api/v1/cloud/services/${serviceId}/power`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: powerAction, timestamp: new Date().toISOString() }),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[cloudServicePowerFunction] Network request skipped:', err.message);
  }
  return null;
}

/**
 * 4. Scale Compute / Memory / Storage Specs
 * Explicitly triggers PATCH /api/v1/cloud/services/:id/scale
 */
export async function cloudServiceScaleFunction(serviceId, specs) {
  logCloudAction('cloudServiceScaleFunction', `Resizing hypervisor allocation for ${serviceId}`, {
    serviceId,
    specs,
  });
  try {
    const response = await fetch(`/api/v1/cloud/services/${serviceId}/scale`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specs, timestamp: new Date().toISOString() }),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[cloudServiceScaleFunction] Network request skipped:', err.message);
  }
  return null;
}

/**
 * 5. Provision / Deploy New Cloud VM Instance
 * Explicitly triggers POST /api/v1/cloud/deploy
 */
export async function cloudDeployProvisionFunction(deployConfig) {
  logCloudAction('cloudDeployProvisionFunction', `Provisioning new instance '${deployConfig?.name}'`, {
    deployConfig,
  });
  try {
    const response = await fetch('/api/v1/cloud/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deployConfig),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[cloudDeployProvisionFunction] Network request skipped:', err.message);
  }
  return null;
}

/**
 * 6. Fetch Billing & Invoices
 * Explicitly triggers GET /api/v1/cloud/billing
 */
export async function cloudBillingInvoicesFunction() {
  logCloudAction('cloudBillingInvoicesFunction', 'Fetching GST tax invoices and prepaid wallet telemetry');
  try {
    const response = await fetch('/api/v1/cloud/billing');
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[cloudBillingInvoicesFunction] Network request skipped:', err.message);
  }
  return null;
}

// Global debug exposure for Chrome DevTools
if (typeof window !== 'undefined') {
  window.cloudFunction = {
    cloudServicesFunction,
    cloudServiceMetricsFunction,
    cloudServicePowerFunction,
    cloudServiceScaleFunction,
    cloudDeployProvisionFunction,
    cloudBillingInvoicesFunction,
    help: () => {
      console.table([
        { Function: 'cloudServicesFunction()', Description: 'Fetch and log active cloud services' },
        { Function: 'cloudServiceMetricsFunction(id)', Description: 'Fetch real-time CPU/RAM telemetry' },
        { Function: 'cloudServicePowerFunction(id, action)', Description: 'Trigger Start/Stop/Reboot power state' },
        { Function: 'cloudServiceScaleFunction(id, specs)', Description: 'Modify vCPU, RAM, and NVMe disk' },
        { Function: 'cloudDeployProvisionFunction(config)', Description: 'Simulate instance deployment' },
        { Function: 'cloudBillingInvoicesFunction()', Description: 'Fetch GST invoices & wallet balance' },
      ]);
      return '🚀 InfraPulse Cloud Debug API ready. Click any function or inspect elements with data-function.';
    },
  };
  window.cloudServices = window.cloudFunction;
}
