// ============================================================
// TaleXMon – Volledige type definities voor alle entiteiten
// ============================================================

export type UserRole = 'admin' | 'tc' | 'hoofdcoach' | 'coach' | 'teammanager' | 'speler' | 'ouder'

export interface AppUser {
  id: string
  email: string
  role: UserRole
  coached_team_ids: string[]
  managed_team_ids: string[]
  hoofdcoach_age_category_ids: string[]
  last_seen: string
  email_notifications_enabled: boolean
}

// ---- Season ----
export interface Season {
  id: string
  created_at: string
  name: string
  start_date: string
  end_date: string
  status: 'actief' | 'gearchiveerd'
}

// ---- AgeCategory ----
export interface AgeCategory {
  id: string
  created_at: string
  code: string
  label: string
  gender: 'm' | 'v' | 'gemengd'
  is_jeugd: boolean
  min_age?: number
  max_age?: number
  sort_order: number
  active: boolean
}

// ---- Team ----
export interface Team {
  id: string
  created_at: string
  name: string
  age_category?: string
  age_category_id?: string
  level: 'selectie' | 'recreatief'
  season_id: string
  coach_emails: string[]
  knvb_ical_url?: string
  knvb_team_code?: string
  last_sync_at?: string
  last_sync_status: 'ok' | 'error' | 'never'
  last_sync_error?: string
}

// ---- Player ----
export type PlayerStatus = 'actief' | 'geblesseerd' | 'gestopt'
export type PlayerPosition = 'keeper' | 'verdediger' | 'middenvelder' | 'aanvaller'
export type DominantFoot = 'links' | 'rechts' | 'beide'
export type TalentLabel = 'geen' | 'talent' | 'groot_talent' | 'doorstroom'

export interface Player {
  id: string
  created_at: string
  first_name: string
  last_name: string
  date_of_birth: string
  position: PlayerPosition
  dominant_foot?: DominantFoot
  status: PlayerStatus
  team_id?: string
  season_id?: string
  extra_team_ids: string[]
  player_email?: string
  player_phone?: string
  parent_email?: string
  parent_phone?: string
  address?: string
  photo_url?: string
  is_minor: boolean
  talent_label: TalentLabel
  consent_data_processing: boolean
  consent_data_processing_at?: string
  consent_photo_internal: boolean
  consent_photo_website: boolean
  consent_photo_socials: boolean
  consent_text_version?: string
  parent_consent_given: boolean
  parent_consent_at?: string
  membership_end_date?: string
  archive_after?: string
  delete_after?: string
}

// ---- Assessment ----
export interface Assessment {
  id: string
  created_at: string
  player_id: string
  team_id: string
  season_id: string
  assessor_email: string
  assessor_name?: string
  date: string
  tech_ball_control?: number
  tech_passing?: number
  tech_dribbling?: number
  tact_game_insight?: number
  tact_positioning?: number
  tact_transition?: number
  phys_speed?: number
  phys_endurance?: number
  phys_strength?: number
  ment_effort?: number
  ment_coachability?: number
  ment_teamwork?: number
  coach_notes?: string
  development_advice?: string
  shared_with_player: boolean
  delete_after?: string
}

// ---- Match ----
export type MatchStatus = 'gepland' | 'gespeeld' | 'afgelast'
export type HomeAway = 'thuis' | 'uit'
export type ExternalSource = 'handmatig' | 'knvb_ical' | 'sportlink'

export interface Match {
  id: string
  created_at: string
  team_id: string
  season_id: string
  date: string
  time?: string
  location?: string
  opponent: string
  home_away: HomeAway
  status: MatchStatus
  goals_for?: number
  goals_against?: number
  notes?: string
  lineup_published: boolean
  external_id?: string
  external_source: ExternalSource
  competition_name?: string
  match_number?: string
  last_synced_at?: string
  manual_overrides: string[]
}

// ---- MatchStat ----
export interface MatchStat {
  id: string
  created_at: string
  match_id: string
  player_id: string
  team_id: string
  season_id: string
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  minutes_played: number
  started: boolean
  rating?: number
}

