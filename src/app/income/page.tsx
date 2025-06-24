'use client'
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";

interface WorkDay {
  id: string;
  date: string;
  hours: number;
  hourlyRate: number;
  dailyEarnings: number;
  notes?: string;
}

interface MonthlyData {
  month: string;
  year: number;
  workDays: WorkDay[];
  totalHours: number;
  totalEarnings: number;
  averageHourlyRate: number;
  workDaysCount: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function IncomePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Exchange rates (you might want to fetch these from an API in a real app)
  const exchangeRates = {
    EUR_TO_RON: 4.97,  // 1 EUR = 4.97 RON (approximate)
    EUR_TO_USD: 1.07   // 1 EUR = 1.07 USD (approximate)
  };
  const [workDays, setWorkDays] = useState<WorkDay[]>([
    { id: '1', date: '2024-12-15', hours: 8, hourlyRate: 37, dailyEarnings: 296, notes: 'Regular workday' },
    { id: '2', date: '2024-12-16', hours: 6, hourlyRate: 40, dailyEarnings: 240, notes: 'Half day consulting' },
    { id: '3', date: '2024-12-17', hours: 8, hourlyRate: 37, dailyEarnings: 296, notes: 'Standard workday' },
  ]);
  
  const [editingDay, setEditingDay] = useState<WorkDay | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const currentMonthData = useMemo((): MonthlyData => {
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const monthWorkDays = workDays.filter(day => day.date.startsWith(monthKey));
    
    const totalHours = monthWorkDays.reduce((sum, day) => sum + day.hours, 0);
    const totalEarnings = monthWorkDays.reduce((sum, day) => sum + day.dailyEarnings, 0);
    const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

    return {
      month: monthNames[selectedMonth],
      year: selectedYear,
      workDays: monthWorkDays,
      totalHours,
      totalEarnings,
      averageHourlyRate,
      workDaysCount: monthWorkDays.length
    };
  }, [selectedMonth, selectedYear, workDays]);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const isWorkDay = (date: string) => {
    return workDays.some(day => day.date === date);
  };

  const getWorkDayData = (date: string) => {
    return workDays.find(day => day.date === date);
  };

