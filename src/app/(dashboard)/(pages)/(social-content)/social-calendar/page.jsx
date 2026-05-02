// "use client";

// import React, { useState, useCallback, useEffect } from 'react';
// import {
//   ChevronLeft, ChevronRight, CalendarDays, Clock, Plus, Trash2, RefreshCw
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import {
//   startOfMonth, endOfMonth, startOfWeek, endOfWeek,
//   eachDayOfInterval, isSameMonth, isSameDay, isToday,
//   format, addMonths, subMonths
// } from 'date-fns';
// import { getPublishedPosts, deletePostFromPlatform, fetchLivePostsFromConnectedAccounts } from '@/lib/integrations';
// import { cn } from '@/lib/utils';
// import { toast } from 'sonner';
// import { Link, useParams } from 'react-router-dom';

// const PLATFORM_META = {
//   facebook:    { label: 'FB',       color: 'bg-blue-500',    emoji: '🔵' },
//   instagram:   { label: 'IG',       color: 'bg-pink-500',    emoji: '📸' },
//   meta_ads:    { label: 'Meta',     color: 'bg-indigo-500',  emoji: '📢' },
//   google_ads:  { label: 'G.Ads',   color: 'bg-green-500',   emoji: '🔍' },
//   tiktok:      { label: 'TikTok',  color: 'bg-slate-500',   emoji: '🎵' },
//   tiktok_ads:  { label: 'TT.Ads',  color: 'bg-cyan-600',    emoji: '🎯' },
//   linkedin:    { label: 'LI',       color: 'bg-blue-600',    emoji: '💼' },
//   twitter:     { label: 'X',        color: 'bg-slate-700',   emoji: '🐦' },
//   youtube:     { label: 'YT',       color: 'bg-red-600',     emoji: '▶️' },
//   pinterest:   { label: 'PIN',      color: 'bg-rose-500',    emoji: '📌' },
//   snapchat:    { label: 'SNAP',     color: 'bg-yellow-400',  emoji: '👻' },
// };

// const STATUS_COLOR = {
//   published: 'border-l-green-500',
//   scheduled: 'border-l-blue-500',
//   failed:    'border-l-red-500',
// };

// function PostPill({ post, onDelete }) {
//   const meta = PLATFORM_META[post.platform] || { label: post.platform, color: 'bg-secondary', emoji: '🌐' };
//   return (
//     <div className={cn(
//       'group flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] border-l-2 bg-card hover:bg-secondary/80 transition-all cursor-default',
//       STATUS_COLOR[post.status] || 'border-l-border'
//     )}>
//       <span>{meta.emoji}</span>
//       <span className="text-foreground truncate flex-1 min-w-0">{post.project_title}</span>
//       <button
//         onClick={(e) => { e.stopPropagation(); onDelete(); }}
//         className="opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive transition-opacity ml-auto flex-shrink-0"
//       >
//         <Trash2 className="w-2.5 h-2.5" />
//       </button>
//     </div>
//   );
// }

// export default function ContentCalendar() {
//   const { type } = useParams(); // 'social' | 'ads'
//   const isAds = type === 'ads';
//   const typeLabel = isAds ? 'Ads' : 'Social';
//   const matchType = isAds ? 'ad' : 'social';

//   const [currentMonth, setCurrentMonth] = useState(new Date());
//   const [allPosts, setAllPosts] = useState([]);
//   const [selectedDay, setSelectedDay] = useState(null);

//   const reload = useCallback(() => setAllPosts(getPublishedPosts()), []);

//   const fetchLive = useCallback(async () => {
//     try {
//       const livePosts = await fetchLivePostsFromConnectedAccounts();
//       const local = getPublishedPosts();
//       const localIds = new Set(local.map(p => p.id));
//       const newPosts = livePosts.filter(lp => !localIds.has(lp.id));
//       const merged = [...newPosts, ...local];
//       localStorage.setItem('creativeklux_published_posts', JSON.stringify(merged));
//       setAllPosts(merged);
//     } catch {
//       reload();
//     }
//   }, [reload]);

//   useEffect(() => { fetchLive(); }, [fetchLive]);

//   const posts = allPosts.filter(p => p.type === matchType);

//   const handleDelete = async (post) => {
//     await deletePostFromPlatform(post);
//     reload();
//     toast.success('Post removed');
//   };

//   // Build calendar grid
//   const monthStart = startOfMonth(currentMonth);
//   const monthEnd = endOfMonth(currentMonth);
//   const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
//   const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
//   const days = eachDayOfInterval({ start: calStart, end: calEnd });

//   const getPostsForDay = (day) =>
//     posts.filter(p => {
//       const d = p.status === 'scheduled' ? p.scheduled_at : p.published_at;
//       return d && isSameDay(new Date(d), day);
//     });

//   const selectedDayPosts = selectedDay ? getPostsForDay(selectedDay) : [];

//   const totalScheduled = posts.filter(p => p.status === 'scheduled').length;
//   const totalPublished = posts.filter(p => p.status === 'published').length;

//   return (
//     <div className="min-h-screen p-6 md:p-8">
//       {/* Header */}
//       <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
//         <div>
//           <h1 className="font-heading text-2xl font-bold text-foreground mb-1">{typeLabel} Calendar</h1>
//           <p className="text-muted-foreground text-sm">
//             {totalScheduled} scheduled · {totalPublished} published
//           </p>
//         </div>
//         <div className="flex items-center gap-3">
//           <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
//             <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Published
//             <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block ml-2" /> Scheduled
//             <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block ml-2" /> Failed
//           </div>
//           <Link to="/projects">
//             <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white hover:from-purple-500 hover:to-pink-500">
//               <Plus className="w-3.5 h-3.5 mr-1" /> New Post
//             </Button>
//           </Link>
//         </div>
//       </div>

//       {/* Month nav */}
//       <div className="flex items-center gap-4 mb-4">
//         <Button variant="outline" size="icon" className="h-8 w-8 border-border/50" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
//           <ChevronLeft className="w-4 h-4" />
//         </Button>
//         <h2 className="font-heading font-semibold text-foreground text-lg min-w-[160px] text-center">
//           {format(currentMonth, 'MMMM yyyy')}
//         </h2>
//         <Button variant="outline" size="icon" className="h-8 w-8 border-border/50" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
//           <ChevronRight className="w-4 h-4" />
//         </Button>
//         <Button variant="ghost" size="sm" className="text-xs text-muted-foreground ml-2" onClick={() => setCurrentMonth(new Date())}>
//           Today
//         </Button>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         {/* Calendar */}
//         <div className="lg:col-span-3">
//           <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
//             {/* Day headers */}
//             <div className="grid grid-cols-7 border-b border-border/50">
//               {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
//                 <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
//                   {d}
//                 </div>
//               ))}
//             </div>

//             {/* Weeks */}
//             <div className="grid grid-cols-7">
//               {days.map((day, idx) => {
//                 const dayPosts = getPostsForDay(day);
//                 const isSelected = selectedDay && isSameDay(day, selectedDay);
//                 const inMonth = isSameMonth(day, currentMonth);
//                 return (
//                   <div
//                     key={idx}
//                     onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
//                     className={cn(
//                       'min-h-[90px] p-1.5 border-b border-r border-border/30 cursor-pointer transition-colors',
//                       !inMonth && 'opacity-30',
//                       isSelected && 'bg-primary/10',
//                       !isSelected && 'hover:bg-secondary/30',
//                       idx % 7 === 6 && 'border-r-0'
//                     )}
//                   >
//                     <div className={cn(
//                       'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ml-auto',
//                       isToday(day)
//                         ? 'bg-primary text-white'
//                         : 'text-foreground'
//                     )}>
//                       {format(day, 'd')}
//                     </div>
//                     <div className="space-y-0.5">
//                       {dayPosts.slice(0, 3).map(post => (
//                         <PostPill key={post.id} post={post} onDelete={() => handleDelete(post)} />
//                       ))}
//                       {dayPosts.length > 3 && (
//                         <p className="text-[9px] text-muted-foreground px-1">+{dayPosts.length - 3} more</p>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         {/* Day detail panel */}
//         <div className="lg:col-span-1">
//           <div className="rounded-xl border border-border/50 bg-card p-4 sticky top-6">
//             {selectedDay ? (
//               <>
//                 <div className="flex items-center gap-2 mb-4">
//                   <CalendarDays className="w-4 h-4 text-primary" />
//                   <h3 className="font-heading font-semibold text-foreground text-sm">
//                     {format(selectedDay, 'EEE, MMM d')}
//                   </h3>
//                 </div>
//                 {selectedDayPosts.length === 0 ? (
//                   <div className="text-center py-8">
//                     <p className="text-xs text-muted-foreground">No posts on this day</p>
//                     <Link to="/projects">
//                       <Button size="sm" variant="outline" className="mt-3 text-xs border-border/50">
//                         <Plus className="w-3 h-3 mr-1" /> Schedule a post
//                       </Button>
//                     </Link>
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {selectedDayPosts.map(post => {
//                       const meta = PLATFORM_META[post.platform] || { emoji: '🌐', label: post.platform };
//                       const dateStr = post.status === 'scheduled' ? post.scheduled_at : post.published_at;
//                       return (
//                         <div key={post.id} className="rounded-lg border border-border/50 p-3 space-y-2">
//                           {post.image_url && (
//                             <img src={post.image_url} alt="" className="w-full h-24 object-cover rounded-lg" />
//                           )}
//                           <div className="flex items-start justify-between gap-1">
//                             <div className="flex-1 min-w-0">
//                               <p className="text-xs font-medium text-foreground truncate">{post.project_title}</p>
//                               {post.caption && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{post.caption}</p>}
//                             </div>
//                             <button
//                               onClick={() => handleDelete(post)}
//                               className="text-destructive/50 hover:text-destructive flex-shrink-0"
//                             >
//                               <Trash2 className="w-3.5 h-3.5" />
//                             </button>
//                           </div>
//                           <div className="flex items-center justify-between">
//                             <Badge className={cn('text-[10px] border-0',
//                               post.status === 'published' ? 'bg-green-500/20 text-green-400' :
//                               post.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
//                               'bg-destructive/20 text-destructive'
//                             )}>
//                               {post.status}
//                             </Badge>
//                             <span className="text-[10px] text-muted-foreground flex items-center gap-1">
//                               {meta.emoji}
//                               {dateStr && format(new Date(dateStr), 'h:mm a')}
//                             </span>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </>
//             ) : (
//               <div className="text-center py-10">
//                 <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
//                 <p className="text-xs text-muted-foreground">Click a day to see its posts</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }