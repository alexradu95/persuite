'use client'
import { useState, useMemo } from "react";
import { Button, Input, Label } from "@/components/atoms";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, InfoCard } from "@/components/molecules";
import { useCopilotReadable } from "@copilotkit/react-core";

interface Asset {
  id: string;
  name: string;
  type: 'cash' | 'investment' | 'property' | 'crypto' | 'other';
  value: number;
  currency: string;
  lastUpdated: string;
  description?: string;
}

interface Liability {
  id: string;
  name: string;
  type: 'mortgage' | 'loan' | 'credit_card' | 'other';
  amount: number;
  currency: string;
  interestRate?: number;
  description?: string;
}

interface WealthData {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetAllocation: { [key: string]: number };
}

const assetTypes = [
  { value: 'cash', label: 'Cash & Savings', icon: '💰' },
  { value: 'investment', label: 'Investments', icon: '📈' },
  { value: 'property', label: 'Real Estate', icon: '🏠' },
  { value: 'crypto', label: 'Cryptocurrency', icon: '₿' },
  { value: 'other', label: 'Other Assets', icon: '💎' }
] as const;

const liabilityTypes = [
  { value: 'mortgage', label: 'Mortgage', icon: '🏠' },
  { value: 'loan', label: 'Personal Loan', icon: '💸' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'other', label: 'Other Debt', icon: '📋' }
] as const;

