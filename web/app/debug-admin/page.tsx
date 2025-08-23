import { cookies } from "next/headers"
import { getServerSupabase } from "@/lib/supabaseServer"

export default async function DebugAdminPage() {
  const cookieStore = await cookies()
  
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const adminEmails = process.env.ADMIN_EMAILS
  
  // Calculate project ref
  let projectRef = "unknown"
  let cookieName = "unknown"
  try {
    if (supabaseUrl) {
      projectRef = new URL(supabaseUrl).host.split(".")[0]
      cookieName = `sb-${projectRef}-auth-token`
    }
  } catch (e) {
    projectRef = "error parsing URL"
  }
  
  // Check cookie
  const authCookie = cookieStore.get(cookieName)
  const cookieValue = authCookie?.value || "not found"
  const cookieExists = !!authCookie?.value
  
  // Try to parse JWT if cookie exists
  let email = "unknown"
  let jwtError = ""
  if (cookieExists && cookieValue !== "not found") {
    try {
      // Try JSON first; if it fails, try base64 decode then JSON
      let parsed: any
      try {
        parsed = JSON.parse(cookieValue)
      } catch (_) {
        const decoded = Buffer.from(cookieValue, "base64").toString("utf8")
        parsed = JSON.parse(decoded)
      }

      if (parsed.access_token) {
        const payloadSegment = parsed.access_token.split(".")[1]
        if (payloadSegment) {
          const json = Buffer.from(payloadSegment.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
          const claims = JSON.parse(json)
          email = claims.email || "no email in token"
        } else {
          jwtError = "no payload segment in token"
        }
      } else {
        jwtError = "no access_token in cookie JSON"
      }
    } catch (e) {
      jwtError = `parse error: ${e instanceof Error ? e.message : String(e)}`
    }
  }

  // Server-side getUser() via Supabase (source of truth for SSR)
  let serverEmail: string | null = null
  try {
    const supabase = await getServerSupabase()
    const { data } = await supabase.auth.getUser()
    serverEmail = data.user?.email ?? null
  } catch (_) {
    // ignore
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Access Debug</h1>
      
      <div className="space-y-6">
        {/* Environment Variables */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Environment Variables</h2>
          <div className="space-y-2 text-sm">
            <div><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {supabaseUrl || "NOT SET"}</div>
            <div><strong>ADMIN_EMAILS:</strong> {adminEmails || "NOT SET"}</div>
            <div><strong>Project Ref:</strong> {projectRef}</div>
          </div>
        </div>
        
        {/* Cookie Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Cookie Status</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Cookie Name:</strong> {cookieName}</div>
            <div><strong>Cookie Exists:</strong> {cookieExists ? "✅ Yes" : "❌ No"}</div>
            <div><strong>Cookie Value:</strong> 
              <div className="mt-2 p-2 bg-white border rounded text-xs font-mono break-all">
                {cookieValue}
              </div>
            </div>
          </div>
        </div>
        
        {/* JWT Analysis */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">JWT Analysis</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Email from Token:</strong> {email}</div>
            {jwtError && <div><strong>JWT Error:</strong> <span className="text-red-600">{jwtError}</span></div>}
            <div><strong>Server getUser() email:</strong> {serverEmail || "unknown"}</div>
          </div>
        </div>
        
        {/* Admin Check */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Admin Access Check</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Admin Emails List:</strong> 
              {adminEmails ? (
                <ul className="mt-2 list-disc list-inside">
                  {adminEmails.split(",").map((email, i) => (
                    <li key={i}>{email.trim()}</li>
                  ))}
                </ul>
              ) : (
                "No admin emails configured"
              )}
            </div>
            <div><strong>Current User Email (server):</strong> {serverEmail || "unknown"}</div>
            <div><strong>Would be Admin:</strong> {
              adminEmails && serverEmail
                ? adminEmails.split(",").map(e => e.trim().toLowerCase()).includes(serverEmail.toLowerCase())
                  ? "✅ Yes" 
                  : "❌ No (email not in admin list)"
                : "❌ Cannot determine (missing data)"
            }</div>
          </div>
        </div>
        
        {/* Troubleshooting */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h2 className="text-lg font-semibold mb-3 text-yellow-800">Troubleshooting Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
            <li>Ensure all environment variables are set in <code>.env.local</code></li>
            <li>Sign out and sign back in to trigger the auth callback</li>
            <li>Check Network tab for <code>POST /api/profile/ensure</code> request</li>
            <li>Verify Supabase Auth redirect URLs include <code>/auth/callback</code></li>
            <li>Restart your dev server after changing environment variables</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
