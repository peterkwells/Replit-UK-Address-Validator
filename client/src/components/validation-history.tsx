import { format } from "date-fns";
import { CheckCircle2, XCircle, MapPin, Search, Mail, Database } from "lucide-react";
import { Validation } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "./ui/input";

interface ValidationHistoryProps {
  validations: Validation[];
  isLoading: boolean;
}

export function ValidationHistory({ validations, isLoading }: ValidationHistoryProps) {
  const [search, setSearch] = useState("");

  const filteredValidations = validations
    .filter((v) => {
      const searchLower = search.toLowerCase();
      return (
        v.postcode.toLowerCase().includes(searchLower) ||
        v.town?.toLowerCase().includes(searchLower) ||
        v.line1?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());

  if (isLoading) {
    return (
      <Card className="h-full border-dashed">
        <CardHeader>
          <div className="h-7 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col bg-white/50 backdrop-blur-sm border-blue-100/50 shadow-xl shadow-blue-900/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>History</CardTitle>
            <CardDescription>Recent address validations</CardDescription>
          </div>
          <Badge variant="secondary" className="px-3 py-1 bg-blue-50 text-blue-700">
            {validations.length} Checks
          </Badge>
        </div>
        <div className="relative pt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search history..." 
            className="pl-9 bg-white/80"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-4">
            {filteredValidations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                <MapPin className="h-10 w-10 mb-2 opacity-20" />
                <p>No validation history found</p>
              </div>
            ) : (
              filteredValidations.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative p-4 rounded-xl border border-border/50 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 rounded-full p-1.5 ${v.isValid ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {v.isValid ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          {v.postcode}
                          {v.isValid && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                              VALID
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5 space-y-0.5">
                          {v.line1 && <p>{v.line1}</p>}
                          {v.line2 && <p>{v.line2}</p>}
                          {v.town && <p>{v.town}</p>}
                        </div>
                        <div className="text-xs text-muted-foreground/50 mt-2 font-mono">
                          {v.createdAt && format(new Date(v.createdAt), "MMM d, h:mm a")}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 items-end flex-shrink-0">
                      {(v.details as any)?.royalMail && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-xs ${(v.details as any).royalMail.matched ? 'text-emerald-600' : 'text-red-500'}`}>
                            {(v.details as any).royalMail.matched ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                      )}
                      {(v.details as any)?.councilTax && (
                        <div className="flex items-center gap-1">
                          <Database className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-xs ${(v.details as any).councilTax.notCovered ? 'text-muted-foreground' : (v.details as any).councilTax.matched ? 'text-emerald-600' : 'text-red-500'}`}>
                            {(v.details as any).councilTax.notCovered ? 'N/A' : (v.details as any).councilTax.matched ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
