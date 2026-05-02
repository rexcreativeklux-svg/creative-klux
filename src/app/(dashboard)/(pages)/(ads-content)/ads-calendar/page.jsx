// "use client";

// import React, { useState, useEffect } from 'react';
// import {
//     ChevronLeft, ChevronRight, Plus, MoreHorizontal,
//     Target, MoreVertical, X, CalendarDays, LayoutGrid, Zap
// } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// /* ── Design tokens (hardcoded — no CSS vars — white card on #f7f8fc page) ── */
// const C = {
//     white: '#ffffff',
//     pageBg: '#f7f8fc',
//     border: '#e5e7eb',
//     textPrimary: '#111827',
//     textSecondary: '#6b7280',
//     textTertiary: '#9ca3af',
//     blue: '#2563EB',
//     blueFaint: '#eff4ff',
//     blueBorder: 'rgba(37,99,235,0.18)',
// };

// const PLATFORM_CONFIG = {
//     facebook: { label: 'Facebook', bg: '#1877F2', short: 'FB' },
//     tiktok: { label: 'TikTok', bg: '#010101', short: 'TK' },
//     instagram: { label: 'Instagram', bg: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)', short: 'IG' },
//     linkedin: { label: 'LinkedIn', bg: '#0A66C2', short: 'LI' },
//     youtube: { label: 'YouTube', bg: '#FF0000', short: 'YT' },
// };

// const PlatformBadge = ({ platform, size = 18 }) => {
//     const cfg = PLATFORM_CONFIG[platform];
//     if (!cfg) return null;
//     return (
//         <span style={{
//             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
//             width: size, height: size, borderRadius: '50%',
//             background: cfg.bg, color: '#fff',
//             fontSize: Math.round(size * 0.38), fontWeight: 700,
//             letterSpacing: '-0.02em', flexShrink: 0,
//         }}>
//             {cfg.short}
//         </span>
//     );
// };

// const formatDate = (d) => d.toISOString().split('T')[0];
// const TODAY_STR = '2025-09-23';
// const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// const getWeekDates = (date) => {
//     const start = new Date(date);
//     start.setDate(start.getDate() - start.getDay());
//     return Array.from({ length: 7 }, (_, i) => {
//         const d = new Date(start); d.setDate(start.getDate() + i); return d;
//     });
// };

// const getMonthDates = (date) => {
//     const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
//     const start = new Date(firstDay);
//     start.setDate(start.getDate() - firstDay.getDay());
//     const dates = [];
//     const cur = new Date(start);
//     while (dates.length < 42) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
//     return dates;
// };

// const navBtn = {
//     display: 'flex', alignItems: 'center', justifyContent: 'center',
//     padding: '6px 8px', borderRadius: 7,
//     border: `1px solid ${C.border}`, background: C.white,
//     color: C.textSecondary, cursor: 'pointer', fontSize: 13,
// };

// const primaryBtn = {
//     width: '100%', padding: '8px', borderRadius: 8,
//     background: C.blue, color: '#fff',
//     border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer',
// };

// const secondaryBtn = {
//     width: '100%', padding: '8px', borderRadius: 8,
//     background: C.pageBg, color: C.textPrimary,
//     border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 500, cursor: 'pointer',
// };

// const inputSty = {
//     flex: 1, padding: '7px 10px', borderRadius: 7, fontSize: 12,
//     border: `1px solid ${C.border}`, background: C.white,
//     color: C.textPrimary, outline: 'none',
// };

// const FilterChip = ({ label }) => (
//     <button style={{
//         padding: '5px 12px', borderRadius: 7, fontSize: 12,
//         border: `1px solid ${C.border}`, background: C.white,
//         color: C.textSecondary, cursor: 'pointer',
//     }}>
//         {label}
//     </button>
// );

// export default function SocialMediaPlanner() {
//     const router = useRouter();
//     const [currentView, setCurrentView] = useState('week');
//     const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 23, 7, 21, 0));
//     const [selectedDay, setSelectedDay] = useState(null);
//     const [showModal, setShowModal] = useState(false);
//     const [selectedAd, setSelectedAd] = useState(null);
//     const [scheduledItems, setScheduledItems] = useState([]);
//     const [menuOpen, setMenuOpen] = useState(null);
//     const [sidebarTab, setSidebarTab] = useState('goals');
//     const [formValues, setFormValues] = useState({});

