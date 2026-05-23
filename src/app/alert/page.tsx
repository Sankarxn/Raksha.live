'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Bell, 
  Check, 
  Loader2, 
  Phone, 
  MapPin,
  ChevronDown,
  Globe
} from 'lucide-react';

const translations = {
  EN: {
    dashboard: "Dashboard",
    title: "Kerala District Alert Network",
    desc: "Subscribe to receive severe weather alerts, flood risk warnings, and offline SMS updates for emergency situations in your district.",
    benefit1: "Severe rain & landslide risk alerts",
    benefit2: "Mobile push notifications during storm cycles",
    benefit3: "SMS network fallback for feature-phone connectivity",
    selectLabel: "Select District",
    phoneLabel: "Phone Number (SMS Alert Broadcasts)",
    phonePlaceholder: "+91 XXXXX XXXXX",
    subscribeBtn: "Subscribe to Alerts",
    subscribing: "Subscribing...",
    successTitle: "Successfully Subscribed!",
    successDesc: "You will now receive emergency alert broadcasts for ",
    successDescEnd: " via push notification and SMS messages.",
    returnBtn: "Return to Dashboard",
    errorRequired: "Please enter a valid phone number"
  },
  ML: {
    dashboard: "ഡാഷ്‌ബോർഡ്",
    title: "കേരള ജില്ലാ അലർട്ട് നെറ്റ്‌വർക്ക്",
    desc: "നിങ്ങളുടെ ജില്ലയിലെ അടിയന്തിര സാഹചര്യങ്ങളിൽ കടുത്ത കാലാവസ്ഥാ മുന്നറിയിപ്പുകൾ, വെള്ളപ്പൊക്ക മുന്നറിയിപ്പുകൾ, ഓഫ്‌ലൈൻ SMS അപ്‌ഡേറ്റുകൾ എന്നിവ ലഭിക്കുന്നതിന് സബ്‌സ്‌ക്രൈബ് ചെയ്യുക.",
    benefit1: "ശക്തമായ മഴ, മണ്ണിടിച്ചിൽ മുന്നറിയിപ്പുകൾ",
    benefit2: "കൊടുങ്കാറ്റ് സമയങ്ങളിൽ മൊബൈൽ പുഷ് അറിയിപ്പുകൾ",
    benefit3: "ഫീച്ചർ ഫോണുകൾക്കായി SMS നെറ്റ്‌വർക്ക് സപ്പോർട്ട്",
    selectLabel: "ജില്ല തിരഞ്ഞെടുക്കുക",
    phoneLabel: "ഫോൺ നമ്പർ (SMS അലർട്ടുകൾക്കായി)",
    phonePlaceholder: "+91 XXXXX XXXXX",
    subscribeBtn: "അലർട്ടുകൾക്കായി സബ്‌സ്‌ക്രൈബ് ചെയ്യുക",
    subscribing: "സബ്‌സ്‌ക്രൈബ് ചെയ്യുന്നു...",
    successTitle: "വിജയകരമായി സബ്‌സ്‌ക്രൈബ് ചെയ്തു!",
    successDesc: "നിങ്ങൾക്ക് ഇപ്പോൾ ",
    successDescEnd: " ജില്ലയിലെ അടിയന്തിര മുന്നറിയിപ്പുകൾ പുഷ് നോട്ടിഫിക്കേഷൻ വഴിയും SMS വഴിയും ലഭിക്കും.",
    returnBtn: "ഡാഷ്‌ബോർഡിലേക്ക് മടങ്ങുക",
    errorRequired: "ദയവായി ഒരു സാധുവായ ഫോൺ നമ്പർ നൽകുക"
  }
};

const districts = [
  "Alappuzha",
  "Ernakulam",
  "Idukki",
  "Kannur",
  "Kasaragod",
  "Kollam",
  "Kottayam",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Pathanamthitta",
  "Thiruvananthapuram",
  "Thrissur",
  "Wayanad"
];

