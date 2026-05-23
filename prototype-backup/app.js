// RAKSHA.APP — Kerala Flood & Landslide Reporting Platform Simulator
// Core Application Logic

// ----------------------------------------------------
// State Management
// ----------------------------------------------------
const state = {
  isOnline: true,
  language: 'EN', // 'EN' or 'ML' (Malayalam)
  aiMode: 'success', // 'success', 'spam', 'low-confidence'
  activeScreen: 'view-dashboard', // dashboard, report-form, pipeline, success, subscribe
  reportFormStep: 1,
  showSafeRoutes: false,
  
  // Data State
  incidents: [
    {
      id: '1',
      type: 'landslide',
      severity: 'critical',
      lat: 11.602,
      lng: 76.083,
      district: 'Wayanad',
      village: 'Mundakkai',
      description: 'Massive landslide blocking main valley access road. Debris cleaning required.',
      ai_verified: true,
      ai_confidence: 0.94,
      ai_score: 9.4,
      report_count: 5,
      created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: '2',
      type: 'flood',
      severity: 'medium',
      lat: 9.931,
      lng: 76.267,
      district: 'Ernakulam',
      village: 'Kochi Town',
      description: 'Water logging up to knee level on roads. Vehicles stranded.',
      ai_verified: true,
      ai_confidence: 0.88,
      ai_score: 7.2,
      report_count: 2,
      created_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    },
    {
      id: '3',
      type: 'roadblock',
      severity: 'high',
      lat: 10.527,
      lng: 76.214,
      district: 'Thrissur',
      village: 'Chalakudy',
      description: 'Fallen tree blocking both lanes on NH-544. Police directing traffic.',
      ai_verified: true,
      ai_confidence: 0.91,
      ai_score: 8.5,
      report_count: 1,
      created_at: new Date(Date.now() - 10800000).toISOString() // 3 hours ago
    }
  ],
  
  // Offline report queue (simulate IndexedDB)
  offlineQueue: [],
  
  // Current Form state
  currentReport: {
    type: 'flood',
    lat: 11.605,
    lng: 76.088,
    district: 'Wayanad',
    photoUploaded: false,
    photoDataUrl: '',
    description: ''
  },
  
  // App stats
  stats: {
    reports: 14,
    verified: 92,
    subscribers: 1420
  }
};

// ----------------------------------------------------
// Translations (Malayalam support)
// ----------------------------------------------------
const translations = {
  EN: {
    lbl_stat_reports: "Reports",
    lbl_stat_verified: "AI Verified",
    lbl_stat_subs: "Alert Subs",
    lbl_btn_report: "Report Incident",
    lbl_btn_subscribe: "Get Alerts",
    lbl_recent_incidents: "Recent Incidents",
    lbl_active_count: "Active",
    lbl_wizard_step1_title: "Select Incident Type",
    lbl_type_flood: "Flood",
    lbl_type_landslide: "Landslide",
    lbl_type_roadblock: "Road Block",
    lbl_type_rescue: "Rescue Needed",
    lbl_wizard_step2_title: "Confirm Location",
    lbl_district: "District / Region",
    lbl_wizard_step3_title: "Upload Photo & Details",
    lbl_upload_instruction: "Tap to simulate photo upload<br><span style='font-size: 0.6rem; color: var(--text-muted);'>Supports automatic 2G compression</span>",
    lbl_description: "Description",
    lbl_pipeline_title: "Processing Report",
    lbl_pipe_save: "Saving to Supabase Database",
    lbl_pipe_ai: "Claude AI Image Validation",
    lbl_pipe_cluster: "Clustering Engine Check",
    lbl_pipe_alert: "Alert Dispatch Engine",
    desc_pipe_save: "Storing incident type and GPS coordinates",
    desc_pipe_ai: "Analyzing photo metadata & assessing severity",
    desc_pipe_cluster: "Grouping with surrounding local reports",
    desc_pipe_alert: "Triggering push messages, SMS, and WhatsApp",
    lbl_success_title: "Report Submitted",
    lbl_success_desc: "Thank you for your report. Your data helps protect communities in Kerala.",
    lbl_share_whatsapp_title: "Help Broadcast Warnings",
    lbl_whatsapp_btn_txt: "Share to WhatsApp",
    lbl_sub_title: "Kerala District Alert Network",
    lbl_sub_desc: "Subscribe to receive instant push alerts and Twilio SMS fallbacks for monsoon emergencies in your area.",
    lbl_sub_benefit1: "Severe weather & landslide risk forecasts",
    lbl_sub_benefit2: "FCM notification overlay during cell network drops",
    lbl_sub_benefit3: "SMS broadcast fallback for non-smartphone users",
    lbl_sub_district: "Select District",
    lbl_sub_phone: "Phone Number (SMS Fallback)",
    lbl_nav_home: "Home",
    lbl_nav_report: "Report",
    lbl_nav_alerts: "Alerts",
    lbl_safe_route_active: "Safe Route Active",
    lbl_safe_route_inactive: "Safe Route: Inactive"
  },
  ML: {
    lbl_stat_reports: "റിപ്പോർട്ടുകൾ",
    lbl_stat_verified: "എഐ സ്ഥിരീകരിച്ചു",
    lbl_stat_subs: "വരിക്കാർ",
    lbl_btn_report: "വിവരം അറിയിക്കുക",
    lbl_btn_subscribe: "അലർട്ടുകൾ ലഭിക്കാൻ",
    lbl_recent_incidents: "സമീപകാല സംഭവങ്ങൾ",
    lbl_active_count: "സജീവം",
    lbl_wizard_step1_title: "ദുരന്ത തരം തിരഞ്ഞെടുക്കുക",
    lbl_type_flood: "വെള്ളപ്പൊക്കം",
    lbl_type_landslide: "മണ്ണിടിച്ചിൽ",
    lbl_type_roadblock: "റോഡ് തടസ്സം",
    lbl_type_rescue: "രക്ഷാപ്രവർത്തനം ആവശ്യമുണ്ട്",
    lbl_wizard_step2_title: "സ്ഥലം സ്ഥിരീകരിക്കുക",
    lbl_district: "ജില്ല / പ്രദേശം",
    lbl_wizard_step3_title: "ഫോട്ടോയും വിശദാംശങ്ങളും",
    lbl_upload_instruction: "ഫോട്ടോ സിമുലേറ്റ് ചെയ്യാൻ അമർത്തുക<br><span style='font-size: 0.6rem; color: var(--text-muted);'>2G നെറ്റ്വർക്കിൽ കംപ്രസ് ചെയ്യപ്പെടുന്നു</span>",
    lbl_description: "വിശദാംശങ്ങൾ",
    lbl_pipeline_title: "റിപ്പോർട്ട് പ്രോസസ്സ് ചെയ്യുന്നു",
    lbl_pipe_save: "സുപബേസ് ഡാറ്റാബേസ് സംരക്ഷിക്കുന്നു",
    lbl_pipe_ai: "ക്ലോഡ് എഐ ഫോട്ടോ പരിശോധന",
    lbl_pipe_cluster: "റിപ്പോർട്ട് ക്ലസ്റ്ററിംഗ്",
    lbl_pipe_alert: "അലർട്ട് വിതരണ സിസ്റ്റം",
    desc_pipe_save: "ദുരന്ത തരവും ജിപിഎസ് സ്ഥാനവും രേഖപ്പെടുത്തുന്നു",
    desc_pipe_ai: "ചിത്ര വിശകലനവും തീവ്രത നിർണ്ണയിക്കലും",
    desc_pipe_cluster: "സമീപ റിപ്പോർട്ടുകളുമായി ഗ്രൂപ്പ് ചെയ്യുന്നു",
    desc_pipe_alert: "പുഷ് സന്ദേശങ്ങളും എസ്എംഎസും അയക്കുന്നു",
    lbl_success_title: "റിപ്പോർട്ട് സമർപ്പിച്ചു",
    lbl_success_desc: "റിപ്പോർട്ട് ചെയ്തതിന് നന്ദി. നിങ്ങളുടെ വിവരങ്ങൾ കേരളത്തിലെ ജനങ്ങളെ സംരക്ഷിക്കാൻ സഹായിക്കും.",
    lbl_share_whatsapp_title: "മുന്നറിയിപ്പുകൾ പ്രചരിപ്പിക്കുക",
    lbl_whatsapp_btn_txt: "വാട്സാപ്പിൽ പങ്കുവെക്കുക",
    lbl_sub_title: "കേരള ജില്ലാ അലർട്ട് നെറ്റ്‌വർക്ക്",
    lbl_sub_desc: "നിങ്ങളുടെ പ്രദേശത്തെ അടിയന്തിര സാഹചര്യങ്ങളിൽ തൽക്ഷണ പുഷ് അലർട്ടുകളും എസ്എംഎസും ലഭിക്കുന്നതിന് സബ്സ്ക്രൈബ് ചെയ്യുക.",
    lbl_sub_benefit1: "കനത്ത മഴ, മണ്ണിടിച്ചിൽ മുന്നറിയിപ്പുകൾ",
    lbl_sub_benefit2: "കുറഞ്ഞ കണക്റ്റിവിറ്റിയിലും പുഷ് നോട്ടിഫിക്കേഷൻ",
    lbl_sub_benefit3: "സ്മാർട്ട്ഫോൺ ഇല്ലാത്തവർക്ക് എസ്എംഎസ് അലർട്ട്",
    lbl_sub_district: "ജില്ല തിരഞ്ഞെടുക്കുക",
    lbl_sub_phone: "ഫോൺ നമ്പർ (SMS ബാക്കപ്പ്)",
    lbl_nav_home: "ഹോം",
    lbl_nav_report: "റിപ്പോർട്ട്",
    lbl_nav_alerts: "അലർട്ടുകൾ",
    lbl_safe_route_active: "സുരക്ഷിത പാത സജീവം",
    lbl_safe_route_inactive: "സുരക്ഷിത പാത: സജീവം അല്ല"
  }
};

