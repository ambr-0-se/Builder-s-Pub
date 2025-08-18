"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info"
}

let toastId = 0
const toastListeners: ((toast: Toast) => void)[] = []

export function showToast(message: string, type: "success" | "error" | "info" = "info") {
  const toast: Toast = {
    id: `toast-${++toastId}`,
    message,
    type,
  }

  toastListeners.forEach((listener) => listener(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 5000)
    }

    toastListeners.push(listener)

    return () => {
      const index = toastListeners.indexOf(listener)
      if (index > -1) {
        toastListeners.splice(index, 1)
      }
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn("rounded-md px-4 py-3 shadow-lg max-w-sm", {
            "bg-green-50 text-green-800 border border-green-200": toast.type === "success",
            "bg-red-50 text-red-800 border border-red-200": toast.type === "error",
            "bg-blue-50 text-blue-800 border border-blue-200": toast.type === "info",
          })}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
