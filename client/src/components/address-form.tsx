import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertValidationSchema, type InsertValidation } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateValidation } from "@/hooks/use-validations";
import { Loader2, Search, MapPinCheckInside, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export function AddressForm() {
  const mutation = useCreateValidation();
  
  const form = useForm<InsertValidation>({
    resolver: zodResolver(insertValidationSchema),
    defaultValues: {
      line1: "",
      line2: "",
      town: "",
      postcode: "",
    },
  });

  function onSubmit(data: InsertValidation) {
    mutation.mutate(data, {
      onSuccess: (response) => {
        if (!response.isValid) {
          form.setError("postcode", { message: "Invalid address or postcode" });
        } else {
          form.reset();
        }
      },
    });
  }

  return (
    <Card className="h-full border-blue-100 shadow-xl shadow-blue-900/5 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
          <MapPinCheckInside className="h-6 w-6" />
        </div>
        <CardTitle className="text-3xl">Validate Address</CardTitle>
        <CardDescription className="text-base">
          Enter address details below to verify against UK Postcode database.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="line1"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/40" />
                        <Input placeholder="House name/number and street" className="pl-10" {...field} value={field.value || ''} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="line2"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address Line 2 <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Apartment, suite, unit, etc." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="town"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Town / City</FormLabel>
                    <FormControl>
                      <Input placeholder="London" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl>
                      <Input placeholder="SW1A 1AA" className="font-mono uppercase placeholder:normal-case" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold shadow-blue-900/20 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Validate Address
                </>
              )}
            </Button>
          </form>
        </Form>
        
        {/* Helper text */}
        <div className="mt-8 pt-6 border-t border-dashed">
          <p className="text-xs text-center text-muted-foreground">
            Uses live data from postcodes.io to verify UK addresses instantly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