// ----------------------------------------------------
// UI Bindings & DOM Elements
// ----------------------------------------------------
const el = {
  // Global simulation inputs
  networkSwitch: document.getElementById('network-switch'),
  networkStatusLabel: document.getElementById('network-status-label'),
  aiModeSelect: document.getElementById('ai-mode-select'),
  btnReset: document.getElementById('btn-reset'),
  
  // Flow diagram Nodes
  nodeHome: document.getElementById('node-home'),
  nodeReportBtn: document.getElementById('node-report-btn'),
  nodeSelectType: document.getElementById('node-select-type'),
  nodeLocation: document.getElementById('node-location'),
  nodeDetails: document.getElementById('node-details'),
  nodeOfflineQueue: document.getElementById('node-offline-queue'),
  nodeSupabaseDb: document.getElementById('node-supabase-db'),
  nodeClaudeApi: document.getElementById('node-claude-api'),
  nodeClustering: document.getElementById('node-clustering'),
  nodeFcmAlert: document.getElementById('node-fcm-alert'),
  nodeSmsTwilio: document.getElementById('node-sms-twilio'),
  nodeWhatsappShare: document.getElementById('node-whatsapp-share'),
  nodeWebhook: document.getElementById('node-webhook'),
  
  // Simulator structures
  phoneTime: document.getElementById('phone-time'),
  phoneNetworkIcon: document.getElementById('phone-network-icon'),
  pushNotification: document.getElementById('push-notification'),
  pushTimeVal: document.getElementById('push-time-val'),
  pushTitleVal: document.getElementById('push-title-val'),
  pushBodyVal: document.getElementById('push-body-val'),
  btnLangToggle: document.getElementById('btn-lang-toggle'),
  offlineBanner: document.getElementById('offline-banner'),
  appToast: document.getElementById('app-toast'),
  
  // App views
  viewDashboard: document.getElementById('view-dashboard'),
  viewReportForm: document.getElementById('view-report-form'),
  viewPipeline: document.getElementById('view-pipeline'),
  viewSuccess: document.getElementById('view-success'),
  viewSubscribe: document.getElementById('view-subscribe'),
  
  // Tab indicators
  tabHome: document.getElementById('nav-tab-home'),
  tabReport: document.getElementById('nav-tab-report'),
  tabAlerts: document.getElementById('nav-tab-alerts'),
  
  // Dashboard view specific
  mapContainer: document.getElementById('map-container'),
  mapVectorSvg: document.getElementById('map-vector-svg'),
  incidentsFeedList: document.getElementById('incidents-feed-list'),
  btnDashboardReport: document.getElementById('btn-dashboard-report'),
  btnDashboardSubscribe: document.getElementById('btn-dashboard-subscribe'),
  valStatReports: document.getElementById('val-stat-reports'),
  valStatVerified: document.getElementById('val-stat-verified'),
  valStatSubs: document.getElementById('val-stat-subs'),
  btnSafeRouteToggle: document.getElementById('btn-safe-route-toggle'),
  vectorSafeRoute: document.getElementById('vector-safe-route'),
  lblSafeRouteStatus: document.getElementById('lbl-safe-route-status'),
  
  // Report wizard specific
  stepDot1: document.getElementById('step-dot-1'),
  stepDot2: document.getElementById('step-dot-2'),
  stepDot3: document.getElementById('step-dot-3'),
  wizardStep1: document.getElementById('wizard-step-1'),
  wizardStep2: document.getElementById('wizard-step-2'),
  wizardStep3: document.getElementById('wizard-step-3'),
  btnFormBack: document.getElementById('btn-form-back'),
  btnFormNext: document.getElementById('btn-form-next'),
  btnSimulateUpload: document.getElementById('btn-simulate-upload'),
  uploadPreview: document.getElementById('upload-preview'),
  lblUploadInstruction: document.getElementById('lbl-upload-instruction'),
  compressStatus: document.getElementById('compress-status'),
  pickerMap: document.getElementById('picker-map'),
  gpsCoordsText: document.getElementById('gps-coords'),
  btnGpsAuto: document.getElementById('btn-gps-auto'),
  inputDistrict: document.getElementById('input-district'),
  inputDesc: document.getElementById('input-desc'),
  
  // Pipeline loader specific
  pipeStep1: document.getElementById('pipe-step-1'),
  pipeStep2: document.getElementById('pipe-step-2'),
  pipeStep3: document.getElementById('pipe-step-3'),
  pipeStep4: document.getElementById('pipe-step-4'),
  
  // Success view specific
  btnWhatsappShareTrigger: document.getElementById('btn-whatsapp-share-trigger'),
  btnSuccessDone: document.getElementById('btn-success-done'),
  successIcon: document.getElementById('success-icon'),
  
  // Subscribe view specific
  selectSubDistrict: document.getElementById('select-sub-district'),
  inputSubPhone: document.getElementById('input-sub-phone'),
  btnSubscribeTrigger: document.getElementById('btn-subscribe-trigger'),
  btnSubscribeBack: document.getElementById('btn-subscribe-back'),
  
  // Flow SVG connection canvas
  flowSvg: document.getElementById('flow-svg')
};