//     useEffect(() => {
//         const stored = localStorage.getItem('selectedAdForScheduling');
//         if (stored) {
//             const ad = JSON.parse(stored);
//             if (Date.now() - ad.timestamp < 5000) { setSelectedAd(ad); setShowModal(true); }
//             localStorage.removeItem('selectedAdForScheduling');
//         }
//         const saved = localStorage.getItem('scheduledItems');
//         if (saved) setScheduledItems(JSON.parse(saved));
//     }, []);

//     const navigate = (dir) => {
//         const d = new Date(currentDate);
//         if (currentView === 'week') d.setDate(d.getDate() + dir * 7);
//         else d.setMonth(d.getMonth() + dir);
//         setCurrentDate(d); setSelectedDay(null);
//     };

//     const goToday = () => { setCurrentDate(new Date(2025, 8, 23, 7, 21, 0)); setSelectedDay(null); };
//     const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

//     const handleDelete = (id) => {
//         const updated = scheduledItems.filter(i => i.id !== id);
//         setScheduledItems(updated);
//         localStorage.setItem('scheduledItems', JSON.stringify(updated));
//         setMenuOpen(null);
//     };

//     const handleSchedule = () => {
//         if (!selectedAd) return;
//         const newItems = [];
//         Object.keys(PLATFORM_CONFIG).forEach(platform => {
//             const dateVal = formValues[`${platform}_date`];
//             const timeVal = formValues[`${platform}_time`];
//             if (dateVal && timeVal) {
//                 newItems.push({ ...selectedAd, id: `${Date.now()}-${Math.random()}-${platform}`, scheduledDate: dateVal, scheduledTime: timeVal, platform });
//             }
//         });
//         if (newItems.length) {
//             const updated = [...scheduledItems, ...newItems];
//             setScheduledItems(updated);
//             localStorage.setItem('scheduledItems', JSON.stringify(updated));
//         }
//         setShowModal(false); setFormValues({}); setSelectedAd(null);
//     };

//     const ItemCard = ({ item }) => (
//         <div style={{
//             position: 'relative', background: C.pageBg,
//             borderRadius: 8, padding: '6px 8px', marginBottom: 6,
//             border: `1px solid ${C.border}`, cursor: 'pointer',
//         }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
//                 <div style={{ width: 24, height: 24, borderRadius: 4, overflow: 'hidden', background: C.border, flexShrink: 0 }}>
//                     {item.type === 'image'
//                         ? <img src={item.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//                         : <div style={{ width: '100%', height: '100%', background: '#ddd' }} />}
//                 </div>
//                 <span style={{ fontSize: 11, color: C.textSecondary, fontWeight: 500 }}>{item.scheduledTime}</span>
//                 <PlatformBadge platform={item.platform} size={14} />
//             </div>
//             <button
//                 style={{ position: 'absolute', top: 3, right: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: C.textTertiary }}
//                 onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === item.id ? null : item.id); }}
//             >
//                 <MoreVertical size={11} />
//             </button>
//             {menuOpen === item.id && (
//                 <div style={{
//                     position: 'absolute', top: 22, right: 0, background: C.white,
//                     border: `1px solid ${C.border}`, borderRadius: 8, zIndex: 30, minWidth: 100,
//                     boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
//                 }}>
//                     <button
//                         style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
//                         onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
//                     >Delete</button>
//                 </div>
//             )}
//         </div>
//     );