// ---- MatchLineup ----
export type LineupPosition = 'basisspeler' | 'invaller' | 'afwezig' | 'niet_geselecteerd'

export interface MatchLineup {
  id: string
  created_at: string
  match_id: string
  player_id: string
  team_id: string
  season_id: string
  position_in_lineup: LineupPosition
  field_position?: number
  shirt_number?: number
  notes?: string
}

// ---- Injury ----
export type InjuryType = 'spierblessure' | 'knieblessure' | 'enkelblessure' | 'hamstring' | 'lies' | 'rug' | 'hoofd' | 'breuk' | 'overig'
export type InjurySeverity = 'licht' | 'matig' | 'ernstig'
export type InjuryStatus = 'actief' | 'hersteld'

export interface Injury {
  id: string
  created_at: string
  player_id: string
  team_id: string
  season_id: string
  injury_type: InjuryType
  severity: InjurySeverity
  status: InjuryStatus
  start_date: string
  expected_return?: string
  actual_return?: string
  notes?: string
  player_email?: string
  parent_email?: string
  consent_given: boolean
  consent_given_at?: string
  consent_given_by_email?: string
  delete_after?: string
}

// ---- Training ----
export type TrainingStatus = 'gepland' | 'afgerond' | 'geannuleerd'

export interface Training {
  id: string
  created_at: string
  team_id: string
  season_id: string
  date: string
  time?: string
  duration_minutes: number
  location?: string
  theme?: string
  notes?: string
  status: TrainingStatus
}

// ---- TrainingAttendance ----
export interface TrainingAttendance {
  id: string
  created_at: string
  training_id: string
  player_id: string
  team_id: string
  season_id: string
  present: boolean
  reason_absent?: string
}

// ---- DrillLibrary ----
export type DrillCategory = 'techniek' | 'tactiek' | 'fysiek' | 'spelvorm' | 'warming_up' | 'cooling_down'
export type DrillDifficulty = 'makkelijk' | 'gemiddeld' | 'moeilijk'

export interface DrillLibrary {
  id: string
  created_at: string
  name: string
  category: DrillCategory
  difficulty: DrillDifficulty
  description?: string
  coaching_points?: string
  min_players?: number
  max_players?: number
  duration_minutes?: number
  field_size?: string
  materials?: string
  image_url?: string
  video_url?: string
  tags: string[]
  age_categories: string[]
}

// ---- TrainingDrill ----
export interface TrainingDrill {
  id: string
  created_at: string
  training_id: string
  drill_id: string
  order?: number
  duration_minutes?: number
  notes?: string
}

// ---- PlayerLoan ----
export type LoanStatus = 'actief' | 'beeindigd'

export interface PlayerLoan {
  id: string
  created_at: string
  player_id: string
  from_team_id: string
  to_team_id: string
  season_id: string
  match_id?: string
  date_from: string
  date_to?: string
  notes?: string
  status: LoanStatus
}

// ---- PlayerAbsence ----
export type AbsenceType = 'training' | 'wedstrijd' | 'beide'

export interface PlayerAbsence {
  id: string
  created_at: string
  player_id: string
  team_id: string
  season_id: string
  type: AbsenceType
  date_from: string
  date_to?: string
  reason?: string
  notes?: string
}

// ---- CoachProfile ----
export type CoachCertificate = 'geen' | 'VC1' | 'VC2' | 'VC3' | 'VC4' | 'VC5'

export interface CoachProfile {
  id: string
  created_at: string
  coach_email: string
  coach_user_id?: string
  first_name?: string
  last_name?: string
  function?: string
  coach_certificate: CoachCertificate
  vog_aanwezig: boolean
  vog_date?: string
  vog_expiry_date?: string
  notes?: string
  delete_after?: string
}

// ---- Notification ----
export type NotificationType = 'training_nieuw' | 'training_geannuleerd' | 'wedstrijd_gewijzigd' | 'wedstrijd_afgelast' | 'opstelling_gepubliceerd'

export interface Notification {
  id: string
  created_at: string
  recipient_email: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  team_id?: string
  reference_id?: string
  delete_after?: string
}