// Node relations for flow connection drawing
const flowConnections = [
  { start: 'node-home', end: 'node-report-btn' },
  { start: 'node-report-btn', end: 'node-select-type' },
  { start: 'node-select-type', end: 'node-location' },
  { start: 'node-location', end: 'node-details' },
  { start: 'node-details', end: 'node-supabase-db', condition: () => state.isOnline },
  { start: 'node-details', end: 'node-offline-queue', condition: () => !state.isOnline },
  { start: 'node-offline-queue', end: 'node-supabase-db' },
  { start: 'node-supabase-db', end: 'node-claude-api' },
  { start: 'node-claude-api', end: 'node-clustering' },
  { start: 'node-clustering', end: 'node-fcm-alert', condition: () => state.aiMode !== 'spam' },
  { start: 'node-clustering', end: 'node-sms-twilio', condition: () => state.aiMode !== 'spam' },
  { start: 'node-clustering', end: 'node-whatsapp-share', condition: () => state.aiMode !== 'spam' },
  { start: 'node-clustering', end: 'node-webhook', condition: () => state.aiMode === 'success' }
];

// ----------------------------------------------------
// Setup & Initializers
// ----------------------------------------------------
function init() {
  updateTime();
  setInterval(updateTime, 60000);
  
  setupLanguages();
  setupEventListeners();
  renderIncidents();
  renderMap();
  
  // Wait short delay to compute flow line layout once elements are rendered
  setTimeout(drawConnections, 300);
  window.addEventListener('resize', drawConnections);
  
  // Add scroll handler to recalculate lines when nodes scroll
  document.getElementById('diagram-container').addEventListener('scroll', drawConnections);
}

function updateTime() {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  minutes = minutes < 10 ? '0' + minutes : minutes;
  el.phoneTime.textContent = `${hours}:${minutes}`;
}

// ----------------------------------------------------
// Flow Diagram SVG Rendering Engine
// ----------------------------------------------------
function drawConnections() {
  const container = document.getElementById('diagram-container');
  const containerRect = container.getBoundingClientRect();
  
  // Set SVG size to match the scrollable content area size
  el.flowSvg.style.width = container.scrollWidth + 'px';
  el.flowSvg.style.height = container.scrollHeight + 'px';
  
  // Remove outdated dynamically generated paths
  const oldPaths = el.flowSvg.querySelectorAll('.dynamic-line');
  oldPaths.forEach(p => p.remove());

  flowConnections.forEach(conn => {
    const startNode = document.getElementById(conn.start);
    const endNode = document.getElementById(conn.end);
    
    if (!startNode || !endNode) return;
    
    const startRect = startNode.getBoundingClientRect();
    const endRect = endNode.getBoundingClientRect();
    
    // Check if the connection condition is satisfied
    let isPathActive = false;
    if (startNode.classList.contains('active') && endNode.classList.contains('active')) {
      isPathActive = true;
    } else if (startNode.classList.contains('completed') && (endNode.classList.contains('active') || endNode.classList.contains('completed'))) {
      isPathActive = true;
    }
    
    // Calculate coordinates relative to the scrollable diagram container
    const x1 = (startRect.left + startRect.width / 2) - containerRect.left + container.scrollLeft;
    const y1 = startRect.bottom - containerRect.top + container.scrollTop;
    
    const x2 = (endRect.left + endRect.width / 2) - containerRect.left + container.scrollLeft;
    const y2 = endRect.top - containerRect.top + container.scrollTop;
    
    // Create connection path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', `dynamic-line connection-line ${isPathActive ? 'active' : ''}`);
    
    // Smooth bezier curve joining the nodes downwards
    const midY = (y1 + y2) / 2;
    const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
    path.setAttribute('d', pathD);
    path.setAttribute('marker-end', isPathActive ? 'url(#arrow)' : 'url(#arrow-inactive)');
    
    el.flowSvg.appendChild(path);
  });
}

function setActiveNode(nodeId) {
  const node = document.getElementById(nodeId);
  if (node) {
    node.classList.add('active');
    node.classList.remove('completed');
  }
  drawConnections();
}

function setCompletedNode(nodeId) {
  const node = document.getElementById(nodeId);
  if (node) {
    node.classList.add('completed');
    node.classList.remove('active');
  }
  drawConnections();
}

