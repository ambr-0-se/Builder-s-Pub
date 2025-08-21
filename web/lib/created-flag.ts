export function handleCreatedFlag(
	params: URLSearchParams,
	pathname: string,
	replace: (href: string) => void,
	showToast: (msg: string, type?: "success" | "error") => void,
	track?: (event: string, properties?: any) => void
) {
	if (params.get("created") === "1") {
		// Use a unique key based on the current URL to prevent duplicate toasts
		const toastKey = `project-created-toast-${pathname.split("/").pop()}`
		
		// Check if we've already shown the toast for this project
		if (typeof window !== "undefined" && window.sessionStorage.getItem(toastKey)) {
			// Just clean the URL without showing toast again
			replace(pathname)
			return
		}

		showToast("Project created successfully!", "success")
		
		// Mark this toast as shown
		if (typeof window !== "undefined") {
			window.sessionStorage.setItem(toastKey, "1")
		}
		
		// Track analytics event for successful project creation
		if (track) {
			track("project_created", {
				source: "redirect_success"
			})
		}
		
		// Remove the flag so refresh doesn't re-toast
		replace(pathname)
	}
}
