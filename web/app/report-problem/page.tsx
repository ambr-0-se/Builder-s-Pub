"use client"

import { useActionState } from "react"
import { reportProblemAction, type ReportProblemState } from "./actions"

export default function ReportProblemPage() {
  const [state, formAction] = useActionState<ReportProblemState, FormData>(reportProblemAction, {})
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">Report a problem</h1>
      <p className="mt-2 text-gray-600">Describe what went wrong and include any steps to reproduce.</p>
      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="url" value={typeof window !== "undefined" ? window.location.href : ""} />
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea name="message" rows={5} className="mt-1 w-full rounded-md border border-gray-300 p-2" placeholder="What happened?" />
        </div>
        {state?.formError && <p className="text-sm text-red-600">{state.formError}</p>}
        {state?.success && <p className="text-sm text-green-700">Thanks! Your report was submitted.</p>}
        <div className="flex gap-3">
          <button type="submit" className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Submit</button>
          <a href="/" className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200">Home</a>
        </div>
      </form>
    </div>
  )
}