function clearAllNodes() {
  const nodes = document.querySelectorAll('.flow-node');
  nodes.forEach(n => {
    n.classList.remove('active', 'completed');
  });
  // Re-activate home node
  el.nodeHome.classList.add('active');
  drawConnections();
}

// ----------------------------------------------------
// UI Localization Functions
// ----------------------------------------------------
function setupLanguages() {
  el.btnLangToggle.addEventListener('click', () => {
    state.language = state.language === 'EN' ? 'ML' : 'EN';
    el.btnLangToggle.textContent = state.language === 'EN' ? 'മലയാളം' : 'English';
    updateLocalizedTexts();
  });
  updateLocalizedTexts();
}

function updateLocalizedTexts() {
  const dict = translations[state.language];
  for (const key in dict) {
    const element = document.getElementById(key);
    if (element) {
      // If it contains html tags, use innerHTML, otherwise textContent
      if (dict[key].includes('<')) {
        element.innerHTML = dict[key];
      } else {
        element.textContent = dict[key];
      }
    }
  }
  
  // Custom localization handling for input placeholders
  if (state.language === 'EN') {
    el.inputDesc.placeholder = "Details (e.g. Rising water level, road blocked by boulder)";
    el.inputSubPhone.placeholder = "+91 XXXXX XXXXX";
  } else {
    el.inputDesc.placeholder = "വിവരങ്ങൾ രേഖപ്പെടുത്തുക (ഉദാ: ജലനിരപ്പ് ഉയരുന്നു, റോഡ് തടസ്സപ്പെട്ടു)";
    el.inputSubPhone.placeholder = "+91 XXXXX XXXXX";
  }
  
  renderIncidents();
  updateSafeRoutesUI();
}

// ----------------------------------------------------
// Event Listeners Configuration
// ----------------------------------------------------
function setupEventListeners() {
  // Global Simulation Controls
  el.networkSwitch.addEventListener('change', (e) => {
    state.isOnline = e.target.checked;
    el.networkStatusLabel.textContent = state.isOnline ? 'Online' : 'Offline';
    el.networkStatusLabel.style.color = state.isOnline ? 'var(--color-success)' : 'var(--color-landslide)';
    
    // Sync simulator phone view state
    if (state.isOnline) {
      el.phoneNetworkIcon.innerHTML = '<i class="bi bi-wifi"></i>';
      el.offlineBanner.classList.remove('active');
      triggerSyncOfflineQueue();
    } else {
      el.phoneNetworkIcon.innerHTML = '<i class="bi bi-cloud-slash-fill"></i>';
      el.offlineBanner.classList.add('active');
      showToast("Switched to Offline Mode", true);
    }
    
    // Draw flows
    updateNodeHighlights();
  });
  
  el.aiModeSelect.addEventListener('change', (e) => {
    state.aiMode = e.target.value;
  });
  
  el.btnReset.addEventListener('click', () => {
    resetSimulation();
  });
  
  // Flow Node Clicks (makes diagram interactive)
  document.querySelectorAll('.flow-node').forEach(node => {
    node.addEventListener('click', () => {
      const targetScreen = node.getAttribute('data-target');
      if (targetScreen) {
        switchScreen(`view-${targetScreen}`);
      }
    });
  });

  // App Tabs Navigation
  el.tabHome.addEventListener('click', () => {
    if (state.activeScreen !== 'view-pipeline') switchScreen('view-dashboard');
  });
  el.tabReport.addEventListener('click', () => {
    if (state.activeScreen !== 'view-pipeline') startReportFlow();
  });
  el.tabAlerts.addEventListener('click', () => {
    if (state.activeScreen !== 'view-pipeline') switchScreen('view-subscribe');
  });

  // Dashboard buttons
  el.btnDashboardReport.addEventListener('click', startReportFlow);
  el.btnDashboardSubscribe.addEventListener('click', () => switchScreen('view-subscribe'));
  
  // Subscriptions flow trigger
  el.btnSubscribeTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    const phone = el.inputSubPhone.value.trim();
    if (!phone) {
      showToast(state.language === 'EN' ? "Enter a valid phone number" : "കൃത്യമായ ഫോൺ നമ്പർ നൽകുക", true);
      return;
    }
    
    showToast(state.language === 'EN' ? "Subscribed Successfully!" : "സബ്സ്ക്രൈബ് വിജയകരമായി പൂർത്തിയായി!", false);
    
    // Update subscriber stats
    state.stats.subscribers += 1;
    el.valStatSubs.textContent = state.stats.subscribers.toLocaleString();
    
    // Highlighting subscription alert nodes in diagram
    setActiveNode('node-fcm-alert');
    setActiveNode('node-sms-twilio');
    setTimeout(() => {
      setCompletedNode('node-fcm-alert');
      setCompletedNode('node-sms-twilio');
      switchScreen('view-dashboard');
    }, 2000);
  });
  el.btnSubscribeBack.addEventListener('click', () => switchScreen('view-dashboard'));
  
  // Report Form Steps Navigation
  el.btnFormBack.addEventListener('click', () => {
    if (state.reportFormStep > 1) {
      state.reportFormStep--;
      renderReportWizardStep();
    } else {
      switchScreen('view-dashboard');
    }
  });

  el.btnFormNext.addEventListener('click', () => {
    if (state.reportFormStep < 3) {
      state.reportFormStep++;
      renderReportWizardStep();
    } else {
      submitReport();
    }
  });

  // Simulator Type Selection cards
  document.querySelectorAll('.type-option-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.type-option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.currentReport.type = card.getAttribute('data-type');
      
      // Auto pre-populate photo upload status based on type
      resetPhotoUploadSim();
    });
  });

  // simulated photo upload
  el.btnSimulateUpload.addEventListener('click', simulatePhotoSelection);

  // Success flow buttons
  el.btnSuccessDone.addEventListener('click', () => {
    switchScreen('view-dashboard');
  });

  el.btnWhatsappShareTrigger.addEventListener('click', triggerWhatsAppShare);

  // Map coordinate drag simulated click
  el.pickerMap.addEventListener('click', (e) => {
    const rect = el.pickerMap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Map relative values back to mock Wayanad coordinates
    const scaleLat = 11.55 + (y / rect.height) * 0.12;
    const scaleLng = 75.95 + (x / rect.width) * 0.2;
    
    state.currentReport.lat = parseFloat(scaleLat.toFixed(3));
    state.currentReport.lng = parseFloat(scaleLng.toFixed(3));
    
    el.gpsCoordsText.textContent = `Lat: ${state.currentReport.lat}, Lng: ${state.currentReport.lng}`;
    
    // Create animated point flash
    const point = document.createElement('div');
    point.style.position = 'absolute';
    point.style.width = '20px';
    point.style.height = '20px';
    point.style.border = '2px solid var(--node-active-border)';
    point.style.borderRadius = '50%';
    point.style.left = `${x}px`;
    point.style.top = `${y}px`;
    point.style.transform = 'translate(-50%, -50%)';
    point.style.pointerEvents = 'none';
    point.style.animation = 'pinPulse 1s ease-out forwards';
    el.pickerMap.appendChild(point);
    setTimeout(() => point.remove(), 1000);
  });
  
  el.btnGpsAuto.addEventListener('click', () => {
    state.currentReport.lat = 11.605;
    state.currentReport.lng = 76.088;
    el.gpsCoordsText.textContent = `Lat: ${state.currentReport.lat}, Lng: ${state.currentReport.lng}`;
    showToast(state.language === 'EN' ? "GPS Coordinates Refreshed" : "ജിപിഎസ് വിവരങ്ങൾ പുതുക്കി", false);
  });
  
  el.btnSafeRouteToggle.addEventListener('click', () => {
    toggleSafeRoutes();
  });
}

