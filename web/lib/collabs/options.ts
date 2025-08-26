export type Option<T extends string> = { value: T; label: string }

// Board segmentation (already readable but included for consistency)
export const COLLAB_KIND_OPTIONS: Option<"ongoing" | "planned" | "individual" | "organization">[] = [
  { value: "ongoing", label: "Ongoing" },
  { value: "planned", label: "Planned" },
  { value: "individual", label: "Individual" },
  { value: "organization", label: "Organization" },
]

// Project type (DB-safe slug values with human labels)
export const PROJECT_TYPE_OPTIONS: Option<
  | "personal"
  | "open_source"
  | "research"
  | "startup_idea_validation"
  | "startup_registered"
  | "student_organization"
  | "university"
  | "ngo"
  | "corporate"
  | "others"
>[] = [
  { value: "personal", label: "Personal" },
  { value: "open_source", label: "Open-source" },
  { value: "research", label: "Research" },
  { value: "startup_idea_validation", label: "Startup idea validation (not registered)" },
  { value: "startup_registered", label: "Startup (company registered)" },
  { value: "student_organization", label: "Student Organization" },
  { value: "university", label: "University" },
  { value: "ngo", label: "NGO" },
  { value: "corporate", label: "Corporate" },
  { value: "others", label: "Others" },
]

// Stage (DB-safe slug values with human labels)
export const STAGE_OPTIONS: Option<
  | "ideation"
  | "planning"
  | "requirements_analysis"
  | "design"
  | "mvp_development"
  | "testing_validation"
  | "implementation_deployment"
  | "monitoring_maintenance"
  | "evaluation_closure"
  | "scaling"
  | "adding_features"
>[] = [
  { value: "ideation", label: "Ideation" },
  { value: "planning", label: "Planning" },
  { value: "requirements_analysis", label: "Requirements Gathering and Analysis" },
  { value: "design", label: "Design" },
  { value: "mvp_development", label: "MVP Development" },
  { value: "testing_validation", label: "Testing and Validation" },
  { value: "implementation_deployment", label: "Implementation and Deployment" },
  { value: "monitoring_maintenance", label: "Monitoring and Maintenance" },
  { value: "evaluation_closure", label: "Evaluation and Closure" },
  { value: "scaling", label: "Scaling" },
  { value: "adding_features", label: "Adding new features" },
]

function toMap<T extends string>(opts: Option<T>[]) {
  const byValue = new Map<T, string>()
  const byLabel = new Map<string, T>()
  for (const o of opts) {
    byValue.set(o.value, o.label)
    byLabel.set(o.label, o.value)
  }
  return { byValue, byLabel }
}

export const PROJECT_TYPE_MAP = toMap(PROJECT_TYPE_OPTIONS)
export const STAGE_MAP = toMap(STAGE_OPTIONS)
export const COLLAB_KIND_MAP = toMap(COLLAB_KIND_OPTIONS)

export function formatProjectType(value: (typeof PROJECT_TYPE_OPTIONS)[number]["value"]): string {
  return PROJECT_TYPE_MAP.byValue.get(value) || value
}

export function formatStage(value: (typeof STAGE_OPTIONS)[number]["value"]): string {
  return STAGE_MAP.byValue.get(value) || value
}

export function formatCollabKind(value: (typeof COLLAB_KIND_OPTIONS)[number]["value"]): string {
  return COLLAB_KIND_MAP.byValue.get(value) || value
}


