import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Grid, _ } from 'gridjs-react';
import "gridjs/dist/theme/mermaid.css";
import { faker } from '@faker-js/faker';
import { Search, ListFilter, ArrowUpDown, Upload, Trash2, X, Download, ChevronDown, Check, Columns, Calendar, RotateCcw, PieChart as PieChartIcon, Eye, Palette, GripVertical, Plus } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner@2.0.3';
import { CustomerFormModal, CustomerFormData } from './CustomerFormModal';
import { RowActions } from './RowActions';
import { CustomerCharts, ChartVisibility, CHART_THEMES, ThemeKey, WidgetSize } from './CustomerCharts';
import update from 'immutability-helper';

interface Customer {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  tags: string[];
  lastContacted: string;
}

interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

const AVAILABLE_TAGS = ['All', 'Lead', 'Customer', 'Partner', 'Overseas', 'VIP', 'Long-term'];
const STORAGE_KEY = 'customer_dashboard_prefs_v1';
const DEFAULT_WIDGET_ORDER = ['stats', 'line', 'bar', 'pie'];
const DEFAULT_WIDGET_SIZES: Record<string, WidgetSize> = {
  stats: 'full',
  line: 'full',
  bar: 'half',
  pie: 'half'
};

export function CustomerTable() {
  // --- State Initialization with Persistence ---
  const [data, setData] = useState<Customer[]>([]);
  
  // Load preferences from local storage or defaults
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeRoleFilter, setActiveRoleFilter] = useState<string>('All');
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set(['avatar']));
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  const [visibleCharts, setVisibleCharts] = useState<ChartVisibility>({ stats: true, bar: true, pie: true, line: true });
  const [chartTheme, setChartTheme] = useState<ThemeKey>('indigo');
  const [customColor, setCustomColor] = useState('#4f46e5');
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_WIDGET_ORDER);
  const [widgetSizes, setWidgetSizes] = useState<Record<string, WidgetSize>>(DEFAULT_WIDGET_SIZES);

  useEffect(() => {
    const savedPrefs = localStorage.getItem(STORAGE_KEY);
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.rowsPerPage) setRowsPerPage(parsed.rowsPerPage);
        if (parsed.activeRoleFilter) setActiveRoleFilter(parsed.activeRoleFilter);
        if (parsed.hiddenColumns) setHiddenColumns(new Set(parsed.hiddenColumns));
        if (parsed.dateRange) setDateRange(parsed.dateRange);
        if (parsed.visibleCharts) setVisibleCharts(parsed.visibleCharts);
        if (parsed.chartTheme) setChartTheme(parsed.chartTheme);
        if (parsed.customColor) setCustomColor(parsed.customColor);
        if (parsed.widgetOrder && Array.isArray(parsed.widgetOrder)) setWidgetOrder(parsed.widgetOrder);
        if (parsed.widgetSizes) setWidgetSizes(parsed.widgetSizes);
      } catch (e) {
        console.error("Failed to load preferences", e);
      }
    }
    setPrefsLoaded(true);
  }, []);

  // Save preferences whenever they change
  useEffect(() => {
    if (!prefsLoaded) return;
    const prefsToSave = {
      rowsPerPage,
      activeRoleFilter,
      hiddenColumns: Array.from(hiddenColumns),
      dateRange,
      visibleCharts,
      chartTheme,
      customColor,
      widgetOrder,
      widgetSizes
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefsToSave));
  }, [rowsPerPage, activeRoleFilter, hiddenColumns, dateRange, visibleCharts, chartTheme, customColor, widgetOrder, widgetSizes, prefsLoaded]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // UI State for dropdowns
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [isChartMenuOpen, setIsChartMenuOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const chartMenuRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Bridge for actions inside Grid.js
  const actionsRef = useRef<{
    edit: (id: string) => void;
    delete: (id: string) => void;
    toggleSelect: (id: string) => void;
  }>({ edit: () => {}, delete: () => {}, toggleSelect: () => {} });

  useEffect(() => {
    // Generate initial data
    const customers = Array.from({ length: 30 }).map(() => ({
      id: faker.string.uuid(),
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      avatar: faker.image.avatar(),
      email: faker.internet.email(),
      phone: faker.phone.number({ style: 'national' }),
      tags: faker.helpers.arrayElements(['Lead', 'Long-term', 'Partner', 'Overseas', 'VIP'], { min: 1, max: 2 }),
      lastContacted: faker.date.past().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }));
    setData(customers);
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) setIsFilterMenuOpen(false);
      if (columnMenuRef.current && !columnMenuRef.current.contains(target)) setIsColumnMenuOpen(false);
      if (dateMenuRef.current && !dateMenuRef.current.contains(target)) setIsDateMenuOpen(false);
      if (chartMenuRef.current && !chartMenuRef.current.contains(target)) setIsChartMenuOpen(false);
    };

    if (isFilterMenuOpen || isColumnMenuOpen || isDateMenuOpen || isChartMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterMenuOpen, isColumnMenuOpen, isDateMenuOpen, isChartMenuOpen]);

  const filteredData = useMemo(() => {
    let result = data;
    
    // Text search
    if (searchQuery) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Role/Tag filter
    if (activeRoleFilter !== 'All') {
      result = result.filter(item => item.tags.includes(activeRoleFilter));
    }

    // Date Range Filter
    if (dateRange.start || dateRange.end) {
      result = result.filter(item => {
        const itemDate = new Date(item.lastContacted);
        const start = dateRange.start ? new Date(dateRange.start) : new Date('1970-01-01');
        const end = dateRange.end ? new Date(dateRange.end) : new Date('2100-01-01');
        // Set end date to end of day to include the selected day
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      });
    }
    
    return result;
  }, [data, searchQuery, activeRoleFilter, dateRange]);

  // Update refs
  useEffect(() => {
    actionsRef.current = {
      edit: (id: string) => {
        const customer = data.find(c => c.id === id);
        if (customer) {
          setEditingCustomer(customer);
          setIsModalOpen(true);
        }
      },
      delete: (id: string) => {
        if (confirm('Are you sure you want to delete this customer?')) {
          setData(prev => prev.filter(c => c.id !== id));
          setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
          toast.success('Customer deleted');
        }
      },
      toggleSelect: (id: string) => {
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
      }
    };
  }, [data]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';
    const toastId = toast.loading('Importing customers...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const newCustomers: Customer[] = results.data.map((row: any) => ({
            id: faker.string.uuid(),
            name: row.name || row.Name || row['Full Name'] || `${faker.person.firstName()} ${faker.person.lastName()}`,
            avatar: row.avatar || faker.image.avatar(),
            email: row.email || row.Email || faker.internet.email(),
            phone: row.phone || row.Phone || faker.phone.number({ style: 'national' }),
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : faker.helpers.arrayElements(['Lead', 'New'], { min: 1, max: 1 }),
            lastContacted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          }));

          if (newCustomers.length > 0) {
            setData(prev => [...newCustomers, ...prev]);
            toast.success(`Successfully imported ${newCustomers.length} customers`, { id: toastId });
          } else {
            toast.error('No valid customer data found in file', { id: toastId });
          }
        } catch (error) {
          console.error("Import error:", error);
          toast.error('Failed to process file data', { id: toastId });
        }
      },
      error: (error) => {
        console.error("Papa parse error:", error);
        toast.error('Failed to parse CSV file', { id: toastId });
      }
    });
  };

  const handleExportSelected = () => {
    const selectedCustomers = data.filter(c => selectedIds.has(c.id));
    if (selectedCustomers.length === 0) return;

    const exportData = selectedCustomers.map(({ id, avatar, ...rest }) => ({
      ...rest,
      tags: rest.tags.join(', ')
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${selectedCustomers.length} customers`);
  };

  const handleModalSubmit = (formData: CustomerFormData) => {
    if (editingCustomer) {
      setData(prev => prev.map(c => {
        if (c.id === editingCustomer.id) {
          return {
            ...c,
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            tags: [formData.role]
          };
        }
        return c;
      }));
      toast.success('Customer updated successfully');
    } else {
      const newCustomer: Customer = {
        id: faker.string.uuid(),
        name: `${formData.firstName} ${formData.lastName}`,
        avatar: faker.image.avatar(),
        email: formData.email,
        phone: formData.phone,
        tags: [formData.role],
        lastContacted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      setData(prev => [newCustomer, ...prev]);
      toast.success('Customer added successfully');
    }
    setEditingCustomer(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleToggleAll = () => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(c => c.id)));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} customers?`)) {
      setData(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      toast.success('Customers deleted');
    }
  };

  const toggleColumnVisibility = (columnId: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const toggleChartVisibility = (chartId: keyof ChartVisibility) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartId]: !prev[chartId]
    }));
  };
  
  const handleToggleWidgetSize = useCallback((id: string) => {
    setWidgetSizes(prev => ({
      ...prev,
      [id]: prev[id] === 'full' ? 'half' : 'full'
    }));
  }, []);

  const handleChartFilter = (tag: string) => {
    setActiveRoleFilter(tag);
    toast.info(`Filtered by ${tag}`);
    
    // Scroll to table if needed
    const tableElement = document.querySelector('.custom-grid-wrapper');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  
  const handleReorderWidgets = useCallback((dragIndex: number, hoverIndex: number) => {
    setWidgetOrder((prevOrder) =>
      update(prevOrder, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevOrder[dragIndex]],
        ],
      })
    );
  }, []);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveRoleFilter('All');
    setDateRange({ start: '', end: '' });
    toast.info('Filters cleared');
  };

  const isAllSelected = filteredData.length > 0 && selectedIds.size === filteredData.length;
  const hasActiveFilters = searchQuery || activeRoleFilter !== 'All' || dateRange.start || dateRange.end;

  const columns = useMemo(() => [
    {
      id: 'checkbox',
      name: _(
        <input 
          type="checkbox" 
          checked={isAllSelected}
          onChange={handleToggleAll}
          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4 bg-white dark:bg-gray-800" 
        />
      ),
      width: '50px',
      formatter: (cell: any) => {
        return _(
          <input 
            type="checkbox" 
            checked={selectedIds.has(cell)}
            onChange={() => actionsRef.current.toggleSelect(cell)}
            className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4 bg-white dark:bg-gray-800" 
          />
        );
      },
      sort: false,
      hidden: false
    },
    {
      id: 'name',
      name: `Name`,
      width: '250px',
      formatter: (cell: string, row: any) => {
        return _(
          <div className="flex items-center gap-3">
            <img 
              src={row.cells[2].data} 
              alt="avatar" 
              className="w-8 h-8 rounded-full object-cover bg-gray-100 dark:bg-gray-800"
            />
            <span className="font-medium text-gray-900 dark:text-gray-100">{cell}</span>
          </div>
        );
      },
      sort: true,
      hidden: hiddenColumns.has('name')
    },
    {
      id: 'avatar',
      name: 'Avatar',
      hidden: true // Always hidden, used for data access
    },
    {
      id: 'email',
      name: 'Email',
      formatter: (cell: string) => _(<span className="text-gray-600 dark:text-gray-400">{cell}</span>),
      sort: true,
      hidden: hiddenColumns.has('email')
    },
    {
      id: 'phone',
      name: 'Phone',
      formatter: (cell: string) => _(<span className="text-gray-600 dark:text-gray-400">{cell}</span>),
      sort: true,
      hidden: hiddenColumns.has('phone')
    },
    {
      id: 'tags',
      name: 'Tags',
      formatter: (cell: string[]) => {
        return _(
          <div className="flex gap-2 flex-wrap">
            {cell.map((tag, i) => (
              <span 
                key={i} 
                className={`px-2 py-1 rounded text-xs font-medium ${
                  tag === 'Lead' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' :
                  tag === 'Partner' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300' :
                  tag === 'Overseas' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' :
                  tag === 'VIP' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        );
      },
      sort: false,
      hidden: hiddenColumns.has('tags')
    },
    {
      id: 'lastContacted',
      name: 'Last contacted',
      formatter: (cell: string) => _(<span className="text-gray-600 dark:text-gray-400">{cell}</span>),
      sort: true,
      hidden: hiddenColumns.has('lastContacted')
    },
    {
      id: 'id',
      name: '',
      width: '60px',
      formatter: (cell: string) => {
        return _(
          <RowActions 
            onEdit={() => actionsRef.current.edit(cell)}
            onDelete={() => actionsRef.current.delete(cell)}
          />
        )
      },
      sort: false,
      hidden: false
    }
  ], [selectedIds, data.length, filteredData.length, isAllSelected, hiddenColumns]);

  const gridData = useMemo(() => {
    return filteredData.map(c => [
      c.id, // cell 0 (checkbox)
      c.name, // cell 1
      c.avatar, // cell 2
      c.email, // cell 3
      c.phone, // cell 4
      c.tags, // cell 5
      c.lastContacted, // cell 6
      c.id // cell 7 (actions)
    ]);
  }, [filteredData]);

  const isDateFilterActive = !!dateRange.start || !!dateRange.end;

  return (
    <div className="bg-transparent space-y-6">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".csv,.txt"
      />

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h2>
          {hasActiveFilters && (
             <button 
              onClick={clearFilters}
              className="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 rounded-md transition-colors"
            >
              <RotateCcw size={12} />
              Reset filters
            </button>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-200 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full whitespace-nowrap">
                {selectedIds.size} selected
              </span>
              <button 
                onClick={handleExportSelected}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Delete</span>
              </button>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <>
              {/* Chart Display Toggle */}
              <div className="relative" ref={chartMenuRef}>
                 <button 
                  onClick={() => setIsChartMenuOpen(!isChartMenuOpen)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Eye size={16} />
                  <span className="hidden sm:inline">View</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {isChartMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Show Widgets</span>
                    </div>
                    <label className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={visibleCharts.stats}
                        onChange={() => toggleChartVisibility('stats')}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mr-3 bg-white dark:bg-gray-900"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Stats Cards</span>
                    </label>
                    <label className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={visibleCharts.line}
                        onChange={() => toggleChartVisibility('line')}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mr-3 bg-white dark:bg-gray-900"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Activity Chart</span>
                    </label>
                    <label className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={visibleCharts.bar}
                        onChange={() => toggleChartVisibility('bar')}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mr-3 bg-white dark:bg-gray-900"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Tag Distribution</span>
                    </label>
                    <label className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={visibleCharts.pie}
                        onChange={() => toggleChartVisibility('pie')}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mr-3 bg-white dark:bg-gray-900"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Tag Composition</span>
                    </label>
                    
                    {/* Theme Selector Section */}
                    <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 mt-1">
                      <div className="flex items-center gap-2">
                        <Palette size={12} className="text-gray-500 dark:text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chart Theme</span>
                      </div>
                    </div>
                    <div className="p-2 grid grid-cols-6 gap-1">
                      {(Object.keys(CHART_THEMES) as ThemeKey[]).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setChartTheme(theme)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${chartTheme === theme ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500' : ''}`}
                          style={{ backgroundColor: CHART_THEMES[theme].primary }}
                          title={CHART_THEMES[theme].name}
                        >
                          {chartTheme === theme && <Check size={14} className="text-white" />}
                        </button>
                      ))}
                      
                      {/* Custom Color Trigger */}
                      <button
                        onClick={() => {
                          setChartTheme('custom');
                          colorInputRef.current?.click();
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 ${chartTheme === 'custom' ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500' : ''}`}
                        title="Custom Color"
                      >
                         <div 
                           className="w-full h-full rounded-full flex items-center justify-center"
                           style={{ backgroundColor: chartTheme === 'custom' ? customColor : 'transparent' }}
                         >
                           {chartTheme === 'custom' ? <Check size={14} className="text-white mix-blend-difference" /> : <Plus size={14} className="text-gray-400 dark:text-gray-300" />}
                         </div>
                      </button>
                    </div>
                    {/* Hidden Color Input */}
                    <input 
                      type="color" 
                      ref={colorInputRef} 
                      className="opacity-0 absolute -z-10 bottom-0 left-0"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setChartTheme('custom');
                      }}
                    />
                  </div>
                )}
              </div>

              <button 
                onClick={handleImportClick}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">Import list</span>
                <span className="inline sm:hidden">Import</span>
              </button>
              <button 
                onClick={() => {
                  setEditingCustomer(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
              >
                Add customer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Visualizations - Shown only if there is data */}
      {data.length > 0 && (
        <CustomerCharts 
          data={data} // Pass ALL data to charts, let the charts show global distribution, clicking them filters the table
          onFilterChange={handleChartFilter}
          visibleCharts={visibleCharts}
          theme={chartTheme}
          customColor={customColor}
          widgetOrder={widgetOrder}
          onReorderWidgets={handleReorderWidgets}
          widgetSizes={widgetSizes}
          onToggleSize={handleToggleWidgetSize}
        />
      )}

      {/* Filter Bar & Table Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto justify-start lg:justify-end">
            
            {/* Tag Filter */}
            <div className="relative" ref={filterMenuRef}>
              <button 
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border whitespace-nowrap ${
                  activeRoleFilter !== 'All' 
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-900/50' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <ListFilter size={16} />
                {activeRoleFilter === 'All' ? 'Filter' : activeRoleFilter}
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              
              {isFilterMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filter by Tag</span>
                  </div>
                  {AVAILABLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setActiveRoleFilter(tag);
                        setIsFilterMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between group"
                    >
                      <span className={`${activeRoleFilter === tag ? 'font-medium text-indigo-600 dark:text-indigo-400' : ''}`}>
                        {tag}
                      </span>
                      {activeRoleFilter === tag && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Filter */}
            <div className="relative" ref={dateMenuRef}>
              <button 
                onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border whitespace-nowrap ${
                  isDateFilterActive 
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-900/50' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Calendar size={16} />
                Date
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              
              {isDateMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="mb-3 pb-2 border-b border-gray-50 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Contacted Range</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">From</label>
                      <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-sm focus:outline-none focus:border-indigo-500 bg-white dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">To</label>
                      <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-sm focus:outline-none focus:border-indigo-500 bg-white dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="pt-2 flex justify-between">
                      <button 
                        onClick={() => setDateRange({ start: '', end: '' })}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Clear
                      </button>
                      <button 
                        onClick={() => setIsDateMenuOpen(false)}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Column Visibility */}
            <div className="relative" ref={columnMenuRef}>
              <button 
                onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Columns size={16} />
                <span className="hidden sm:inline">Columns</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {isColumnMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visible Columns</span>
                  </div>
                  {[
                    { id: 'name', label: 'Name' },
                    { id: 'email', label: 'Email' },
                    { id: 'phone', label: 'Phone' },
                    { id: 'tags', label: 'Tags' },
                    { id: 'lastContacted', label: 'Last Contacted' },
                  ].map(col => (
                    <label key={col.id} className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!hiddenColumns.has(col.id)}
                        onChange={() => toggleColumnVisibility(col.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mr-3 bg-white dark:bg-gray-900"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{col.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Rows:</span>
              <div className="relative">
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2 pl-3 pr-8 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid.js Table */}
        <div className="custom-grid-wrapper">
          <Grid
            data={gridData}
            columns={columns}
            sort={true}
            pagination={{
              enabled: true,
              limit: rowsPerPage,
            }}
            className={{
              table: 'w-full',
              th: '!bg-transparent !border-b !border-gray-100 dark:!border-gray-800 !text-gray-500 dark:!text-gray-400 !font-medium !text-xs !uppercase !tracking-wider !p-4 !shadow-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800',
              td: '!border-b !border-gray-50 dark:!border-gray-800 !p-4 !bg-white dark:!bg-gray-900 !text-sm !overflow-visible !text-gray-900 dark:!text-gray-100',
              container: '!shadow-none !border-none',
              footer: '!bg-transparent !border-none !p-4'
            }}
            style={{
              table: { border: 'none' },
              th: { border: 'none' },
              td: { border: 'none' },
            }}
          />
        </div>
        
        {/* Footer Text / Status */}
        <div className="flex justify-center mt-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Showing {Math.min(rowsPerPage, filteredData.length)} of {filteredData.length} customers
          </p>
        </div>
      </div>

      <style>{`
        .custom-grid-wrapper .gridjs-wrapper {
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
        }
        .custom-grid-wrapper .gridjs-container {
          color: inherit;
        }
        .custom-grid-wrapper .gridjs-tr-selected td {
          background-color: rgba(79, 70, 229, 0.05);
        }
        .dark .custom-grid-wrapper .gridjs-tr-selected td {
          background-color: rgba(79, 70, 229, 0.1);
        }
        .custom-grid-wrapper td {
          overflow: visible !important; 
        }
        .gridjs-th-sort .gridjs-sort {
          opacity: 0.3;
          float: right;
        }
        .gridjs-th-sort:hover .gridjs-sort {
          opacity: 1;
        }
        
        .gridjs-pagination .gridjs-pages button {
          border-radius: 6px !important;
          font-size: 13px !important;
          background-color: transparent;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }
        .dark .gridjs-pagination .gridjs-pages button {
          color: #9ca3af;
          border: 1px solid #374151;
        }
        .gridjs-pagination .gridjs-pages button:hover {
          background-color: #f3f4f6 !important;
        }
        .dark .gridjs-pagination .gridjs-pages button:hover {
          background-color: #1f2937 !important;
        }
        .gridjs-pagination .gridjs-pages button.gridjs-currentPage {
          background-color: #4f46e5 !important;
          color: white !important;
          border-color: #4f46e5 !important;
        }
      `}</style>

      <CustomerFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSubmit={handleModalSubmit}
        initialData={editingCustomer ? {
          firstName: editingCustomer.name.split(' ')[0],
          lastName: editingCustomer.name.split(' ').slice(1).join(' '),
          email: editingCustomer.email,
          phone: editingCustomer.phone,
          role: editingCustomer.tags[0] || 'Lead'
        } : undefined}
        isEditing={!!editingCustomer}
      />
    </div>
  );
}
