// "use client";

// import React, { useState, useCallback, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import {
//   BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
// } from 'recharts';
// import {
//   Eye, MousePointer, Users, Heart, Share2, TrendingUp,
//   RefreshCw, AlertCircle, CheckCircle2, Clock, BarChart3
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { format, subDays, isAfter } from 'date-fns';
// import { toast } from 'sonner';
// import {
//   getPublishedPosts, getConnectedAccounts, savePublishedPost,
//   getFacebookPostStats, getInstagramPostStats,
//   fetchLivePostsFromConnectedAccounts,
// } from '@/lib/integrations';
// import { cn } from '@/lib/utils';

// const PLATFORM_META = {
//   facebook:    { label: 'Facebook',   color: '#3b82f6', emoji: '🔵' },
//   instagram:   { label: 'Instagram',  color: '#ec4899', emoji: '📸' },
//   meta_ads:    { label: 'Meta Ads',   color: '#6366f1', emoji: '📢' },
//   google_ads:  { label: 'Google Ads', color: '#22c55e', emoji: '🔍' },
//   tiktok:      { label: 'TikTok',     color: '#94a3b8', emoji: '🎵' },
//   tiktok_ads:  { label: 'TT Ads',     color: '#0891b2', emoji: '🎯' },
//   linkedin:    { label: 'LinkedIn',   color: '#2563eb', emoji: '💼' },
//   twitter:     { label: 'X/Twitter',  color: '#475569', emoji: '🐦' },
// };

// function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }) {
//   return (
//     <div className="rounded-xl bg-card border border-border/50 p-5">
//       <div className="flex items-center justify-between mb-3">
//         <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
//         <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
//           <Icon className={cn('w-4 h-4', color)} />
//         </div>
//       </div>
//       <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
//       {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
//     </div>
//   );
// }

// const CUSTOM_TOOLTIP_STYLE = {
//   contentStyle: { background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 5% 18%)', borderRadius: 8, fontSize: 12 },
//   labelStyle: { color: 'hsl(0 0% 95%)', fontWeight: 600 },
//   itemStyle: { color: 'hsl(0 0% 80%)' },
// };

// export default function Analytics() {
//   const { type } = useParams(); 
//   const isAds = type === 'ads';
//   const typeLabel = isAds ? 'Ads' : 'Social';
//   const matchType = isAds ? 'ad' : 'social';

//   const [allPosts, setAllPosts] = useState([]);
//   const [refreshingAll, setRefreshingAll] = useState(false);
//   const [fetchingLive, setFetchingLive] = useState(false);

//   const reload = useCallback(() => setAllPosts(getPublishedPosts()), []);

//   const fetchLive = useCallback(async (silent = false) => {
//     setFetchingLive(true);
//     try {
//       const livePosts = await fetchLivePostsFromConnectedAccounts();
//       const local = getPublishedPosts();
//       const localIds = new Set(local.map(p => p.id));
//       const newPosts = livePosts.filter(lp => !localIds.has(lp.id));
//       const merged = [...newPosts, ...local];
//       localStorage.setItem('creativeklux_published_posts', JSON.stringify(merged));
//       setAllPosts(merged);
//       if (!silent) toast.success(newPosts.length > 0 ? `Synced ${newPosts.length} live post(s)` : 'Already up to date');
//     } catch {
//       if (!silent) toast.error('Failed to fetch live posts');
//       else reload();
//     } finally {
//       setFetchingLive(false);
//     }
//   }, [reload]);

//   useEffect(() => { fetchLive(true); }, [fetchLive]);

//   const posts = allPosts.filter(p => p.type === matchType);
//   const publishedPosts = posts.filter(p => p.status === 'published');

//   // ── Aggregate totals ────────────────────────────────────────────────────────
//   const totals = publishedPosts.reduce((acc, p) => {
//     const s = p.stats || {};
//     acc.impressions += s.impressions || 0;
//     acc.reach += s.reach || 0;
//     acc.clicks += s.clicks || 0;
//     acc.likes += s.likes || 0;
//     acc.shares += s.shares || 0;
//     acc.comments += s.comments || 0;
//     return acc;
//   }, { impressions: 0, reach: 0, clicks: 0, likes: 0, shares: 0, comments: 0 });

