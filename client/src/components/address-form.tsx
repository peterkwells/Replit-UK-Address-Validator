import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertValidationSchema, type InsertValidation, type Validation } from "@shared/schema";
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
import { Loader2, Search, MapPinCheckInside, Building2, CheckCircle2, XCircle, Info, AlertTriangle, Database, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

function SourceResult({ source, label, icon: Icon, result }: {
  source: string;
  label: string;
  icon: any;
  result: any;
}) {
  if (!result) return null;

  const isNotCovered = result.notCovered;
  const isMatched = result.matched;
  const hasError = result.error;

  let statusColor = "border-muted bg-muted/20";
  let statusIcon = <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
  let statusText = "Not available";

  if (isNotCovered) {
    statusColor = "border-muted bg-muted/20";
    statusIcon = <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    statusText = "Postcode not covered by this dataset";
  } else if (hasError) {
    statusColor = "border-red-200 bg-red-50/50";
    statusIcon = <XCircle className="h-5 w-5 text-red-500" />;
    statusText = result.error;
  } else if (isMatched) {
    statusColor = "border-emerald-200 bg-emerald-50/50";
    statusIcon = <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    statusText = "Address found";
  } else {
    statusColor = "border-red-200 bg-red-50/50";
    statusIcon = <XCircle className="h-5 w-5 text-red-500" />;
    statusText = "Address not found";
  }

  const matchedAddr = result.matchedAddress;
  const formatAddress = () => {
    if (!matchedAddr) return null;
    if (source === "royalMail") {
      return [matchedAddr.line_1, matchedAddr.line_2, matchedAddr.line_3, matchedAddr.post_town, matchedAddr.postcode].filter(Boolean).join(', ');
    }
    return [matchedAddr.addr1, matchedAddr.addr2, matchedAddr.addr3, matchedAddr.postcode].filter(Boolean).join(', ');
  };

  return (
    <div className={`rounded-md border p-4 ${statusColor}`} data-testid={`result-${source}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{label}</span>
            {result.council && (
              <span className="text-xs text-muted-foreground">({result.council})</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            {statusIcon}
            <span className="text-sm">{statusText}</span>
            {result.score !== undefined && !isNotCovered && !hasError && (
              <span className="text-xs text-muted-foreground ml-auto">
                {result.score}% match
              </span>
            )}
          </div>

          {matchedAddr && (
            <div className="mt-2 p-2 rounded bg-white/60 border border-inherit">
              <p className="text-xs text-muted-foreground mb-0.5">
                {isMatched ? "Matched address:" : "Closest match:"}
              </p>
              <p className="text-sm font-medium">{formatAddress()}</p>
            </div>
          )}

          {!isMatched && !isNotCovered && !hasError && result.suggestions && result.suggestions.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                View {result.totalAddresses || result.suggestions.length} addresses at this postcode
              </summary>
              <ul className="mt-1 space-y-0.5 pl-2">
                {result.suggestions.map((s: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground">{s}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

export function AddressForm() {
  const mutation = useCreateValidation();
  const [lastResult, setLastResult] = useState<Validation | null>(null);

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
    setLastResult(null);
    mutation.mutate(data, {
      onSuccess: (response) => {
        setLastResult(response);
        if (!response.isValid) {
          form.setError("postcode", { message: "Address could not be verified" });
        }
      },
    });
  }

  const details = lastResult?.details as any;

  return (
    <div className="space-y-6">
      <Card className="h-full border-blue-100 shadow-xl shadow-blue-900/5 overflow-visible relative" data-testid="card-address-form">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <CardHeader className="relative">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <MapPinCheckInside className="h-6 w-6" />
          </div>
          <CardTitle className="text-3xl">Validate Address</CardTitle>
          <CardDescription className="text-base">
            Enter address details below to verify against two official sources.
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
                          <Input data-testid="input-line1" placeholder="House name/number and street" className="pl-10" {...field} value={field.value || ''} />
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
                        <Input data-testid="input-line2" placeholder="Apartment, suite, unit, etc." {...field} value={field.value || ''} />
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
                        <Input data-testid="input-town" placeholder="London" {...field} value={field.value || ''} />
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
                        <Input data-testid="input-postcode" placeholder="SW1A 1AA" className="font-mono uppercase placeholder:normal-case" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-blue-900/20 shadow-lg"
                disabled={mutation.isPending}
                data-testid="button-validate"
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

          <div className="mt-8 pt-6 border-t border-dashed">
            <p className="text-xs text-center text-muted-foreground">
              Validates against Royal Mail Postcode Address File and Council Tax open address data.
            </p>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            data-testid="card-result"
          >
            <Card className={`overflow-visible border-2 ${lastResult.isValid ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`rounded-full p-2 ${lastResult.isValid ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {lastResult.isValid ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-semibold ${lastResult.isValid ? 'text-emerald-800' : 'text-red-800'}`}>
                      {lastResult.isValid ? 'Address Verified' : 'Address Not Found'}
                    </h3>
                    <p className={`text-sm ${lastResult.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                      Checked against two data sources
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <SourceResult
                    source="royalMail"
                    label="Royal Mail (PAF)"
                    icon={Mail}
                    result={details?.royalMail}
                  />
                  <SourceResult
                    source="councilTax"
                    label="Council Tax Records"
                    icon={Database}
                    result={details?.councilTax}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