// ----------------------------------------------------
// Simulator Router / View Switcher
// ----------------------------------------------------
function switchScreen(screenId) {
  state.activeScreen = screenId;
  
  // Hide all screens
  document.querySelectorAll('.app-screen-view').forEach(view => {
    view.classList.remove('active');
  });
  
  // Show target
  const activeView = document.getElementById(screenId);
  if (activeView) {
    activeView.classList.add('active');
  }
  
  // Update Bottom Nav Highlighting
  el.tabHome.classList.remove('active');
  el.tabReport.classList.remove('active');
  el.tabAlerts.classList.remove('active');
  
  if (screenId === 'view-dashboard') {
    el.tabHome.classList.add('active');
  } else if (screenId === 'view-report-form') {
    el.tabReport.classList.add('active');
  } else if (screenId === 'view-subscribe') {
    el.tabAlerts.classList.add('active');
  }
  
  updateNodeHighlights();
}

function updateNodeHighlights() {
  clearAllNodes();
  
  if (state.activeScreen === 'view-dashboard') {
    setActiveNode('node-home');
  } else if (state.activeScreen === 'view-report-form') {
    setCompletedNode('node-home');
    setActiveNode('node-report-btn');
    
    if (state.reportFormStep === 1) {
      setActiveNode('node-select-type');
    } else if (state.reportFormStep === 2) {
      setCompletedNode('node-select-type');
      setActiveNode('node-location');
    } else if (state.reportFormStep === 3) {
      setCompletedNode('node-select-type');
      setCompletedNode('node-location');
      setActiveNode('node-details');
    }
  } else if (state.activeScreen === 'view-pipeline') {
    setCompletedNode('node-home');
    setCompletedNode('node-report-btn');
    setCompletedNode('node-select-type');
    setCompletedNode('node-location');
    setCompletedNode('node-details');
    
    if (state.isOnline) {
      setActiveNode('node-supabase-db');
    } else {
      setActiveNode('node-offline-queue');
    }
  } else if (state.activeScreen === 'view-success') {
    setCompletedNode('node-home');
    setCompletedNode('node-report-btn');
    setCompletedNode('node-select-type');
    setCompletedNode('node-location');
    setCompletedNode('node-details');
    
    if (state.isOnline) {
      setCompletedNode('node-supabase-db');
      setCompletedNode('node-claude-api');
      setCompletedNode('node-clustering');
      
      if (state.aiMode !== 'spam') {
        setActiveNode('node-fcm-alert');
        setActiveNode('node-sms-twilio');
        setActiveNode('node-whatsapp-share');
        if (state.aiMode === 'success') {
          setActiveNode('node-webhook');
        }
      }
    } else {
      setCompletedNode('node-offline-queue');
    }
  } else if (state.activeScreen === 'view-subscribe') {
    setCompletedNode('node-home');
  }
}

// ----------------------------------------------------
// Form Wizard Reporting Engine
// ----------------------------------------------------
function startReportFlow() {
  state.reportFormStep = 1;
  state.currentReport.description = '';
  el.inputDesc.value = '';
  
  // Default coordinate set
  state.currentReport.lat = 11.605;
  state.currentReport.lng = 76.088;
  el.gpsCoordsText.textContent = `Lat: 11.605, Lng: 76.088`;
  
  resetPhotoUploadSim();
  renderReportWizardStep();
  switchScreen('view-report-form');
}

function renderReportWizardStep() {
  // Reset steps active styling
  el.stepDot1.className = 'form-step-dot';
  el.stepDot2.className = 'form-step-dot';
  el.stepDot3.className = 'form-step-dot';
  
  el.wizardStep1.classList.remove('active');
  el.wizardStep2.classList.remove('active');
  el.wizardStep3.classList.remove('active');
  
  if (state.reportFormStep === 1) {
    el.stepDot1.classList.add('active');
    el.wizardStep1.classList.add('active');
    el.btnFormBack.textContent = 'Cancel';
    el.btnFormNext.textContent = 'Next';
  } else if (state.reportFormStep === 2) {
    el.stepDot1.classList.add('completed');
    el.stepDot2.classList.add('active');
    el.wizardStep2.classList.add('active');
    el.btnFormBack.textContent = 'Back';
    el.btnFormNext.textContent = 'Next';
  } else if (state.reportFormStep === 3) {
    el.stepDot1.classList.add('completed');
    el.stepDot2.classList.add('completed');
    el.stepDot3.classList.add('active');
    el.wizardStep3.classList.add('active');
    el.btnFormBack.textContent = 'Back';
    
    // Change button text to "Submit" or "Queue Offline" based on network status
    el.btnFormNext.textContent = state.isOnline ? 'Submit' : 'Queue Offline';
  }
  
  updateNodeHighlights();
}

function resetPhotoUploadSim() {
  state.currentReport.photoUploaded = false;
  state.currentReport.photoDataUrl = '';
  el.uploadPreview.style.display = 'none';
  el.lblUploadInstruction.style.display = 'block';
  el.compressStatus.style.display = 'none';
}