//   const avgCTR = publishedPosts.length
//     ? (publishedPosts.reduce((a, p) => a + (p.stats?.ctr || 0), 0) / publishedPosts.length).toFixed(2)
//     : '0.00';

//   // ── Per-platform breakdown ──────────────────────────────────────────────────
//   const platformMap = {};
//   publishedPosts.forEach(p => {
//     const pm = PLATFORM_META[p.platform] || { label: p.platform, color: '#888' };
//     if (!platformMap[p.platform]) {
//       platformMap[p.platform] = { platform: pm.label, color: pm.color, impressions: 0, clicks: 0, likes: 0, posts: 0 };
//     }
//     platformMap[p.platform].impressions += p.stats?.impressions || 0;
//     platformMap[p.platform].clicks += p.stats?.clicks || 0;
//     platformMap[p.platform].likes += p.stats?.likes || 0;
//     platformMap[p.platform].posts += 1;
//   });
//   const platformData = Object.values(platformMap);

//   // ── Timeline (last 14 days) ─────────────────────────────────────────────────
//   const timelineData = Array.from({ length: 14 }, (_, i) => {
//     const day = subDays(new Date(), 13 - i);
//     const label = format(day, 'MMM d');
//     const dayPosts = publishedPosts.filter(p => p.published_at && isSameDay14(new Date(p.published_at), day));
//     return {
//       date: label,
//       impressions: dayPosts.reduce((a, p) => a + (p.stats?.impressions || 0), 0),
//       clicks: dayPosts.reduce((a, p) => a + (p.stats?.clicks || 0), 0),
//       likes: dayPosts.reduce((a, p) => a + (p.stats?.likes || 0), 0),
//     };
//   });

//   function isSameDay14(a, b) {
//     return format(a, 'yyyy-MM-dd') === format(b, 'yyyy-MM-dd');
//   }

//   // ── Pie: engagement split ───────────────────────────────────────────────────
//   const engagementPie = [
//     { name: 'Likes', value: totals.likes, color: '#ec4899' },
//     { name: 'Shares', value: totals.shares, color: '#8b5cf6' },
//     { name: 'Comments', value: totals.comments, color: '#f59e0b' },
//     { name: 'Clicks', value: totals.clicks, color: '#22c55e' },
//   ].filter(e => e.value > 0);

//   // ── Refresh all live stats ──────────────────────────────────────────────────
//   const handleRefreshAll = async () => {
//     setRefreshingAll(true);
//     const accounts = getConnectedAccounts();
//     let updated = 0;
//     for (const post of publishedPosts) {
//       if (!post.post_id) continue;
//       try {
//         let newStats = null;
//         if (post.platform === 'facebook' && accounts.facebook) {
//           newStats = await getFacebookPostStats({ access_token: accounts.facebook.access_token, post_id: post.post_id });
//         } else if (post.platform === 'instagram' && accounts.instagram) {
//           newStats = await getInstagramPostStats({ access_token: accounts.instagram.access_token, post_id: post.post_id });
//         }
//         if (newStats) {
//           savePublishedPost({ ...post, stats: { ...post.stats, ...newStats, last_updated: new Date().toISOString() } });
//           updated++;
//         }
//       } catch {}
//     }
//     reload();
//     setRefreshingAll(false);
//     toast.success(updated > 0 ? `Refreshed stats for ${updated} post(s)` : 'No live stats available — connect Facebook or Instagram first');
//   };

//   const hasAnyStats = publishedPosts.some(p => p.stats && Object.keys(p.stats).length > 0);

