'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Map from '@/components/Map';
import { Incident } from '@/lib/db';
import { 
  AlertTriangle, 
  Bell, 
  Activity, 
  MapPin, 
  Share2, 
  CheckCircle,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Info
} from 'lucide-react';

const translations = {
  EN: {
    title: "raksha",
    subtitle: "",
    online: "Online",
    offline: "Offline Mode (Submissions Queue)",
    reports: "Total Reports",
    verified: "Confirmed Alerts",
    subs: "Alert Subscribers",
    reportBtn: "Report Incident",
    subscribeBtn: "Get Alerts",
    recentTitle: "Recent Emergency Feeds",
    activeIncidents: "Active Alerts",
    share: "Share Alert",
    verifiedText: "Community Confirmed",
    unverifiedText: "Awaiting Local Votes",
    loading: "Loading disaster feeds...",
    noIncidents: "No active incidents reported. Stay safe!",
    toastCopied: "Link copied! Share via WhatsApp.",
    soundOn: "Audio Alerts On",
    soundOff: "Audio Alerts Off",
    lbl_type_flood: "Flood",
    lbl_type_landslide: "Landslide",
    lbl_type_roadblock: "Road Block",
    lbl_type_rescue: "Rescue Needed",
    solveBtn: "Mark as Solved",
    solvedText: "Solved / Closed"
  },
  ML: {
    title: "രക്ഷ",
    subtitle: "",
    online: "ഓൺലൈൻ",
    offline: "ഓഫ്‌ലൈൻ മോഡ് (ക്യൂ സജീവം)",
    reports: "റിപ്പോർട്ടുകൾ",
    verified: "സ്ഥിരീകരിച്ചവ",
    subs: "വരിക്കാർ",
    reportBtn: "വിവരം അറിയിക്കുക",
    subscribeBtn: "അലർട്ടുകൾ ലഭിക്കാൻ",
    recentTitle: "സമീപകാല വിവരങ്ങൾ",
    activeIncidents: "സജീവം",
    share: "പങ്കുവെക്കുക",
    verifiedText: "പ്രാദേശികമായി സ്ഥിരീകരിച്ചു",
    unverifiedText: "വോട്ടിനായി കാത്തിരിക്കുന്നു",
    loading: "വിവരങ്ങൾ ശേഖരിക്കുന്നു...",
    noIncidents: "നിലവിൽ അപകടങ്ങൾ റിപ്പോർട്ട് ചെയ്തിട്ടില്ല. സുരക്ഷിതരായിരിക്കുക!",
    toastCopied: "ലിങ്ക് കോപ്പി ചെയ്തു! വാട്സാപ്പിൽ അയക്കുക.",
    soundOn: "ശബ്ദ മുന്നറിയിപ്പുകൾ ഓൺ",
    soundOff: "ശബ്ദ മുന്നറിയിപ്പുകൾ ഓഫ്",
    lbl_type_flood: "വെള്ളപ്പൊക്കം",
    lbl_type_landslide: "മണ്ണിടിച്ചിൽ",
    lbl_type_roadblock: "റോഡ് തടസ്സം",
    lbl_type_rescue: "രക്ഷാപ്രവർത്തനം",
    solveBtn: "പരിഹരിച്ചതായി അടയാളപ്പെടുത്തുക",
    solvedText: "പരിഹരിച്ചു / ക്ലോസ് ചെയ്തു"
  }
};