function simulatePhotoSelection() {
  el.lblUploadInstruction.innerHTML = '<i class="bi bi-hourglass-split"></i> Compressing Image (2.4MB)...';
  
  // Simulate 2G Network Latency compression (1.2 seconds)
  setTimeout(() => {
    state.currentReport.photoUploaded = true;
    
    // Set mock picture depending on chosen type
    if (state.currentReport.type === 'flood') {
      state.currentReport.photoDataUrl = 'flood_report_mock.png';
    } else {
      state.currentReport.photoDataUrl = 'landslide_report_mock.png';
    }
    
    el.uploadPreview.src = state.currentReport.photoDataUrl;
    el.uploadPreview.style.display = 'block';
    el.lblUploadInstruction.style.display = 'none';
    
    el.compressStatus.textContent = "Compressed: 2.4MB → 178KB";
    el.compressStatus.style.display = 'block';
  }, 1000);
}

// ----------------------------------------------------
// Pipeline & Submission Core Logic
// ----------------------------------------------------
function submitReport() {
  state.currentReport.description = el.inputDesc.value.trim();
  switchScreen('view-pipeline');
  
  // Reset pipeline UI loader states
  const timelineSteps = [el.pipeStep1, el.pipeStep2, el.pipeStep3, el.pipeStep4];
  timelineSteps.forEach(step => step.className = 'pipeline-step-item');
  
  if (state.isOnline) {
    runOnlinePipeline();
  } else {
    runOfflineQueuePipeline();
  }
}

// Online path
function runOnlinePipeline() {
  // Step 1: Save to Supabase (1s)
  el.pipeStep1.classList.add('active');
  setActiveNode('node-supabase-db');
  
  setTimeout(() => {
    el.pipeStep1.className = 'pipeline-step-item completed';
    setCompletedNode('node-supabase-db');
    
    // Step 2: Claude AI verification (1.5s)
    el.pipeStep2.classList.add('active');
    setActiveNode('node-claude-api');
    
    setTimeout(() => {
      // Apply mock validation outcome
      const statusText = document.getElementById('desc-pipe-ai');
      if (state.aiMode === 'spam') {
        statusText.innerHTML = '<span style="color: var(--color-landslide); font-weight: bold;">Flagged: Fake/Spam Photo</span>';
        el.pipeStep2.className = 'pipeline-step-item completed';
        setCompletedNode('node-claude-api');
        
        // Interrupt pipeline: go straight to success but flag the incident
        setTimeout(() => {
          showToast("AI flagged image: report suppressed", true);
          
          // Show flagged success layout
          el.successIcon.innerHTML = '<i class="bi bi-x-circle-fill"></i>';
          el.successIcon.style.color = 'var(--color-landslide)';
          el.successIcon.style.borderColor = 'var(--color-landslide)';
          document.getElementById('lbl-success-title').textContent = "Report Flagged by AI";
          document.getElementById('lbl-success-desc').textContent = "Claude API identified this photo as pre-existing or stock imagery. The report has been flagged and hidden from public mapping to prevent spam.";
          el.btnWhatsappShareTrigger.style.display = 'none';
          
          switchScreen('view-success');
        }, 1000);
        return;
      } else if (state.aiMode === 'low-confidence') {
        statusText.innerHTML = '<span style="color: var(--color-warning); font-weight: bold;">Verified: Low Confidence Duplicate</span>';
      } else {
        statusText.innerHTML = '<span style="color: var(--color-success); font-weight: bold;">Verified: Real Emergency! Confidence 95%</span>';
      }
      
      el.pipeStep2.className = 'pipeline-step-item completed';
      setCompletedNode('node-claude-api');
      
      // Step 3: Clustering Engine (1s)
      el.pipeStep3.classList.add('active');
      setActiveNode('node-clustering');
      
      setTimeout(() => {
        el.pipeStep3.className = 'pipeline-step-item completed';
        setCompletedNode('node-clustering');
        
        // Add new incident to dataset
        const newIncident = {
          id: String(state.incidents.length + 1),
          type: state.currentReport.type,
          severity: state.aiMode === 'low-confidence' ? 'low' : 'critical',
          lat: state.currentReport.lat,
          lng: state.currentReport.lng,
          district: state.currentReport.district,
          village: 'Mundakkai East',
          description: state.currentReport.description || 'Reported on Wayanad local flood tracking channel.',
          ai_verified: true,
          ai_confidence: state.aiMode === 'low-confidence' ? 0.45 : 0.95,
          ai_score: state.aiMode === 'low-confidence' ? 4.5 : 9.5,
          report_count: 1,
          created_at: new Date().toISOString()
        };
        state.incidents.unshift(newIncident);
        
        // Increment report count statistics
        state.stats.reports += 1;
        el.valStatReports.textContent = state.stats.reports;
        
        renderIncidents();
        renderMap();
        
        // Step 4: Dispatch Alerts (1.2s)
        el.pipeStep4.classList.add('active');
        setActiveNode('node-fcm-alert');
        setActiveNode('node-sms-twilio');
        setActiveNode('node-whatsapp-share');
        if (state.aiMode === 'success') {
          setActiveNode('node-webhook');
        }
        
        setTimeout(() => {
          el.pipeStep4.className = 'pipeline-step-item completed';
          
          setCompletedNode('node-fcm-alert');
          setCompletedNode('node-sms-twilio');
          setCompletedNode('node-whatsapp-share');
          if (state.aiMode === 'success') {
            setCompletedNode('node-webhook');
          }
          
          // Trigger iOS simulator notification banner
          triggerAlertPush(newIncident);
          
          // Format Success screen content
          el.successIcon.innerHTML = '<i class="bi bi-check-lg"></i>';
          el.successIcon.style.color = 'var(--color-success)';
          el.successIcon.style.borderColor = 'var(--color-success)';
          document.getElementById('lbl-success-title').textContent = "Report Submitted Successfully";
          document.getElementById('lbl-success-desc').textContent = "Report processed by Claude AI and updated on the Live Map. Auto-generated WhatsApp warnings are prepared below.";
          el.btnWhatsappShareTrigger.style.display = 'flex';
          
          switchScreen('view-success');
        }, 1200);
        
      }, 1000);
      
    }, 1500);
    
  }, 1000);
}