// ---- UserRequest ----
export type RequestedRole = 'coach' | 'speler' | 'teammanager' | 'tc'
export type RequestStatus = 'nieuw' | 'wacht_op_ouder' | 'goedgekeurd' | 'afgewezen'

export interface UserRequest {
  id: string
  created_at: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  city?: string
  date_of_birth?: string
  requested_role: RequestedRole
  team_preference?: string
  motivation?: string
  is_minor: boolean
  parent_email?: string
  parent_name?: string
  status: RequestStatus
  admin_notes?: string
  consent_given: boolean
  consent_given_at?: string
  consent_text_version?: string
  parent_consent_token?: string
  parent_consent_token_expires?: string
  parent_consent_at?: string
}

// ---- RolePermissions ----
export interface RolePermissions {
  id: string
  created_at: string
  role: UserRole
  permissions: Record<string, boolean>
}

// ---- AppSettings ----
export interface AppSettings {
  id: string
  created_at: string
  association_name?: string
  association_kvk?: string
  association_address?: string
  contact_email_dpo?: string
  privacy_statement_html?: string
  privacy_statement_version?: string
  consent_text_version?: string
}

// ---- GDPR entities ----
export type ConsentType = 'data_processing' | 'photo_internal' | 'photo_website' | 'photo_socials' | 'health_data' | 'parent_consent_minor'
export type ConsentAction = 'gegeven' | 'ingetrokken' | 'verlopen' | 'gewijzigd'

export interface ConsentLog {
  id: string
  created_at: string
  consent_type: ConsentType
  action: ConsentAction
  timestamp: string
  given_by_email: string
  given_by_role?: string
  subject_player_id?: string
  subject_user_email?: string
  consent_text_version?: string
  ip_address?: string
  notes?: string
}

export type DataAction = 'read' | 'create' | 'update' | 'delete' | 'export'

export interface DataAccessLog {
  id: string
  created_at: string
  accessed_at: string
  accessed_by_email: string
  accessed_by_role?: string
  entity_name: string
  action: DataAction
  record_id?: string
  subject_player_id?: string
  ip_address?: string
}

export type DSRType = 'inzage' | 'rectificatie' | 'verwijdering' | 'beperking' | 'data_portabiliteit' | 'bezwaar' | 'intrekking_toestemming'
export type DSRStatus = 'nieuw' | 'identiteit_geverifieerd' | 'in_behandeling' | 'afgerond' | 'afgewezen'
export type DSROutcome = 'uitgevoerd' | 'gedeeltelijk_uitgevoerd' | 'afgewezen'

export interface DataSubjectRequest {
  id: string
  created_at: string
  request_type: DSRType
  requester_email: string
  requester_name?: string
  requester_player_id?: string
  requested_at: string
  deadline: string
  deadline_extended: boolean
  description?: string
  status: DSRStatus
  outcome?: DSROutcome
  outcome_explanation?: string
  admin_notes?: string
  completed_at?: string
}

export type BreachStatus = 'nieuw' | 'in_behandeling' | 'gemeld_ap' | 'afgerond'

export interface DataBreach {
  id: string
  created_at: string
  incident_date: string
  discovered_date: string
  reported_to_dpa_at?: string
  reported_to_subjects_at?: string
  description: string
  affected_categories?: string
  affected_count?: number
  mitigation_measures?: string
  status: BreachStatus
}

// ---- Module system ----
export type ModuleCategory = 'core' | 'optional'
export type ModuleScopeType = 'club' | 'age_category' | 'team' | 'role'

export interface Module {
  id: string
  created_at: string
  code: string
  name: string
  description?: string
  icon?: string
  category: ModuleCategory
  default_enabled: boolean
  entities: string[]
  depends_on: string[]
  menu_routes: string[]
  sort_order: number
  active: boolean
}

export interface ModuleActivation {
  id: string
  created_at: string
  module_code: string
  scope_type: ModuleScopeType
  active: boolean
  season_id?: string
  team_id?: string
  age_category_id?: string
  role?: UserRole
  valid_from?: string
  valid_until?: string
  notes?: string
}