//     const WeekView = () => {
//         const weekDates = getWeekDates(currentDate);
//         return (
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', flex: 1, height: '100%' }}>
//                 {weekDates.map((date, idx) => {
//                     const dateStr = formatDate(date);
//                     const items = scheduledItems.filter(i => i.scheduledDate === dateStr);
//                     const isToday = dateStr === TODAY_STR;
//                     const isSelected = selectedDay === dateStr;
//                     return (
//                         <div
//                             key={idx}
//                             style={{
//                                 borderRight: idx < 6 ? `1px solid ${C.border}` : 'none',
//                                 background: isSelected ? C.blueFaint : C.white,
//                                 cursor: 'pointer',
//                             }}
//                             onClick={() => setSelectedDay(isSelected ? null : dateStr)}
//                         >
//                             <div style={{
//                                 padding: '10px 12px 8px', borderBottom: `1px solid ${C.border}`,
//                                 background: isToday ? C.blue : isSelected ? C.blueFaint : C.pageBg,
//                             }}>
//                                 <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2, color: isToday ? 'rgba(255,255,255,0.7)' : C.textTertiary }}>
//                                     {SHORT_DAYS[idx]}
//                                 </div>
//                                 <div style={{ fontSize: 20, fontWeight: isToday ? 700 : 400, lineHeight: 1, color: isToday ? '#fff' : isSelected ? C.blue : C.textPrimary }}>
//                                     {date.getDate()}
//                                 </div>
//                             </div>
//                             <div style={{ padding: '8px 6px', overflowY: 'auto' }}>
//                                 {items.map(item => <ItemCard key={item.id} item={item} />)}
//                                 {isToday && items.length === 0 && (
//                                     <div style={{ fontSize: 10, color: C.textTertiary, textAlign: 'center', marginTop: 10 }}>No posts today</div>
//                                 )}
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>
//         );
//     };

//     const MonthView = () => {
//         const monthDates = getMonthDates(currentDate);
//         return (
//             <div style={{ flex: 1 }}>
//                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: `1px solid ${C.border}`, background: C.pageBg }}>
//                     {SHORT_DAYS.map(d => (
//                         <div key={d} style={{ padding: '10px 12px', fontSize: 10, fontWeight: 600, color: C.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
//                             {d}
//                         </div>
//                     ))}
//                 </div>
//                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridTemplateRows: 'repeat(6,1fr)' }}>
//                     {monthDates.map((date, idx) => {
//                         const dateStr = formatDate(date);
//                         const items = scheduledItems.filter(i => i.scheduledDate === dateStr);
//                         const isToday = dateStr === TODAY_STR;
//                         const isCurrentMonth = date.getMonth() === currentDate.getMonth();
//                         const isSelected = selectedDay === dateStr;
//                         return (
//                             <div
//                                 key={idx}
//                                 style={{
//                                     minHeight: 100, padding: '8px 10px',
//                                     borderRight: (idx % 7) < 6 ? `1px solid ${C.border}` : 'none',
//                                     borderBottom: idx < 35 ? `1px solid ${C.border}` : 'none',
//                                     background: isSelected ? C.blueFaint : C.white,
//                                     cursor: 'pointer',
//                                 }}
//                                 onClick={() => setSelectedDay(isSelected ? null : dateStr)}
//                             >
//                                 <div style={{
//                                     width: 26, height: 26, borderRadius: '50%', marginBottom: 6,
//                                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                     background: isToday ? C.blue : 'transparent',
//                                     fontSize: 13, fontWeight: isToday ? 700 : 400,
//                                     color: isToday ? '#fff' : !isCurrentMonth ? C.textTertiary : C.textPrimary,
//                                 }}>
//                                     {date.getDate()}
//                                 </div>
//                                 {items.slice(0, 3).map(item => <ItemCard key={item.id} item={item} />)}
//                                 {items.length > 3 && <div style={{ fontSize: 10, color: C.textSecondary, marginTop: 2 }}>+{items.length - 3} more</div>}
//                             </div>
//                         );
//                     })}
//                 </div>
//             </div>
//         );
//     };

//     return (
//         <div style={{ fontFamily: 'inherit', color: C.textPrimary }}>

