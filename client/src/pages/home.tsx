import { AddressForm } from "@/components/address-form";
import { ValidationHistory } from "@/components/validation-history";
import { useValidations } from "@/hooks/use-validations";
import { motion } from "framer-motion";
import { ClipboardEdit, Search, ShieldCheck, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { data: validations = [], isLoading } = useValidations();

  // Statistics
  const totalChecks = validations.length;
  const validChecks = validations.filter(v => v.isValid).length;
  const validPercentage = totalChecks > 0 ? Math.round((validChecks / totalChecks) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/40 to-transparent -z-10" />
      <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-blue-200/20 blur-3xl -z-10" />
      <div className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] rounded-full bg-indigo-200/20 blur-3xl -z-10" />

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <header className="mb-12 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-2">
              <span className="text-primary">UK</span> Address Validator
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Professional address verification service powered by official postcode data.
              Ensure your delivery data is accurate and up-to-date.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-4 md:gap-8 pt-4"
          >
            <div className="px-6 py-3 bg-white rounded-full shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-600">
                <strong className="text-slate-900">{totalChecks}</strong> Checks Performed
              </span>
            </div>
            <div className="px-6 py-3 bg-white rounded-full shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-slate-600">
                <strong className="text-slate-900">{validPercentage}%</strong> Validity Rate
              </span>
            </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-7 h-full"
          >
            <AddressForm />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-5 h-full"
          >
            <ValidationHistory validations={validations} isLoading={isLoading} />
          </motion.div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
          data-testid="section-how-it-works"
        >
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">How it Works</h2>
          <p className="text-sm text-slate-500 text-center mb-8 max-w-lg mx-auto">
            Your address is checked against two independent official data sources for reliable verification.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: 1,
                icon: ClipboardEdit,
                title: "Enter your address",
                description: "Type in the street address, town, and postcode you want to verify.",
              },
              {
                step: 2,
                icon: Search,
                title: "Cross-reference two sources",
                description: "We look up your postcode with Ideal Postcodes (Royal Mail PAF data) and open address records published by UK local authorities.",
              },
              {
                step: 3,
                icon: ShieldCheck,
                title: "Fuzzy matching & scoring",
                description: "Each source compares your input against known addresses using smart matching that handles abbreviations, spelling differences, and formatting.",
              },
              {
                step: 4,
                icon: FileText,
                title: "Get your results",
                description: "You receive a confidence score from each source, a clear pass or fail verdict, and suggestions for close matches if the exact address isn't found.",
              },
            ].map((item) => (
              <Card key={item.step} className="overflow-visible relative">
                <CardContent className="pt-6 pb-5 px-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-primary shrink-0">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-primary tracking-wide uppercase">Step {item.step}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        <footer className="mt-20 border-t border-slate-200 pt-8 text-center text-sm text-slate-400">
          <p>© 2024 UK Address Validator. All data processed securely.</p>
        </footer>
      </div>
    </div>
  );
}