export default function SubscribeAlerts() {
  const router = useRouter();
  const [lang, setLang] = useState<'EN' | 'ML'>('EN');
  const [district, setDistrict] = useState('Wayanad');
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [smsLogs, setSmsLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchSmsLogs = async () => {
      try {
        const res = await fetch('/sms-broadcasts.json');
        if (res.ok) {
          const data = await res.json();
          setSmsLogs(data);
        }
      } catch (err) {
        // file doesn't exist yet, which is fine
      }
    };
    fetchSmsLogs();
    const interval = setInterval(fetchSmsLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = translations[lang];
    if (!phone) {
      setErrorMessage(t.errorRequired);
      return;
    }
    
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district,
          phone,
          fcm_token: 'fcm-token-' + Math.random().toString(36).substr(2, 9)
        })
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setSuccess(true);
      } else {
        setErrorMessage(data.error || 'Subscription failed');
      }

    } catch (err) {
      console.error(err);
      setLoading(false);
      setErrorMessage('Failed to connect to subscription services.');
    }
  };

  const t = translations[lang];

  return (
    <div className="flex-1 bg-[#090b11] flex flex-col justify-center items-center p-6 text-white min-h-screen relative overflow-hidden">
      
      {/* Abstract Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none animate-pulse duration-[6000ms]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-amber-500/5 blur-[110px] pointer-events-none animate-pulse duration-[8000ms]"></div>

      {/* Top sticky back button & language toggle */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-40">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg backdrop-blur-md">
          <ArrowLeft className="w-4 h-4" />
          {t.dashboard}
        </Link>

        <button
          onClick={() => setLang(lang === 'EN' ? 'ML' : 'EN')}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg backdrop-blur-md"
        >
          <Globe className="w-3.5 h-3.5 text-amber-500" />
          {lang === 'EN' ? 'മലയാളം' : 'English'}
        </button>
      </div>

      {/* Main Card container with drop shadow & borders */}
      <div className="w-full max-w-[460px] bg-[#12141c]/80 backdrop-blur-2xl rounded-3xl p-8 border border-white/5 shadow-2xl shadow-black/80 flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out] z-10">
        
        {/* Header section with swinging Bell */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/5">
            <Bell className="w-7 h-7 animate-[swing_2.5s_infinite_ease-in-out]" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1 leading-tight">{t.title}</h2>
          <p className="text-xs text-gray-400 max-w-[340px] leading-relaxed">
            {t.desc}
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Display error message if present */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3.5 text-xs text-center font-semibold animate-shake">
                {errorMessage}
              </div>
            )}

            {/* Premium Benefits Checklist Box */}
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4.5 flex flex-col gap-3.5">
              {[t.benefit1, t.benefit2, t.benefit3].map((benefit, i) => (
                <div key={i} className="flex items-start gap-3 text-xs text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-[#16a34a]/10 border border-[#16a34a]/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-[#16a34a]" />
                  </div>
                  <span className="leading-normal">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Custom district dropdown to guarantee contrast and visual excellence */}
            <div className="flex flex-col gap-2 relative">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                {t.selectLabel}
              </label>
              
              <button
                type="button"
                onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}
                className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-blue-500/80 rounded-xl px-4 py-3.5 text-sm text-white flex justify-between items-center outline-none cursor-pointer transition-all duration-200 shadow-inner"
              >
                <span className="flex items-center gap-2.5 font-semibold text-gray-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50 animate-pulse"></span>
                  {district}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${districtDropdownOpen ? 'transform rotate-180 text-white' : ''}`} />
              </button>

              {/* Custom selection list */}
              {districtDropdownOpen && (
                <div className="absolute top-[80px] left-0 w-full bg-[#151722] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5 max-h-[220px] overflow-y-auto animate-[fadeIn_0.15s_ease-out]">
                  {districts.map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => {
                        setDistrict(dist);
                        setDistrictDropdownOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3 text-sm transition-all duration-150 flex items-center justify-between ${
                        district === dist 
                          ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500' 
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{dist}</span>
                      {district === dist && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone input with custom focus ring */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                {t.phoneLabel}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500/80 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 outline-none transition-all shadow-inner focus:shadow-blue-500/5"
              />
            </div>

            {/* Subscribe Action Button with full gradient & smooth hover transitions */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold py-4 px-4 rounded-xl text-sm shadow-xl shadow-blue-500/15 flex items-center justify-center gap-2.5 transition-all duration-300 mt-3 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.subscribing}
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 text-amber-300" />
                  {t.subscribeBtn}
                </>
              )}
            </button>

          </form>
        ) : (
          /* Redesigned Success Screen */
          <div className="flex flex-col items-center text-center gap-6 py-6 animate-[fadeIn_0.4s_ease-out]">
            <div className="w-16 h-16 rounded-full bg-[#16a34a]/10 border border-[#16a34a]/30 flex items-center justify-center text-[#16a34a] shadow-2xl shadow-[#16a34a]/10 animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-extrabold text-xl text-white">{t.successTitle}</h3>
              <p className="text-xs text-gray-400 max-w-[310px] leading-relaxed">
                {t.successDesc}<strong className="text-blue-400 font-bold">{district}</strong>{t.successDescEnd}
              </p>
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md transform hover:-translate-y-0.5 mt-2"
            >
              {t.returnBtn}
            </button>
          </div>
        )}

      </div>

      {/* Live SMS Broadcast Log Panel */}
      <div className="w-full max-w-[460px] bg-[#12141c]/60 backdrop-blur-xl rounded-3xl p-6 border border-white/5 shadow-2xl mt-6 z-10 flex flex-col gap-4 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Live SMS Broadcast Logs (Kerala Network)
          </h3>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
            Active
          </span>
        </div>
        
        <div className="flex flex-col gap-3.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
          {smsLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs flex flex-col items-center gap-2 border border-dashed border-white/5 rounded-2xl bg-white/[0.005]">
              <Phone className="w-6 h-6 text-gray-600 animate-pulse" />
              <span>No SMS broadcasts sent yet. Submit a new incident report to trigger automatic district alerts!</span>
            </div>
          ) : (
            smsLogs.map((log: any) => (
              <div key={log.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-1.5 transition-all hover:bg-white/[0.04] text-left">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-blue-400 font-bold">
                    {log.phone ? `${log.phone.slice(0, 3)}****${log.phone.slice(-4)}` : 'Subscriber'}
                  </span>
                  <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-[11px] text-gray-300 leading-normal bg-black/20 p-2.5 rounded-lg font-mono whitespace-pre-line">
                  {log.message}
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-gray-500 font-semibold uppercase">District: {log.district}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                    log.status.includes('failed') ? 'bg-red-500/10 text-red-400 border border-red-500/25' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                  }`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
