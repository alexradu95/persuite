'use client'
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, Building, Coins, Plus, Edit, PiggyBank, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Investment {
  id: string;
  type: 'stock' | 'bond' | 'etf';
  symbol: string;
  name: string;
  units: number;
  pricePerUnit: number;
  currentValue: number;
  purchaseDate: string;
}

interface CryptoHolding {
  id: string;
  symbol: string;
  name: string;
  units: number;
  pricePerUnit: number;
  currentValue: number;
  isStaked: boolean;
  stakingApr?: number;
  stakingRewards?: number;
  purchaseDate: string;
}

interface BankDeposit {
  id: string;
  type: 'savings' | 'checking' | 'cd' | 'money_market';
  bankName: string;
  accountName: string;
  balance: number;
  interestRate?: number;
  maturityDate?: string;
  monthlyGrowth?: number;
}

interface WealthData {
  investments: {
    holdings: Investment[];
    total: number;
  };
  crypto: {
    holdings: CryptoHolding[];
    totalValue: number;
    totalStakingRewards: number;
  };
  deposits: {
    accounts: BankDeposit[];
    total: number;
    monthlyInterest: number;
  };
  cash: number;
  totalWealth: number;
}

export default function WealthPage() {
  const [wealthData, setWealthData] = useState<WealthData>({
    investments: {
      holdings: [
        { id: '1', type: 'etf', symbol: 'SPY', name: 'SPDR S&P 500 ETF', units: 50, pricePerUnit: 420, currentValue: 21000, purchaseDate: '2023-01-15' },
        { id: '2', type: 'etf', symbol: 'VTI', name: 'Vanguard Total Stock Market', units: 30, pricePerUnit: 220, currentValue: 6600, purchaseDate: '2023-02-10' },
        { id: '3', type: 'stock', symbol: 'AAPL', name: 'Apple Inc.', units: 25, pricePerUnit: 180, currentValue: 4500, purchaseDate: '2023-03-05' },
        { id: '4', type: 'bond', symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond', units: 100, pricePerUnit: 95, currentValue: 9500, purchaseDate: '2023-04-01' },
      ],
      total: 41600
    },
    crypto: {
      holdings: [
        { id: '1', symbol: 'BTC', name: 'Bitcoin', units: 0.5, pricePerUnit: 45000, currentValue: 22500, isStaked: false, purchaseDate: '2023-01-20' },
        { id: '2', symbol: 'ETH', name: 'Ethereum', units: 4, pricePerUnit: 2800, currentValue: 11200, isStaked: true, stakingApr: 5.2, stakingRewards: 48.5, purchaseDate: '2023-02-15' },
        { id: '3', symbol: 'SOL', name: 'Solana', units: 50, pricePerUnit: 95, currentValue: 4750, isStaked: true, stakingApr: 7.1, stakingRewards: 28.2, purchaseDate: '2023-03-10' },
      ],
      totalValue: 38450,
      totalStakingRewards: 76.7
    },
    deposits: {
      accounts: [
        { id: '1', type: 'savings', bankName: 'Chase Bank', accountName: 'High Yield Savings', balance: 25000, interestRate: 4.5, monthlyGrowth: 93.75 },
        { id: '2', type: 'checking', bankName: 'Bank of America', accountName: 'Premium Checking', balance: 8000, interestRate: 0.1 },
        { id: '3', type: 'cd', bankName: 'Wells Fargo', accountName: '12-Month CD', balance: 15000, interestRate: 5.25, maturityDate: '2024-06-15', monthlyGrowth: 65.625 },
        { id: '4', type: 'money_market', bankName: 'Fidelity', accountName: 'Money Market', balance: 12000, interestRate: 4.8, monthlyGrowth: 48 },
      ],
      total: 60000,
      monthlyInterest: 207.375
    },
    cash: 5000,
    totalWealth: 145050
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string>('');
  const [editForm, setEditForm] = useState<any>({});
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [addItemType, setAddItemType] = useState<'investment' | 'crypto' | 'deposit'>('investment');
  const [addItemForm, setAddItemForm] = useState<any>({});

  const recalculateWealth = (data: WealthData) => {
    const investmentsTotal = data.investments.holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    const cryptoTotal = data.crypto.holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    const depositsTotal = data.deposits.accounts.reduce((sum, account) => sum + account.balance, 0);
    const stakingRewards = data.crypto.holdings.reduce((sum, holding) => sum + (holding.stakingRewards || 0), 0);
    const monthlyInterest = data.deposits.accounts.reduce((sum, account) => sum + (account.monthlyGrowth || 0), 0);
    
    return {
      ...data,
      investments: { ...data.investments, total: investmentsTotal },
      crypto: { ...data.crypto, totalValue: cryptoTotal, totalStakingRewards: stakingRewards },
      deposits: { ...data.deposits, total: depositsTotal, monthlyInterest },
      totalWealth: investmentsTotal + cryptoTotal + depositsTotal + data.cash
    };
  };

  const updateWealthData = (updates: Partial<WealthData>) => {
    const newData = recalculateWealth({ ...wealthData, ...updates });
    setWealthData(newData);
  };

  const addNewItem = () => {
    const id = Date.now().toString();
    
    if (addItemType === 'investment') {
      const newInvestment: Investment = {
        id,
        type: addItemForm.type || 'etf',
        symbol: addItemForm.symbol || '',
        name: addItemForm.name || '',
        units: Number(addItemForm.units) || 0,
        pricePerUnit: Number(addItemForm.pricePerUnit) || 0,
        currentValue: (Number(addItemForm.units) || 0) * (Number(addItemForm.pricePerUnit) || 0),
        purchaseDate: addItemForm.purchaseDate || new Date().toISOString().split('T')[0],
      };
      
      updateWealthData({
        investments: {
          ...wealthData.investments,
          holdings: [...wealthData.investments.holdings, newInvestment]
        }
      });
    } else if (addItemType === 'crypto') {
      const newCrypto: CryptoHolding = {
        id,
        symbol: addItemForm.symbol || '',
        name: addItemForm.name || '',
        units: Number(addItemForm.units) || 0,
        pricePerUnit: Number(addItemForm.pricePerUnit) || 0,
        currentValue: (Number(addItemForm.units) || 0) * (Number(addItemForm.pricePerUnit) || 0),
        isStaked: addItemForm.isStaked || false,
        stakingApr: addItemForm.isStaked ? Number(addItemForm.stakingApr) || 0 : undefined,
        stakingRewards: addItemForm.isStaked ? Number(addItemForm.stakingRewards) || 0 : undefined,
        purchaseDate: addItemForm.purchaseDate || new Date().toISOString().split('T')[0],
      };
      
      updateWealthData({
        crypto: {
          ...wealthData.crypto,
          holdings: [...wealthData.crypto.holdings, newCrypto]
        }
      });
    } else if (addItemType === 'deposit') {
      const newDeposit: BankDeposit = {
        id,
        type: addItemForm.type || 'savings',
        bankName: addItemForm.bankName || '',
        accountName: addItemForm.accountName || '',
        balance: Number(addItemForm.balance) || 0,
        interestRate: Number(addItemForm.interestRate) || 0,
        maturityDate: addItemForm.maturityDate || undefined,
        monthlyGrowth: ((Number(addItemForm.balance) || 0) * (Number(addItemForm.interestRate) || 0) / 100) / 12,
      };
      
      updateWealthData({
        deposits: {
          ...wealthData.deposits,
          accounts: [...wealthData.deposits.accounts, newDeposit]
        }
      });
    }
    
    setAddItemDialogOpen(false);
    setAddItemForm({});
  };

  const openAddDialog = (type: 'investment' | 'crypto' | 'deposit') => {
    setAddItemType(type);
    setAddItemForm({});
    setAddItemDialogOpen(true);
  };

  const deleteItem = (type: 'investment' | 'crypto' | 'deposit', id: string) => {
    if (type === 'investment') {
      updateWealthData({
        investments: {
          ...wealthData.investments,
          holdings: wealthData.investments.holdings.filter(holding => holding.id !== id)
        }
      });
    } else if (type === 'crypto') {
      updateWealthData({
        crypto: {
          ...wealthData.crypto,
          holdings: wealthData.crypto.holdings.filter(holding => holding.id !== id)
        }
      });
    } else if (type === 'deposit') {
      updateWealthData({
        deposits: {
          ...wealthData.deposits,
          accounts: wealthData.deposits.accounts.filter(account => account.id !== id)
        }
      });
    }
  };

  const editItem = (type: 'investment' | 'crypto' | 'deposit', id: string, updates: any) => {
    if (type === 'investment') {
      updateWealthData({
        investments: {
          ...wealthData.investments,
          holdings: wealthData.investments.holdings.map(holding => 
            holding.id === id 
              ? { 
                  ...holding, 
                  ...updates,
                  currentValue: (updates.units || holding.units) * (updates.pricePerUnit || holding.pricePerUnit)
                }
              : holding
          )
        }
      });
    } else if (type === 'crypto') {
      updateWealthData({
        crypto: {
          ...wealthData.crypto,
          holdings: wealthData.crypto.holdings.map(holding => 
            holding.id === id 
              ? { 
                  ...holding, 
                  ...updates,
                  currentValue: (updates.units || holding.units) * (updates.pricePerUnit || holding.pricePerUnit)
                }
              : holding
          )
        }
      });
    } else if (type === 'deposit') {
      const newBalance = updates.balance || wealthData.deposits.accounts.find(acc => acc.id === id)?.balance || 0;
      const newInterestRate = updates.interestRate || wealthData.deposits.accounts.find(acc => acc.id === id)?.interestRate || 0;
      
      updateWealthData({
        deposits: {
          ...wealthData.deposits,
          accounts: wealthData.deposits.accounts.map(account => 
            account.id === id 
              ? { 
                  ...account, 
                  ...updates,
                  monthlyGrowth: (newBalance * newInterestRate / 100) / 12
                }
              : account
          )
        }
      });
    }
  };

  const findItemBySymbol = (symbol: string): { type: 'investment' | 'crypto'; item: Investment | CryptoHolding } | null => {
    const investment = wealthData.investments.holdings.find(h => h.symbol.toLowerCase() === symbol.toLowerCase());
    if (investment) return { type: 'investment', item: investment };
    
    const crypto = wealthData.crypto.holdings.find(h => h.symbol.toLowerCase() === symbol.toLowerCase());
    if (crypto) return { type: 'crypto', item: crypto };
    
    return null;
  };

  const findAccountByName = (name: string): BankDeposit | null => {
    return wealthData.deposits.accounts.find(acc => 
      acc.accountName.toLowerCase().includes(name.toLowerCase()) ||
      acc.bankName.toLowerCase().includes(name.toLowerCase())
    ) || null;
  };

  const saveChanges = () => {
    if (editingCategory === 'cash') {
      updateWealthData({ cash: Number(editForm.cash) || 0 });
    }
    setEditDialogOpen(false);
  };

  const openEditDialog = (category: string) => {
    setEditingCategory(category);
    if (category === 'cash') {
      setEditForm({ cash: wealthData.cash });
      setEditDialogOpen(true);
    }
  };

  // CopilotKit integration
  useCopilotReadable({
    description: "User's complete wealth and financial portfolio data including investments, cryptocurrency, bank deposits, and cash",
    value: wealthData,
  });

  // ADD operations
  useCopilotAction({
    name: "addInvestment",
    description: "Add a new investment (stock, bond, or ETF) to the portfolio",
    parameters: [
      { name: "type", type: "string", description: "Investment type: stock, bond, or etf" },
      { name: "symbol", type: "string", description: "Investment symbol (e.g., SPY, AAPL)" },
      { name: "name", type: "string", description: "Investment name" },
      { name: "units", type: "number", description: "Number of units/shares" },
      { name: "pricePerUnit", type: "number", description: "Price per unit/share" }
    ],
    handler: ({ type, symbol, name, units, pricePerUnit }) => {
      setAddItemForm({ type, symbol, name, units, pricePerUnit });
      setAddItemType('investment');
      addNewItem();
    },
  });

  useCopilotAction({
    name: "addCrypto",
    description: "Add a new cryptocurrency holding with optional staking",
    parameters: [
      { name: "symbol", type: "string", description: "Crypto symbol (e.g., BTC, ETH)" },
      { name: "name", type: "string", description: "Cryptocurrency name" },
      { name: "units", type: "number", description: "Number of crypto units" },
      { name: "pricePerUnit", type: "number", description: "Price per unit" },
      { name: "isStaked", type: "boolean", description: "Whether crypto is staked" },
      { name: "stakingApr", type: "number", description: "Staking APR percentage (if staked)" },
      { name: "stakingRewards", type: "number", description: "Current staking rewards (if staked)" }
    ],
    handler: ({ symbol, name, units, pricePerUnit, isStaked, stakingApr, stakingRewards }) => {
      setAddItemForm({ symbol, name, units, pricePerUnit, isStaked, stakingApr, stakingRewards });
      setAddItemType('crypto');
      addNewItem();
    },
  });

  useCopilotAction({
    name: "addBankAccount",
    description: "Add a new bank account or deposit with interest tracking",
    parameters: [
      { name: "type", type: "string", description: "Account type: savings, checking, cd, money_market" },
      { name: "bankName", type: "string", description: "Bank name" },
      { name: "accountName", type: "string", description: "Account name/description" },
      { name: "balance", type: "number", description: "Account balance" },
      { name: "interestRate", type: "number", description: "Interest rate percentage" },
      { name: "maturityDate", type: "string", description: "Maturity date for CDs (YYYY-MM-DD format)" }
    ],
    handler: ({ type, bankName, accountName, balance, interestRate, maturityDate }) => {
      setAddItemForm({ type, bankName, accountName, balance, interestRate, maturityDate });
      setAddItemType('deposit');
      addNewItem();
    },
  });

  // EDIT operations
  useCopilotAction({
    name: "editInvestment",
    description: "Edit an existing investment by symbol. You can update units, price, or other details",
    parameters: [
      { name: "symbol", type: "string", description: "Investment symbol to find and edit" },
      { name: "units", type: "number", description: "New number of units/shares (optional)" },
      { name: "pricePerUnit", type: "number", description: "New price per unit/share (optional)" },
      { name: "name", type: "string", description: "New investment name (optional)" }
    ],
    handler: ({ symbol, units, pricePerUnit, name }) => {
      const found = findItemBySymbol(symbol);
      if (found && found.type === 'investment') {
        const updates: any = {};
        if (units !== undefined) updates.units = units;
        if (pricePerUnit !== undefined) updates.pricePerUnit = pricePerUnit;
        if (name !== undefined) updates.name = name;
        editItem('investment', found.item.id, updates);
      } else {
        throw new Error(`Investment with symbol ${symbol} not found`);
      }
    },
  });

  useCopilotAction({
    name: "editCrypto",
    description: "Edit an existing cryptocurrency holding by symbol",
    parameters: [
      { name: "symbol", type: "string", description: "Crypto symbol to find and edit" },
      { name: "units", type: "number", description: "New number of units (optional)" },
      { name: "pricePerUnit", type: "number", description: "New price per unit (optional)" },
      { name: "isStaked", type: "boolean", description: "Update staking status (optional)" },
      { name: "stakingApr", type: "number", description: "New staking APR (optional)" },
      { name: "stakingRewards", type: "number", description: "New staking rewards amount (optional)" }
    ],
    handler: ({ symbol, units, pricePerUnit, isStaked, stakingApr, stakingRewards }) => {
      const found = findItemBySymbol(symbol);
      if (found && found.type === 'crypto') {
        const updates: any = {};
        if (units !== undefined) updates.units = units;
        if (pricePerUnit !== undefined) updates.pricePerUnit = pricePerUnit;
        if (isStaked !== undefined) updates.isStaked = isStaked;
        if (stakingApr !== undefined) updates.stakingApr = stakingApr;
        if (stakingRewards !== undefined) updates.stakingRewards = stakingRewards;
        editItem('crypto', found.item.id, updates);
      } else {
        throw new Error(`Cryptocurrency with symbol ${symbol} not found`);
      }
    },
  });

  useCopilotAction({
    name: "editBankAccount",
    description: "Edit an existing bank account by account name or bank name",
    parameters: [
      { name: "accountIdentifier", type: "string", description: "Account name or bank name to find the account" },
      { name: "balance", type: "number", description: "New account balance (optional)" },
      { name: "interestRate", type: "number", description: "New interest rate percentage (optional)" },
      { name: "accountName", type: "string", description: "New account name (optional)" }
    ],
    handler: ({ accountIdentifier, balance, interestRate, accountName }) => {
      const account = findAccountByName(accountIdentifier);
      if (account) {
        const updates: any = {};
        if (balance !== undefined) updates.balance = balance;
        if (interestRate !== undefined) updates.interestRate = interestRate;
        if (accountName !== undefined) updates.accountName = accountName;
        editItem('deposit', account.id, updates);
      } else {
        throw new Error(`Bank account containing "${accountIdentifier}" not found`);
      }
    },
  });

  // DELETE operations
  useCopilotAction({
    name: "deleteInvestment",
    description: "Delete an investment by symbol",
    parameters: [
      { name: "symbol", type: "string", description: "Investment symbol to delete" }
    ],
    handler: ({ symbol }) => {
      const found = findItemBySymbol(symbol);
      if (found && found.type === 'investment') {
        deleteItem('investment', found.item.id);
      } else {
        throw new Error(`Investment with symbol ${symbol} not found`);
      }
    },
  });

  useCopilotAction({
    name: "deleteCrypto",
    description: "Delete a cryptocurrency holding by symbol",
    parameters: [
      { name: "symbol", type: "string", description: "Crypto symbol to delete" }
    ],
    handler: ({ symbol }) => {
      const found = findItemBySymbol(symbol);
      if (found && found.type === 'crypto') {
        deleteItem('crypto', found.item.id);
      } else {
        throw new Error(`Cryptocurrency with symbol ${symbol} not found`);
      }
    },
  });

  useCopilotAction({
    name: "deleteBankAccount",
    description: "Delete a bank account by account name or bank name",
    parameters: [
      { name: "accountIdentifier", type: "string", description: "Account name or bank name to find and delete the account" }
    ],
    handler: ({ accountIdentifier }) => {
      const account = findAccountByName(accountIdentifier);
      if (account) {
        deleteItem('deposit', account.id);
      } else {
        throw new Error(`Bank account containing "${accountIdentifier}" not found`);
      }
    },
  });

  // SEARCH/LIST operations
  useCopilotAction({
    name: "listInvestments",
    description: "List all current investments with their details",
    parameters: [],
    handler: () => {
      return wealthData.investments.holdings.map(h => ({
        symbol: h.symbol,
        name: h.name,
        type: h.type,
        units: h.units,
        pricePerUnit: h.pricePerUnit,
        currentValue: h.currentValue,
        purchaseDate: h.purchaseDate
      }));
    },
  });

  useCopilotAction({
    name: "listCrypto",
    description: "List all cryptocurrency holdings with staking details",
    parameters: [],
    handler: () => {
      return wealthData.crypto.holdings.map(h => ({
        symbol: h.symbol,
        name: h.name,
        units: h.units,
        pricePerUnit: h.pricePerUnit,
        currentValue: h.currentValue,
        isStaked: h.isStaked,
        stakingApr: h.stakingApr,
        stakingRewards: h.stakingRewards,
        purchaseDate: h.purchaseDate
      }));
    },
  });

  useCopilotAction({
    name: "listBankAccounts",
    description: "List all bank accounts with interest details",
    parameters: [],
    handler: () => {
      return wealthData.deposits.accounts.map(acc => ({
        bankName: acc.bankName,
        accountName: acc.accountName,
        type: acc.type,
        balance: acc.balance,
        interestRate: acc.interestRate,
        monthlyGrowth: acc.monthlyGrowth,
        maturityDate: acc.maturityDate
      }));
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
                <div className="text-2xl font-bold">${wealthData.crypto.totalValue.toLocaleString()}</div>
                <p className="text-xs text-neutral-500 mt-2 dark:text-neutral-400">
                  {((wealthData.crypto.totalValue / wealthData.totalWealth) * 100).toFixed(1)}% of portfolio
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
          
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Investment Holdings</CardTitle>
                  <CardDescription>Individual stocks, bonds, and ETFs</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openAddDialog('investment')}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {wealthData.investments.holdings.map((holding) => (
                    <div key={holding.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{holding.symbol}</div>
                        <div className="text-xs text-neutral-500">{holding.units} units @ ${holding.pricePerUnit}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${holding.currentValue.toLocaleString()}</div>
                        <div className="text-xs text-neutral-500 capitalize">{holding.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cryptocurrency</CardTitle>
                  <CardDescription>Digital assets with staking rewards</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openAddDialog('crypto')}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {wealthData.crypto.holdings.map((holding) => (
                    <div key={holding.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm flex items-center gap-2">
                          {holding.symbol}
                          {holding.isStaked && <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Staked</span>}
                        </div>
                        <div className="text-xs text-neutral-500">{holding.units} units @ ${holding.pricePerUnit}</div>
                        {holding.isStaked && (
                          <div className="text-xs text-green-600">APR: {holding.stakingApr}% | Rewards: ${holding.stakingRewards}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${holding.currentValue.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  {wealthData.crypto.totalStakingRewards > 0 && (
                    <div className="border-t pt-2 text-sm font-medium text-green-600">
                      Total Staking Rewards: ${wealthData.crypto.totalStakingRewards.toFixed(2)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Bank Accounts</CardTitle>
                  <CardDescription>Deposits with interest forecasting</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openAddDialog('deposit')}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {wealthData.deposits.accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{account.accountName}</div>
                        <div className="text-xs text-neutral-500">{account.bankName} | {account.type.replace('_', ' ').toUpperCase()}</div>
                        {account.interestRate && (
                          <div className="text-xs text-blue-600">
                            {account.interestRate}% APY | Monthly: ${account.monthlyGrowth?.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${account.balance.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 text-sm font-medium text-blue-600">
                    Monthly Interest: ${wealthData.deposits.monthlyInterest.toFixed(2)}
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between">
                    <span className="text-sm">Cash</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${wealthData.cash.toLocaleString()}</span>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog('cash')}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
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
                <CardDescription>Detailed view of all investment holdings</CardDescription>
              </div>
              <Button onClick={() => openAddDialog('investment')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Investment
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wealthData.investments.holdings.map((holding) => (
                  <div key={holding.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-bold text-lg">{holding.symbol}</div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                            {holding.type}
                          </span>
                        </div>
                        <div className="text-neutral-600 mb-2">{holding.name}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-neutral-500">Units</div>
                            <div className="font-medium">{holding.units}</div>
                          </div>
                          <div>
                            <div className="text-neutral-500">Price per Unit</div>
                            <div className="font-medium">${holding.pricePerUnit}</div>
                          </div>
                          <div>
                            <div className="text-neutral-500">Purchase Date</div>
                            <div className="font-medium">{new Date(holding.purchaseDate).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-neutral-500">% of Portfolio</div>
                            <div className="font-medium">{((holding.currentValue / wealthData.investments.total) * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4 flex flex-col items-end gap-2">
                        <div className="text-2xl font-bold">${holding.currentValue.toLocaleString()}</div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteItem('investment', holding.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-lg font-medium">Total Investment Value</span>
                  <span className="text-2xl font-bold">${wealthData.investments.total.toLocaleString()}</span>
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
                <CardDescription>Digital assets with staking rewards tracking</CardDescription>
              </div>
              <Button onClick={() => openAddDialog('crypto')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Crypto
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wealthData.crypto.holdings.map((holding) => (
                  <div key={holding.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-bold text-lg">{holding.symbol}</div>
                          {holding.isStaked && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Staked
                            </span>
                          )}
                        </div>
                        <div className="text-neutral-600 mb-2">{holding.name}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-neutral-500">Units</div>
                            <div className="font-medium">{holding.units}</div>
                          </div>
                          <div>
                            <div className="text-neutral-500">Price per Unit</div>
                            <div className="font-medium">${holding.pricePerUnit.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-neutral-500">Purchase Date</div>
                            <div className="font-medium">{new Date(holding.purchaseDate).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-neutral-500">% of Crypto</div>
                            <div className="font-medium">{((holding.currentValue / wealthData.crypto.totalValue) * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                        {holding.isStaked && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-green-700 font-medium">Staking APR</div>
                                <div className="text-green-800 font-bold">{holding.stakingApr}%</div>
                              </div>
                              <div>
                                <div className="text-green-700 font-medium">Current Rewards</div>
                                <div className="text-green-800 font-bold">${holding.stakingRewards}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4 flex flex-col items-end gap-2">
                        <div className="text-2xl font-bold">${holding.currentValue.toLocaleString()}</div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteItem('crypto', holding.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium">Total Crypto Value</span>
                    <span className="text-2xl font-bold">${wealthData.crypto.totalValue.toLocaleString()}</span>
                  </div>
                  {wealthData.crypto.totalStakingRewards > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="font-medium">Total Staking Rewards</span>
                      <span className="font-bold">${wealthData.crypto.totalStakingRewards.toFixed(2)}</span>
                    </div>
                  )}
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
                <CardDescription>Bank accounts with interest forecasting</CardDescription>
              </div>
              <Button onClick={() => openAddDialog('deposit')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wealthData.deposits.accounts.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-bold text-lg">{account.accountName}</div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                            {account.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-neutral-600 mb-2">{account.bankName}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-neutral-500">Interest Rate</div>
                            <div className="font-medium">{account.interestRate}% APY</div>
                          </div>
                          <div>
                            <div className="text-neutral-500">Monthly Growth</div>
                            <div className="font-medium">${account.monthlyGrowth?.toFixed(2)}</div>
                          </div>
                          {account.maturityDate && (
                            <div>
                              <div className="text-neutral-500">Maturity Date</div>
                              <div className="font-medium">{new Date(account.maturityDate).toLocaleDateString()}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-neutral-500">% of Deposits</div>
                            <div className="font-medium">{((account.balance / wealthData.deposits.total) * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                        {account.interestRate && account.interestRate > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm">
                              <div className="text-blue-700 font-medium">12-Month Projection</div>
                              <div className="text-blue-800 font-bold">
                                ${(account.balance + (account.monthlyGrowth || 0) * 12).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4 flex flex-col items-end gap-2">
                        <div className="text-2xl font-bold">${account.balance.toLocaleString()}</div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteItem('deposit', account.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium">Total Bank Deposits</span>
                    <span className="text-2xl font-bold">${wealthData.deposits.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-600 mb-2">
                    <span className="font-medium">Monthly Interest Income</span>
                    <span className="font-bold">${wealthData.deposits.monthlyInterest.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-lg font-medium">Cash</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">${wealthData.cash.toLocaleString()}</span>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog('cash')}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
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

      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New {addItemType === 'investment' ? 'Investment' : addItemType === 'crypto' ? 'Cryptocurrency' : 'Bank Account'}</DialogTitle>
            <DialogDescription>
              Enter details for your new {addItemType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {addItemType === 'investment' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={addItemForm.type || 'etf'} onValueChange={(value) => setAddItemForm({...addItemForm, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="bond">Bond</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., SPY, AAPL"
                    value={addItemForm.symbol || ''}
                    onChange={(e) => setAddItemForm({...addItemForm, symbol: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., SPDR S&P 500 ETF"
                    value={addItemForm.name || ''}
                    onChange={(e) => setAddItemForm({...addItemForm, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="units">Units</Label>
                    <Input
                      id="units"
                      type="number"
                      step="0.01"
                      value={addItemForm.units || ''}
                      onChange={(e) => setAddItemForm({...addItemForm, units: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">Price per Unit ($)</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      step="0.01"
                      value={addItemForm.pricePerUnit || ''}
                      onChange={(e) => setAddItemForm({...addItemForm, pricePerUnit: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={addItemForm.purchaseDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setAddItemForm({...addItemForm, purchaseDate: e.target.value})}
                  />
                </div>
              </>
            )}
            
            {addItemType === 'crypto' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., BTC, ETH, SOL"
                    value={addItemForm.symbol || ''}
                    onChange={(e) => setAddItemForm({...addItemForm, symbol: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Bitcoin, Ethereum"
                    value={addItemForm.name || ''}
                    onChange={(e) => setAddItemForm({...addItemForm, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="units">Units</Label>
                    <Input
                      id="units"
                      type="number"
                      step="0.000001"
                      value={addItemForm.units || ''}
                      onChange={(e) => setAddItemForm({...addItemForm, units: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">Price per Unit ($)</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      step="0.01"
                      value={addItemForm.pricePerUnit || ''}
                      onChange={(e) => setAddItemForm({...addItemForm, pricePerUnit: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isStaked"
                    checked={addItemForm.isStaked || false}
                    onCheckedChange={(checked) => setAddItemForm({...addItemForm, isStaked: checked})}
                  />
                  <Label htmlFor="isStaked">Enable Staking</Label>
                </div>
                {addItemForm.isStaked && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stakingApr">Staking APR (%)</Label>
                      <Input
                        id="stakingApr"
                        type="number"
                        step="0.1"
                        value={addItemForm.stakingApr || ''}
                        onChange={(e) => setAddItemForm({...addItemForm, stakingApr: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stakingRewards">Current Rewards ($)</Label>
                      <Input
                        id="stakingRewards"
                        type="number"
                        step="0.01"
                        value={addItemForm.stakingRewards || ''}
                        onChange={(e) => setAddItemForm({...addItemForm, stakingRewards: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={addItemForm.purchaseDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setAddItemForm({...addItemForm, purchaseDate: e.target.value})}
                  />
                </div>
              </>
            )}
            
            {addItemType === 'deposit' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="type">Account Type</Label>
                  <Select value={addItemForm.type || 'savings'} onValueChange={(value) => setAddItemForm({...addItemForm, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="cd">Certificate of Deposit</SelectItem>
                      <SelectItem value="money_market">Money Market</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g., Chase Bank"
                    value={addItemForm.bankName || ''}
                    onChange={(e) => setAddItemForm({...addItemForm, bankName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="e.g., High Yield Savings"
                    value={addItemForm.accountName || ''}
                    onChange={(e) => setAddItemForm({...addItemForm, accountName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="balance">Balance ($)</Label>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      value={addItemForm.balance || ''}
                      onChange={(e) => setAddItemForm({...addItemForm, balance: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interestRate">Interest Rate (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      value={addItemForm.interestRate || ''}
                      onChange={(e) => setAddItemForm({...addItemForm, interestRate: e.target.value})}
                    />
                  </div>
                </div>
                {addItemForm.type === 'cd' && (
                  <div className="space-y-2">
                    <Label htmlFor="maturityDate">Maturity Date</Label>
                    <Input
                      id="maturityDate"
                      type="date"
                      value={addItemForm.maturityDate || ''}
                      onChange={(e) => setAddItemForm({...addItemForm, maturityDate: e.target.value})}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addNewItem}>
              Add {addItemType === 'investment' ? 'Investment' : addItemType === 'crypto' ? 'Crypto' : 'Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cash</DialogTitle>
            <DialogDescription>
              Update your cash amount
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cash">Cash ($)</Label>
              <Input
                id="cash"
                type="number"
                value={editForm.cash || ''}
                onChange={(e) => setEditForm({...editForm, cash: e.target.value})}
              />
            </div>
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