// Offline path (cached in local state queue)
function runOfflineQueuePipeline() {
  el.pipeStep1.classList.add('active');
  setActiveNode('node-offline-queue');
  
  setTimeout(() => {
    el.pipeStep1.className = 'pipeline-step-item completed';
    setCompletedNode('node-offline-queue');
    
    // Save current report to offline queue
    state.offlineQueue.push({
      ...state.currentReport,
      description: state.currentReport.description || 'Offline Report'
    });
    
    showToast("Offline Report Queue Saved to IndexedDB");
    
    // Switch to success view showing offline success
    el.successIcon.innerHTML = '<i class="bi bi-cloud-arrow-down-fill"></i>';
    el.successIcon.style.color = 'var(--color-warning)';
    el.successIcon.style.borderColor = 'var(--color-warning)';
    document.getElementById('lbl-success-title').textContent = "Saved to Offline Queue";
    document.getElementById('lbl-success-desc').textContent = "Your network connection is unavailable. The report details have been securely cached in IndexedDB. They will auto-sync to the database as soon as you reconnect.";
    el.btnWhatsappShareTrigger.style.display = 'flex';
    
    switchScreen('view-success');
  }, 1200);
}

// Trigger background synchronization when reconnecting
function triggerSyncOfflineQueue() {
  if (state.offlineQueue.length === 0) return;
  
  showToast("Reconnected! Syncing offline reports...", false);
  
  // Highlight node sync
  setActiveNode('node-offline-queue');
  
  setTimeout(() => {
    setCompletedNode('node-offline-queue');
    
    // Flush queue sequentially
    while(state.offlineQueue.length > 0) {
      const qReport = state.offlineQueue.shift();
      
      // Save to server
      const newInc = {
        id: String(state.incidents.length + 1),
        type: qReport.type,
        severity: 'medium',
        lat: qReport.lat,
        lng: qReport.lng,
        district: qReport.district,
        village: 'Wayanad Sector',
        description: qReport.description + ' (Synced from Offline Cache)',
        ai_verified: true,
        ai_confidence: 0.85,
        ai_score: 8.5,
        report_count: 1,
        created_at: new Date().toISOString()
      };
      state.incidents.unshift(newInc);
    }
    
    state.stats.reports += 1;
    el.valStatReports.textContent = state.stats.reports;
    
    renderIncidents();
    renderMap();
    
    setActiveNode('node-supabase-db');
    setActiveNode('node-claude-api');
    setTimeout(() => {
      setCompletedNode('node-supabase-db');
      setCompletedNode('node-claude-api');
      showToast("Offline queue synchronized with database", false);
    }, 1500);
    
  }, 1000);
}

// ----------------------------------------------------
// Simulator Alerts & Sharing (FCM, SMS, WhatsApp)
// ----------------------------------------------------
function triggerAlertPush(incident) {
  const typeMap = {
    flood: state.language === 'EN' ? 'Flood Warning' : 'വെള്ളപ്പൊക്ക മുന്നറിയിപ്പ്',
    landslide: state.language === 'EN' ? 'Landslide Emergency' : 'മണ്ണിടിച്ചിൽ മുന്നറിയിപ്പ്',
    roadblock: state.language === 'EN' ? 'Road Block Alert' : 'യാത്രാ തടസ്സം',
    rescue: state.language === 'EN' ? 'Rescue Assistance Alert' : 'രക്ഷാപ്രവർത്തനം'
  };
  
  const textBody = state.language === 'EN' 
    ? `Critical alert in ${incident.district} (${incident.village}). Avoid dangerous roads. Safe route active.`
    : `ജാഗ്രത: ${incident.district} (${incident.village}) പ്രദേശത്ത് കനത്ത നാശനഷ്ടം. മലയോര യാത്രകൾ ഒഴിവാക്കുക.`;
  
  el.pushTitleVal.textContent = typeMap[incident.type];
  el.pushBodyVal.textContent = textBody;
  
  // Slide down notification banner
  el.pushNotification.classList.add('show');
  
  // Set notification audio feedback
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);
    
    // Play dual beep tone
    osc.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.08, context.currentTime);
    osc.start();
    osc.stop(context.currentTime + 0.15);
    
    setTimeout(() => {
      const osc2 = new (window.AudioContext || window.webkitAudioContext)().createOscillator();
      const gain2 = osc2.context.createGain();
      osc2.connect(gain2);
      gain2.connect(osc2.context.destination);
      osc2.frequency.setValueAtTime(880, osc2.context.currentTime);
      gain2.gain.setValueAtTime(0.08, osc2.context.currentTime);
      osc2.start();
      osc2.stop(osc2.context.currentTime + 0.15);
    }, 250);
  } catch (e) {
    console.log("Audio not supported or interaction deferred");
  }
  
  // Dismiss notification banner after 6 seconds
  setTimeout(() => {
    el.pushNotification.classList.remove('show');
  }, 6000);
}

function triggerWhatsAppShare() {
  const inc = state.incidents[0];
  const typeMap = {
    flood: "Flood (വെള്ളപ്പൊക്കം)",
    landslide: "Landslide (മണ്ണിടിച്ചിൽ)",
    roadblock: "Road Block (റോഡ് തടസ്സം)",
    rescue: "Rescue Needed (രക്ഷാപ്രവർത്തനം)"
  };
  
  const malayalamMsg = `⚠️ *രക്ഷാ അലർട്ട് (RAKSHA.APP)* ⚠️\n\nപ്രദേശം: ${inc.village}, ${inc.district}\nദുരന്ത തരം: ${typeMap[inc.type]}\nസമയം: ${new Date(inc.created_at).toLocaleTimeString()}\nവിശദാംശങ്ങൾ: ${inc.description}\n\nതത്സമയ വിവരങ്ങൾക്കും സുരക്ഷിത പാതകൾക്കുമായി സന്ദർശിക്കുക: https://raksha.app/incident/${inc.id}`;
  
  const encodedMsg = encodeURIComponent(malayalamMsg);
  
  // In simulation, trigger a mock window alert showing what would be sent
  alert(`WhatsApp API Share Triggered:\n\n${malayalamMsg}`);
  
  // Log event to flow visualizer
  setCompletedNode('node-whatsapp-share');
}

// ----------------------------------------------------
// Map and Incident Feeds rendering
// ----------------------------------------------------
function renderMap() {
  // Clear existing pins
  const pins = el.mapContainer.querySelectorAll('.map-pin');
  pins.forEach(p => p.remove());
  
  // Calculate marker offset distributions
  state.incidents.forEach(inc => {
    // Convert mock GPS coordinates to percentage layout inside 250px container
    // Mock Wayanad bbox: Lat [11.52, 11.65], Lng [75.90, 76.20]
    const mapY = 100 - ((inc.lat - 11.50) / 0.18) * 100;
    const mapX = ((inc.lng - 75.90) / 0.35) * 100;
    
    // Bounds check
    const clampedX = Math.max(10, Math.min(90, mapX));
    const clampedY = Math.max(10, Math.min(90, mapY));
    
    const pin = document.createElement('div');
    pin.className = `map-pin ${inc.type}`;
    pin.style.left = `${clampedX}%`;
    pin.style.top = `${clampedY}%`;
    pin.title = `${inc.type.toUpperCase()} in ${inc.district}`;
    
    // Handle click to inspect
    pin.addEventListener('click', () => {
      showToast(`${inc.type.toUpperCase()}: ${inc.description}`);
    });
    
    el.mapContainer.appendChild(pin);
  });
}

