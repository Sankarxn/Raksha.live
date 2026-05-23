import { NextRequest, NextResponse } from 'next/server';
import { db, Report, Incident } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Helper to calculate distance between two coordinates in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'incidents') {
      const incidents = await db.getIncidents();
      const activeIncidents = incidents.filter(inc => inc.active !== false);
      const reports = await db.getReports();
      const subscriptions = await db.getSubscriptions();
      
      // Only count reports belonging to active incidents
      const activeReports = reports.filter(rep => {
        return activeIncidents.some(inc => 
          inc.type === rep.type && 
          getDistance(inc.lat, inc.lng, rep.lat, rep.lng) <= 500
        );
      });
      
      const totalReports = activeReports.length;
      const verifiedReports = activeIncidents.filter(inc => inc.confirmed).length; // Count community-confirmed incidents
      const totalSubscriptions = subscriptions.length;

      return NextResponse.json({ 
        success: true, 
        incidents: activeIncidents,
        stats: {
          reports: totalReports,
          verified: verifiedReports,
          subs: totalSubscriptions
        }
      });
    }

    const reports = await db.getReports();
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching reports/incidents:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// Helper to broadcast SMS alerts to matching district subscribers
async function broadcastSMSAlert(incident: Incident) {
  try {
    const subscriptions = await db.getSubscriptions();
    const district = incident.district;
    const type = incident.type;
    const village = incident.village || `${district} Sector`;
    
    const matchingSubs = subscriptions.filter(
      sub => sub.district.toLowerCase() === district.toLowerCase() && sub.phone
    );

    if (matchingSubs.length === 0) {
      console.log(`[SMS BROADCAST] No phone subscribers found for district: ${district}`);
      return;
    }

    const englishMsg = `[RAKSHA ALERT] Active ${type} reported in ${village}, ${district}. Avoid the area and stay safe!`;
    const malayalamMsg = `[രക്ഷാ അലേർട്ട്] ${district}-ലെ ${village}-ൽ ${type} റിപ്പോർട്ട് ചെയ്തിരിക്കുന്നു. ദയവായി ഈ പ്രദേശം ഒഴിവാക്കുക, സുരക്ഷിതരായിരിക്കുക!`;
    const fullMessage = `${englishMsg}\n${malayalamMsg}`;

    const broadcastRecords: any[] = [];

    for (const sub of matchingSubs) {
      const phoneNumber = sub.phone!;
      console.log(`[SMS DISPATCH] Sending alert to ${phoneNumber} in ${district}: "${englishMsg}"`);
      
      let status = 'sent (simulated)';
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        try {
          const twilio = require('twilio');
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.messages.create({
            body: fullMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
          });
          status = 'delivered';
        } catch (twilioErr) {
          console.error(`Twilio send failed for ${phoneNumber}:`, twilioErr);
          status = `failed (Twilio error: ${twilioErr instanceof Error ? twilioErr.message : String(twilioErr)})`;
        }
      }

      broadcastRecords.push({
        id: `sms-${Math.random().toString(36).substr(2, 9)}`,
        phone: phoneNumber,
        district,
        message: fullMessage,
        status,
        timestamp: new Date().toISOString()
      });
    }

    // Append to local broadcast log for visualization/testing
    const logPath = path.join(process.cwd(), 'public', 'sms-broadcasts.json');
    let logs: any[] = [];
    if (fs.existsSync(logPath)) {
      try {
        logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
      } catch (e) {
        logs = [];
      }
    }
    logs.unshift(...broadcastRecords);
    if (logs.length > 100) logs = logs.slice(0, 100);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

  } catch (err) {
    console.error('Error broadcasting SMS alerts:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if this is a database reset simulation action
    if (body.reset === true) {
      db.resetLocalDB();
      return NextResponse.json({ success: true, message: 'Database reset successfully' });
    }
    
    // Check if this is a voting action
    if (body.action === 'vote') {
      const { incidentId, upvoteDelta, downvoteDelta } = body;
      if (!incidentId || typeof upvoteDelta !== 'number' || typeof downvoteDelta !== 'number') {
        return NextResponse.json({ success: false, error: 'Invalid voting parameters' }, { status: 400 });
      }

      const incidents = await db.getIncidents();
      const incident = incidents.find(inc => inc.id === incidentId);
      if (!incident) {
        return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
      }

      const newUpvotes = Math.max(0, (incident.upvotes || 0) + upvoteDelta);
      const newDownvotes = Math.max(0, (incident.downvotes || 0) + downvoteDelta);

      // Determine if community upvotes reach the 3 threshold to confirm
      const shouldConfirm = newUpvotes >= 3 && !incident.confirmed;
      
      const updatedIncident = await db.updateIncident(incidentId, {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        confirmed: incident.confirmed || shouldConfirm
      });

      // If it becomes confirmed, trigger the real-time broadcast alert
      if (shouldConfirm) {
        console.log(`[COMMUNITY CONFIRMED] Incident ${incidentId} reached 3 upvotes. Dispatching alerts!`);
        await broadcastSMSAlert(updatedIncident);
      }

      return NextResponse.json({
        success: true,
        incident: updatedIncident
      });
    }

    // Check if this is a resolve action
    if (body.action === 'resolve') {
      const { incidentId } = body;
      if (!incidentId) {
        return NextResponse.json({ success: false, error: 'Missing incidentId' }, { status: 400 });
      }

      const incidents = await db.getIncidents();
      const incident = incidents.find(inc => inc.id === incidentId);
      if (!incident) {
        return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
      }

      const updatedIncident = await db.updateIncident(incidentId, {
        active: false
      });

      return NextResponse.json({
        success: true,
        incident: updatedIncident
      });
    }

    const { type, lat, lng, district, village, photo, description, anonymous_session_id } = body;

    if (!type || lat === undefined || lng === undefined || !district) {
      return NextResponse.json({ success: false, error: 'Missing required report fields' }, { status: 400 });
    }

    // 1. Save core report details to Database first (Directly auto-verified)
    const report = await db.createReport({
      type,
      severity: 'medium', // Default severity
      lat: typeof lat === 'number' ? lat : parseFloat(lat),
      lng: typeof lng === 'number' ? lng : parseFloat(lng),
      district,
      village: village || `${district} Sector`,
      photo_url: photo ? photo : undefined, // Save the actual base64 upload
      description: description || '',
      ai_verified: true,
      ai_confidence: 1.0,
      ai_score: 10.0,
      anonymous_session_id
    });

    const aiResult = {
      is_real_disaster: true,
      matches_reported_type: true,
      confidence: 1.0,
      severity: 'medium',
      reasoning: 'Verified instantly.'
    };

    // Save report updates in database
    const reports = await db.getReports();
    const repIdx = reports.findIndex(r => r.id === report.id);
    if (repIdx !== -1) {
      reports[repIdx] = report;
      // If we are using local DB, we update the reports array in file
      if (!db.isSupabase()) {
        const local = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'raksha-db.json'), 'utf-8'));
        const fIdx = local.reports.findIndex((r: Report) => r.id === report.id);
        if (fIdx !== -1) {
          local.reports[fIdx] = report;
          fs.writeFileSync(path.join(process.cwd(), 'raksha-db.json'), JSON.stringify(local, null, 2));
        }
      }
    }

    // 2. Clustering & Incident creation
    let finalIncident: Incident | null = null;

    const activeIncidents = await db.getIncidents();
    
    // Find any nearby active incident of the same type within 500m
    const nearbyIncident = activeIncidents.find(inc => {
      if (!inc.active || inc.type !== type) return false;
      const dist = getDistance(inc.lat, inc.lng, report.lat, report.lng);
      return dist <= 500;
    });

    if (nearbyIncident) {
      // Increment report count of the existing cluster
      const newReportCount = nearbyIncident.report_count + 1;
      
      // Confirm automatically if report count reaches 3
      const shouldConfirm = newReportCount >= 3 && !nearbyIncident.confirmed;
      
      finalIncident = await db.updateIncident(nearbyIncident.id, {
        report_count: newReportCount,
        severity: 'medium',
        description: `${nearbyIncident.description} (Additional report: ${description || 'No description'})`,
        photo_url: nearbyIncident.photo_url || report.photo_url, // Preserve existing photo or set new one
        confirmed: nearbyIncident.confirmed || shouldConfirm
      });

      // If it becomes confirmed through multiple duplicate reports, dispatch the alert
      if (shouldConfirm) {
        console.log(`[COMMUNITY CONFIRMED] Incident ${nearbyIncident.id} reached 3 reports. Dispatching alerts!`);
        await broadcastSMSAlert(finalIncident);
      }
    } else {
      // Create new Incident cluster - confirmed is false by default
      finalIncident = await db.createIncident({
        type,
        severity: 'medium',
        lat: report.lat,
        lng: report.lng,
        district,
        village: report.village || `${district} Sector`,
        report_count: 1,
        confirmed: false, // Starts as Awaiting Votes
        active: true,
        photo_url: report.photo_url, // Store report photo in incident cluster
        description: description || `Reported active ${type} emergency in ${district}.`
      });
    }

    // 3. Trigger notification broadcasts (FCM / SMS Fallbacks) ONLY if incident is community confirmed!
    if (finalIncident && finalIncident.confirmed) {
      await broadcastSMSAlert(finalIncident);
    }

    return NextResponse.json({
      success: true,
      report,
      incident: finalIncident,
      aiResult
    });

  } catch (error) {
    console.error('Error submitting report:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