//   return (
//     <div className="min-h-screen p-6 md:p-8">
//       {/* Header */}
//       <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
//         <div>
//           <h1 className="font-heading text-2xl font-bold text-foreground mb-1">{typeLabel} Analytics</h1>
//           <p className="text-muted-foreground text-sm">Aggregated {typeLabel.toLowerCase()} performance across platforms</p>
//         </div>
//         <div className="flex gap-2">
//           <Button
//             size="sm"
//             variant="outline"
//             className="border-border/50 text-sm"
//             onClick={() => fetchLive(false)}
//             disabled={fetchingLive}
//           >
//             <RefreshCw className={cn('w-3.5 h-3.5 mr-2', fetchingLive && 'animate-spin')} />
//             {fetchingLive ? 'Syncing...' : 'Sync Live Posts'}
//           </Button>
//           <Button
//             size="sm"
//             variant="outline"
//             className="border-border/50 text-sm"
//             onClick={handleRefreshAll}
//             disabled={refreshingAll}
//           >
//             <RefreshCw className={cn('w-3.5 h-3.5 mr-2', refreshingAll && 'animate-spin')} />
//             {refreshingAll ? 'Fetching stats...' : 'Refresh Stats'}
//           </Button>
//         </div>
//       </div>

//       {publishedPosts.length === 0 ? (
//         <div className="rounded-xl border border-dashed border-border/50 bg-card/50 p-16 text-center">
//           <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
//           <p className="text-foreground font-medium mb-1">No published posts yet</p>
//           <p className="text-muted-foreground text-sm">Publish content from Projects to start seeing analytics.</p>
//         </div>
//       ) : (
//         <div className="space-y-6">
//           {/* KPI Cards */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <StatCard icon={Eye}           label="Total Impressions" value={totals.impressions.toLocaleString()} />
//             <StatCard icon={Users}         label="Total Reach"       value={totals.reach.toLocaleString()} color="text-blue-400" />
//             <StatCard icon={MousePointer}  label="Total Clicks"      value={totals.clicks.toLocaleString()} color="text-green-400" />
//             <StatCard icon={TrendingUp}    label="Avg. CTR"          value={`${avgCTR}%`} color="text-purple-400" />
//             <StatCard icon={Heart}         label="Total Likes"       value={totals.likes.toLocaleString()} color="text-pink-400" />
//             <StatCard icon={Share2}        label="Total Shares"      value={totals.shares.toLocaleString()} color="text-orange-400" />
//             <StatCard icon={CheckCircle2}  label="Published Posts"   value={publishedPosts.length} color="text-green-400" />
//             <StatCard icon={Clock}         label="Scheduled"         value={posts.filter(p => p.status === 'scheduled').length} color="text-blue-400" />
//           </div>

//           {!hasAnyStats && (
//             <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400">
//               <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
//               No stats fetched yet. Click <strong className="mx-1">Refresh All Stats</strong> to pull live metrics from connected Facebook / Instagram accounts.
//             </div>
//           )}

//           {/* Timeline chart */}
//           <div className="rounded-xl bg-card border border-border/50 p-5">
//             <h3 className="font-heading font-semibold text-foreground text-sm mb-4">Performance — Last 14 Days</h3>
//             <ResponsiveContainer width="100%" height={220}>
//               <LineChart data={timelineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 18%)" />
//                 <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} />
//                 <YAxis tick={{ fontSize: 10, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} />
//                 <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
//                 <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(0 0% 80%)' }} />
//                 <Line type="monotone" dataKey="impressions" stroke="#a855f7" strokeWidth={2} dot={false} />
//                 <Line type="monotone" dataKey="clicks"      stroke="#22c55e" strokeWidth={2} dot={false} />
//                 <Line type="monotone" dataKey="likes"       stroke="#ec4899" strokeWidth={2} dot={false} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Platform breakdown + Engagement pie */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {/* Bar chart per platform */}
//             <div className="rounded-xl bg-card border border-border/50 p-5">
//               <h3 className="font-heading font-semibold text-foreground text-sm mb-4">Impressions by Platform</h3>
//               {platformData.length === 0 ? (
//                 <p className="text-xs text-muted-foreground text-center py-8">No data</p>
//               ) : (
//                 <ResponsiveContainer width="100%" height={200}>
//                   <BarChart data={platformData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 18%)" />
//                     <XAxis dataKey="platform" tick={{ fontSize: 10, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} />
//                     <YAxis tick={{ fontSize: 10, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} />
//                     <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
//                     <Bar dataKey="impressions" radius={[4, 4, 0, 0]}>
//                       {platformData.map((entry, i) => (
//                         <Cell key={i} fill={entry.color} />
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               )}
//             </div>

