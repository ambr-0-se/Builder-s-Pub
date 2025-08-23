type AnalyticsEvent =
  | "project_created"
  | "project_viewed"
  | "upvote_toggled"
  | "comment_added"
  | "comment_deleted"
  | "reply_added"
  | "collaboration_created"
  | "collaboration_viewed"
  | "search_performed"
  | "filters_applied"

export function useAnalyticsMock() {
  const track = (event: AnalyticsEvent, properties?: Record<string, any>) => {
    // TODO: Replace with real analytics service (e.g., Vercel Analytics, PostHog)
    console.log(`[Analytics] ${event}`, properties)
  }

  return { track }
}
