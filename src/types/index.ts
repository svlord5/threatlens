// ThreatLens Global Type Definitions

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentStatus = 'Open' | 'Investigating' | 'Contained' | 'Closed';
export type IOCType = 'IP' | 'DOMAIN' | 'URL' | 'SHA256' | 'MD5' | 'SHA1' | 'EMAIL' | 'REGISTRY' | 'FILE_PATH';

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  description: string | null;
  origin_country: string | null;
  mitre_id: string | null;
  created_at: string;
}

export interface MalwareFamily {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  threat_actor_id: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  target_sectors: string[];
  threat_actor_id: string | null;
  created_at: string;
}

export interface IOC {
  id: string;
  value: string;
  type: IOCType;
  severity: SeverityLevel;
  confidence_score: number;
  expiration_date: string | null;
  campaign_id: string | null;
  created_by: string | null;
  created_at: string;
  // Note: tags are fetched from a joined table, we attach them dynamically
  tags?: string[]; 
}

export interface Incident {
  id: string;
  title: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  analyst_id: string | null; // previously assigned_to, but using analyst_id to match 'case' table
  created_at: string;
  description: string | null;
}

export interface InvestigationEvent {
  id: string;
  case_id: string;
  timeline_event: string;
  event_time: string;
  analyst_id: string | null;
  created_at: string;
}

export interface Evidence {
  id: string;
  case_id: string;
  file_url: string | null;
  file_hash: string | null;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ForensicArtifact {
  id: string;
  case_id: string;
  artifact_type: string;
  artifact_data: any;
  is_malicious: boolean;
  created_at: string;
}

export interface APIFinding {
  id: string;
  endpoint: string;
  vulnerability_type: string;
  risk_score: number | null;
  proof_of_concept: string | null;
  status: string;
  created_at: string;
}
