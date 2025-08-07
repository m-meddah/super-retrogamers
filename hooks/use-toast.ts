import { toast } from "sonner"

export interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToast() {
  return {
    toast: ({ title, description, variant }: ToastProps) => {
      if (variant === "destructive") {
        toast.error(title || "Erreur", {
          description: description
        })
      } else {
        toast.success(title || "Succès", {
          description: description
        })
      }
    }
  }
}