export default function Dashboard() {
  const [lang, setLang] = useState<'EN' | 'ML'>('EN');
  const [isOnline, setIsOnline] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [stats, setStats] = useState({ reports: 0, verified: 0, subs: 0 });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  
  // Voting session state
  const [userVotes, setUserVotes] = useState<Record<string, 'upvote' | 'downvote'>>({});

  // Load votes on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('raksha_user_votes');
      if (stored) {
        setUserVotes(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading votes from localStorage', e);
    }
  }, []);

  const handleVote = async (incidentId: string, voteType: 'upvote' | 'downvote') => {
    // 1. Calculate the deltas based on current status
    const currentVote = userVotes[incidentId];
    let upvoteDelta = 0;
    let downvoteDelta = 0;

    if (voteType === 'upvote') {
      if (currentVote === 'upvote') {
        // Retract upvote
        upvoteDelta = -1;
      } else if (currentVote === 'downvote') {
        // Switch from downvote to upvote
        upvoteDelta = 1;
        downvoteDelta = -1;
      } else {
        // New upvote
        upvoteDelta = 1;
      }
    } else {
      if (currentVote === 'downvote') {
        // Retract downvote
        downvoteDelta = -1;
      } else if (currentVote === 'upvote') {
        // Switch from upvote to downvote
        upvoteDelta = -1;
        downvoteDelta = 1;
      } else {
        // New downvote
        downvoteDelta = 1;
      }
    }

    // 2. Determine next vote state
    const nextVote = currentVote === voteType ? undefined : voteType;
    const updatedUserVotes = { ...userVotes };
    if (nextVote) {
      updatedUserVotes[incidentId] = nextVote;
    } else {
      delete updatedUserVotes[incidentId];
    }

    // 3. Optimistic UI Updates
    setUserVotes(updatedUserVotes);
    localStorage.setItem('raksha_user_votes', JSON.stringify(updatedUserVotes));

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === incidentId) {
        const nextUpvotes = Math.max(0, (inc.upvotes || 0) + upvoteDelta);
        return {
          ...inc,
          upvotes: nextUpvotes,
          downvotes: Math.max(0, (inc.downvotes || 0) + downvoteDelta),
          confirmed: inc.confirmed || nextUpvotes >= 3
        };
      }
      return inc;
    });
    setIncidents(updatedIncidents);

    if (selectedIncident && selectedIncident.id === incidentId) {
      const nextUpvotes = Math.max(0, (selectedIncident.upvotes || 0) + upvoteDelta);
      setSelectedIncident({
        ...selectedIncident,
        upvotes: nextUpvotes,
        downvotes: Math.max(0, (selectedIncident.downvotes || 0) + downvoteDelta),
        confirmed: selectedIncident.confirmed || nextUpvotes >= 3
      });
    }

    // 4. Dispatch update to API
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          incidentId,
          upvoteDelta,
          downvoteDelta
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Server error voting');
      }
      
      // Update state with exact DB data
      setIncidents(prev => prev.map(inc => inc.id === incidentId ? data.incident : inc));
      if (selectedIncident && selectedIncident.id === incidentId) {
        setSelectedIncident(data.incident);
      }
    } catch (err) {
      console.error('Error syncing vote:', err);
      // Revert optimistic state
      setUserVotes(userVotes);
      localStorage.setItem('raksha_user_votes', JSON.stringify(userVotes));
      fetchData(); // reload raw DB entries
      triggerSyncToast("Failed to register vote. Reverting...");
    }
  };

  const handleResolve = async (incidentId: string) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          incidentId
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Server error resolving incident');
      }

      // Close the inspector panel
      setSelectedIncident(null);
      // Reload raw DB entries to reflect change for all users
      fetchData();
      triggerSyncToast(lang === 'EN' ? "Incident successfully solved and closed!" : "അപകട വിവരം വിജയകരമായി പരിഹരിച്ചു!");
    } catch (err) {
      console.error('Error resolving incident:', err);
      triggerSyncToast("Failed to resolve incident.");
    }
  };

  // Monitor network status
  useEffect(() => {
    setIsOnline(window.navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      fetchData();
      triggerSyncToast("Reconnected! Syncing database...");
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerSyncToast("Offline: Submissions will queue locally");
    };
    const handleDataSynced = () => {
      fetchData();
      triggerSyncToast("Offline reports successfully synchronized!");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('raksha-data-synced', handleDataSynced);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('raksha-data-synced', handleDataSynced);
    };
  }, []);


  // Fetch incidents — wrapped in useCallback so it can be safely referenced
  // inside other useEffects without triggering stale-closure lint warnings
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports?action=incidents');
      const data = await res.json();
      if (data.success) {
        setIncidents(data.incidents);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const triggerSyncToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const shareToWhatsApp = (inc: Incident) => {
    const typeMap: Record<string, string> = {
      flood: "Flood (വെള്ളപ്പൊക്കം)",
      landslide: "Landslide (മണ്ണിടിച്ചിൽ)",
      roadblock: "Road Block (റോഡ് തടസ്സം)",
      rescue: "Rescue Needed (രക്ഷാപ്രവർത്തനം)"
    };
    
    const msg = `⚠️ *രക്ഷാ അലർട്ട് (raksha)* ⚠️\n\nപ്രദേശം: ${inc.village || 'Sector'}, ${inc.district}\nദുരന്ത തരം: ${typeMap[inc.type] || inc.type}\nതീവ്രത: ${inc.severity.toUpperCase()}\nറിപ്പോർട്ടുകൾ: ${inc.report_count}\nവിശദാംശങ്ങൾ: ${inc.description}\n\nതത്സമയ വിവരങ്ങൾക്കും സുരക്ഷിത പാതകൾക്കുമായി സന്ദർശിക്കുക: https://raksha.app/incident/${inc.id}`;
    
    // Fallback copy to clipboard if navigator fails
    navigator.clipboard.writeText(msg).then(() => {
      triggerSyncToast(translations[lang].toastCopied);
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    }).catch(() => {
      triggerSyncToast("Failed to copy link");
    });
  };

  const t = translations[lang];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      
      {/* Dynamic Network Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#16a34a] border border-white/20 text-white px-4 py-2.5 rounded-xl shadow-2xl z-50 text-sm font-medium animate-[slideUp_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
          {toastMessage}
        </div>
      )}

      {/* Main Header */}
      <header className="bg-[#0b0c12]/95 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center z-40">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">
            {t.title}{t.subtitle && <span className="text-amber-500 font-semibold">{t.subtitle}</span>}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-[#16a34a] animate-pulse" />
                <span className="hidden sm:inline text-[#16a34a]">{t.online}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="hidden sm:inline text-red-500">{t.offline}</span>
              </>
            )}
          </div>

          {/* Sound Notification Control */}
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-2 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 text-gray-400 hover:text-white transition-all"
            title={audioEnabled ? t.soundOn : t.soundOff}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          {/* Languages Toggle */}
          <button
            onClick={() => setLang(lang === 'EN' ? 'ML' : 'EN')}
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all"
          >
            {lang === 'EN' ? 'മലയാളം' : 'English'}
          </button>

          {/* Info Credits Toggle */}
          <div className="relative">
            <button
              onClick={() => setInfoOpen(!infoOpen)}
              className={`p-2 rounded-full border transition-all ${
                infoOpen 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold shadow-inner' 
                  : 'hover:bg-white/5 border-transparent hover:border-white/10 text-gray-400 hover:text-white'
              }`}
              title="Credits & Info"
            >
              <Info className="w-4 h-4" />
            </button>

            {infoOpen && (
              <div className="absolute right-0 mt-2.5 w-64 bg-[#12141c]/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl z-50 text-left animate-[slideDown_0.2s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1.5">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  System Credits
                </div>
                <p className="text-xs text-gray-300 font-medium">
                  RAKSHA Emergency Platform
                </p>
                <div className="mt-2.5 pt-2.5 border-t border-white/5 text-[11px] text-gray-400 flex flex-col gap-1">
                  <span className="font-semibold text-white">
                    Developed by Sankaranarayanan
                  </span>
                  <span>Kerala Broadcast Network &copy; 2026</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_450px] overflow-hidden">
        
        {/* Left Side: Map Container */}
        <section className="h-[55vh] lg:h-full relative bg-[#0e1017]">
          <Map incidents={incidents} onPinClick={(inc) => setSelectedIncident(inc)} />

        </section>

        {/* Right Side: Side Panels (Feed and details) */}
        <aside className="h-[45vh] lg:h-full bg-[#12141c]/90 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col overflow-hidden z-10">
          
          {/* Quick stats panel */}
          <div className="p-5 border-b border-white/5 grid grid-cols-3 gap-3.5">
            <div className="glass-card rounded-xl p-3.5 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t.reports}</span>
              <span className="text-xl font-bold mt-1 block text-white">{stats.reports}</span>
            </div>
            <div className="glass-card rounded-xl p-3.5 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t.verified}</span>
              <span className="text-xl font-bold mt-1 block text-[#16a34a]">{stats.verified}</span>
            </div>
            <div className="glass-card rounded-xl p-3.5 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t.subs}</span>
              <span className="text-xl font-bold mt-1 block text-amber-500">{stats.subs.toLocaleString()}</span>
            </div>
          </div>

          {/* Quick action triggers */}
          <div className="p-5 border-b border-white/5 flex gap-4">
            <Link href="/report" className="flex-1 bg-gradient-to-br from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold py-3.5 px-4 rounded-xl text-center shadow-lg shadow-red-600/10 flex items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5">
              <AlertTriangle className="w-4 h-4" />
              {t.reportBtn}
            </Link>
            <Link href="/alert" className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold py-3.5 px-4 rounded-xl text-center flex items-center justify-center gap-2 transition-all">
              <Bell className="w-4 h-4" />
              {t.subscribeBtn}
            </Link>
          </div>

          {/* Scrollable Container for Inspector Panel and Feeds */}
          <div className="flex-1 flex flex-col overflow-y-auto min-h-0">

            {/* Incident Detail Inspector Panel */}
          {selectedIncident && (
            <div className="p-5 border-b border-white/10 bg-white/[0.02] flex flex-col gap-3.5 animate-[fadeIn_0.3s_ease]">
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  selectedIncident.type === 'landslide' ? 'bg-red-600/25 text-red-500' :
                  selectedIncident.type === 'flood' ? 'bg-blue-600/25 text-blue-500' :
                  selectedIncident.type === 'roadblock' ? 'bg-amber-600/25 text-amber-500' : 'bg-purple-600/25 text-purple-500'
                }`}>
                  {selectedIncident.type} ({selectedIncident.severity})
                </span>
                <button 
                  onClick={() => setSelectedIncident(null)}
                  className="text-gray-400 hover:text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              <div>
                <h3 className="font-bold text-lg text-white">
                  {selectedIncident.village || 'Region Sector'}, {selectedIncident.district}
                </h3>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  Reported: {new Date(selectedIncident.first_reported_at).toLocaleTimeString()} ({new Date(selectedIncident.first_reported_at).toLocaleDateString()})
                </p>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed bg-[#1b1c24] p-3 rounded-lg border border-white/5">
                {selectedIncident.description}
              </p>

              {selectedIncident.photo_url && (
                <div className="relative rounded-xl overflow-hidden border border-white/10 h-44 w-full bg-[#1b1c24]/50 shadow-inner">
                  <img 
                    src={selectedIncident.photo_url} 
                    alt="Disaster evidence" 
                    className="w-full h-full object-cover transition-transform hover:scale-[1.02] duration-300"
                  />
                </div>
              )}

              {selectedIncident.confirmed ? (
                <div className="flex justify-between items-center bg-[#16a34a]/10 border border-[#16a34a]/20 p-2.5 rounded-lg text-xs text-[#16a34a] font-semibold shadow-inner">
                  <span className="flex items-center gap-1.5 animate-[pulse_2s_infinite]">
                    <CheckCircle className="w-4 h-4" />
                    {t.verifiedText}
                  </span>
                  <span>Reports: {selectedIncident.report_count}</span>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-xs text-amber-500 font-semibold shadow-inner">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 animate-pulse" />
                    {t.unverifiedText} ({selectedIncident.upvotes || 0}/3 upvotes)
                  </span>
                  <span>Reports: {selectedIncident.report_count}</span>
                </div>
              )}

              {/* Detailed Voting Row */}
              <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                <span className="text-xs text-gray-400 font-semibold">Helpful alert feedback?</span>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVote(selectedIncident.id, 'upvote')}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs transition-all ${
                      userVotes[selectedIncident.id] === 'upvote'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5'
                        : 'bg-white/5 border-white/10 hover:border-emerald-500/20 hover:text-emerald-400 text-gray-400'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Upvote ({selectedIncident.upvotes || 0})</span>
                  </button>
                  
                  <button
                    onClick={() => handleVote(selectedIncident.id, 'downvote')}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs transition-all ${
                      userVotes[selectedIncident.id] === 'downvote'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 font-bold shadow-lg shadow-red-500/5'
                        : 'bg-white/5 border-white/10 hover:border-red-500/20 hover:text-red-400 text-gray-400'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Downvote ({selectedIncident.downvotes || 0})</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={() => handleResolve(selectedIncident.id)}
                className="bg-gradient-to-br from-[#16a34a] to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all w-full shadow-lg shadow-emerald-500/10 transform hover:-translate-y-0.5"
              >
                <CheckCircle className="w-4 h-4" />
                {t.solveBtn}
              </button>

              <button 
                onClick={() => shareToWhatsApp(selectedIncident)}
                className="bg-[#25d366] hover:bg-[#20ba5a] text-white text-sm font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all w-full"
              >
                <Share2 className="w-4 h-4" />
                {t.share}
              </button>
            </div>
          )}

          {/* Recent Feeds List */}
          <div className="p-5 flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                {t.recentTitle}
              </h2>
              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                {incidents.length} {t.activeIncidents}
              </span>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
                <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                <span className="text-xs text-gray-400">{t.loading}</span>
              </div>
            ) : incidents.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400 glass-card rounded-xl p-5 border border-white/5">
                {t.noIncidents}
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {incidents.map((inc) => (
                  <div 
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className="glass-card rounded-xl p-4 cursor-pointer hover:border-white/20 hover:bg-white/[0.01] transition-all flex flex-col gap-2.5 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        inc.type === 'landslide' ? 'bg-red-600/20 text-red-400' :
                        inc.type === 'flood' ? 'bg-blue-600/20 text-blue-400' :
                        inc.type === 'roadblock' ? 'bg-amber-600/20 text-amber-400' : 'bg-purple-600/20 text-purple-400'
                      }`}>
                        {lang === 'EN' ? inc.type : translations.ML[`lbl_type_${inc.type}` as keyof typeof translations.ML] || inc.type}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(inc.first_reported_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>

                    <div className="font-semibold text-sm text-white group-hover:text-amber-500 transition-colors flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {inc.village || 'Region'}, {inc.district}
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {inc.description}
                    </p>

                    <div className="flex justify-between items-center border-t border-white/5 pt-2.5 mt-1 text-[10px] font-semibold">
                      {inc.confirmed ? (
                        <span className="text-[#16a34a] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {t.verifiedText}
                        </span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-1">
                          <Activity className="w-3 h-3 animate-pulse" />
                          {t.unverifiedText} ({inc.upvotes || 0}/3)
                        </span>
                      )}

                      {/* Card Voting Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(inc.id, 'upvote');
                          }}
                          className={`flex items-center gap-1 py-1 px-2 rounded-lg border transition-all ${
                            userVotes[inc.id] === 'upvote'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                              : 'bg-white/5 border-white/5 hover:border-emerald-500/20 hover:text-emerald-400 text-gray-400'
                          }`}
                          title="Upvote alert accuracy"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>{inc.upvotes || 0}</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(inc.id, 'downvote');
                          }}
                          className={`flex items-center gap-1 py-1 px-2 rounded-lg border transition-all ${
                            userVotes[inc.id] === 'downvote'
                              ? 'bg-red-500/10 border-red-500/30 text-red-400 font-bold'
                              : 'bg-white/5 border-white/5 hover:border-red-500/20 hover:text-red-400 text-gray-400'
                          }`}
                          title="Downvote alert accuracy"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>{inc.downvotes || 0}</span>
                        </button>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          shareToWhatsApp(inc);
                        }}
                        className="text-[#25d366] hover:bg-[#25d366]/10 px-2 py-1 rounded transition-colors"
                      >
                        {t.share}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
      </main>
    </div>
  );
}