export default function WealthPage() {
  // Sample data
  const [assets, setAssets] = useState<Asset[]>([
    { id: '1', name: 'Savings Account', type: 'cash', value: 15000, currency: 'EUR', lastUpdated: '2024-12-24', description: 'Emergency fund' },
    { id: '2', name: 'Stock Portfolio', type: 'investment', value: 25000, currency: 'EUR', lastUpdated: '2024-12-24', description: 'Mixed index funds' },
    { id: '3', name: 'Apartment', type: 'property', value: 180000, currency: 'EUR', lastUpdated: '2024-12-24', description: 'Primary residence' },
    { id: '4', name: 'Bitcoin', type: 'crypto', value: 5000, currency: 'EUR', lastUpdated: '2024-12-24', description: 'Long-term hold' },
  ]);

  const [liabilities, setLiabilities] = useState<Liability[]>([
    { id: '1', name: 'Mortgage', type: 'mortgage', amount: 120000, currency: 'EUR', interestRate: 3.5, description: 'Home loan' },
    { id: '2', name: 'Car Loan', type: 'loan', amount: 8000, currency: 'EUR', interestRate: 4.2, description: 'Vehicle financing' },
  ]);

  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [isLiabilityDialogOpen, setIsLiabilityDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);

  const wealthData = useMemo((): WealthData => {
    const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0);
    const netWorth = totalAssets - totalLiabilities;

    const assetAllocation = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + asset.value;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      assetAllocation
    };
  }, [assets, liabilities]);

  const handleAddAsset = () => {
    setEditingAsset({
      id: Date.now().toString(),
      name: '',
      type: 'cash',
      value: 0,
      currency: 'EUR',
      lastUpdated: new Date().toISOString().split('T')[0],
      description: ''
    });
    setIsAssetDialogOpen(true);
  };

  const handleAddLiability = () => {
    setEditingLiability({
      id: Date.now().toString(),
      name: '',
      type: 'loan',
      amount: 0,
      currency: 'EUR',
      description: ''
    });
    setIsLiabilityDialogOpen(true);
  };

  const handleSaveAsset = (asset: Asset) => {
    const existingIndex = assets.findIndex(a => a.id === asset.id);
    if (existingIndex >= 0) {
      const updatedAssets = [...assets];
      updatedAssets[existingIndex] = asset;
      setAssets(updatedAssets);
    } else {
      setAssets([...assets, asset]);
    }
    setIsAssetDialogOpen(false);
    setEditingAsset(null);
  };

  const handleSaveLiability = (liability: Liability) => {
    const existingIndex = liabilities.findIndex(l => l.id === liability.id);
    if (existingIndex >= 0) {
      const updatedLiabilities = [...liabilities];
      updatedLiabilities[existingIndex] = liability;
      setLiabilities(updatedLiabilities);
    } else {
      setLiabilities([...liabilities, liability]);
    }
    setIsLiabilityDialogOpen(false);
    setEditingLiability(null);
  };

  const getAssetTypeInfo = (type: string) => {
    return assetTypes.find(t => t.value === type) || assetTypes[0];
  };

  const getLiabilityTypeInfo = (type: string) => {
    return liabilityTypes.find(t => t.value === type) || liabilityTypes[0];
  };

  // CopilotKit integration
  useCopilotReadable({
    description: "Current wealth tracking data including assets, liabilities, and net worth",
    value: {
      wealthSummary: wealthData,
      assets: assets,
      liabilities: liabilities,
      assetAllocation: wealthData.assetAllocation,
      netWorthStatus: wealthData.netWorth > 0 ? 'positive' : 'negative'
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wide mb-2">Wealth Tracker</h1>
          <p className="text-gray-600 font-bold">Monitor your assets and calculate net worth</p>
        </div>
      </div>

      {/* Wealth Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <InfoCard
          title="Total Assets"
          icon="💰"
          value={`€${wealthData.totalAssets.toLocaleString()}`}
          subtitle={`${assets.length} assets tracked`}
          color="green"
        />

        <InfoCard
          title="Total Liabilities"
          icon="💸"
          value={`€${wealthData.totalLiabilities.toLocaleString()}`}
          subtitle={`${liabilities.length} debts tracked`}
          color="red"
        />

        <InfoCard
          title="Net Worth"
          icon="📊"
          value={`€${wealthData.netWorth.toLocaleString()}`}
          subtitle={wealthData.netWorth >= 0 ? 'positive equity' : 'negative equity'}
          color={wealthData.netWorth >= 0 ? 'blue' : 'red'}
        />

        <InfoCard
          title="Asset Growth"
          icon="📈"
          value="+5.2%"
          subtitle="last 30 days (sample)"
          color="purple"
        />
      </div>

      {/* Assets Section */}
      <div 
        className="bg-white border-[5px] border-black p-6 relative text-black"
        style={{ boxShadow: '6px 6px 0px #000000' }}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b-[3px] border-black">
          <h2 
            className="font-black text-lg uppercase tracking-wide m-0"
            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          >
            Assets
          </h2>
          <Button onClick={handleAddAsset} className="bg-emerald-500 text-white hover:bg-black">
            + Add Asset
          </Button>
        </div>
        <div className="mt-4">
          <div className="grid gap-4">
            {assets.map((asset) => {
              const typeInfo = getAssetTypeInfo(asset.type);
              return (
                <div 
                  key={asset.id} 
                  className="flex items-center justify-between p-4 border-[3px] border-black bg-white hover:bg-gray-100 transition-all duration-200"
                  style={{ boxShadow: '4px 4px 0px #000000' }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{typeInfo.icon}</span>
                    <div>
                      <div className="font-black text-lg">{asset.name}</div>
                      <div className="text-sm font-bold opacity-70">{typeInfo.label}</div>
                      {asset.description && (
                        <div className="text-xs opacity-60">{asset.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg">€{asset.value.toLocaleString()}</div>
                    <div className="text-xs opacity-60">Updated: {asset.lastUpdated}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Liabilities Section */}
      <div 
        className="bg-white border-[5px] border-black p-6 relative text-black"
        style={{ boxShadow: '6px 6px 0px #000000' }}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b-[3px] border-black">
          <h2 
            className="font-black text-lg uppercase tracking-wide m-0"
            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          >
            Liabilities
          </h2>
          <Button onClick={handleAddLiability} className="bg-red-500 text-white hover:bg-black">
            + Add Liability
          </Button>
        </div>
        <div className="mt-4">
          <div className="grid gap-4">
            {liabilities.map((liability) => {
              const typeInfo = getLiabilityTypeInfo(liability.type);
              return (
                <div 
                  key={liability.id} 
                  className="flex items-center justify-between p-4 border-[3px] border-black bg-white hover:bg-gray-100 transition-all duration-200"
                  style={{ boxShadow: '4px 4px 0px #000000' }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{typeInfo.icon}</span>
                    <div>
                      <div className="font-black text-lg">{liability.name}</div>
                      <div className="text-sm font-bold opacity-70">{typeInfo.label}</div>
                      {liability.description && (
                        <div className="text-xs opacity-60">{liability.description}</div>
                      )}
                      {liability.interestRate && (
                        <div className="text-xs opacity-60">{liability.interestRate}% interest</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg text-red-500">-€{liability.amount.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Asset Dialog */}
      <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Add an asset to track your wealth
            </DialogDescription>
          </DialogHeader>
          {editingAsset && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="asset-name">Asset Name</Label>
                <Input
                  id="asset-name"
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({
                    ...editingAsset,
                    name: e.target.value
                  })}
                  placeholder="e.g., Savings Account"
                />
              </div>
              <div>
                <Label htmlFor="asset-type">Asset Type</Label>
                <select
                  id="asset-type"
                  value={editingAsset.type}
                  onChange={(e) => setEditingAsset({
                    ...editingAsset,
                    type: e.target.value as Asset['type']
                  })}
                  className="w-full"
                >
                  {assetTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="asset-value">Value (€)</Label>
                <Input
                  id="asset-value"
                  type="number"
                  step="0.01"
                  value={editingAsset.value}
                  onChange={(e) => setEditingAsset({
                    ...editingAsset,
                    value: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label htmlFor="asset-description">Description (Optional)</Label>
                <Input
                  id="asset-description"
                  value={editingAsset.description || ''}
                  onChange={(e) => setEditingAsset({
                    ...editingAsset,
                    description: e.target.value
                  })}
                  placeholder="Brief description"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsAssetDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSaveAsset(editingAsset)}>
                  Save Asset
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Liability Dialog */}
      <Dialog open={isLiabilityDialogOpen} onOpenChange={setIsLiabilityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Liability</DialogTitle>
            <DialogDescription>
              Add a liability to track your debts
            </DialogDescription>
          </DialogHeader>
          {editingLiability && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="liability-name">Liability Name</Label>
                <Input
                  id="liability-name"
                  value={editingLiability.name}
                  onChange={(e) => setEditingLiability({
                    ...editingLiability,
                    name: e.target.value
                  })}
                  placeholder="e.g., Car Loan"
                />
              </div>
              <div>
                <Label htmlFor="liability-type">Liability Type</Label>
                <select
                  id="liability-type"
                  value={editingLiability.type}
                  onChange={(e) => setEditingLiability({
                    ...editingLiability,
                    type: e.target.value as Liability['type']
                  })}
                  className="w-full"
                >
                  {liabilityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="liability-amount">Amount (€)</Label>
                <Input
                  id="liability-amount"
                  type="number"
                  step="0.01"
                  value={editingLiability.amount}
                  onChange={(e) => setEditingLiability({
                    ...editingLiability,
                    amount: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label htmlFor="liability-rate">Interest Rate % (Optional)</Label>
                <Input
                  id="liability-rate"
                  type="number"
                  step="0.01"
                  value={editingLiability.interestRate || ''}
                  onChange={(e) => setEditingLiability({
                    ...editingLiability,
                    interestRate: parseFloat(e.target.value) || undefined
                  })}
                />
              </div>
              <div>
                <Label htmlFor="liability-description">Description (Optional)</Label>
                <Input
                  id="liability-description"
                  value={editingLiability.description || ''}
                  onChange={(e) => setEditingLiability({
                    ...editingLiability,
                    description: e.target.value
                  })}
                  placeholder="Brief description"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsLiabilityDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSaveLiability(editingLiability)}>
                  Save Liability
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}