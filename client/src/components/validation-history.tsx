import { format } from "date-fns";
import { CheckCircle2, XCircle, MapPin, Search, Mail, Database, Landmark, AlertTriangle, ChevronDown, ChevronUp, Shield } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Input } from "./ui/input";

interface ValidationHistoryProps {
  validations: Validation[];
  isLoading: boolean;
}

function SourceIcon({ source }: { source: string }) {
  switch (source) {
    case "royalMail": return <Mail className="h-3 w-3" />;
    case "councilTax": return <Database className="h-3 w-3" />;
    case "pricePaid": return <Landmark className="h-3 w-3" />;
    default: return null;
  }
}

function SourceLabel({ source }: { source: string }) {
  switch (source) {
    case "royalMail": return "Royal Mail PAF";
    case "councilTax": return "Council Tax";
    case "pricePaid": return "Land Registry";
    default: return source;
  }
}

function SourceLicense({ source }: { source: string }) {
  switch (source) {
    case "royalMail": return "Royal Mail / Ideal Postcodes (paid)";
    case "councilTax": return "Open data, OGL v3.0";
    case "pricePaid": return "Crown copyright, OGL v3.0";
    default: return "";
  }
}

function SourceStatusBadge({ result }: { result: any }) {
  if (!result || result.skipped) return null;

  if (result.notCovered) {
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
        <AlertTriangle className="h-2.5 w-2.5" />
        Not covered
      </Badge>
    );
  }
  if (result.error) {
    return (
      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
        <XCircle className="h-2.5 w-2.5" />
        Error
      </Badge>
    );
  }
  if (result.matched) {
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
        <CheckCircle2 className="h-2.5 w-2.5" />
        Match ({result.score}%)
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 bg-red-50 text-red-600 border-red-200">
      <XCircle className="h-2.5 w-2.5" />
      No match ({result.score}%)
    </Badge>
  );
}

function ExpandedDetails({ details }: { details: any }) {
  const sources = ["royalMail", "councilTax", "pricePaid"] as const;
  const checkedSources = sources.filter(s => details?.[s] && !details[s].skipped);
  const skippedSources = sources.filter(s => !details?.[s] || details[s]?.skipped);

  return (
    <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
      {checkedSources.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sources checked</p>
          {checkedSources.map(source => {
            const result = details[source];
            return (
              <div key={source} className="rounded-md border border-border/40 bg-slate-50/50 p-2.5 space-y-1.5" data-testid={`history-source-${source}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <SourceIcon source={source} />
                    <span className="text-xs font-medium"><SourceLabel source={source} /></span>
                  </div>
                  <SourceStatusBadge result={result} />
                </div>

                {result.matchedAddress && (
                  <div className="text-[11px] text-muted-foreground">
                    {source === "royalMail" && result.matchedAddress && (
                      <p>
                        {[result.matchedAddress.line_1, result.matchedAddress.line_2, result.matchedAddress.line_3, result.matchedAddress.post_town, result.matchedAddress.postcode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {source === "councilTax" && result.matchedAddress && (
                      <p>
                        {[result.matchedAddress.addr1, result.matchedAddress.addr2, result.matchedAddress.addr3, result.matchedAddress.postcode]
                          .filter(Boolean)
                          .join(", ")}
                        {result.council && <span className="text-muted-foreground/60"> ({result.council})</span>}
                      </p>
                    )}
                    {source === "pricePaid" && result.matchedAddress && (
                      <p>
                        {[result.matchedAddress.saon, result.matchedAddress.paon, result.matchedAddress.street, result.matchedAddress.town, result.matchedAddress.postcode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                )}

                {result.notCovered && (
                  <p className="text-[11px] text-muted-foreground">Postcode not in this dataset ({result.totalAddresses || 0} addresses)</p>
                )}

                {source === "pricePaid" && result.saleHistory && result.saleHistory.length > 0 && (
                  <div className="text-[11px] text-muted-foreground">
                    {result.saleHistory.length} sale{result.saleHistory.length !== 1 ? "s" : ""} recorded
                  </div>
                )}

                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                  <Shield className="h-2.5 w-2.5" />
                  <SourceLicense source={source} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {skippedSources.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Not checked</p>
          <div className="flex flex-wrap gap-1.5">
            {skippedSources.map(source => (
              <span key={source} className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                <SourceIcon source={source} />
                <SourceLabel source={source} />
              </span>
            ))}
          </div>
        </div>
      )}

      {details?.sourcesChecked != null && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
          <span>{details.sourcesChecked} source{details.sourcesChecked !== 1 ? "s" : ""} checked</span>
          {details.matchScore != null && (
            <>
              <span>·</span>
              <span>Best confidence: {details.matchScore}%</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ValidationHistory({ validations, isLoading }: ValidationHistoryProps) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
        <div className="flex items-center justify-between gap-1">
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
            data-testid="input-search-history"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-3">
            {filteredValidations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                <MapPin className="h-10 w-10 mb-2 opacity-20" />
                <p>No validation history found</p>
              </div>
            ) : (
              filteredValidations.map((v, i) => {
                const details = v.details as any;
                const isExpanded = expandedId === v.id;
                const sources = ["royalMail", "councilTax", "pricePaid"] as const;
                const checkedSources = sources.filter(s => details?.[s] && !details[s].skipped);

                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group relative rounded-xl border border-border/50 bg-white hover:border-blue-200 transition-all duration-300 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : v.id)}
                    data-testid={`card-validation-${v.id}`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${v.isValid ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {v.isValid ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground flex items-center gap-2 flex-wrap">
                              <span>{v.postcode}</span>
                              {v.isValid ? (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                                  VALID
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200">
                                  INVALID
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-0.5">
                              {[v.line1, v.line2, v.town].filter(Boolean).join(", ")}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/50 font-mono">
                                {v.createdAt && format(new Date(v.createdAt), "MMM d, h:mm a")}
                              </span>
                              {checkedSources.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {checkedSources.map(s => {
                                    const r = details[s];
                                    const color = r.notCovered ? "text-muted-foreground/40" : r.matched ? "text-emerald-500" : "text-red-400";
                                    return (
                                      <span key={s} className={color} title={`${s}: ${r.notCovered ? 'Not covered' : r.matched ? `Match (${r.score}%)` : `No match (${r.score}%)`}`}>
                                        <SourceIcon source={s} />
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              {details?.matchScore != null && (
                                <span className="text-[10px] text-muted-foreground/40">{details.matchScore}% confidence</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-muted-foreground/30 mt-1">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ExpandedDetails details={details} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
