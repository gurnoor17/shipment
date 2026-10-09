'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

type Shipment = {
  _id?: string;
  category: string;
  invoiceNo: string;
  dateOfShipment: string;
  noOfBoxes: number;
  totalWeight: number;
  cbm: number;
  fbaId: string;
  sailingDate: string;
  expectedReachingDate: string;
  containerNo: string;
  reachedDate: string;
  pickupDate: string;
  assignedManager: string;
  attachments: { name: string; data: string; mimeType: string }[];
  saved: boolean;
  createdAt?: string;
};

type Profile = {
  _id?: string;
  userName: string;
  companyName: string;
  defaultCategory: string;
};

const CATEGORIES = ['USA', 'UK', 'Germany', 'Walmart US'];
const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'];

let toastIdCounter = 0;

export default function Home() {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const [profile, setProfile] = useState<Profile>({ userName: 'Logistics Manager', companyName: 'Danodia Global Exports', defaultCategory: 'USA' });
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentViewMode, setCurrentViewMode] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  // Fetch data
  useEffect(() => {
    fetchProfile();
    fetchShipments();
  }, []);



  async function fetchProfile() {
    const res = await fetch('/api/profile');
    if (res.ok) {
      const data = await res.json();
      if (data && data.companyName) setProfile(data);
    }
  }

  async function fetchShipments() {
    const res = await fetch('/api/shipments');
    if (res.ok) {
      const data = await res.json();
      setShipments(data);
    }
  }

  const showToast = (msg: string) => {
    toastIdCounter += 1;
    const id = toastIdCounter;
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const saveProfile = async (updatedProfile: Profile) => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProfile)
    });
    if (res.ok) {
      setProfile(await res.json());
      showToast('Profile updated successfully');
    }
  };

  const saveShipment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Handle File Uploads
    const files = Array.from((e.currentTarget.elements.namedItem('files') as HTMLInputElement)?.files || []);
    const parsedFiles = await Promise.all(files.map(file => new Promise<{ name: string; mimeType: string; data: string }>((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve({ name: file.name, mimeType: file.type, data: ev.target?.result as string });
      reader.readAsDataURL(file);
    })));

    const shipmentData: Record<string, unknown> = {
      category: formData.get('category'),
      assignedManager: formData.get('assignedManager') || 'Unassigned',
      invoiceNo: formData.get('invoiceNo'),
      dateOfShipment: formData.get('dateOfShipment'),
      noOfBoxes: Number(formData.get('noOfBoxes')) || 0,
      totalWeight: Number(formData.get('totalWeight')) || 0,
      cbm: Number(formData.get('cbm')) || 0,
      fbaId: formData.get('fbaId'),
      sailingDate: formData.get('sailingDate'),
      expectedReachingDate: formData.get('expectedReachingDate'),
      containerNo: formData.get('containerNo'),
      reachedDate: formData.get('reachedDate'),
      pickupDate: formData.get('pickupDate') as string,
      attachments: [...(editingShipment?.attachments || []), ...parsedFiles]
    };

    if (editingShipment && editingShipment._id) {
      const res = await fetch(`/api/shipments/${editingShipment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentData)
      });
      if (res.ok) {
        showToast('Shipment updated');
        fetchShipments();
        closeModal();
      }
    } else {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentData)
      });
      if (res.ok) {
        showToast('Shipment added');
        fetchShipments();
        closeModal();
      }
    }
  };

  const deleteShipment = async (id: string) => {
    if (confirm('Are you sure you want to delete this shipment?')) {
      const res = await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Shipment deleted');
        fetchShipments();
      }
    }
  };

  const deleteAttachment = async (shipmentId: string, attachmentIndex: number) => {
    if (!confirm('Remove this document?')) return;
    const shipment = shipments.find(s => s._id === shipmentId);
    if (!shipment) return;
    const updatedAttachments = shipment.attachments.filter((_, i) => i !== attachmentIndex);
    const res = await fetch(`/api/shipments/${shipmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachments: updatedAttachments })
    });
    if (res.ok) {
      showToast('Document removed');
      fetchShipments();
    }
  };

  const toggleSaved = async (shipment: Shipment) => {
    if (!shipment._id) return;
    const res = await fetch(`/api/shipments/${shipment._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved: !shipment.saved })
    });
    if (res.ok) {
      showToast(shipment.saved ? 'Shipment unsaved' : 'Shipment saved');
      fetchShipments();
    }
  };

  const formatNumber = (val: number | string) => {
    if (!val && val !== 0) return '–';
    return Number(val).toLocaleString('en-IN');
  };


  const escapeHtml = (unsafe: string | number | boolean | null | undefined) => {
    if (unsafe === null || unsafe === undefined || unsafe === '') return '–';
    return String(unsafe);
  };



  // Derived state
  const navDashboardCount = shipments.length;
  const navSavedCount = shipments.filter(s => s.saved).length;

  const counts = useMemo(() => {
    const c = { 'All': { c: 0, w: 0, v: 0 }, 'USA': { c: 0, w: 0, v: 0 }, 'UK': { c: 0, w: 0, v: 0 }, 'Germany': { c: 0, w: 0, v: 0 }, 'Walmart US': { c: 0, w: 0, v: 0 } };
    shipments.forEach(s => {
      const w = Number(s.totalWeight) || 0;
      const v = Number(s.cbm) || 0;
      c['All'].c++; c['All'].w += w; c['All'].v += v;
      if (c[s.category as keyof typeof c]) {
        c[s.category as keyof typeof c].c++;
        c[s.category as keyof typeof c].w += w;
        c[s.category as keyof typeof c].v += v;
      }
    });
    return c;
  }, [shipments]);

  const filteredData = useMemo(() => {
    const filtered = shipments.filter(s => {
      if (currentViewMode === 'saved' && !s.saved) return false;
      const matchCat = (currentViewMode === 'saved' || currentViewMode === 'analytics' || activeCategory === 'All') ? true : s.category === activeCategory;
      const matchSearch = (s.invoiceNo || '').toLowerCase().includes(searchQuery.toLowerCase());
      let matchStatus = true;
      if (statusFilter !== 'All') {
        const isDelivered = !!s.reachedDate;
        if (statusFilter === 'Delivered' && !isDelivered) matchStatus = false;
        if (statusFilter === 'In Transit' && isDelivered) matchStatus = false;
      }
      return matchCat && matchSearch && matchStatus;
    });

    return filtered.sort((a, b) => {
      if (!a.dateOfShipment && !b.dateOfShipment) return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (!a.dateOfShipment) return 1;
      if (!b.dateOfShipment) return -1;
      return new Date(b.dateOfShipment).getTime() - new Date(a.dateOfShipment).getTime();
    });
  }, [shipments, currentViewMode, activeCategory, searchQuery, statusFilter]);

  const summary = useMemo(() => {
    let boxes = 0, weight = 0, cbm = 0;
    filteredData.forEach(s => {
      boxes += Number(s.noOfBoxes) || 0;
      weight += Number(s.totalWeight) || 0;
      cbm += Number(s.cbm) || 0;
    });
    return { boxes, weight, cbm };
  }, [filteredData]);


  const chartDataMonthly = useMemo(() => {
    const monthlyMap: Record<string, { name: string; timestamp: number; Shipments: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    shipments.forEach(s => {
      const primaryDate = s.pickupDate || s.sailingDate || s.createdAt;
      if (primaryDate) {
        const d = new Date(primaryDate);
        const m = d.getMonth();
        const y = d.getFullYear();
        const key = `${months[m]} ${y}`;
        if (!monthlyMap[key]) {
          monthlyMap[key] = { name: key, timestamp: new Date(y, m, 1).getTime(), Shipments: 0 };
        }
        monthlyMap[key].Shipments++;
      }
    });
    // Sort chronologically
    return Object.values(monthlyMap).sort((a, b) => a.timestamp - b.timestamp);
  }, [shipments]);

  const chartDataPie = CATEGORIES.map((cat, idx) => ({
    name: cat,
    value: shipments.filter(s => s.category === cat).length,
    color: COLORS[idx % COLORS.length]
  })).filter(d => d.value > 0);

  const exportCSV = () => {
    if (filteredData.length === 0) {
      showToast('No data to export');
      return;
    }
    const headers = ['Shipment Date', 'Invoice No.', 'Category', 'Manager', 'No. of Boxes', 'Total Weight (kg)', 'CBM', 'FBA ID', 'Pickup Date', 'Sailing Date', 'Expected Reaching Date', 'Container No.', 'Reached Date', 'Status'];
    const rows = [headers.join(',')];
    
    filteredData.forEach(s => {
      const status = s.reachedDate ? 'Delivered' : 'In Transit';
      const row = [
        s.dateOfShipment || '',
        `"${(s.invoiceNo || '').replace(/"/g, '""')}"`,
        s.category || '',
        s.assignedManager || 'Unassigned',
        s.noOfBoxes || '',
        s.totalWeight || '',
        s.cbm || '',
        `"${(s.fbaId || '').replace(/"/g, '""')}"`,
        s.pickupDate || '',
        s.sailingDate || '',
        s.expectedReachingDate || '',
        `"${(s.containerNo || '').replace(/"/g, '""')}"`,
        s.reachedDate || '',
        status
      ];
      rows.push(row.join(','));
    });

    const csvStr = rows.join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `Shipments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Exported CSV successfully');
  };

  const openModal = (shipment: Shipment | null = null) => {
    setEditingShipment(shipment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingShipment(null);
  };



  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-900 font-inter">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <nav className={`fixed inset-y-0 left-0 w-72 bg-[#0B1120] text-slate-300 z-50 transform transition-transform duration-300 flex flex-col shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/20">
              D
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-tight">Danodia</h2>
              <h2 className="text-xl font-bold tracking-tight text-indigo-400 leading-tight">FreightOS</h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-4">Workspace</p>
          <p className="text-sm text-slate-300 mt-1 truncate">{profile.companyName}</p>
        </div>

        <div className="px-6 mb-6">
          <button 
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-2 group"
            onClick={() => { openModal(); setIsSidebarOpen(false); }}
          >
            <span className="text-lg group-hover:scale-110 transition-transform">+</span> Create Shipment
          </button>
        </div>

        <div className="px-6 mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu</p>
        </div>
        <ul className="flex-1 px-4 space-y-1">
          <li 
            className={`px-4 py-3 rounded-xl cursor-pointer flex items-center justify-between text-sm font-medium transition-all ${currentViewMode === 'dashboard' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 hover:text-white'}`}
            onClick={() => { setCurrentViewMode('dashboard'); setIsSidebarOpen(false); }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📊</span>
              <span>Dashboard</span>
            </div>
            <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full text-xs">{navDashboardCount}</span>
          </li>
          <li 
            className={`px-4 py-3 rounded-xl cursor-pointer flex items-center justify-between text-sm font-medium transition-all ${currentViewMode === 'analytics' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 hover:text-white'}`}
            onClick={() => { setCurrentViewMode('analytics'); setIsSidebarOpen(false); }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📈</span>
              <span>Analytics</span>
            </div>
          </li>
          <li 
            className={`px-4 py-3 rounded-xl cursor-pointer flex items-center justify-between text-sm font-medium transition-all ${currentViewMode === 'saved' ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 hover:text-white'}`}
            onClick={() => { setCurrentViewMode('saved'); setIsSidebarOpen(false); }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">⭐</span>
              <span>Saved Watchlist</span>
            </div>
            <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full text-xs">{navSavedCount}</span>
          </li>
        </ul>

        <div className="p-4 mt-auto">
          <ul className="space-y-1">
            <li>
              <Link
                href="/profile" 
                className="px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-all hover:bg-white/5 hover:text-white"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                  👤
                </div>
                <div className="flex flex-col">
                  <span className="text-white">{profile.userName}</span>
                  <span className="text-xs text-slate-500">Settings</span>
                </div>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 overflow-x-hidden transition-all duration-300">
        <div className="flex md:hidden items-center justify-between bg-white p-4 -m-4 mb-6 shadow-sm border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white">D</div>
            <h2 className="text-lg font-bold text-slate-900">FreightOS</h2>
          </div>
          <button className="text-2xl text-slate-600 p-1" onClick={() => setIsSidebarOpen(true)}>☰</button>
        </div>

        {(currentViewMode === 'dashboard' || currentViewMode === 'saved') && (
          <div className="animate-fade-in max-w-[1600px] mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {currentViewMode === 'saved' ? 'Watchlist' : 'Global Shipments'}
                </h1>
                <p className="text-slate-500 mt-1">Manage and track your active freight movements globally.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-sm transition-all"
                  onClick={exportCSV}
                >
                  Export CSV
                </button>
              </div>
            </div>

            {currentViewMode === 'dashboard' && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {['All', ...CATEGORIES].map(cat => {
                  const data = counts[cat as keyof typeof counts];
                  const isActive = activeCategory === cat;
                  return (
                    <div 
                      key={cat} 
                      className={`p-5 bg-white rounded-2xl cursor-pointer transition-all border-2 ${isActive ? 'border-indigo-500 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.2)]' : 'border-transparent shadow-sm hover:shadow-md hover:-translate-y-1'}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{cat === 'All' ? 'All Origins' : cat}</div>
                      <div className={`text-4xl font-black mb-2 ${isActive ? 'text-indigo-600' : 'text-slate-800'}`}>{data.c}</div>
                      <div className="text-sm font-medium text-slate-500 flex justify-between">
                        <span>{formatNumber(data.w)} <span className="text-xs font-normal">kg</span></span>
                        <span>{formatNumber(data.v)} <span className="text-xs font-normal">CBM</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search by Invoice No. or FBA ID..." 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-indigo-500 shadow-sm min-w-[160px]"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="In Transit">In Transit 🚢</option>
                <option value="Delivered">Delivered ✅</option>
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
              
              {/* Table Summary Strip */}
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap gap-x-8 gap-y-2 items-center text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Results: <strong className="text-slate-900">{filteredData.length}</strong>
                </div>
                <div className="text-slate-500">Total Boxes: <strong className="text-slate-900">{formatNumber(summary.boxes)}</strong></div>
                <div className="text-slate-500">Total Weight: <strong className="text-slate-900">{formatNumber(summary.weight)} kg</strong></div>
                <div className="text-slate-500">Total Volume: <strong className="text-slate-900">{formatNumber(summary.cbm)} CBM</strong></div>

              </div>

              {filteredData.length === 0 ? (
                <div className="text-center py-24 px-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">{currentViewMode === 'saved' ? '⭐' : '📦'}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{currentViewMode === 'saved' ? 'Watchlist is empty' : 'No shipments found'}</h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                    {currentViewMode === 'saved' ? 'Star a shipment on the dashboard to pin it here.' : 'Create a new shipment or adjust your search filters to see data.'}
                  </p>
                  {currentViewMode !== 'saved' && (
                    <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm" onClick={() => openModal()}>
                      + Add Shipment
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="bg-white">
                        <th className="font-semibold text-slate-500 text-xs uppercase tracking-wider py-4 px-6 border-b border-slate-200">Shipment Details</th>
                        <th className="font-semibold text-slate-500 text-xs uppercase tracking-wider py-4 px-6 border-b border-slate-200">Cargo</th>
                        <th className="font-semibold text-slate-500 text-xs uppercase tracking-wider py-4 px-6 border-b border-slate-200">Logistics</th>
                        <th className="font-semibold text-slate-500 text-xs uppercase tracking-wider py-4 px-6 border-b border-slate-200 text-right w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredData.map(s => {
                        const badgeColor = s.category === 'USA' ? 'bg-blue-100 text-blue-700 border-blue-200' : s.category === 'UK' ? 'bg-red-100 text-red-700 border-red-200' : s.category === 'Germany' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
                        const isDelivered = !!s.reachedDate;
                        
                        return (
                          <tr key={s._id} className="hover:bg-slate-50/80 transition-colors group">
                            
                            {/* Column 1: Details */}
                            <td className="py-4 px-6">
                              <div className="flex items-start gap-3">
                                <button className={`text-xl transition-transform hover:scale-110 focus:outline-none mt-0.5 ${s.saved ? 'text-amber-400 drop-shadow-sm' : 'text-slate-300 hover:text-amber-400'}`} onClick={() => toggleSaved(s)} title="Watchlist">
                                  {s.saved ? '★' : '☆'}
                                </button>
                                <div>
                                  <div className="font-bold text-slate-900 text-base">{escapeHtml(s.invoiceNo)}</div>
                                  <div className="text-xs text-slate-500 font-medium mt-0.5 mb-1.5 flex items-center gap-1"><span className="text-[10px]">👤</span> {escapeHtml(s.assignedManager || 'Unassigned')}</div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${badgeColor}`}>
                                      {escapeHtml(s.category)}
                                    </span>
                                    {s.attachments && s.attachments.length > 0 && (
                                      <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                                        📎 {s.attachments.length}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Column 2: Cargo */}
                            <td className="py-4 px-6">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <div className="text-slate-500">Boxes: <span className="font-medium text-slate-800">{escapeHtml(s.noOfBoxes)}</span></div>
                                <div className="text-slate-500">FBA: <span className="font-medium text-slate-800">{escapeHtml(s.fbaId)}</span></div>
                                <div className="text-slate-500">Weight: <span className="font-medium text-slate-800">{formatNumber(s.totalWeight)} kg</span></div>
                                <div className="text-slate-500">CBM: <span className="font-medium text-slate-800">{formatNumber(s.cbm)}</span></div>
                                <div className="text-slate-500 col-span-2">Cont: <span className="font-mono text-xs text-slate-700 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">{escapeHtml(s.containerNo)}</span></div>
                              </div>
                            </td>

                            {/* Column 3: Logistics */}
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${isDelivered ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-500 animate-pulse'}`}></span>
                                  <span className={`text-xs font-bold uppercase tracking-wide ${isDelivered ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {isDelivered ? 'Delivered' : 'In Transit'}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 space-y-0.5">
                                  <div><span className="inline-block w-16 font-medium">Pickup:</span> <span className="text-slate-800">{escapeHtml(s.pickupDate)}</span></div>
                                  <div><span className="inline-block w-16 font-medium">Sail:</span> <span className="text-slate-800">{escapeHtml(s.sailingDate)}</span></div>
                                  <div><span className="inline-block w-16 font-medium">ETA:</span> <span className="text-slate-800">{escapeHtml(s.expectedReachingDate)}</span></div>
                                  {isDelivered && <div><span className="inline-block w-16 font-medium text-emerald-600">Arrived:</span> <span className="text-emerald-700 font-semibold">{escapeHtml(s.reachedDate)}</span></div>}
                                </div>
                              </div>
                            </td>


                            {/* Column 5: Actions */}
                            <td className="py-4 px-6 text-right align-middle w-32">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm focus:outline-none" onClick={() => openModal(s)} title="Edit Shipment">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm focus:outline-none" onClick={() => deleteShipment(s._id!)} title="Delete Shipment">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {currentViewMode === 'analytics' && (
          <div className="animate-fade-in max-w-[1600px] mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">Intelligence & Analytics</h1>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Volume Distribution */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">🌍</span> 
                  Global Volume Distribution
                </h3>
                <div className="h-[350px]">
                  {chartDataPie.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartDataPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartDataPie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} formatter={(val) => [`${Number(val) || 0} Shipments`, 'Volume']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 font-medium bg-slate-50 rounded-xl">No shipping data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Month-wise Trends */}
            <div className="mt-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">📅</span> 
                Month-wise Performance & Trends
              </h3>
              <div className="h-[350px]">
                {chartDataMonthly.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataMonthly} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <RechartsTooltip cursor={{fill: '#f8fafc', strokeWidth: 1, stroke: '#e2e8f0'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} formatter={(val: unknown, name: unknown) => name === 'Shipments' ? [val as string|number, name as string] : [`₹${(Number(val) || 0).toLocaleString()}`, name as string]} />
                      <Line yAxisId="left" type="monotone" dataKey="Revenue" stroke="#4F46E5" strokeWidth={4} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      <Line yAxisId="left" type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      <Line yAxisId="right" type="monotone" dataKey="Shipments" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 3, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 font-medium bg-slate-50 rounded-xl">No shipping dates recorded to map timeline</div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentViewMode === 'profile' && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">Workspace Settings</h1>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                saveProfile({
                  ...profile,
                  userName: formData.get('userName') as string,
                  companyName: formData.get('companyName') as string,
                  defaultCategory: formData.get('defaultCategory') as string
                });
              }} className="space-y-6">
                
                <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl shadow-inner">
                    👤
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Admin Profile</h3>
                    <p className="text-slate-500 text-sm">Manage your workspace identity and defaults.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-slate-700 mb-2">Display Name</label>
                    <input name="userName" defaultValue={profile.userName} className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-slate-700 mb-2">Workspace / Company</label>
                    <input name="companyName" defaultValue={profile.companyName} className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50" />
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 mb-2">Default Global Region</label>
                    <select name="defaultCategory" defaultValue={profile.defaultCategory} className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="pt-6">
                  <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)]">Save Configuration</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex justify-center items-center p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{editingShipment ? `Edit Shipment` : 'Create New Shipment'}</h2>
                {editingShipment && <p className="text-slate-500 text-sm mt-1">Invoice: {editingShipment.invoiceNo}</p>}
              </div>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-slate-50/50">
              <form id="shipmentForm" onSubmit={saveShipment} className="space-y-8">
                
                {/* Core Info */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2"><span className="text-indigo-500">1.</span> Consignment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Region / Category</label>
                      <select name="category" defaultValue={editingShipment?.category || profile.defaultCategory} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Assigned Manager</label>
                      <input name="assignedManager" defaultValue={editingShipment?.assignedManager} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="E.g. Jane Doe" />
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Invoice No.</label>
                      <input name="invoiceNo" defaultValue={editingShipment?.invoiceNo} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="INV-2026-..." />
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">FBA ID (Amazon)</label>
                      <input name="fbaId" defaultValue={editingShipment?.fbaId} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="Optional" />
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Container No.</label>
                      <input name="containerNo" defaultValue={editingShipment?.containerNo} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono" placeholder="ABCD1234567" />
                    </div>
                  </div>
                </div>

                {/* Metrics & Dates Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cargo Metrics */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2"><span className="text-indigo-500">2.</span> Cargo Metrics</h3>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">No. of Boxes</label>
                        <input type="number" name="noOfBoxes" defaultValue={editingShipment?.noOfBoxes} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Total Weight (kg)</label>
                        <input type="number" step="any" name="totalWeight" defaultValue={editingShipment?.totalWeight} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                      </div>
                      <div className="flex flex-col col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Volume (CBM)</label>
                        <input type="number" step="0.01" name="cbm" defaultValue={editingShipment?.cbm} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2"><span className="text-indigo-500">3.</span> Logistics</h3>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Pickup Date</label>
                        <input type="date" name="pickupDate" defaultValue={editingShipment?.pickupDate} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Sailing Date</label>
                        <input type="date" name="sailingDate" defaultValue={editingShipment?.sailingDate} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Expected ETA</label>
                        <input type="date" id="expectedReachingDate" name="expectedReachingDate" defaultValue={editingShipment?.expectedReachingDate} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase tracking-wide text-emerald-600 mb-2">Actual Arrival</label>
                        <input type="date" name="reachedDate" defaultValue={editingShipment?.reachedDate} className="px-4 py-2.5 border border-emerald-300 bg-emerald-50 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all font-semibold" title="Leave blank if In Transit" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2"><span className="text-indigo-500">4.</span> Attachments & Documents</h3>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                    <div className="text-4xl mb-3">📄</div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">Upload Invoices, BoL, or Packing Lists</p>
                    <p className="text-xs text-slate-500 mb-4">Supported formats: PDF, PNG, JPG</p>
                    <input type="file" name="files" multiple accept=".pdf,image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                  </div>
                  
                  {editingShipment?.attachments && editingShipment.attachments.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Saved Files</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {editingShipment.attachments.map((file, i) => (
                          <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm group hover:border-indigo-300 transition-colors">
                            <a href={file.data} download={file.name} className="text-indigo-600 font-medium hover:underline truncate max-w-[85%]" title={file.name}>
                              {file.name}
                            </a>
                            <button type="button" onClick={() => deleteAttachment(editingShipment._id!, i)} className="text-slate-400 hover:text-rose-600 focus:outline-none">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
            
            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button onClick={closeModal} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" form="shipmentForm" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)]">
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl border border-slate-800 text-sm font-medium toast-anim flex items-center gap-3 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
