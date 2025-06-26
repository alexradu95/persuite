'use client'
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label } from "@/components/atoms";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, InfoCard } from "@/components/molecules";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { useModernIncomeService } from "@/lib/hooks/use-modern-income-service";
import { Contract, WorkDayEntry, CreateContract, CreateWorkDayEntry } from "@/lib/db/types";
import { MonthlyData } from "@/lib/domains/income/services/modern-income-service";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ModernIncomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize from URL params or current date
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const monthParam = searchParams.get('month');
    const currentMonth = new Date().getMonth();
    return monthParam && !isNaN(parseInt(monthParam)) ? parseInt(monthParam) - 1 : currentMonth;
  });
  
  const [selectedYear, setSelectedYear] = useState(() => {
    const yearParam = searchParams.get('year');
    const currentYear = new Date().getFullYear();
    return yearParam && !isNaN(parseInt(yearParam)) ? parseInt(yearParam) : currentYear;
  });
  
  // Exchange rates
  const exchangeRates = useMemo(() => ({
    EUR_TO_RON: 4.97,
    EUR_TO_USD: 1.07
  }), []);
  
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [editingEntries, setEditingEntries] = useState<WorkDayEntry[]>([]);
  const [newContract, setNewContract] = useState<CreateContract>({
    id: '',
    name: '',
    hourlyRate: 37,
    description: ''
  });
  
  const incomeService = useModernIncomeService();

  // Function to update URL when month/year changes
  const updateURL = useMemo(() => (month: number, year: number) => {
    const params = new URLSearchParams();
    params.set('month', (month + 1).toString());
    params.set('year', year.toString());
    router.push(`/income?${params.toString()}`, { scroll: false });
  }, [router]);

  // Handle browser navigation
  useEffect(() => {
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    
    if (monthParam && yearParam && !isNaN(parseInt(monthParam)) && !isNaN(parseInt(yearParam))) {
      const urlMonth = parseInt(monthParam) - 1;
      const urlYear = parseInt(yearParam);
      
      if (urlMonth !== selectedMonth || urlYear !== selectedYear) {
        setSelectedMonth(urlMonth);
        setSelectedYear(urlYear);
      }
    }
  }, [searchParams, selectedMonth, selectedYear]);

  // Load contracts on mount
  useEffect(() => {
    const loadContracts = async () => {
      try {
        const contractsData = await incomeService.getAllContracts();
        setContracts(contractsData);
      } catch (error) {
        console.error('Failed to load contracts:', error);
      }
    };

    loadContracts();
  }, [incomeService]);

  // Load monthly data when month/year changes
  useEffect(() => {
    const loadMonthlyData = async () => {
      try {
        const data = await incomeService.getMonthlyData(selectedMonth + 1, selectedYear);
        setMonthlyData(data);
      } catch (error) {
        console.error('Failed to load monthly data:', error);
      }
    };

    loadMonthlyData();
  }, [selectedMonth, selectedYear, incomeService]);

  const currentMonthData = monthlyData || {
    month: monthNames[selectedMonth],
    year: selectedYear,
    workDayEntries: [],
    contracts: [],
    entriesGroupedByDate: {},
    totalHours: 0,
    totalEarnings: 0,
    averageHourlyRate: 0,
    workDaysCount: 0
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const getEntriesForDate = (date: string) => {
    return currentMonthData.entriesGroupedByDate[date] || [];
  };

  const isWorkDay = (date: string) => {
    return getEntriesForDate(date).length > 0;
  };

  const calculateDayEarnings = (date: string) => {
    const entries = getEntriesForDate(date);
    return entries.reduce((total, entry) => {
      const contract = contracts.find(c => c.id === entry.contractId);
      if (!contract) return total;
      return total + (entry.hours * contract.hourlyRate);
    }, 0);
  };

  const handleDayClick = async (day: number) => {
    const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(selectedYear, selectedMonth, day);
    
    try {
      const existingEntries = await incomeService.getWorkDayEntriesByDate(date);
      setEditingEntries(existingEntries);
      setSelectedDate(dateString);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Failed to load entries for date:', error);
    }
  };

  const handleAddEntry = () => {
    if (!selectedDate || contracts.length === 0) return;
    
    const newEntry: WorkDayEntry = {
      id: `temp-${Date.now()}`,
      date: new Date(selectedDate),
      contractId: contracts[0].id,
      hours: 8,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setEditingEntries([...editingEntries, newEntry]);
  };

  const handleUpdateEntry = (index: number, updates: Partial<WorkDayEntry>) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], ...updates };
    setEditingEntries(updated);
  };

  const handleRemoveEntry = (index: number) => {
    const updated = [...editingEntries];
    updated.splice(index, 1);
    setEditingEntries(updated);
  };

  const handleSaveEntries = async () => {
    try {
      for (const entry of editingEntries) {
        if (entry.id.startsWith('temp-')) {
          // Create new entry
          const createData: CreateWorkDayEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            date: entry.date,
            contractId: entry.contractId,
            hours: entry.hours,
            notes: entry.notes
          };
          await incomeService.createWorkDayEntry(createData);
        } else {
          // Update existing entry
          await incomeService.updateWorkDayEntry({
            id: entry.id,
            contractId: entry.contractId,
            hours: entry.hours,
            notes: entry.notes
          });
        }
      }
      
      // Reload monthly data
      const data = await incomeService.getMonthlyData(selectedMonth + 1, selectedYear);
      setMonthlyData(data);
      
      setIsDialogOpen(false);
      setEditingEntries([]);
      setSelectedDate(null);
    } catch (error) {
      console.error('Failed to save entries:', error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (entryId.startsWith('temp-')) {
      // Just remove from local state
      setEditingEntries(editingEntries.filter(e => e.id !== entryId));
      return;
    }
    
    try {
      await incomeService.deleteWorkDayEntry(entryId);
      setEditingEntries(editingEntries.filter(e => e.id !== entryId));
      
      // Reload monthly data
      const data = await incomeService.getMonthlyData(selectedMonth + 1, selectedYear);
      setMonthlyData(data);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleCreateContract = async () => {
    try {
      const contractData: CreateContract = {
        ...newContract,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };
      
      const created = await incomeService.createContract(contractData);
      setContracts([...contracts, created]);
      setIsContractDialogOpen(false);
      setNewContract({ id: '', name: '', hourlyRate: 37, description: '' });
    } catch (error) {
      console.error('Failed to create contract:', error);
    }
  };

  const getFreeDaysInMonth = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const freeDays = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (!isWorkDay(dateString)) {
        freeDays.push({
          day,
          date: dateString,
          dayName: new Date(selectedYear, selectedMonth, day).toLocaleDateString('en', { weekday: 'short' })
        });
      }
    }
    return freeDays;
  }, [selectedYear, selectedMonth, currentMonthData.entriesGroupedByDate]);

  const convertCurrency = useMemo(() => (amountInEur: number) => {
    return {
      eur: amountInEur,
      ron: amountInEur * exchangeRates.EUR_TO_RON,
      usd: amountInEur * exchangeRates.EUR_TO_USD
    };
  }, [exchangeRates]);

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square flex flex-col items-center justify-center border-[3px] border-black bg-white min-h-[60px] p-2" style={{visibility: 'hidden'}}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entries = getEntriesForDate(dateString);
      const isWork = isWorkDay(dateString);
      const dayEarnings = calculateDayEarnings(dateString);

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={`aspect-square flex flex-col items-center justify-center border-[3px] border-black cursor-pointer transition-all duration-200 font-black min-h-[60px] p-2 relative group ${
            isWork 
              ? 'bg-emerald-500 text-white' 
              : 'bg-white hover:bg-amber-400 hover:-translate-x-0.5 hover:-translate-y-0.5'
          }`}
          style={{
            boxShadow: isWork ? '6px 6px 0px #000000' : '4px 4px 0px #000000',
            fontFamily: 'Arial Black, Arial, sans-serif'
          }}
        >
          <span className="font-black text-lg mb-1">{day}</span>
          {isWork && (
            <>
              <span className="text-xs font-bold opacity-80">€{dayEarnings.toFixed(0)}</span>
              <span className="text-xs font-bold opacity-60">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
            </>
          )}
        </div>
      );
    }

    return days;
  };

  // CopilotKit integration
  useCopilotReadable({
    description: "Current income tracking data with contracts and work day entries",
    value: {
      currentMonth: {
        ...currentMonthData,
        totalEarningsMultiCurrency: convertCurrency(currentMonthData.totalEarnings)
      },
      contracts: contracts,
      selectedPeriod: `${monthNames[selectedMonth]} ${selectedYear}`,
      freeDaysThisMonth: getFreeDaysInMonth,
      exchangeRates
    },
  });

  useCopilotAction({
    name: "addWorkDayEntry",
    description: "Add a new work day entry for a specific contract",
    parameters: [
      { name: "date", type: "string", description: "Date in YYYY-MM-DD format", required: true },
      { name: "contractId", type: "string", description: "ID of the contract to use", required: true },
      { name: "hours", type: "number", description: "Number of hours worked", required: true },
      { name: "notes", type: "string", description: "Optional notes for the work day entry", required: false },
    ],
    handler: async ({ date, contractId, hours, notes = "" }) => {
      try {
        const contract = contracts.find(c => c.id === contractId);
        if (!contract) {
          return `Contract with ID ${contractId} not found. Available contracts: ${contracts.map(c => `${c.name} (${c.id})`).join(', ')}`;
        }

        const createData: CreateWorkDayEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          date: new Date(date),
          contractId,
          hours,
          notes
        };
        
        await incomeService.createWorkDayEntry(createData);
        
        // Reload monthly data
        const data = await incomeService.getMonthlyData(selectedMonth + 1, selectedYear);
        setMonthlyData(data);
        
        const dailyEarnings = hours * contract.hourlyRate;
        const earnings = convertCurrency(dailyEarnings);
        return `Added work day entry for ${date}: ${hours} hours for ${contract.name} at €${contract.hourlyRate}/hour = €${dailyEarnings} (${earnings.ron.toFixed(2)} RON, $${earnings.usd.toFixed(2)} USD)`;
      } catch (error) {
        return `Failed to add work day entry: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });

  useCopilotAction({
    name: "createContract",
    description: "Create a new contract with name, hourly rate, and optional description",
    parameters: [
      { name: "name", type: "string", description: "Contract name", required: true },
      { name: "hourlyRate", type: "number", description: "Hourly rate in EUR", required: true },
      { name: "description", type: "string", description: "Optional contract description", required: false },
    ],
    handler: async ({ name, hourlyRate, description = "" }) => {
      try {
        const contractData: CreateContract = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name,
          hourlyRate,
          description
        };
        
        const created = await incomeService.createContract(contractData);
        setContracts([...contracts, created]);
        
        return `Created contract "${name}" with hourly rate €${hourlyRate}/hour. Contract ID: ${created.id}`;
      } catch (error) {
        return `Failed to create contract: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wide mb-2">Modern Income Tracking</h1>
          <p className="text-gray-600 font-bold">Track work with multiple contracts and calculate monthly income</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsContractDialogOpen(true)}>
            Manage Contracts
          </Button>
          <select
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              const newYear = parseInt(year);
              const newMonth = parseInt(month);
              setSelectedYear(newYear);
              setSelectedMonth(newMonth);
              updateURL(newMonth, newYear);
            }}
          >
            {Array.from({ length: 24 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - 12 + i);
              return (
                <option key={i} value={`${date.getFullYear()}-${date.getMonth()}`}>
                  {monthNames[date.getMonth()]} {date.getFullYear()}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Loading and Error States */}
      {incomeService.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {incomeService.error}
          <button 
            onClick={incomeService.clearError}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Contracts Overview */}
      {contracts.length > 0 && (
        <div className="bg-blue-50 border-[3px] border-black p-4" style={{ boxShadow: '4px 4px 0px #000000' }}>
          <h3 className="font-black mb-2">Active Contracts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {contracts.map(contract => (
              <div key={contract.id} className="bg-white border-[2px] border-black p-2 text-sm">
                <div className="font-bold">{contract.name}</div>
                <div>€{contract.hourlyRate}/hour</div>
                {contract.description && <div className="text-gray-600 text-xs">{contract.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4 md:gap-6">
        <InfoCard
          title="Total Earnings"
          icon="💰"
          value={incomeService.isLoading ? "Loading..." : `€${currentMonthData.totalEarnings.toFixed(2)}`}
          subValues={incomeService.isLoading ? [] : [
            { value: convertCurrency(currentMonthData.totalEarnings).ron.toFixed(2), label: "RON" },
            { value: `$${convertCurrency(currentMonthData.totalEarnings).usd.toFixed(2)}`, label: "USD" }
          ]}
          subtitle={`${currentMonthData.workDaysCount} work days`}
          color="yellow"
        />

        <InfoCard
          title="Total Hours"
          icon="⏰"
          value={incomeService.isLoading ? "Loading..." : currentMonthData.totalHours}
          subValues={incomeService.isLoading ? [] : [
            { value: currentMonthData.workDaysCount, label: "Days Worked" },
            { value: getFreeDaysInMonth.length, label: "Free days" }
          ]}
          subtitle="hours worked this month"
          color="blue"
        />

        <InfoCard
          title="Taxes to be Paid"
          icon="📈"
          value={incomeService.isLoading ? "Loading..." : `${((convertCurrency(currentMonthData.totalEarnings).ron * 0.1) + ((132000 * 0.25) / 12) + ((132000 * 0.10) / 12)).toFixed(2)} RON`}
          subValues={incomeService.isLoading ? [] : [
            { value: (convertCurrency(currentMonthData.totalEarnings).ron * 0.1).toFixed(2), label: "Impozit" },
            { value: ((132000 * 0.25) / 12).toFixed(2), label: "CAS" },
            { value: ((132000 * 0.10) / 12).toFixed(2), label: "CASS" }
          ]}
          subtitle="monthly taxes to reserve"
          color="green"
        />
      </div>

      {/* Calendar */}
      <div 
        className="bg-white border-[5px] border-black p-6 relative text-black"
        style={{ boxShadow: '6px 6px 0px #000000' }}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b-[3px] border-black">
          <h2 
            className="font-black text-lg uppercase tracking-wide m-0"
            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          >
            {monthNames[selectedMonth]} {selectedYear}
          </h2>
        </div>
        <div className="mt-4">
          <p className="text-sm font-bold mb-4 uppercase tracking-wide">
            Click on any day to add or edit work entries. Green days show total earnings and number of entries.
          </p>
          
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-3 px-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div 
                key={day} 
                className="text-center font-black text-sm uppercase tracking-wide p-2 bg-black text-white border-[3px] border-black"
                style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div 
            className="grid grid-cols-7 gap-2 p-4 bg-gray-100 border-[5px] border-black"
            style={{ boxShadow: '6px 6px 0px #000000' }}
          >
            {renderCalendar()}
          </div>
        </div>
      </div>

      {/* Work Day Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Work Entries for {selectedDate}
            </DialogTitle>
            <DialogDescription>
              Add or edit work day entries for different contracts
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {editingEntries.map((entry, index) => (
              <div key={entry.id} className="border-[2px] border-black p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold">Entry {index + 1}</h4>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    Delete
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`contract-${index}`}>Contract</Label>
                    <select
                      id={`contract-${index}`}
                      value={entry.contractId}
                      onChange={(e) => handleUpdateEntry(index, { contractId: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      {contracts.map(contract => (
                        <option key={contract.id} value={contract.id}>
                          {contract.name} (€{contract.hourlyRate}/h)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`hours-${index}`}>Hours</Label>
                    <Input
                      id={`hours-${index}`}
                      type="number"
                      step="0.5"
                      value={entry.hours}
                      onChange={(e) => handleUpdateEntry(index, { hours: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`notes-${index}`}>Notes</Label>
                  <Input
                    id={`notes-${index}`}
                    value={entry.notes || ''}
                    onChange={(e) => handleUpdateEntry(index, { notes: e.target.value })}
                    placeholder="Project details, tasks, etc."
                  />
                </div>
                
                <div className="p-2 bg-gray-50 rounded text-sm">
                  {(() => {
                    const contract = contracts.find(c => c.id === entry.contractId);
                    const earnings = contract ? entry.hours * contract.hourlyRate : 0;
                    return `Earnings: €${earnings.toFixed(2)}`;
                  })()}
                </div>
              </div>
            ))}
            
            {contracts.length > 0 && (
              <Button onClick={handleAddEntry} className="w-full">
                Add Entry
              </Button>
            )}
            
            {contracts.length === 0 && (
              <div className="text-center p-4 bg-yellow-50 border border-yellow-300 rounded">
                <p>You need to create at least one contract before adding work entries.</p>
                <Button onClick={() => setIsContractDialogOpen(true)} className="mt-2">
                  Create Contract
                </Button>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEntries}>
                Save Entries
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Management Dialog */}
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Contracts</DialogTitle>
            <DialogDescription>
              Create and manage your contracts
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-[2px] border-black p-4">
              <h4 className="font-bold mb-3">Create New Contract</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="contract-name">Contract Name</Label>
                  <Input
                    id="contract-name"
                    value={newContract.name}
                    onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                    placeholder="Client name or project"
                  />
                </div>
                
                <div>
                  <Label htmlFor="hourly-rate">Hourly Rate (€)</Label>
                  <Input
                    id="hourly-rate"
                    type="number"
                    step="0.01"
                    value={newContract.hourlyRate}
                    onChange={(e) => setNewContract({ ...newContract, hourlyRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={newContract.description}
                    onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                    placeholder="Contract details, scope, etc."
                  />
                </div>
                
                <Button 
                  onClick={handleCreateContract}
                  disabled={!newContract.name.trim() || newContract.hourlyRate <= 0}
                  className="w-full"
                >
                  Create Contract
                </Button>
              </div>
            </div>
            
            {contracts.length > 0 && (
              <div>
                <h4 className="font-bold mb-3">Existing Contracts</h4>
                <div className="space-y-2">
                  {contracts.map(contract => (
                    <div key={contract.id} className="flex justify-between items-center p-2 border border-gray-300 rounded">
                      <div>
                        <div className="font-medium">{contract.name}</div>
                        <div className="text-sm text-gray-600">€{contract.hourlyRate}/hour</div>
                        {contract.description && <div className="text-xs text-gray-500">{contract.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setIsContractDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}