"use client";

import { useEffect, useState } from "react";

interface Tenant {
  id: string;
  name: string;
  apiKey: string;
  plan: string;
  algorithm: string;
  requestsPerMinute: number;
  burstAllowance: number;
  createdAt: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");

  // Modal & form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("PRO");
  const [algorithm, setAlgorithm] = useState("SLIDING_WINDOW");
  const [rpm, setRpm] = useState(60);
  const [burst, setBurst] = useState(10);
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);

  // Edit tenant modal state
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [regeneratedKey, setRegeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/tenants");
      const data = await res.json();
      if (data.success) {
        setTenants(data.tenants);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          plan,
          algorithm,
          requestsPerMinute: rpm,
          burstAllowance: burst,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedApiKey(data.apiKey);
        fetchTenants();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    try {
      const res = await fetch(`/api/tenants/${editingTenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingTenant.name,
          plan: editingTenant.plan,
          algorithm: editingTenant.algorithm,
          requestsPerMinute: editingTenant.requestsPerMinute,
          burstAllowance: editingTenant.burstAllowance,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingTenant(null);
        fetchTenants();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegenerateKey = async (id: string) => {
    if (!confirm("Regenerate API key? Existing clients using the old key will be immediately unauthorized.")) return;
    try {
      const res = await fetch(`/api/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateKey: true }),
      });
      const data = await res.json();
      if (data.success) {
        setRegeneratedKey(data.apiKey);
        fetchTenants();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tenant? All traffic records will be removed.")) return;
    try {
      await fetch(`/api/tenants/${id}`, { method: "DELETE" });
      fetchTenants();
    } catch (e) {
      console.error(e);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredTenants = tenants.filter((t) => {
    if (planFilter !== "ALL" && t.plan !== planFilter) return false;
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-stack-lg">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Tenant Management</h1>
          <p className="font-body-base text-body-base text-secondary">
            Configure tenant rate-limit rules, API keys, quota tiers, and burst allowances across sliding window and token bucket algorithms.
          </p>
        </div>

        <button
          onClick={() => {
            setCreatedApiKey(null);
            setName("");
            setShowCreateModal(true);
          }}
          className="bg-primary hover:bg-primary-container text-on-primary font-label-caps text-label-caps uppercase px-4 py-2.5 rounded flex items-center gap-2 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add New Tenant
        </button>
      </header>

      {/* Regenerated Key Alert Banner */}
      {regeneratedKey && (
        <div className="bg-emerald-50 border border-emerald-300 p-stack-md rounded flex items-center justify-between">
          <div>
            <div className="font-headline-md text-emerald-900 font-bold mb-1">New API Key Issued!</div>
            <p className="text-body-sm text-emerald-800">
              Save this key now. It will not be shown again in cleartext:{" "}
              <code className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-mono-sm font-bold text-emerald-900">
                {regeneratedKey}
              </code>
            </p>
          </div>
          <button
            onClick={() => copyKey(regeneratedKey)}
            className="bg-emerald-700 text-white font-label-caps text-label-caps uppercase px-3 py-1.5 rounded hover:bg-emerald-800"
          >
            {copiedKey === regeneratedKey ? "Copied!" : "Copy Key"}
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded flex flex-wrap items-center justify-between gap-stack-md">
        <div className="flex flex-wrap items-center gap-stack-md flex-grow max-w-2xl">
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search tenant name or identity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded pl-9 pr-3 py-1.5 text-body-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-label-caps text-label-caps text-secondary uppercase">Plan:</label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded px-3 py-1.5 text-body-sm text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Tiers</option>
              <option value="ENTERPRISE">Enterprise</option>
              <option value="PRO">Pro</option>
              <option value="FREE">Free</option>
            </select>
          </div>
        </div>

        <div className="font-mono-sm text-secondary">
          Showing <span className="font-bold text-on-surface">{filteredTenants.length}</span> of {tenants.length} tenants
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-base">
            <thead className="bg-surface-container-low border-b border-outline-variant font-label-caps text-label-caps text-secondary uppercase">
              <tr>
                <th className="px-4 py-3">Tenant Name</th>
                <th className="px-4 py-3">Plan Tier</th>
                <th className="px-4 py-3">Sustained Limit</th>
                <th className="px-4 py-3">Burst Allowance</th>
                <th className="px-4 py-3">Algorithm</th>
                <th className="px-4 py-3">API Key Prefix</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-secondary font-mono-sm">
                    Loading tenant directory...
                  </td>
                </tr>
              ) : filteredTenants.length > 0 ? (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-semibold text-on-surface">{t.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-mono-sm text-[11px] font-bold ${
                          t.plan === "ENTERPRISE"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : t.plan === "PRO"
                            ? "bg-primary-fixed/40 text-primary border border-primary-fixed"
                            : "bg-surface-container-high text-secondary border border-outline-variant"
                        }`}
                      >
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono-sm font-bold text-on-surface">{t.requestsPerMinute} RPM</td>
                    <td className="px-4 py-3 font-mono-sm text-emerald-700">+{t.burstAllowance} tokens</td>
                    <td className="px-4 py-3 font-mono-sm text-secondary">{t.algorithm}</td>
                    <td className="px-4 py-3 font-mono-sm text-secondary">
                      <span className="bg-surface-container px-2 py-0.5 rounded border border-outline-variant">
                        {t.apiKey.substring(0, 16)}...
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingTenant(t)}
                          title="Edit Configuration"
                          className="p-1.5 rounded text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleRegenerateKey(t.id)}
                          title="Regenerate API Key"
                          className="p-1.5 rounded text-secondary hover:text-primary hover:bg-surface-container-high transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">key</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTenant(t.id)}
                          title="Delete Tenant"
                          className="p-1.5 rounded text-error hover:bg-error-container/40 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-secondary font-mono-sm">
                    No tenants match the specified criteria. Click "Add New Tenant" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-lg rounded p-stack-lg space-y-stack-md shadow-xl">
            <div className="flex justify-between items-center pb-stack-sm border-b border-outline-variant">
              <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Provision New Tenant Identity</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {createdApiKey ? (
              <div className="space-y-stack-md">
                <div className="bg-emerald-50 border border-emerald-200 p-stack-md rounded space-y-2">
                  <div className="font-headline-md text-emerald-900 font-bold">API Key Generated</div>
                  <p className="text-body-sm text-emerald-800">
                    Below is the cleartext API Key for this tenant. Store it securely — it will not be displayed again.
                  </p>
                  <div className="flex items-center justify-between bg-white p-3 rounded border border-emerald-300 font-mono-sm text-emerald-950 font-bold">
                    <span className="select-all">{createdApiKey}</span>
                    <button
                      onClick={() => copyKey(createdApiKey)}
                      className="text-emerald-700 hover:text-emerald-900 font-label-caps text-label-caps uppercase"
                    >
                      {copiedKey === createdApiKey ? "Copied!" : "Copy Key"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-caps text-label-caps uppercase py-2.5 rounded transition-colors"
                >
                  Complete Provisioning
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Tenant Organization / Identity</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe Payment Engine (Prod)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-body-base focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-stack-md">
                  <div>
                    <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Plan Tier</label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-body-base focus:outline-none focus:border-primary"
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Rate Limiter Algorithm</label>
                    <select
                      value={algorithm}
                      onChange={(e) => setAlgorithm(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-body-base focus:outline-none focus:border-primary"
                    >
                      <option value="SLIDING_WINDOW">Sliding Window Log</option>
                      <option value="TOKEN_BUCKET">Token Bucket</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-stack-md">
                  <div>
                    <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Sustained Limit (RPM)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10000}
                      value={rpm}
                      onChange={(e) => setRpm(Number(e.target.value))}
                      className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-body-base focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Burst Allowance</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={500}
                      value={burst}
                      onChange={(e) => setBurst(Number(e.target.value))}
                      className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-body-base focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="bg-surface-container-low border border-outline-variant text-on-surface font-label-caps text-label-caps uppercase px-4 py-2 rounded hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-container text-on-primary font-label-caps text-label-caps uppercase px-5 py-2 rounded transition-colors"
                  >
                    Issue Key & Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-lg rounded p-stack-lg space-y-stack-md shadow-xl">
            <div className="flex justify-between items-center pb-stack-sm border-b border-outline-variant">
              <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Edit Tenant Quotas</h2>
              <button onClick={() => setEditingTenant(null)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateTenant} className="space-y-4">
              <div>
                <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Tenant Name</label>
                <input
                  type="text"
                  required
                  value={editingTenant.name}
                  onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-body-base focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-stack-md">
                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Plan Tier</label>
                  <select
                    value={editingTenant.plan}
                    onChange={(e) => setEditingTenant({ ...editingTenant, plan: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-body-base focus:outline-none focus:border-primary"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Algorithm</label>
                  <select
                    value={editingTenant.algorithm}
                    onChange={(e) => setEditingTenant({ ...editingTenant, algorithm: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-body-base focus:outline-none focus:border-primary"
                  >
                    <option value="SLIDING_WINDOW">Sliding Window Log</option>
                    <option value="TOKEN_BUCKET">Token Bucket</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-stack-md">
                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Sustained Limit (RPM)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingTenant.requestsPerMinute}
                    onChange={(e) => setEditingTenant({ ...editingTenant, requestsPerMinute: Number(e.target.value) })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-body-base focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Burst Allowance</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingTenant.burstAllowance}
                    onChange={(e) => setEditingTenant({ ...editingTenant, burstAllowance: Number(e.target.value) })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-body-base focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="bg-surface-container-low border border-outline-variant text-on-surface font-label-caps text-label-caps uppercase px-4 py-2 rounded hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-container text-on-primary font-label-caps text-label-caps uppercase px-5 py-2 rounded transition-colors"
                >
                  Update Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

