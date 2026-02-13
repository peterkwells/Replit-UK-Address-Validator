import { AddressForm } from "@/components/address-form";
import { ValidationHistory } from "@/components/validation-history";
import { useValidations } from "@/hooks/use-validations";
import { motion } from "framer-motion";

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

        <footer className="mt-20 border-t border-slate-200 pt-8 text-center text-sm text-slate-400">
          <p>© 2024 UK Address Validator. All data processed securely.</p>
        </footer>
      </div>
    </div>
  );
}