//             {/* Page header */}
//             <div style={{ padding: '24px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
//                 <div>
//                     <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, marginBottom: 4, color: C.textPrimary }}>Planner</h1>
//                     <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
//                         Plan your marketing calendar — create, schedule and manage content.
//                     </p>
//                 </div>
//                 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//                     <button
//                         onClick={() => router.push('/studio')}
//                         className=' hover:scale-105 transition-all duration-200'
//                         style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.textPrimary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
//                     >
//                         <Plus size={14} /> Create ad
//                     </button>
//                     <button
//                         onClick={() => router.push('/studio')}
//                         className=' hover:scale-105 transition-all duration-200'
//                         style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: C.blue, color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
//                     >
//                         <Plus size={14} /> Create post
//                     </button>
//                     <button className=' hover:scale-105 transition-all duration-200' style={{ padding: 8, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', color: C.textSecondary, display: 'flex' }}>
//                         <MoreHorizontal size={16} />
//                     </button>
//                 </div>
//             </div>

//             {/* Main calendar card — white surface lifts off the #f7f8fc page */}
//             <div style={{
//                 border: `1px solid ${C.border}`, borderRadius: 12,
//                 overflow: 'hidden', display: 'flex', flexDirection: 'column',
//                 background: C.white,
//                 boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
//             }}>
//                 {/* Toolbar — uses page bg for subtle depth inside the white card */}
//                 <div style={{
//                     display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                     padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
//                     background: C.pageBg, flexWrap: 'wrap', gap: 10,
//                 }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <div style={{ display: 'flex', background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 2, gap: 2 }}>
//                             {['week', 'month'].map(v => (
//                                 <button
//                                     key={v}
//                                     onClick={() => setCurrentView(v)}
//                                     style={{
//                                         padding: '5px 14px', borderRadius: 6, border: 'none',
//                                         fontSize: 12, fontWeight: 500, cursor: 'pointer',
//                                         background: currentView === v ? C.blue : 'transparent',
//                                         color: currentView === v ? '#fff' : C.textSecondary,
//                                         display: 'flex', alignItems: 'center', gap: 5,
//                                     }}
//                                 >
//                                     {v === 'week' ? <CalendarDays size={12} /> : <LayoutGrid size={12} />}
//                                     {v.charAt(0).toUpperCase() + v.slice(1)}
//                                 </button>
//                             ))}
//                         </div>
//                         <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                             <button onClick={() => navigate(-1)} style={navBtn}><ChevronLeft size={15} /></button>
//                             <button onClick={goToday} style={{ ...navBtn, padding: '5px 10px', fontSize: 12, fontWeight: 500, color: C.textPrimary }}>Today</button>
//                             <button onClick={() => navigate(1)} style={navBtn}><ChevronRight size={15} /></button>
//                         </div>
//                         <span style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{monthYear}</span>
//                     </div>
//                     <div style={{ display: 'flex', gap: 8 }}>
//                         <FilterChip label="Content type: All" />
//                         <FilterChip label="Shared to: All" />
//                     </div>
//                 </div>

//                 {/* Calendar + Sidebar */}
//                 <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
//                     <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', borderRight: `1px solid ${C.border}` }}>
//                         {currentView === 'week' ? <WeekView /> : <MonthView />}
//                     </div>

//                     {/* Sidebar */}
//                     <div style={{ width: 240, background: C.white, flexShrink: 0 }}>
//                         <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 4px' }}>
//                             {['goals', 'moments', 'drafts'].map(tab => (
//                                 <button
//                                     key={tab}
//                                     onClick={() => setSidebarTab(tab)}
//                                     style={{
//                                         flex: 1, padding: '12px 0', border: 'none',
//                                         background: 'transparent', cursor: 'pointer',
//                                         fontSize: 12, fontWeight: 500,
//                                         color: sidebarTab === tab ? C.blue : C.textSecondary,
//                                         borderBottom: sidebarTab === tab ? `2px solid ${C.blue}` : '2px solid transparent',
//                                         textTransform: 'capitalize',
//                                     }}
//                                 >{tab}</button>
//                             ))}
//                         </div>

//                         {sidebarTab === 'goals' && (
//                             <div style={{ padding: '16px 14px' }}>
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
//                                     <Target size={15} style={{ color: C.blue }} />
//                                     <span style={{ fontSize: 13, fontWeight: 600 }}>Goals</span>
//                                 </div>