function renderIncidents() {
  el.incidentsFeedList.innerHTML = '';
  
  state.incidents.forEach(inc => {
    const typeLabel = translations[state.language][`lbl_type_${inc.type}`] || inc.type;
    const timeLabel = new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const card = document.createElement('div');
    card.className = 'incident-card';
    
    // Severity styling
    const verifyClass = inc.ai_verified ? 'verified' : 'unverified';
    const verifyText = inc.ai_verified 
      ? `✓ AI Confirmed (${Math.round(inc.ai_confidence * 100)}%)` 
      : `Unverified`;
      
    card.innerHTML = `
      <div class="incident-header">
        <span class="incident-type-tag ${inc.type}">${typeLabel}</span>
        <span class="incident-time">${timeLabel}</span>
      </div>
      <div class="incident-location">${inc.village || 'Kerala Region'}, ${inc.district}</div>
      <div class="incident-desc">${inc.description}</div>
      <div class="incident-footer">
        <span class="incident-badge-verified ${verifyClass}">${verifyText}</span>
        <button class="incident-share-btn" onclick="event.stopPropagation(); triggerWhatsAppShare();">
          <i class="bi bi-whatsapp"></i> Share
        </button>
      </div>
    `;
    
    el.incidentsFeedList.appendChild(card);
  });
}

// ----------------------------------------------------
// Safe Evacuation Routes Toggle Logic
// ----------------------------------------------------
function toggleSafeRoutes() {
  state.showSafeRoutes = !state.showSafeRoutes;
  updateSafeRoutesUI();
}

function updateSafeRoutesUI() {
  const isActive = state.showSafeRoutes;
  if (!el.btnSafeRouteToggle || !el.vectorSafeRoute || !el.lblSafeRouteStatus) return;
  
  el.btnSafeRouteToggle.classList.toggle('active', isActive);
  el.vectorSafeRoute.classList.toggle('active', isActive);
  
  const dict = translations[state.language];
  if (isActive) {
    el.lblSafeRouteStatus.textContent = dict.lbl_safe_route_active || "Safe Route Active";
    showToast(state.language === 'EN' ? "Safe Evacuation Routes Activated — All paths clear" : "സുരക്ഷിത പാതകൾ സജീവമാക്കി — ദുരന്തമേഖലകൾ ഒഴിവാക്കി", false);
  } else {
    el.lblSafeRouteStatus.textContent = dict.lbl_safe_route_inactive || "Safe Route: Inactive";
  }
}

// ----------------------------------------------------
// Utility Functions & Reset
// ----------------------------------------------------
function showToast(message, isError = false) {
  el.appToast.textContent = message;
  el.appToast.className = `interactive-overlay-toast ${isError ? 'error' : ''}`;
  el.appToast.style.display = 'block';
  
  setTimeout(() => {
    el.appToast.style.display = 'none';
  }, 3500);
}

function resetPhotoUploadSim() {
  state.currentReport.photoUploaded = false;
  state.currentReport.photoDataUrl = '';
  el.uploadPreview.style.display = 'none';
  el.lblUploadInstruction.style.display = 'block';
  el.compressStatus.style.display = 'none';
  
  // Prepopulate form if needed
  if (state.currentReport.type === 'flood') {
    el.inputDesc.value = "Water rising fast on residential lane near the river canal. Level is at 2 feet.";
  } else if (state.currentReport.type === 'landslide') {
    el.inputDesc.value = "Mudslide occurred blocking road near hair-pin curve. Large rocks sliding.";
  } else {
    el.inputDesc.value = "";
  }
}

function resetSimulation() {
  state.isOnline = true;
  state.language = 'EN';
  state.aiMode = 'success';
  state.reportFormStep = 1;
  state.offlineQueue = [];
  state.showSafeRoutes = false;
  
  el.networkSwitch.checked = true;
  el.networkStatusLabel.textContent = 'Online';
  el.networkStatusLabel.style.color = 'var(--color-success)';
  el.phoneNetworkIcon.innerHTML = '<i class="bi bi-wifi"></i>';
  el.offlineBanner.classList.remove('active');
  el.aiModeSelect.value = 'success';
  el.btnLangToggle.textContent = 'മലയാളം';
  
  // Revert incident dataset
  state.incidents = [
    {
      id: '1',
      type: 'landslide',
      severity: 'critical',
      lat: 11.602,
      lng: 76.083,
      district: 'Wayanad',
      village: 'Mundakkai',
      description: 'Massive landslide blocking main valley access road. Debris cleaning required.',
      ai_verified: true,
      ai_confidence: 0.94,
      ai_score: 9.4,
      report_count: 5,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '2',
      type: 'flood',
      severity: 'medium',
      lat: 9.931,
      lng: 76.267,
      district: 'Ernakulam',
      village: 'Kochi Town',
      description: 'Water logging up to knee level on roads. Vehicles stranded.',
      ai_verified: true,
      ai_confidence: 0.88,
      ai_score: 7.2,
      report_count: 2,
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: '3',
      type: 'roadblock',
      severity: 'high',
      lat: 10.527,
      lng: 76.214,
      district: 'Thrissur',
      village: 'Chalakudy',
      description: 'Fallen tree blocking both lanes on NH-544. Police directing traffic.',
      ai_verified: true,
      ai_confidence: 0.91,
      ai_score: 8.5,
      report_count: 1,
      created_at: new Date(Date.now() - 10800000).toISOString()
    }
  ];
  
  state.stats = {
    reports: 14,
    verified: 92,
    subscribers: 1420
  };
  
  el.valStatReports.textContent = state.stats.reports;
  el.valStatVerified.textContent = `${state.stats.verified}%`;
  el.valStatSubs.textContent = state.stats.subscribers.toLocaleString();
  
  showToast("Simulation Reset Complete");
  
  updateLocalizedTexts();
  switchScreen('view-dashboard');
}

// ----------------------------------------------------
// App Entry point execution
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', init);
window.triggerWhatsAppShare = triggerWhatsAppShare; // Expose globally for onclick events