//             {/* Pie: engagement breakdown */}
//             <div className="rounded-xl bg-card border border-border/50 p-5">
//               <h3 className="font-heading font-semibold text-foreground text-sm mb-4">Engagement Breakdown</h3>
//               {engagementPie.length === 0 ? (
//                 <p className="text-xs text-muted-foreground text-center py-8">No engagement data yet</p>
//               ) : (
//                 <ResponsiveContainer width="100%" height={200}>
//                   <PieChart>
//                     <Pie data={engagementPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
//                       {engagementPie.map((entry, i) => (
//                         <Cell key={i} fill={entry.color} />
//                       ))}
//                     </Pie>
//                     <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
//                     <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(0 0% 80%)' }} />
//                   </PieChart>
//                 </ResponsiveContainer>
//               )}
//             </div>
//           </div>

//           {/* Post-level table */}
//           <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
//             <div className="px-5 py-3 border-b border-border/50">
//               <h3 className="font-heading font-semibold text-foreground text-sm">Post Performance</h3>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="border-b border-border/50 bg-secondary/20">
//                     <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-semibold">Post</th>
//                     <th className="text-left px-3 py-2.5 text-xs text-muted-foreground font-semibold">Platform</th>
//                     <th className="text-center px-3 py-2.5 text-xs text-muted-foreground font-semibold">Impressions</th>
//                     <th className="text-center px-3 py-2.5 text-xs text-muted-foreground font-semibold">Reach</th>
//                     <th className="text-center px-3 py-2.5 text-xs text-muted-foreground font-semibold">Clicks</th>
//                     <th className="text-center px-3 py-2.5 text-xs text-muted-foreground font-semibold">Likes</th>
//                     <th className="text-center px-3 py-2.5 text-xs text-muted-foreground font-semibold">CTR</th>
//                     <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-semibold">Updated</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {publishedPosts.map((post, i) => {
//                     const meta = PLATFORM_META[post.platform] || { emoji: '🌐', label: post.platform };
//                     const s = post.stats || {};
//                     return (
//                       <tr key={post.id} className={cn('border-b border-border/30 hover:bg-secondary/20 transition-colors', i % 2 !== 0 && 'bg-secondary/10')}>
//                         <td className="px-4 py-2.5">
//                           <div className="flex items-center gap-2.5">
//                             {post.image_url && <img src={post.image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}
//                             <p className="text-xs text-foreground truncate max-w-[160px]">{post.project_title}</p>
//                           </div>
//                         </td>
//                         <td className="px-3 py-2.5 text-xs text-muted-foreground">{meta.emoji} {meta.label}</td>
//                         <td className="px-3 py-2.5 text-center text-xs text-foreground">{s.impressions?.toLocaleString() || '—'}</td>
//                         <td className="px-3 py-2.5 text-center text-xs text-foreground">{s.reach?.toLocaleString() || '—'}</td>
//                         <td className="px-3 py-2.5 text-center text-xs text-foreground">{s.clicks?.toLocaleString() || '—'}</td>
//                         <td className="px-3 py-2.5 text-center text-xs text-foreground">{s.likes?.toLocaleString() || '—'}</td>
//                         <td className="px-3 py-2.5 text-center text-xs text-foreground">{s.ctr ? `${Number(s.ctr).toFixed(2)}%` : '—'}</td>
//                         <td className="px-4 py-2.5 text-right text-[10px] text-muted-foreground">
//                           {s.last_updated ? format(new Date(s.last_updated), 'MMM d HH:mm') : '—'}
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }