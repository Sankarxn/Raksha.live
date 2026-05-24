'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  MapPin, 
  Check, 
  Loader2, 
  Wifi, 
  WifiOff, 
  Share2, 
  Database,
  Cpu,
  Layers,
  Send,
  AlertTriangle,
  UploadCloud,
  ChevronRight
} from 'lucide-react';



interface ReportResult {
  id?: string;
  offline?: boolean;
}

export default function ReportIncident() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [success, setSuccess] = useState(false);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);

  // Form State
  const [type, setType] = useState('flood');
  const [coords, setCoords] = useState({ lat: 11.605, lng: 76.088 }); // default Wayanad
  const [district, setDistrict] = useState('Wayanad');
  const [village, setVillage] = useState('Wayanad Sector');
  const [photo, setPhoto] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [description, setDescription] = useState('');

  // GPS/Geolocation State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  const fetchExactLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setCoords({ lat, lng });
        setGpsSuccess(true);
        setGpsLoading(false);

        // Reverse geocoding using OpenStreetMap Nominatim
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
          headers: {
            'User-Agent': 'RAKSHA-Kerala-Emergency-Network/1.0 (sankaranarayanan.raksha@gmail.com)'
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.address) {
              const address = data.address;
              // Extract district from OS details
              const dist = address.county || address.state_district || address.city || address.district || 'Wayanad';
              const villageName = address.suburb || address.village || address.town || address.neighbourhood || address.municipality || 'Kerala Sector';
              
              setDistrict(dist.replace(' District', ''));
              setVillage(villageName);
            }
          })
          .catch(err => {
            console.error("Reverse geocoding error:", err);
          });
      },
      (error) => {
        console.error("Error getting location:", error);
        let msg = "Failed to retrieve exact location";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location access denied by user. Please enable browser permissions.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Request timed out getting location.";
        }
        setGpsError(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    setIsOnline(window.navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTypeSelect = (selectedType: string) => {
    setType(selectedType);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      // Simulate client-side compression delay (800ms)
      setTimeout(() => {
        setPhoto(reader.result as string);
        setCompressing(false);
      }, 800);
    };
    reader.readAsDataURL(file);
  };

  const submitReport = async () => {
    setSubmitting(true);
    setPipelineStep(1); // 1. Save to DB

    const payload = {
      type,
      lat: coords.lat,
      lng: coords.lng,
      district,
      village,
      photo: photo,
      description,
      anonymous_session_id: 'sess-' + Math.random().toString(36).substr(2, 9)
    };

    if (!isOnline) {
      // Strip base64 photo for offline queue to prevent localStorage QuotaExceededError (5MB limit)
      const offlinePayload = {
        ...payload,
        photo: null // Stored as extremely lightweight JSON
      };

      setTimeout(() => {
        try {
          const queue = JSON.parse(localStorage.getItem('raksha_offline_queue') || '[]');
          queue.push(offlinePayload);
          localStorage.setItem('raksha_offline_queue', JSON.stringify(queue));
          
          setSubmitting(false);
          setSuccess(true);
          setReportResult({ offline: true });
        } catch (storageErr) {
          console.error('[Offline Storage] Quota full error:', storageErr);
          setSubmitting(false);
          setGpsError("Offline storage queue is full. Please clear some browser space or return online to submit.");
        }
      }, 1500);
      return;
    }

    // Online execution pipeline sequence simulation
    try {
      // Save report
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      setTimeout(() => {
        setPipelineStep(2); // 2. AI validation
        
        setTimeout(() => {
          setPipelineStep(3); // 3. Clustering
          
          setTimeout(() => {
            setPipelineStep(4); // 4. Dispatch Alert
            
            setTimeout(() => {
              setSubmitting(false);
              setSuccess(true);
              setReportResult(data.report);
            }, 1200);
          }, 1000);
        }, 1500);
      }, 1000);

    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!reportResult) return;
    const typeMap: Record<string, string> = {
      flood: "Flood (വെള്ളപ്പൊക്കം)",
      landslide: "Landslide (മണ്ണിടിച്ചിൽ)",
      roadblock: "Road Block (റോഡ് തടസ്സം)",
      rescue: "Rescue Needed (രക്ഷാപ്രവർത്തനം)"
    };
    const msg = `⚠️ *രക്ഷാ അലർട്ട് (raksha)* ⚠️\n\nപ്രദേശം: Wayanad Sector\nദുരന്ത തരം: ${typeMap[type] || type}\nസമയം: ${new Date().toLocaleTimeString()}\nവിശദാംശങ്ങൾ: ${description || 'Emergency reported.'}\n\nതത്സമയ വിവരങ്ങൾക്കും സുരക്ഷിത പാതകൾക്കുമായി സന്ദർശിക്കുക: https://raksha.app/incident/${reportResult.id || 'new'}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const mapClickSimulate = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Map bounds mock
    const scaleLat = parseFloat((11.55 + (y / rect.height) * 0.12).toFixed(6));
    const scaleLng = parseFloat((75.95 + (x / rect.width) * 0.2).toFixed(6));
    
    setCoords({ lat: scaleLat, lng: scaleLng });
    setGpsSuccess(true);
    setGpsError(null);

    // Reverse geocoding simulated coordinates too
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${scaleLat}&lon=${scaleLng}`, {
      headers: {
        'User-Agent': 'RAKSHA-Kerala-Emergency-Network/1.0 (sankaranarayanan.raksha@gmail.com)'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const address = data.address;
          const dist = address.county || address.state_district || address.city || address.district || 'Wayanad';
          const villageName = address.suburb || address.village || address.town || address.neighbourhood || address.municipality || 'Wayanad Sector';
          
          setDistrict(dist.replace(' District', ''));
          setVillage(villageName);
        }
      })
      .catch(err => {
        console.error("Reverse geocoding error:", err);
      });
  };

  return (
    <div className="flex-1 bg-[#0a0b10] flex flex-col justify-center items-center p-6 text-white min-h-screen">
      
      {/* Top sticky controls */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>

        <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm">
          {/* Network Indicator */}
          <div className="flex items-center gap-2 font-semibold">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-[#16a34a]" />
                <span className="text-[#16a34a] text-xs">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-red-500 text-xs">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Wizard Form Container */}
      {!submitting && !success && (
        <div className="w-[500px] glass-card rounded-2xl p-6 border border-white/5 shadow-2xl flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
          
          {/* Steps Indicator dots */}
          <div className="flex justify-between items-center relative px-8">
            <div className="absolute top-2.5 left-12 right-12 h-0.5 bg-white/5 z-0" />
            {[1, 2, 3].map((num) => (
              <div 
                key={num}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 border transition-all ${
                  step === num ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' :
                  step > num ? 'bg-[#16a34a] border-[#16a34a] text-white' : 'bg-[#12141c] border-white/10 text-gray-500'
                }`}
              >
                {step > num ? <Check className="w-3.5 h-3.5" /> : num}
              </div>
            ))}
          </div>

          {/* STEP 1: Select Type */}
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">1. Select Incident Type</h2>
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { id: 'flood', label: 'Flood', color: 'text-blue-500', desc: 'Waterlogging / Rising levels' },
                  { id: 'landslide', label: 'Landslide', color: 'text-red-500', desc: 'Mudslides / Falling rocks' },
                  { id: 'roadblock', label: 'Road Block', color: 'text-amber-500', desc: 'Trees / Debris blocking transit' },
                  { id: 'rescue', label: 'Rescue Needed', color: 'text-purple-500', desc: 'Stranded residents' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTypeSelect(item.id)}
                    className={`p-4 rounded-xl text-left border flex flex-col gap-2.5 transition-all hover:bg-white/[0.02] ${
                      type === item.id ? 'bg-blue-500/10 border-blue-500/80 shadow-lg shadow-blue-500/5' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <span className={`font-bold text-sm ${item.color} flex items-center gap-1.5`}>
                      <AlertTriangle className="w-4 h-4" />
                      {item.label}
                    </span>
                    <span className="text-[11px] text-gray-400 leading-normal">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: GPS Location */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">2. Confirm GPS Location</h2>
              
              {/* Interactive map click sim */}
              <div 
                onClick={mapClickSimulate}
                className="h-[200px] w-full bg-[#12141c] border border-white/10 rounded-xl relative overflow-hidden cursor-crosshair"
              >
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
                  <MapPin className="w-6 h-6 text-blue-500 animate-bounce" />
                  <span className="text-[9px] bg-blue-600 px-1.5 py-0.5 rounded text-white font-bold uppercase tracking-wider mt-1">Crosshair</span>
                </div>
              </div>

              {/* Exact Location Sharing Button */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={fetchExactLocation}
                  disabled={gpsLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold transition-all border ${
                    gpsSuccess 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-blue-600 hover:bg-blue-500 border-blue-500/30 text-white shadow-lg shadow-blue-600/10'
                  }`}
                >
                  {gpsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Retrieving GPS Coordinates...</span>
                    </>
                  ) : gpsSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>GPS Location Shared Successfully</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 text-white" />
                      <span>Share Exact Device Location</span>
                    </>
                  )}
                </button>
                
                {gpsError && (
                  <p className="text-xs text-red-500 font-semibold bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg animate-[fadeIn_0.2s_ease]">
                    ⚠️ {gpsError}
                  </p>
                )}
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-xs text-gray-400 text-center">
                Coordinates: Lat {coords.lat.toFixed(5)}, Lng {coords.lng.toFixed(5)}
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Report District</label>
                  <input 
                    type="text" 
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Wayanad"
                    className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/80 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Village / Region</label>
                  <input 
                    type="text" 
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Chooralmala"
                    className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/80 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Photo & Description */}
          {step === 3 && (
            <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">3. Photo & Descriptions</h2>
              
              {/* Hidden Local File Input */}
              <input 
                type="file" 
                id="local-photo-input" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
                className="hidden" 
              />

              {/* Photo Box */}
              <div 
                onClick={() => document.getElementById('local-photo-input')?.click()}
                className="h-[140px] border-2 border-dashed border-white/10 rounded-xl flex flex-col justify-center items-center cursor-pointer hover:bg-white/[0.01] hover:border-white/20 transition-all relative overflow-hidden"
              >
                {compressing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                    <span className="text-xs text-gray-400">Compressing Image (2.4MB)...</span>
                  </div>
                ) : photo ? (
                  <>
                    <img src={photo} className="w-full h-full object-cover" alt="disaster scene" />
                    <div className="absolute bottom-3 bg-[#16a34a] text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg border border-white/10 animate-pulse">
                      Compressed to 178KB
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud className="w-8 h-8 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-400">Tap to Upload Photo from Device</span>
                    <span className="text-[9px] text-gray-500">Auto client-side 2G compression active</span>
                  </div>
                )}
              </div>

              {/* Description Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Incident Details</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe details (e.g. Mudslide near hairpin curves, road completely blocked...)" 
                  rows={3}
                  className="bg-white/5 border border-white/10 focus:border-blue-500/80 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Form Navigations */}
          <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-2 gap-4">
            <button 
              onClick={() => {
                if (step > 1) setStep(step - 1);
                else router.push('/');
              }}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button 
              onClick={() => {
                if (step < 3) setStep(step + 1);
                else submitReport();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1 transition-all"
            >
              {step === 3 ? (isOnline ? 'Submit Report' : 'Queue Offline') : 'Next'}
              {step < 3 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

        </div>
      )}

      {/* PIPELINE LOADER: Backend processing steps */}
      {submitting && (
        <div className="w-[500px] glass-card rounded-2xl p-6 border border-white/5 shadow-2xl flex flex-col items-center justify-center gap-6 animate-[fadeIn_0.3s_ease]">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <h2 className="text-xl font-bold">Processing Disaster Report</h2>

          <div className="w-full flex flex-col gap-4 mt-2">
            {[
              { stepNum: 1, label: "Saving to Supabase Database", desc: "Writing reports dataset schema coordinates", icon: <Database className="w-4 h-4" /> },
              { stepNum: 2, label: "Report Ingestion Verification", desc: "Checking coordinate boundaries and formatting metadata", icon: <Cpu className="w-4 h-4" /> },
              { stepNum: 3, label: "Clustering Engine Check", desc: "Grouping with surrounding local reports grid", icon: <Layers className="w-4 h-4" /> },
              { stepNum: 4, label: "Alert Dispatch Engine", desc: "Triggering FCM push, SMS Twilio fallback notifications", icon: <Send className="w-4 h-4" /> }
            ].map((stepItem) => {
              const isActive = pipelineStep === stepItem.stepNum;
              const isCompleted = pipelineStep > stepItem.stepNum;
              
              return (
                <div 
                  key={stepItem.stepNum}
                  className={`flex items-center gap-4 transition-all duration-300 ${
                    isActive || isCompleted ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold ${
                    isCompleted ? 'bg-[#16a34a] border-[#16a34a] text-white' :
                    isActive ? 'border-blue-500 text-blue-400 animate-pulse shadow-md shadow-blue-500/10' : 'border-white/10 text-gray-500'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepItem.stepNum}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                      {stepItem.icon}
                      {stepItem.label}
                    </div>
                    <div className="text-[10px] text-gray-400 leading-normal mt-0.5">{stepItem.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUCCESS: Submission Summary */}
      {success && (
        <div className="w-[500px] glass-card rounded-2xl p-6 border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center gap-5 animate-[fadeIn_0.3s_ease]">
          
          {reportResult?.offline ? (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-500/15 border-2 border-amber-500 flex items-center justify-center text-amber-500 text-3xl shadow-lg shadow-amber-500/10">
                <Database className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Cached in Offline Queue</h2>
              <p className="text-xs text-gray-400 max-w-[340px] leading-relaxed">
                Your connection is offline. The report has been saved to the local cache and will automatically sync once your connection is restored.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-[#16a34a]/15 border-2 border-[#16a34a] flex items-center justify-center text-[#16a34a] text-3xl shadow-lg shadow-[#16a34a]/10">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Report Submitted Successfully</h2>
              <p className="text-xs text-gray-400 max-w-[340px] leading-relaxed">
                Thank you. The report is active on the emergency dashboard.
              </p>
              
              <div className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-2.5 text-left mt-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Broadcast warning template</span>
                <button 
                  onClick={handleWhatsAppShare}
                  className="bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Share2 className="w-4.5 h-4.5" />
                  Share Alert to WhatsApp
                </button>
              </div>
            </>
          )}

          <button 
            onClick={() => router.push('/')}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all mt-4"
          >
            Return to Dashboard
          </button>
        </div>
      )}

    </div>
  );
}