//                                 <div style={{ background: C.pageBg, borderRadius: 10, padding: 14, marginBottom: 12, border: `1px solid ${C.border}` }}>
//                                     <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#22c55e,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
//                                         <Target size={17} style={{ color: '#fff' }} />
//                                     </div>
//                                     <p style={{ fontSize: 12, color: C.textSecondary, margin: '0 0 12px', lineHeight: 1.6 }}>
//                                         Set a goal, track progress and learn helpful tips for your success.
//                                     </p>
//                                     <button style={primaryBtn}>Start new goal</button>
//                                 </div>

//                                 <div style={{ background: C.pageBg, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
//                                     <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
//                                         <Zap size={13} style={{ color: '#f59e0b' }} />
//                                         <span style={{ fontSize: 12, fontWeight: 500 }}>Boost a post</span>
//                                     </div>
//                                     <p style={{ fontSize: 12, color: C.textSecondary, margin: '0 0 12px', lineHeight: 1.6 }}>
//                                         Reach audiences that don't follow you yet.
//                                     </p>
//                                     <button style={secondaryBtn}>Boost</button>
//                                 </div>

//                                 {scheduledItems.length > 0 && (
//                                     <div style={{ marginTop: 12, padding: '10px 12px', background: C.blueFaint, borderRadius: 8, border: `1px solid ${C.blueBorder}` }}>
//                                         <div style={{ fontSize: 11, color: C.blue, fontWeight: 600, marginBottom: 2 }}>
//                                             {scheduledItems.length} post{scheduledItems.length !== 1 ? 's' : ''} scheduled
//                                         </div>
//                                         <div style={{ fontSize: 11, color: C.textSecondary }}>
//                                             Across {[...new Set(scheduledItems.map(i => i.platform))].length} platform{[...new Set(scheduledItems.map(i => i.platform))].length !== 1 ? 's' : ''}
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//                         )}

//                         {sidebarTab === 'moments' && <div style={{ padding: '32px 14px', textAlign: 'center', color: C.textTertiary, fontSize: 13 }}>No moments yet</div>}
//                         {sidebarTab === 'drafts' && <div style={{ padding: '32px 14px', textAlign: 'center', color: C.textTertiary, fontSize: 13 }}>No drafts</div>}
//                     </div>
//                 </div>
//             </div>

//             {/* Schedule modal */}
//             {showModal && (
//                 <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)' }}>
//                     <div style={{ background: C.white, borderRadius: 14, width: '90%', maxWidth: 480, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
//                         <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//                             <div>
//                                 <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Schedule {selectedAd?.name || 'post'}</h2>
//                                 <p style={{ margin: '4px 0 0', fontSize: 12, color: C.textSecondary }}>Set publish date and time per platform.</p>
//                             </div>
//                             <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTertiary, padding: 2 }}>
//                                 <X size={16} />
//                             </button>
//                         </div>
//                         <div style={{ padding: '14px 20px', maxHeight: '55vh', overflowY: 'auto' }}>
//                             {Object.entries(PLATFORM_CONFIG).map(([platform, cfg]) => (
//                                 <div key={platform} style={{ marginBottom: 14 }}>
//                                     <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
//                                         <PlatformBadge platform={platform} size={18} />
//                                         <span style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{cfg.label}</span>
//                                     </div>
//                                     <div style={{ display: 'flex', gap: 8 }}>
//                                         <input type="date" value={formValues[`${platform}_date`] || ''} onChange={e => setFormValues(v => ({ ...v, [`${platform}_date`]: e.target.value }))} style={inputSty} />
//                                         <input type="time" value={formValues[`${platform}_time`] || ''} onChange={e => setFormValues(v => ({ ...v, [`${platform}_time`]: e.target.value }))} style={{ ...inputSty, flex: '0 0 110px' }} />
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                         <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
//                             <button onClick={handleSchedule} style={{ ...primaryBtn, flex: 1 }}>Schedule all</button>
//                             <button onClick={() => setShowModal(false)} style={{ ...secondaryBtn, flex: 1 }}>Cancel</button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

"use client";


export default function Analytics() {
  
  return (
  <div>
    ads
  </div>
  );
}