  const handleDayClick = (day: number) => {
    const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingWorkDay = getWorkDayData(dateString);
    
    if (existingWorkDay) {
      setEditingDay(existingWorkDay);
    } else {
      setEditingDay({
        id: Date.now().toString(),
        date: dateString,
        hours: 8,
        hourlyRate: 37,
        dailyEarnings: 296,
        notes: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveWorkDay = (workDay: WorkDay) => {
    workDay.dailyEarnings = workDay.hours * workDay.hourlyRate;
    
    const existingIndex = workDays.findIndex(day => day.id === workDay.id);
    if (existingIndex >= 0) {
      const updatedWorkDays = [...workDays];
      updatedWorkDays[existingIndex] = workDay;
      setWorkDays(updatedWorkDays);
    } else {
      setWorkDays([...workDays, workDay]);
    }
    setIsDialogOpen(false);
    setEditingDay(null);
  };

  const handleDeleteWorkDay = (workDayId: string) => {
    setWorkDays(workDays.filter(day => day.id !== workDayId));
    setIsDialogOpen(false);
    setEditingDay(null);
  };

  const handleQuickAdd = (day: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (isWorkDay(dateString)) return; // Don't add if already a work day
    
    const newWorkDay: WorkDay = {
      id: Date.now().toString(),
      date: dateString,
      hours: 8,
      hourlyRate: 37,
      dailyEarnings: 296,
      notes: 'Quick add - 8h at €37/hour'
    };
    
    setWorkDays([...workDays, newWorkDay]);
  };

  const getFreeDaysInMonth = () => {
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
  };

  const convertCurrency = (amountInEur: number) => {
    return {
      eur: amountInEur,
      ron: amountInEur * exchangeRates.EUR_TO_RON,
      usd: amountInEur * exchangeRates.EUR_TO_USD
    };
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
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
          className={`h-16 border border-gray-200 cursor-pointer hover:bg-gray-50 flex flex-col items-center justify-center text-sm relative group ${
            isWork ? 'bg-green-100 hover:bg-green-200 border-green-300' : ''
          }`}
        >
          <span className="font-medium">{day}</span>
          {workDayData && (
            <span className="text-xs text-green-700">€{workDayData.dailyEarnings}</span>
          )}
          {!isWork && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-0 right-0 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-blue-500 hover:text-white"
              onClick={(e) => handleQuickAdd(day, e)}
              title="Quick add: 8h at €37/hour"
            >
              <span>⚡</span>
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
      allWorkDays: workDays,
      selectedPeriod: `${monthNames[selectedMonth]} ${selectedYear}`,
      freeDaysThisMonth: getFreeDaysInMonth(),
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
      const newWorkDay: WorkDay = {
        id: Date.now().toString(),
        date,
        hours,
        hourlyRate,
        dailyEarnings: hours * hourlyRate,
        notes
      };
      setWorkDays([...workDays, newWorkDay]);
      const earnings = convertCurrency(newWorkDay.dailyEarnings);
      return `Added work day for ${date}: ${hours} hours at €${hourlyRate}/hour = €${newWorkDay.dailyEarnings} (${earnings.ron.toFixed(2)} RON, $${earnings.usd.toFixed(2)} USD)`;
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
      const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
      const addedDays = [];
      
      // Parse different day formats
      if (days.toLowerCase() === 'all-weekdays') {
        // Add all weekdays (Mon-Fri) that are free
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(selectedYear, selectedMonth, day);
          const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
          const dateString = `${monthKey}-${String(day).padStart(2, '0')}`;
          
          if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isWorkDay(dateString)) {
            const newWorkDay: WorkDay = {
              id: `${Date.now()}-${day}`,
              date: dateString,
              hours,
              hourlyRate,
              dailyEarnings: hours * hourlyRate,
              notes
            };
            addedDays.push(newWorkDay);
          }
        }
      } else if (days.includes('-')) {
        // Handle ranges like "1-5" or "10-15"
        const [start, end] = days.split('-').map(d => parseInt(d.trim()));
        for (let day = start; day <= Math.min(end, daysInMonth); day++) {
          const dateString = `${monthKey}-${String(day).padStart(2, '0')}`;
          if (!isWorkDay(dateString)) {
            const newWorkDay: WorkDay = {
              id: `${Date.now()}-${day}`,
              date: dateString,
              hours,
              hourlyRate,
              dailyEarnings: hours * hourlyRate,
              notes
            };
            addedDays.push(newWorkDay);
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
            const newWorkDay: WorkDay = {
              id: `${Date.now()}-${day}`,
              date: dateString,
              hours,
              hourlyRate,
              dailyEarnings: hours * hourlyRate,
              notes
            };
            addedDays.push(newWorkDay);
          }
        }
      }
      
      if (addedDays.length > 0) {
        setWorkDays([...workDays, ...addedDays]);
        const totalEarnings = addedDays.reduce((sum, day) => sum + day.dailyEarnings, 0);
        const earnings = convertCurrency(totalEarnings);
        return `Added ${addedDays.length} work days with total earnings of €${totalEarnings} (${earnings.ron.toFixed(2)} RON, $${earnings.usd.toFixed(2)} USD). Days: ${addedDays.map(d => d.date.split('-')[2]).join(', ')}`;
      } else {
        return "No work days were added. The specified days might already be work days or invalid.";
      }
    },
  });

  useCopilotAction({
    name: "showFreeDays",
    description: "Show all available free days in the current month that can be used for work",
    parameters: [],
    handler: async () => {
      const freeDays = getFreeDaysInMonth();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Income Tracking</h1>
          <p className="text-gray-600">Track your work days and calculate monthly income</p>
        </div>
        <select
          value={`${selectedYear}-${selectedMonth}`}
          onChange={(e) => {
            const [year, month] = e.target.value.split('-');
            setSelectedYear(parseInt(year));
            setSelectedMonth(parseInt(month));
          }}
          className="px-4 py-2 border border-gray-300 rounded-md"
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Monthly Summary Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <span className="text-gray-500">💰</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">€{currentMonthData.totalEarnings.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">
                {convertCurrency(currentMonthData.totalEarnings).ron.toFixed(2)} RON
              </div>
              <div className="text-sm text-muted-foreground">
                ${convertCurrency(currentMonthData.totalEarnings).usd.toFixed(2)} USD
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {currentMonthData.workDaysCount} work days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <span className="text-gray-500">⏰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthData.totalHours}</div>
            <p className="text-xs text-muted-foreground">
              hours worked this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
            <span className="text-gray-500">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{currentMonthData.averageHourlyRate.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              per hour average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Days</CardTitle>
            <span className="text-gray-500">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthData.workDaysCount}</div>
            <p className="text-xs text-muted-foreground">
              days this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>{monthNames[selectedMonth]} {selectedYear}</CardTitle>
          <CardDescription>
            Click on any day to add or edit work hours. Green days indicate work days.
            Hover over free days to see the quick add button (⚡) for 8h at €37/hour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="h-8 flex items-center justify-center font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </CardContent>
      </Card>

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
                      variant="destructive"
                      onClick={() => handleDeleteWorkDay(editingDay.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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