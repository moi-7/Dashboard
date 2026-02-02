import React, { useMemo, useRef, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Users, UserCheck, Clock, TrendingUp, Download, MoreVertical, FileText, Image as ImageIcon, GripHorizontal, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface Customer {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  tags: string[];
  lastContacted: string;
}

export interface ChartVisibility {
  stats: boolean;
  bar: boolean;
  pie: boolean;
  line: boolean;
}

export type WidgetSize = 'full' | 'half';

// Define available themes
export const CHART_THEMES = {
  indigo: {
    name: 'Indigo',
    colors: ['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff', '#312e81'],
    primary: '#4f46e5',
    light: '#e0e7ff',
    iconClass: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/50 dark:text-indigo-400',
    hoverClass: 'hover:border-indigo-200 dark:hover:border-indigo-800'
  },
  emerald: {
    name: 'Emerald',
    colors: ['#10b981', '#34d399', '#6ee7b7', '#d1fae5', '#064e3b'],
    primary: '#10b981',
    light: '#d1fae5',
    iconClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/50 dark:text-emerald-400',
    hoverClass: 'hover:border-emerald-200 dark:hover:border-emerald-800'
  },
  rose: {
    name: 'Rose',
    colors: ['#e11d48', '#fb7185', '#fda4af', '#ffe4e6', '#881337'],
    primary: '#e11d48',
    light: '#ffe4e6',
    iconClass: 'text-rose-600 bg-rose-50 dark:bg-rose-900/50 dark:text-rose-400',
    hoverClass: 'hover:border-rose-200 dark:hover:border-rose-800'
  },
  amber: {
    name: 'Amber',
    colors: ['#d97706', '#f59e0b', '#fcd34d', '#fef3c7', '#78350f'],
    primary: '#d97706',
    light: '#fef3c7',
    iconClass: 'text-amber-600 bg-amber-50 dark:bg-amber-900/50 dark:text-amber-400',
    hoverClass: 'hover:border-amber-200 dark:hover:border-amber-800'
  },
  slate: {
    name: 'Slate',
    colors: ['#475569', '#94a3b8', '#cbd5e1', '#f1f5f9', '#0f172a'],
    primary: '#475569',
    light: '#f1f5f9',
    iconClass: 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400',
    hoverClass: 'hover:border-slate-200 dark:hover:border-slate-700'
  }
};

export type ThemeKey = keyof typeof CHART_THEMES | 'custom';

function generatePalette(baseColor: string) {
  return [
    baseColor,
    baseColor + 'CC', // 80%
    baseColor + '80', // 50%
    baseColor + '4D', // 30%
    baseColor + '1A'  // 10%
  ];
}

interface CustomerChartsProps {
  data: Customer[];
  onFilterChange: (tag: string) => void;
  visibleCharts: ChartVisibility;
  theme: ThemeKey;
  customColor?: string;
  widgetOrder: string[];
  onReorderWidgets: (dragIndex: number, hoverIndex: number) => void;
  widgetSizes: Record<string, WidgetSize>;
  onToggleSize: (id: string) => void;
}

const ItemTypes = {
  WIDGET: 'widget'
};

interface DraggableWidgetProps {
  id: string;
  index: number;
  moveWidget: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
  className?: string;
}

function DraggableWidget({ id, index, moveWidget, children, className }: DraggableWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.WIDGET,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as any).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveWidget(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.WIDGET,
    item: () => ({ id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div 
      ref={ref} 
      data-handler-id={handlerId}
      className={`transition-all duration-200 ${isDragging ? 'opacity-0' : 'opacity-100'} ${className}`}
    >
      <div className="relative group/drag h-full">
        <div className="absolute top-2 right-12 z-10 opacity-0 group-hover/drag:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg">
          <GripHorizontal size={16} />
        </div>
        {children}
      </div>
    </div>
  );
}

function ChartCard({ 
  title, 
  subtitle, 
  children, 
  onExportData, 
  onExportImage,
  id,
  size,
  onToggleSize
}: { 
  title: string; 
  subtitle?: string; 
  children: React.ReactNode; 
  onExportData?: () => void; 
  onExportImage?: () => void;
  id: string;
  size: WidgetSize;
  onToggleSize: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm relative h-full flex flex-col transition-colors duration-300" id={id}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  onToggleSize();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                {size === 'full' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {size === 'full' ? 'Half Width' : 'Full Width'}
              </button>
              
              <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>

              {onExportData && (
                <button
                  onClick={() => {
                    onExportData();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <FileText size={14} />
                  Export CSV
                </button>
              )}
              {onExportImage && (
                <button
                  onClick={() => {
                    onExportImage();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <ImageIcon size={14} />
                  Export Image
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}

export function CustomerCharts({ 
  data, 
  onFilterChange, 
  visibleCharts, 
  theme = 'indigo',
  customColor = '#4f46e5',
  widgetOrder,
  onReorderWidgets,
  widgetSizes,
  onToggleSize
}: CustomerChartsProps) {
  
  // Resolve Theme
  const themeColors = useMemo(() => {
    if (theme === 'custom') {
      return {
        colors: generatePalette(customColor),
        primary: customColor,
        light: customColor + '10', 
        iconClass: '', 
        hoverClass: ''
      };
    }
    return CHART_THEMES[theme];
  }, [theme, customColor]);

  // Determine if dark mode is active by checking DOM class
  // This is a simple check for Recharts colors. Reactive updates might require context or prop drilling,
  // but for now this check runs on render. If theme changes, this component re-renders.
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#f3f4f6';
  const tooltipBg = isDark ? '#1f2937' : '#fff';
  const tooltipBorder = isDark ? '#374151' : '#fff';
  const tooltipText = isDark ? '#f3f4f6' : '#111827';

  // Compute stats
  const stats = useMemo(() => {
    const total = data.length;
    const leads = data.filter(c => c.tags.includes('Lead')).length;
    const partners = data.filter(c => c.tags.includes('Partner')).length;
    
    // Check contact dates within last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const recentContacts = data.filter(c => {
      const date = new Date(c.lastContacted);
      return date >= thirtyDaysAgo;
    }).length;

    return { total, leads, partners, recentContacts };
  }, [data]);

  // Prepare Chart Data
  const tagData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(c => {
      c.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); 
  }, [data]);

  const activityData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(c => {
      const date = new Date(c.lastContacted);
      if (isNaN(date.getTime())) return;
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!counts[key]) counts[key] = 0;
      counts[key]++;
    });

    const chartData = Object.entries(counts).map(([name, value]) => {
      const [month, year] = name.split(" '");
      const monthIdx = new Date(`${month} 1, 2000`).getMonth();
      const fullYear = parseInt(`20${year}`);
      const sortValue = fullYear * 100 + monthIdx;
      return { name, value, sortValue };
    });

    return chartData.sort((a, b) => a.sortValue - b.sortValue);
  }, [data]);

  const handleChartClick = (data: any) => {
    if (data && data.name) {
      onFilterChange(data.name);
    }
  };

  // Export Utilities
  const downloadCSV = (chartData: any[], filename: string) => {
    const headers = Object.keys(chartData[0] || {}).filter(k => k !== 'sortValue').join(',');
    const rows = chartData.map(row => 
      Object.keys(row).filter(k => k !== 'sortValue').map(k => row[k]).join(',')
    ).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Chart data downloaded');
  };

  const downloadImage = (chartId: string, filename: string) => {
    const chartContainer = document.querySelector(`#${chartId} .recharts-surface`);
    if (!chartContainer) {
      toast.error('Could not find chart to export');
      return;
    }
    try {
      const svgData = new XMLSerializer().serializeToString(chartContainer);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      const svgRect = chartContainer.getBoundingClientRect();
      canvas.width = svgRect.width * 2;
      canvas.height = svgRect.height * 2;
      
      if (ctx) {
        ctx.scale(2, 2);
        // Use proper background color for export based on theme
        ctx.fillStyle = isDark ? '#111827' : 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      img.onload = () => {
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const link = document.createElement("a");
          link.download = `${filename}.png`;
          link.href = canvas.toDataURL("image/png");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Chart image downloaded');
        }
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      toast.error('Failed to export chart image');
    }
  };

  // Render Functions for Widgets
  const renderWidget = (widgetId: string) => {
    const size = widgetSizes[widgetId];
    const isFull = size === 'full';

    // Stats
    if (widgetId === 'stats' && visibleCharts.stats) {
      const gridCols = isFull ? 'lg:grid-cols-4' : 'lg:grid-cols-2';
      
      return (
        <div className="h-full relative group">
          <div className="absolute top-0 right-0 z-20">
             <div className="relative">
                <button 
                  onClick={() => onToggleSize('stats')}
                  className="p-1.5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                  title={isFull ? "Half Width" : "Full Width"}
                >
                  {isFull ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
             </div>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-4 h-full`}>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 h-full transition-colors duration-300">
              <div 
                className={`p-3 rounded-lg ${theme === 'custom' ? '' : (themeColors as any).iconClass}`}
                style={theme === 'custom' ? { color: themeColors.primary, backgroundColor: themeColors.light } : {}}
              >
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>

            <div 
              className={`bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-pointer transition-colors duration-300 ${theme === 'custom' ? 'hover:opacity-80' : (themeColors as any).hoverClass}`}
              onClick={() => onFilterChange('Lead')}
            >
              <div 
                className={`p-3 rounded-lg ${theme === 'custom' ? '' : (themeColors as any).iconClass}`}
                style={theme === 'custom' ? { color: themeColors.primary, backgroundColor: themeColors.light } : {}}
              >
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Leads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.leads}</p>
              </div>
            </div>

            <div 
              className={`bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-pointer transition-colors duration-300 ${theme === 'custom' ? 'hover:opacity-80' : (themeColors as any).hoverClass}`}
              onClick={() => onFilterChange('Partner')}
            >
              <div 
                className={`p-3 rounded-lg ${theme === 'custom' ? '' : (themeColors as any).iconClass}`}
                style={theme === 'custom' ? { color: themeColors.primary, backgroundColor: themeColors.light } : {}}
              >
                <UserCheck size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Partners</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.partners}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 h-full transition-colors duration-300">
              <div 
                className={`p-3 rounded-lg ${theme === 'custom' ? '' : (themeColors as any).iconClass}`}
                style={theme === 'custom' ? { color: themeColors.primary, backgroundColor: themeColors.light } : {}}
              >
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recentContacts}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Line Chart
    if (widgetId === 'line' && visibleCharts.line) {
      return (
        <ChartCard 
          id="chart-line"
          title="Activity Over Time" 
          subtitle="Customer contacts by month"
          onExportData={() => downloadCSV(activityData, 'activity_over_time')}
          onExportImage={() => downloadImage('chart-line', 'activity_over_time')}
          size={size}
          onToggleSize={() => onToggleSize(widgetId)}
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData} margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: axisColor }} 
                  axisLine={false} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: axisColor }} 
                  axisLine={false} 
                  tickLine={false}
                  width={30}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: tooltipBg, color: tooltipText }}
                  cursor={{ stroke: themeColors.primary, strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={themeColors.primary} 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: themeColors.primary, strokeWidth: 2, stroke: isDark ? '#1f2937' : '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: themeColors.primary }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      );
    }

    // Bar Chart
    if (widgetId === 'bar' && visibleCharts.bar) {
      return (
        <ChartCard 
          id="chart-bar"
          title="Customer Distribution by Tag" 
          subtitle="Click a bar to filter"
          onExportData={() => downloadCSV(tagData, 'customer_tags')}
          onExportImage={() => downloadImage('chart-bar', 'customer_tags')}
          size={size}
          onToggleSize={() => onToggleSize(widgetId)}
        >
          <div className="h-[300px] w-full cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tagData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 12, fill: axisColor }} 
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: tooltipBg, color: tooltipText }}
                />
                <Bar 
                  dataKey="value" 
                  fill={themeColors.primary} 
                  radius={[0, 4, 4, 0]} 
                  barSize={30}
                  onClick={handleChartClick}
                  className="hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      );
    }

    // Pie Chart
    if (widgetId === 'pie' && visibleCharts.pie) {
      return (
        <ChartCard 
          id="chart-pie"
          title="Tag Composition" 
          subtitle="Click a segment to filter"
          onExportData={() => downloadCSV(tagData, 'tag_composition')}
          onExportImage={() => downloadImage('chart-pie', 'tag_composition')}
          size={size}
          onToggleSize={() => onToggleSize(widgetId)}
        >
          <div className="h-[300px] w-full flex flex-col items-center justify-center cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tagData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={handleChartClick}
                  className="hover:opacity-80 transition-opacity outline-none"
                  stroke={isDark ? '#111827' : '#fff'}
                >
                  {tagData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={themeColors.colors[index % themeColors.colors.length]} className="outline-none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: tooltipBg, color: tooltipText }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      );
    }

    return null;
  };

  // ... render
  // (Rest is handled by DndProvider and the component logic)
  
  if (data.length === 0) return null;
  const hasVisibleCharts = Object.values(visibleCharts).some(v => v);
  if (!hasVisibleCharts) return null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        {widgetOrder.map((widgetId, index) => {
          if (!renderWidget(widgetId)) return null; 
          
          const isFullWidth = widgetSizes[widgetId] === 'full';
          
          return (
            <DraggableWidget
              key={widgetId}
              id={widgetId}
              index={index}
              moveWidget={onReorderWidgets}
              className={`${isFullWidth ? 'lg:col-span-2' : 'lg:col-span-1'} h-full`}
            >
              {renderWidget(widgetId)}
            </DraggableWidget>
          );
        })}
      </div>
    </DndProvider>
  );
}
