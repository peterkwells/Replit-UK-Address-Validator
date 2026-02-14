import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertValidation, type Validation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Since the shared routes manifest might not be fully available in the type system during generation,
// we'll define the fetchers manually based on the provided schema/routes.
// In a real repo, we'd import `api` from @shared/routes.

// Mocking the API structure for type safety in this file based on the prompt
const API_BASE = "/api/validations";

export function useValidations() {
  return useQuery({
    queryKey: [API_BASE],
    queryFn: async () => {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to fetch validations");
      return (await res.json()) as Validation[];
    },
  });
}

export type ValidationRequest = InsertValidation & {
  sources?: {
    idealPostcodes: boolean;
    openAddresses: boolean;
    pricePaid: boolean;
  };
};

export function useCreateValidation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ValidationRequest) => {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to validate address");
      }

      return (await res.json()) as Validation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [API_BASE] });
      
      if (data.isValid) {
        toast({
          title: "Address Validated",
          description: "The address has been successfully verified.",
          variant: "default",
          className: "bg-emerald-50 border-emerald-200 text-emerald-900",
        });
      } else {
        toast({
          title: "Invalid Address",
          description: "We could not verify this address details.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
