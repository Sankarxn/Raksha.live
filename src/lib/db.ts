import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Define schemas
export interface Report {
  id: string;
  type: string; // flood | landslide | roadblock | rescue | missing
  severity: string; // low | medium | critical
  lat: number;
  lng: number;
  district: string;
  village?: string;
  photo_url?: string;
  description: string;
  ai_verified: boolean;
  ai_confidence: number;
  ai_score: number;
  anonymous_session_id?: string;
  created_at: string;
}

export interface Incident {
  id: string;
  type: string;
  severity: string;
  lat: number;
  lng: number;
  district: string;
  village?: string;
  photo_url?: string;
  report_count: number;
  confirmed: boolean;
  active: boolean;
  first_reported_at: string;
  last_updated_at: string;
  description: string;
  upvotes: number;
  downvotes: number;
}

export interface Subscription {
  id: string;
  district: string;
  phone?: string;
  fcm_token?: string;
  created_at: string;
}

// Check Supabase environment configurations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

let supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Local JSON Database Config
const LOCAL_DB_PATH = path.join(process.cwd(), 'raksha-db.json');

const defaultIncidents: Incident[] = [];

// Local JSON DB utilities
interface LocalDBStructure {
  reports: Report[];
  incidents: Incident[];
  subscriptions: Subscription[];
}

function readLocalDB(): LocalDBStructure {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initialData: LocalDBStructure = {
      reports: [],
      incidents: defaultIncidents,
      subscriptions: []
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  
  try {
    const content = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Error reading local DB file, recreating...', e);
    const initialData: LocalDBStructure = {
      reports: [],
      incidents: defaultIncidents,
      subscriptions: []
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

function writeLocalDB(data: LocalDBStructure) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
}

// ----------------------------------------------------
// Unified Database Operations API
// ----------------------------------------------------

export const db = {
  isSupabase: () => isSupabaseConfigured,

  // REPORTS
  getReports: async (): Promise<Report[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const local = readLocalDB();
      return [...local.reports].sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  },

  createReport: async (report: Omit<Report, 'id' | 'created_at'>): Promise<Report> => {
    const newReport: Report = {
      ...report,
      id: `rep-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('reports')
        .insert([newReport])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      local.reports.push(newReport);
      writeLocalDB(local);
      return newReport;
    }
  },

  // INCIDENTS (Clustered view)
  getIncidents: async (): Promise<Incident[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('last_updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const local = readLocalDB();
      return [...local.incidents].sort((a, b) => b.last_updated_at.localeCompare(a.last_updated_at));
    }
  },

  createIncident: async (incident: Omit<Incident, 'id' | 'first_reported_at' | 'last_updated_at' | 'upvotes' | 'downvotes'>): Promise<Incident> => {
    const now = new Date().toISOString();
    const newIncident: Incident = {
      ...incident,
      id: `inc-${Math.random().toString(36).substr(2, 9)}`,
      upvotes: 0,
      downvotes: 0,
      first_reported_at: now,
      last_updated_at: now
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('incidents')
        .insert([newIncident])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      local.incidents.push(newIncident);
      writeLocalDB(local);
      return newIncident;
    }
  },

  updateIncident: async (id: string, updates: Partial<Incident>): Promise<Incident> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('incidents')
        .update({ ...updates, last_updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      const idx = local.incidents.findIndex(inc => inc.id === id);
      if (idx === -1) throw new Error(`Incident with ID ${id} not found`);
      
      local.incidents[idx] = {
        ...local.incidents[idx],
        ...updates,
        last_updated_at: new Date().toISOString()
      };
      writeLocalDB(local);
      return local.incidents[idx];
    }
  },

  // SUBSCRIPTIONS
  getSubscriptions: async (): Promise<Subscription[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*');
      if (error) throw error;
      return data || [];
    } else {
      const local = readLocalDB();
      return local.subscriptions;
    }
  },

  createSubscription: async (sub: Omit<Subscription, 'id' | 'created_at'>): Promise<Subscription> => {
    const newSub: Subscription = {
      ...sub,
      id: `sub-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([newSub])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = readLocalDB();
      // Avoid duplicate phone subscriptions on same district
      const isDuplicate = local.subscriptions.some(
        s => s.phone === sub.phone && s.district === sub.district
      );
      if (!isDuplicate) {
        local.subscriptions.push(newSub);
        writeLocalDB(local);
      }
      return newSub;
    }
  },

  // RESET
  resetLocalDB: (): void => {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      fs.unlinkSync(LOCAL_DB_PATH);
    }
    readLocalDB(); // triggers regeneration
  }
};
