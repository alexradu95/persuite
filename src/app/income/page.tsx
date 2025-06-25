'use client'
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label } from "@/components/atoms";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, InfoCard } from "@/components/molecules";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { useIncomeService } from "@/lib/hooks/use-income-service";
import { WorkDay, MonthlyData, CreateWorkDay, UpdateWorkDay } from "@/lib/db/types";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function IncomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize from URL params or current date
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const monthParam = searchParams.get('month');
    const currentMonth = new Date().getMonth();
    return monthParam && !isNaN(parseInt(monthParam)) ? parseInt(monthParam) - 1 : currentMonth; // URL uses 1-12, state uses 0-11
  });
  
  const [selectedYear, setSelectedYear] = useState(() => {
    const yearParam = searchParams.get('year');
    const currentYear = new Date().getFullYear();
    return yearParam && !isNaN(parseInt(yearParam)) ? parseInt(yearParam) : currentYear;
  });
  
  // Exchange rates (you might want to fetch these from an API in a real app)
  const exchangeRates = useMemo(() => ({
    EUR_TO_RON: 4.97,  // 1 EUR = 4.97 RON (approximate)
    EUR_TO_USD: 1.07   // 1 EUR = 1.07 USD (approximate)
  }), []);
  
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [editingDay, setEditingDay] = useState<WorkDay | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const incomeService = useIncomeService();

  // Function to update URL when month/year changes
  const updateURL = useMemo(() => (month: number, year: number) => {
    const params = new URLSearchParams();
    params.set('month', (month + 1).toString()); // Convert 0-11 to 1-12 for URL
    params.set('year', year.toString());
    router.push(`/income?${params.toString()}`, { scroll: false });
  }, [router]);

  // Handle browser navigation (back/forward buttons)
  useEffect(() => {
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    
    if (monthParam && yearParam && !isNaN(parseInt(monthParam)) && !isNaN(parseInt(yearParam))) {
      const urlMonth = parseInt(monthParam) - 1; // Convert 1-12 to 0-11
      const urlYear = parseInt(yearParam);
      
      // Only update if different from current state
      if (urlMonth !== selectedMonth || urlYear !== selectedYear) {
        setSelectedMonth(urlMonth);
        setSelectedYear(urlYear);
      }
    }
  }, [searchParams]); // React to URL changes only

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  const currentMonthData = monthlyData || {
    month: monthNames[selectedMonth],
    year: selectedYear,
    workDays: [],
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
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const isWorkDay = (date: string) => {
    return currentMonthData.workDays.some(day => day.date === date);
  };

  const getWorkDayData = (date: string) => {
    return currentMonthData.workDays.find(day => day.date === date);
  };

  const handleDayClick = (day: number) => {
    const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingWorkDay = getWorkDayData(dateString);
    
    if (existingWorkDay) {
      setEditingDay(existingWorkDay);
    } else {
      // Create a temporary work day for editing
      const tempWorkDay: WorkDay = {
        id: `temp-${Date.now()}`,
        date: dateString,
        hours: 8,
        hourlyRate: 37,
        notes: ''
      };
      setEditingDay(tempWorkDay);
    }
    setIsDialogOpen(true);
  };

  const handleSaveWorkDay = async (workDay: WorkDay) => {
    try {
      const isExisting = !workDay.id.startsWith('temp-');
      
      if (isExisting) {
        // Update existing work day
        const updateData: UpdateWorkDay = {
          id: workDay.id,
          hours: workDay.hours,
          hourlyRate: workDay.hourlyRate,
          notes: workDay.notes,
        };
        await incomeService.updateWorkDay(updateData);
      } else {
        // Create new work day
        const createData: CreateWorkDay = {
          id: Date.now().toString(),
          date: workDay.date,
          hours: workDay.hours,
          hourlyRate: workDay.hourlyRate,
          notes: workDay.notes,
        };
        await incomeService.createWorkDay(createData);
      }

      // Reload monthly data
      const data = await incomeService.getMonthlyData(selectedMonth + 1, selectedYear);
      setMonthlyData(data);
      
      setIsDialogOpen(false);
      setEditingDay(null);
    } catch (error) {
      console.error('Failed to save work day:', error);
      // You might want to show a toast notification here
    }
  };

  const handleDeleteWorkDay = async (workDayId: string) => {
    try {
      await incomeService.deleteWorkDay(workDayId);
      
      // Reload monthly data
      const data = await incomeService.getMonthlyData(selectedMonth + 1, selectedYear);
      setMonthlyData(data);
      
      setIsDialogOpen(false);
      setEditingDay(null);
    } catch (error) {
      console.error('Failed to delete work day:', error);
      // You might want to show a toast notification here
    }
  };

  const handleQuickAdd = async (day: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (isWorkDay(dateString)) return; // Don't add if already a work day
    
    try {
      const createData: CreateWorkDay = {
        id: Date.now().toString(),
        date: dateString,
        hours: 8,
        hourlyRate: 37,
        notes: 'Quick add - 8h at €37/hour'
      };
      
      await incomeService.createWorkDay(createData);
      
      // Reload monthly data
      const data = await incomeService.getMonthlyData(selectedMonth + 1, selectedYear);
      setMonthlyData(data);
    } catch (error) {
      console.error('Failed to quick add work day:', error);
    }
  };

  const handleQuickDelete = async (day: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const workDayData = getWorkDayData(dateString);
    
    if (!workDayData) return; // Don't delete if not a work day
    
    // Show confirmation dialog
    const earnings = incomeService.calculateEarnings(workDayData.hours, workDayData.hourlyRate);
    const confirmed = window.confirm(
      `Delete work day for ${dateString}?\n\n` +
      `Hours: ${workDayData.hours}\n` +
      `Rate: €${workDayData.hourlyRate}/hour\n` +
      `Earnings: €${earnings}\n\n` +
      `This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      await incomeService.deleteWorkDay(workDayData.id);
      
      // Reload monthly data
      const data = await incomeService.getMonthlyData(selectedMonth + 1, selectedYear);
      setMonthlyData(data);
    } catch (error) {
      console.error('Failed to quick delete work day:', error);
    }
  };

  const getFreeDaysInMonth = useMemo(() => {
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const freeDays = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${monthKey}-${String(day).padStart(2, '0')}`;
      if (!isWorkDay(dateString)) {
        freeDays.push({
          day,
          date: dateString,
          dayName: new Date(selectedYear, selectedMonth, day).toLocaleDateString('en', { weekday: 'short' })
        });
      }
    }
    return freeDays;
  }, [selectedYear, selectedMonth, currentMonthData.workDays]);

  const convertCurrency = useMemo(() => (amountInEur: number) => {
    return {
      eur: amountInEur,
      ron: amountInEur * exchangeRates.EUR_TO_RON,
      usd: amountInEur * exchangeRates.EUR_TO_USD
    };
  }, [exchangeRates.EUR_TO_RON, exchangeRates.EUR_TO_USD]);

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
      const workDayData = getWorkDayData(dateString);
      const isWork = isWorkDay(dateString);

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
          {workDayData && (
            <span className="text-xs font-bold opacity-80">€{incomeService.calculateEarnings(workDayData.hours, workDayData.hourlyRate)}</span>
          )}
          {!isWork && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-0 right-0 w-4 h-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-blue-500 hover:text-white text-xs border-none shadow-none"
              onClick={(e) => handleQuickAdd(day, e)}
              title="Quick add: 8h at €37/hour"
            >
              <span>⚡</span>
            </Button>
          )}
          {isWork && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-0 right-0 w-4 h-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white text-xs border-none shadow-none"
              onClick={(e) => handleQuickDelete(day, e)}
              title="Quick delete work day"
            >
              <span>🗑️</span>
            </Button>
          )}
        </div>
      );
    }

    return days;
  };

  // CopilotKit integration
  useCopilotReadable({
    description: "Current income tracking data including work days, hours, and earnings in multiple currencies",
    value: {
      currentMonth: {
        ...currentMonthData,
        totalEarningsMultiCurrency: convertCurrency(currentMonthData.totalEarnings)
      },
      allWorkDays: currentMonthData.workDays,
      selectedPeriod: `${monthNames[selectedMonth]} ${selectedYear}`,
      freeDaysThisMonth: getFreeDaysInMonth,
      defaultRate: 37,
      defaultHours: 8,
      exchangeRates
    },
  });

  useCopilotAction({
    name: "addWorkDay",
    description: "Add a new work day with hours and hourly rate",
    parameters: [
      { name: "date", type: "string", description: "Date in YYYY-MM-DD format", required: true },
      { name: "hours", type: "number", description: "Number of hours worked", required: true },
      { name: "hourlyRate", type: "number", description: "Hourly rate for this day", required: true },
      { name: "notes", type: "string", description: "Optional notes for the work day", required: false },
    ],
    handler: async ({ date, hours, hourlyRate, notes = "" }) => {
      try {
        const createData: CreateWorkDay = {
          id: Date.now().toString(),
          date,
          hours,
          hourlyRate,
          notes
        };
        
        await incomeService.createWorkDay(createData);
        
        // Reload monthly data
        const data = await incomeService.getMonthlyData(selectedMonth + 1, selectedYear);
        setMonthlyData(data);
        
        const dailyEarnings = incomeService.calculateEarnings(hours, hourlyRate);
        const earnings = convertCurrency(dailyEarnings);
        return `Added work day for ${date}: ${hours} hours at €${hourlyRate}/hour = €${dailyEarnings} (${earnings.ron.toFixed(2)} RON, $${earnings.usd.toFixed(2)} USD)`;
      } catch (error) {
        return `Failed to add work day: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });

  useCopilotAction({
    name: "addQuickWorkDays",
    description: "Add multiple work days with default settings (8 hours at €37/hour). Can specify days by number, weekdays, or ranges.",
    parameters: [
      { name: "days", type: "string", description: "Days to add work - can be comma-separated numbers (1,5,10), weekdays (mon,tue,wed), ranges (1-5), or 'all-weekdays'", required: true },
      { name: "hours", type: "number", description: "Hours per day (default: 8)", required: false },
      { name: "hourlyRate", type: "number", description: "Hourly rate (default: €37)", required: false },
      { name: "notes", type: "string", description: "Notes for the work days", required: false },
    ],
    handler: async ({ days, hours = 8, hourlyRate = 37, notes = "Bulk added via AI" }) => {
      try {
        const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
        const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
        const workDaysToAdd: CreateWorkDay[] = [];
        
        // Parse different day formats
        if (days.toLowerCase() === 'all-weekdays') {
          // Add all weekdays (Mon-Fri) that are free
          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(selectedYear, selectedMonth, day);
            const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            const dateString = `${monthKey}-${String(day).padStart(2, '0')}`;
            
            if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isWorkDay(dateString)) {
              workDaysToAdd.push({
                id: `${Date.now()}-${day}`,
                date: dateString,
                hours,
                hourlyRate,
                notes
              });
            }
          }
        } else if (days.includes('-')) {
          // Handle ranges like "1-5" or "10-15"
          const [start, end] = days.split('-').map(d => parseInt(d.trim()));
          for (let day = start; day <= Math.min(end, daysInMonth); day++) {
            const dateString = `${monthKey}-${String(day).padStart(2, '0')}`;
            if (!isWorkDay(dateString)) {
              workDaysToAdd.push({
                id: `${Date.now()}-${day}`,
                date: dateString,
                hours,
                hourlyRate,
                notes
              });
            }
          }
        } else {
          // Handle comma-separated days or weekday names
          const dayList = days.split(',').map(d => d.trim().toLowerCase());
          const weekdayMap: { [key: string]: number } = {
            'mon': 1, 'monday': 1,    // Monday = 1
            'tue': 2, 'tuesday': 2,   // Tuesday = 2
            'wed': 3, 'wednesday': 3, // Wednesday = 3
            'thu': 4, 'thursday': 4,  // Thursday = 4
            'fri': 5, 'friday': 5,    // Friday = 5
            'sat': 6, 'saturday': 6,  // Saturday = 6
            'sun': 0, 'sunday': 0     // Sunday = 0
          };
          
          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(selectedYear, selectedMonth, day);
            const dayOfWeek = date.getDay();
            const dateString = `${monthKey}-${String(day).padStart(2, '0')}`;
            
            const shouldAdd = dayList.some(d => {
              if (!isNaN(parseInt(d))) {
                return parseInt(d) === day;
              } else if (weekdayMap[d] !== undefined) {
                return weekdayMap[d] === dayOfWeek;
              }
              return false;
            });
            
            if (shouldAdd && !isWorkDay(dateString)) {
              workDaysToAdd.push({
                id: `${Date.now()}-${day}`,
                date: dateString,
                hours,
                hourlyRate,
                notes
              });
            }
          }
        }
        
        if (workDaysToAdd.length > 0) {
          // Add all work days to database
          for (const workDay of workDaysToAdd) {
            await incomeService.createWorkDay(workDay);
          }
          
          // Reload monthly data
          const data = await incomeService.getMonthlyData(selectedMonth + 1, selectedYear);
          setMonthlyData(data);
          
          const totalEarnings = workDaysToAdd.reduce((sum, day) => sum + incomeService.calculateEarnings(day.hours, day.hourlyRate), 0);
          const earnings = convertCurrency(totalEarnings);
          return `Added ${workDaysToAdd.length} work days with total earnings of €${totalEarnings} (${earnings.ron.toFixed(2)} RON, $${earnings.usd.toFixed(2)} USD). Days: ${workDaysToAdd.map(d => d.date.split('-')[2]).join(', ')}`;
        } else {
          return "No work days were added. The specified days might already be work days or invalid.";
        }
      } catch (error) {
        return `Failed to add work days: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });

  useCopilotAction({
    name: "showFreeDays",
    description: "Show all available free days in the current month that can be used for work",
    parameters: [],
    handler: async () => {
      const freeDays = getFreeDaysInMonth;
      if (freeDays.length === 0) {
        return `No free days available in ${monthNames[selectedMonth]} ${selectedYear} - all days are already work days!`;
      }
      
      const weekdays = freeDays.filter(d => {
        const dayOfWeek = new Date(selectedYear, selectedMonth, d.day - 1).getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday=1 to Friday=5
      });
      
      const weekends = freeDays.filter(d => {
        const dayOfWeek = new Date(selectedYear, selectedMonth, d.day - 1).getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday=0, Saturday=6
      });
      
      return `Free days in ${monthNames[selectedMonth]} ${selectedYear}:
      
Weekdays (${weekdays.length}): ${weekdays.map(d => `${d.day} (${d.dayName})`).join(', ')}
Weekends (${weekends.length}): ${weekends.map(d => `${d.day} (${d.dayName})`).join(', ')}

Total free days: ${freeDays.length}
Potential earnings if all weekdays worked: €${weekdays.length * 8 * 37} (${(weekdays.length * 8 * 37 * exchangeRates.EUR_TO_RON).toFixed(2)} RON, $${(weekdays.length * 8 * 37 * exchangeRates.EUR_TO_USD).toFixed(2)} USD)`;
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wide mb-2">Income Tracking</h1>
          <p className="text-gray-600 font-bold">Track your work days and calculate monthly income</p>
        </div>
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
            { value: getFreeDaysInMonth.length, label: "Free work days" }
          ]}
          subtitle="hours worked this month"
          color="blue"
        />

        <InfoCard
          title="Taxes to be Paid"
          icon="📈"
          value={incomeService.isLoading ? "Loading..." : `${(convertCurrency(currentMonthData.totalEarnings).ron * 0.1).toFixed(2)} RON`}
          subValues={incomeService.isLoading ? [] : [
            { value: (convertCurrency(currentMonthData.totalEarnings).ron * 0.1).toFixed(2), label: "Impozit" },
            { value: (convertCurrency(currentMonthData.totalEarnings).ron * 0.25).toFixed(2), label: "CAS" },
            { value: (convertCurrency(currentMonthData.totalEarnings).ron * 0.10).toFixed(2), label: "CASS" }
          ]}
          subtitle="to be reserved for taxes"
          color="green"
        />
      </div>

      {/* Calendar - Brutalist Style */}
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
            Click on any day to add or edit work hours. Green days indicate work days.
            Hover over free days to see the quick add button (⚡) for 8h at €37/hour.
            Hover over work days to see the quick delete button (🗑️).
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

      {/* Work Day Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDay && isWorkDay(editingDay.date) ? 'Edit Work Day' : 'Add Work Day'}
            </DialogTitle>
            <DialogDescription>
              {editingDay && `Set work details for ${editingDay.date}`}
            </DialogDescription>
          </DialogHeader>
          {editingDay && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="hours">Hours Worked</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  value={editingDay.hours}
                  onChange={(e) => setEditingDay({
                    ...editingDay,
                    hours: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label htmlFor="rate">Hourly Rate (€)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={editingDay.hourlyRate}
                  onChange={(e) => setEditingDay({
                    ...editingDay,
                    hourlyRate: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={editingDay.notes || ''}
                  onChange={(e) => setEditingDay({
                    ...editingDay,
                    notes: e.target.value
                  })}
                  placeholder="Project details, client, etc."
                />
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-medium">
                  Daily Earnings: €{(editingDay.hours * editingDay.hourlyRate).toFixed(2)}
                </p>
              </div>
              <div className="flex justify-between">
                <div className="space-x-2">
                  {isWorkDay(editingDay.date) && (
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteWorkDay(editingDay.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <div className="space-x-2">
                  <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveWorkDay(editingDay)}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}