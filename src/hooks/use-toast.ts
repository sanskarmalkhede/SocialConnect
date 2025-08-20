import { toast } from 'sonner'

export function useToast() {
  return {
    toast: ({ title, description, variant = "default" }: {
      title?: string
      description: string
      variant?: "default" | "destructive"
    }) => {
      if (variant === "destructive") {
        toast.error(description, {
          id: title
        })
      } else {
        toast(title || description, {
          id: title
        })
      }
    }
  }
}
