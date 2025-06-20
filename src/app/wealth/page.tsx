'use client'
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, Building, Coins, Plus, Edit, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WealthData {
  investments: {
    stocks: number;
    bonds: number;
    etfs: number;
    total: number;
  };
  crypto: {
    bitcoin: number;
    ethereum: number;
    others: number;
    total: number;
  };
  deposits: {
    savings: number;
    checking: number;
    cd: number;
    total: number;
  };
  cash: number;
  totalWealth: number;
}

export default function WealthPage() {
  const [wealthData, setWealthData] = useState<WealthData>({
    investments: {
      stocks: 25000,
      bonds: 15000,
      etfs: 8000,
      total: 48000
    },
    crypto: {
      bitcoin: 12000,
      ethereum: 8000,
      others: 3000,
      total: 23000
    },
    deposits: {
      savings: 35000,
      checking: 8000,
      cd: 20000,
      total: 63000
    },
    cash: 5000,
    totalWealth: 139000
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string>('');
  const [editForm, setEditForm] = useState<any>({});

  const recalculateWealth = (data: WealthData) => {
    const investments = data.investments.stocks + data.investments.bonds + data.investments.etfs;
    const crypto = data.crypto.bitcoin + data.crypto.ethereum + data.crypto.others;
    const deposits = data.deposits.savings + data.deposits.checking + data.deposits.cd;
    
    return {
      ...data,
      investments: { ...data.investments, total: investments },
      crypto: { ...data.crypto, total: crypto },
      deposits: { ...data.deposits, total: deposits },
      totalWealth: investments + crypto + deposits + data.cash
    };
  };

  const updateWealthData = (updates: Partial<WealthData>) => {
    const newData = recalculateWealth({ ...wealthData, ...updates });
    setWealthData(newData);
  };

  const openEditDialog = (category: string) => {
    setEditingCategory(category);
    switch (category) {
      case 'investments':
        setEditForm({
          stocks: wealthData.investments.stocks,
          bonds: wealthData.investments.bonds,
          etfs: wealthData.investments.etfs
        });
        break;
      case 'crypto':
        setEditForm({
          bitcoin: wealthData.crypto.bitcoin,
          ethereum: wealthData.crypto.ethereum,
          others: wealthData.crypto.others
        });
        break;
      case 'deposits':
        setEditForm({
          savings: wealthData.deposits.savings,
          checking: wealthData.deposits.checking,
          cd: wealthData.deposits.cd
        });
        break;
      case 'cash':
        setEditForm({ cash: wealthData.cash });
        break;
    }
    setEditDialogOpen(true);
  };

  const saveChanges = () => {
    switch (editingCategory) {
      case 'investments':
        updateWealthData({
          investments: {
            ...wealthData.investments,
            stocks: Number(editForm.stocks) || 0,
            bonds: Number(editForm.bonds) || 0,
            etfs: Number(editForm.etfs) || 0
          }
        });
        break;
      case 'crypto':
        updateWealthData({
          crypto: {
            ...wealthData.crypto,
            bitcoin: Number(editForm.bitcoin) || 0,
            ethereum: Number(editForm.ethereum) || 0,
            others: Number(editForm.others) || 0
          }
        });
        break;
      case 'deposits':
        updateWealthData({
          deposits: {
            ...wealthData.deposits,
            savings: Number(editForm.savings) || 0,
            checking: Number(editForm.checking) || 0,
            cd: Number(editForm.cd) || 0
          }
        });
        break;
      case 'cash':
        updateWealthData({ cash: Number(editForm.cash) || 0 });
        break;
    }
    setEditDialogOpen(false);
  };

  // CopilotKit integration
  useCopilotReadable({
    description: "User's complete wealth and financial portfolio data including investments, cryptocurrency, bank deposits, and cash",
    value: wealthData,
  });

  useCopilotAction({
    name: "updateInvestments",
    description: "Update investment portfolio values (stocks, bonds, ETFs)",
    parameters: [
      { name: "stocks", type: "number", description: "Stock investments value" },
      { name: "bonds", type: "number", description: "Bond investments value" },
      { name: "etfs", type: "number", description: "ETF investments value" }
    ],
    handler: ({ stocks, bonds, etfs }) => {
      updateWealthData({
        investments: {
          ...wealthData.investments,
          stocks: stocks || wealthData.investments.stocks,
          bonds: bonds || wealthData.investments.bonds,
          etfs: etfs || wealthData.investments.etfs
        }
      });
    },
  });

  useCopilotAction({
    name: "updateCrypto",
    description: "Update cryptocurrency holdings (Bitcoin, Ethereum, others)",
    parameters: [
      { name: "bitcoin", type: "number", description: "Bitcoin value" },
      { name: "ethereum", type: "number", description: "Ethereum value" },
      { name: "others", type: "number", description: "Other cryptocurrency value" }
    ],
    handler: ({ bitcoin, ethereum, others }) => {
      updateWealthData({
        crypto: {
          ...wealthData.crypto,
          bitcoin: bitcoin || wealthData.crypto.bitcoin,
          ethereum: ethereum || wealthData.crypto.ethereum,
          others: others || wealthData.crypto.others
        }
      });
    },
  });

  useCopilotAction({
    name: "updateBankDeposits",
    description: "Update bank deposits and savings accounts",
    parameters: [
      { name: "savings", type: "number", description: "Savings account balance" },
      { name: "checking", type: "number", description: "Checking account balance" },
      { name: "cd", type: "number", description: "Certificate of deposit value" }
    ],
    handler: ({ savings, checking, cd }) => {
      updateWealthData({
        deposits: {
          ...wealthData.deposits,
          savings: savings || wealthData.deposits.savings,
          checking: checking || wealthData.deposits.checking,
          cd: cd || wealthData.deposits.cd
        }
      });
    },
  });

  useCopilotAction({
    name: "updateCash",
    description: "Update cash holdings",
    parameters: [
      { name: "cash", type: "number", description: "Cash amount" }
    ],
    handler: ({ cash }) => {
      updateWealthData({ cash: cash || wealthData.cash });
    },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Wealth Management</h2>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
          <TabsTrigger value="deposits">Bank Deposits</TabsTrigger>
          <TabsTrigger value="ai-chat">AI Assistant</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Wealth</CardTitle>
                <Wallet className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${wealthData.totalWealth.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Investments</CardTitle>
                <TrendingUp className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${wealthData.investments.total.toLocaleString()}</div>
                <p className="text-xs text-neutral-500 mt-2 dark:text-neutral-400">
                  {((wealthData.investments.total / wealthData.totalWealth) * 100).toFixed(1)}% of portfolio
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Crypto</CardTitle>
                <Coins className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${wealthData.crypto.total.toLocaleString()}</div>
                <p className="text-xs text-neutral-500 mt-2 dark:text-neutral-400">
                  {((wealthData.crypto.total / wealthData.totalWealth) * 100).toFixed(1)}% of portfolio
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bank Deposits</CardTitle>
                <Building className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${wealthData.deposits.total.toLocaleString()}</div>
                <p className="text-xs text-neutral-500 mt-2 dark:text-neutral-400">
                  {((wealthData.deposits.total / wealthData.totalWealth) * 100).toFixed(1)}% of portfolio
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Investments Breakdown</CardTitle>
                  <CardDescription>Your investment portfolio allocation</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEditDialog('investments')}>
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Stocks</span>
                    <span className="font-medium">${wealthData.investments.stocks.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bonds</span>
                    <span className="font-medium">${wealthData.investments.bonds.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ETFs</span>
                    <span className="font-medium">${wealthData.investments.etfs.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cryptocurrency</CardTitle>
                  <CardDescription>Digital asset holdings</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEditDialog('crypto')}>
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bitcoin</span>
                    <span className="font-medium">${wealthData.crypto.bitcoin.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ethereum</span>
                    <span className="font-medium">${wealthData.crypto.ethereum.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Others</span>
                    <span className="font-medium">${wealthData.crypto.others.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Bank Deposits & Cash</CardTitle>
                  <CardDescription>Liquid assets and savings</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEditDialog('deposits')}>
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Savings Account</span>
                    <span className="font-medium">${wealthData.deposits.savings.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Checking Account</span>
                    <span className="font-medium">${wealthData.deposits.checking.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Certificates of Deposit</span>
                    <span className="font-medium">${wealthData.deposits.cd.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-sm">Cash</span>
                    <span className="font-medium">${wealthData.cash.toLocaleString()}</span>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog('cash')}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Investment Portfolio</CardTitle>
                <CardDescription>Manage your investment allocations</CardDescription>
              </div>
              <Button onClick={() => openEditDialog('investments')}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Portfolio
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Stocks</Label>
                  <div className="text-2xl font-bold">${wealthData.investments.stocks.toLocaleString()}</div>
                  <p className="text-sm text-neutral-500">
                    {((wealthData.investments.stocks / wealthData.investments.total) * 100).toFixed(1)}% of investments
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Bonds</Label>
                  <div className="text-2xl font-bold">${wealthData.investments.bonds.toLocaleString()}</div>
                  <p className="text-sm text-neutral-500">
                    {((wealthData.investments.bonds / wealthData.investments.total) * 100).toFixed(1)}% of investments
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>ETFs</Label>
                  <div className="text-2xl font-bold">${wealthData.investments.etfs.toLocaleString()}</div>
                  <p className="text-sm text-neutral-500">
                    {((wealthData.investments.etfs / wealthData.investments.total) * 100).toFixed(1)}% of investments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crypto" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cryptocurrency Holdings</CardTitle>
                <CardDescription>Track your digital asset portfolio</CardDescription>
              </div>
              <Button onClick={() => openEditDialog('crypto')}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Holdings
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Bitcoin</Label>
                  <div className="text-2xl font-bold">${wealthData.crypto.bitcoin.toLocaleString()}</div>
                  <p className="text-sm text-neutral-500">
                    {((wealthData.crypto.bitcoin / wealthData.crypto.total) * 100).toFixed(1)}% of crypto
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Ethereum</Label>
                  <div className="text-2xl font-bold">${wealthData.crypto.ethereum.toLocaleString()}</div>
                  <p className="text-sm text-neutral-500">
                    {((wealthData.crypto.ethereum / wealthData.crypto.total) * 100).toFixed(1)}% of crypto
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Others</Label>
                  <div className="text-2xl font-bold">${wealthData.crypto.others.toLocaleString()}</div>
                  <p className="text-sm text-neutral-500">
                    {((wealthData.crypto.others / wealthData.crypto.total) * 100).toFixed(1)}% of crypto
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bank Deposits & Cash</CardTitle>
                <CardDescription>Manage your liquid assets</CardDescription>
              </div>
              <Button onClick={() => openEditDialog('deposits')}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Deposits
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Savings Account</Label>
                  <div className="text-2xl font-bold">${wealthData.deposits.savings.toLocaleString()}</div>
                </div>
                <div className="space-y-2">
                  <Label>Checking Account</Label>
                  <div className="text-2xl font-bold">${wealthData.deposits.checking.toLocaleString()}</div>
                </div>
                <div className="space-y-2">
                  <Label>Certificates of Deposit</Label>
                  <div className="text-2xl font-bold">${wealthData.deposits.cd.toLocaleString()}</div>
                </div>
                <div className="space-y-2">
                  <Label>Cash</Label>
                  <div className="text-2xl font-bold">${wealthData.cash.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Wealth Assistant</CardTitle>
              <CardDescription>
                Chat with AI to manage your wealth. You can ask to update values, get insights, or analyze your portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <CopilotChat
                  instructions="You are a wealth management assistant. Help users manage their financial portfolio including investments, cryptocurrency, bank deposits, and cash. You can update values, provide insights, and answer questions about their wealth data."
                  labels={{
                    title: "Wealth Assistant",
                    initial: "Hello! I'm your AI wealth assistant. I can help you update your portfolio values, analyze your investments, or answer questions about your financial data. What would you like to do?",
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingCategory}</DialogTitle>
            <DialogDescription>
              Update your {editingCategory} values
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingCategory === 'investments' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="stocks">Stocks ($)</Label>
                  <Input
                    id="stocks"
                    type="number"
                    value={editForm.stocks || ''}
                    onChange={(e) => setEditForm({...editForm, stocks: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonds">Bonds ($)</Label>
                  <Input
                    id="bonds"
                    type="number"
                    value={editForm.bonds || ''}
                    onChange={(e) => setEditForm({...editForm, bonds: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="etfs">ETFs ($)</Label>
                  <Input
                    id="etfs"
                    type="number"
                    value={editForm.etfs || ''}
                    onChange={(e) => setEditForm({...editForm, etfs: e.target.value})}
                  />
                </div>
              </>
            )}
            {editingCategory === 'crypto' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bitcoin">Bitcoin ($)</Label>
                  <Input
                    id="bitcoin"
                    type="number"
                    value={editForm.bitcoin || ''}
                    onChange={(e) => setEditForm({...editForm, bitcoin: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ethereum">Ethereum ($)</Label>
                  <Input
                    id="ethereum"
                    type="number"
                    value={editForm.ethereum || ''}
                    onChange={(e) => setEditForm({...editForm, ethereum: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="others">Others ($)</Label>
                  <Input
                    id="others"
                    type="number"
                    value={editForm.others || ''}
                    onChange={(e) => setEditForm({...editForm, others: e.target.value})}
                  />
                </div>
              </>
            )}
            {editingCategory === 'deposits' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="savings">Savings Account ($)</Label>
                  <Input
                    id="savings"
                    type="number"
                    value={editForm.savings || ''}
                    onChange={(e) => setEditForm({...editForm, savings: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checking">Checking Account ($)</Label>
                  <Input
                    id="checking"
                    type="number"
                    value={editForm.checking || ''}
                    onChange={(e) => setEditForm({...editForm, checking: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cd">Certificates of Deposit ($)</Label>
                  <Input
                    id="cd"
                    type="number"
                    value={editForm.cd || ''}
                    onChange={(e) => setEditForm({...editForm, cd: e.target.value})}
                  />
                </div>
              </>
            )}
            {editingCategory === 'cash' && (
              <div className="space-y-2">
                <Label htmlFor="cash">Cash ($)</Label>
                <Input
                  id="cash"
                  type="number"
                  value={editForm.cash || ''}
                  onChange={(e) => setEditForm({...editForm, cash: e.target.value})}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveChanges}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}