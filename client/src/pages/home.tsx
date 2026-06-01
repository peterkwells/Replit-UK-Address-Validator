import { AddressForm } from "@/components/address-form";
import { ValidationHistory } from "@/components/validation-history";
import { useValidations } from "@/hooks/use-validations";
import { motion } from "framer-motion";
import { ClipboardEdit, Search, ShieldCheck, FileText, Scale, ExternalLink, Landmark, Mail, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { data: validations = [], isLoading } = useValidations();

  // Statistics
  const totalChecks = validations.length;
  const validChecks = validations.filter(v => v.isValid).length;
  const validPercentage = totalChecks > 0 ? Math.round((validChecks / totalChecks) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 relative overflow-hidden font-sans">
      <div className="w-full bg-amber-500 text-white text-center px-4 py-2" data-testid="banner-experiment">
        <p className="text-sm font-medium">
          This address validator is an experiment. Do not rely on it. Read more on{" "}
          <a href="https://peterkwells.com/2026/03/09/experimenting-with-using-replit-to-build-a-postal-address-validator/" target="_blank" rel="noopener noreferrer" className="underline font-semibold" data-testid="link-peterkwells">peterkwells.com</a>
        </p>
      </div>

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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">
              <span className="text-primary">UK</span> Address Validator
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Check any UK address against multiple official data sources.
              See how confident each source is, what it costs, and how freely you can re-use the data.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-3 md:gap-4 pt-4 flex-wrap"
          >
            <div className="px-4 py-2.5 bg-white rounded-md shadow-sm border border-slate-100 flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-slate-600">
                <strong className="text-slate-900">Accuracy</strong>
                <span className="hidden sm:inline"> &mdash; confidence scores from each source</span>
              </span>
            </div>
            <div className="px-4 py-2.5 bg-white rounded-md shadow-sm border border-slate-100 flex items-center gap-2.5">
              <Scale className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-slate-600">
                <strong className="text-slate-900">Licensing</strong>
                <span className="hidden sm:inline"> &mdash; re-use rights rated per source</span>
              </span>
            </div>
            <div className="px-4 py-2.5 bg-white rounded-md shadow-sm border border-slate-100 flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-slate-600">
                <strong className="text-slate-900">Cost</strong>
                <span className="hidden sm:inline"> &mdash; free sources clearly marked</span>
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-4 md:gap-6 pt-3"
          >
            <div className="px-5 py-2 bg-white/70 rounded-full shadow-sm border border-slate-100 flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-600">
                <strong className="text-slate-900">{totalChecks}</strong> Checks
              </span>
            </div>
            <div className="px-5 py-2 bg-white/70 rounded-full shadow-sm border border-slate-100 flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-slate-600">
                <strong className="text-slate-900">{validPercentage}%</strong> Valid
              </span>
            </div>
          </motion.div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <AddressForm />
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
          data-testid="section-how-it-works"
        >
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">How it Works</h2>
          <p className="text-sm text-slate-500 text-center mb-8 max-w-lg mx-auto">
            Your address is checked against up to three independent official data sources for reliable verification.
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
                title: "Choose your sources",
                description: "Select which data sources to check against. Royal Mail PAF costs approx. 2p per lookup; Council Tax and Land Registry checks are free.",
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

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="overflow-visible">
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center h-7 w-7 rounded-md bg-blue-50 text-blue-600 shrink-0">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">Royal Mail PAF</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  The most comprehensive UK address list, maintained by Royal Mail and accessed via the
                  Ideal Postcodes API. Covers every deliverable address in the UK. Ideal for confirming
                  that an address exists and is formatted correctly. Each lookup costs approximately 2p.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-visible">
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center h-7 w-7 rounded-md bg-amber-50 text-amber-600 shrink-0">
                    <Database className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">Council Tax Records</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Open data address lists published by 51 UK local authorities, containing around 5.7 million
                  property records. Coverage varies by council area. Free to use. Useful as an independent
                  cross-check against a completely separate data source.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-visible">
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center h-7 w-7 rounded-md bg-emerald-50 text-emerald-600 shrink-0">
                    <Landmark className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">Land Registry Price Paid</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  HM Land Registry records of residential property sales in England and Wales from 2013 to 2025,
                  covering approximately 12.2 million transactions. Free to use. Confirms whether a property
                  has been sold, and shows sale prices and dates.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-visible mt-4">
            <CardContent className="pt-5 pb-5 px-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-3">Understanding Your Results</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-slate-500 leading-relaxed">
                <div>
                  <span className="font-medium text-slate-700">Confidence score.</span>{" "}
                  A percentage showing how closely your input matches the best address found in each source.
                  100% means an exact match; lower scores indicate partial matches such as a correct street
                  but wrong house number.
                </div>
                <div>
                  <span className="font-medium text-slate-700">Pass / Fail.</span>{" "}
                  An address passes when the confidence score is 80% or above in at least one checked source.
                  If all sources return below 80%, the address is marked as invalid.
                </div>
                <div>
                  <span className="font-medium text-slate-700">Not covered.</span>{" "}
                  Some sources have limited geographic coverage. "Not covered" means the postcode does not
                  appear in that particular dataset &mdash; it does not mean the address is invalid.
                </div>
                <div>
                  <span className="font-medium text-slate-700">Suggestions.</span>{" "}
                  When an exact match isn't found, you'll see nearby addresses at the same postcode. These
                  can help identify typos or confirm the correct house number or flat designation.
                </div>
                <div>
                  <span className="font-medium text-slate-700">Licence re-use confidence.</span>{" "}
                  Each source is rated for how freely you can re-use its address data.{" "}
                  <span className="text-emerald-600 font-medium">High</span> means the data is openly
                  licensed for any purpose (e.g. OGL v3.0).{" "}
                  <span className="text-amber-600 font-medium">Medium</span> means the data itself is
                  open but contains address components from restricted sources like OS or Royal Mail.{" "}
                  <span className="text-red-500 font-medium">Low</span> means re-use is restricted and
                  may require a separate commercial licence.
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
          data-testid="section-data-licensing"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scale className="h-5 w-5 text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-900 text-center">Data Sources & Licensing</h2>
          </div>
          <p className="text-sm text-slate-500 text-center mb-8 max-w-lg mx-auto">
            This service uses three officially licensed data sources. All data is used in compliance with the terms below.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="overflow-visible">
              <CardContent className="pt-6 pb-5 px-6">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-slate-900">Ideal Postcodes</h3>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200">Low re-use</Badge>
                </div>
                <p className="text-xs font-medium text-slate-400 mb-3">Royal Mail Postcode Address File (PAF)</p>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Address lookups are performed via the Ideal Postcodes API, which provides access to Royal Mail's
                  Postcode Address File. Data is used on a per-lookup basis for address verification only and is
                  not stored or redistributed as a standalone database.
                </p>
                <div className="bg-slate-50 rounded-md p-3 mb-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Contains Royal Mail data &copy; Royal Mail copyright and database right.
                    Contains Ordnance Survey data &copy; Crown copyright and database right.
                  </p>
                </div>
                <a
                  href="https://ideal-postcodes.co.uk/termsandconditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium"
                  data-testid="link-ideal-postcodes-terms"
                >
                  Ideal Postcodes Terms of Service
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>

            <Card className="overflow-visible">
              <CardContent className="pt-6 pb-5 px-6">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-slate-900">Open Address Data</h3>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">Re-use rights disputed</Badge>
                </div>
                <p className="text-xs font-medium text-slate-400 mb-3">UK Local Authority Council Tax Address Lists</p>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Address records are sourced from Council Tax address lists published as open data by UK local
                  authorities under the Open Government Licence. However, Ordnance Survey and GeoPlace have
                  written to Datadaptive claiming that most of these datasets contain OS/GeoPlace/Royal Mail
                  intellectual property. The re-use rights for these datasets are currently disputed — see the
                  OGL exemptions section below for full details.
                </p>
                <div className="bg-slate-50 rounded-md p-3 mb-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Contains public sector information licensed under the
                    {" "}
                    <a
                      href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Open Government Licence v3.0
                    </a>.
                    Data compiled by Datadaptive from individual council releases.
                  </p>
                </div>
                <a
                  href="https://www.datadaptive.com/addr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium"
                  data-testid="link-datadaptive"
                >
                  View source datasets at Datadaptive
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>

            <Card className="overflow-visible">
              <CardContent className="pt-6 pb-5 px-6">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-slate-900">HM Land Registry</h3>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">Medium re-use</Badge>
                </div>
                <p className="text-xs font-medium text-slate-400 mb-3">Price Paid Data (2013-2025)</p>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Property sale records are sourced from HM Land Registry's Price Paid Data, covering
                  residential property transactions in England and Wales. This data confirms whether a
                  property has been sold and provides sale history including prices and dates.
                </p>
                <div className="bg-slate-50 rounded-md p-3 mb-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Contains HM Land Registry data &copy; Crown copyright and database right.
                    Licensed under the{" "}
                    <a
                      href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Open Government Licence v3.0
                    </a>.
                  </p>
                </div>
                <a
                  href="https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium"
                  data-testid="link-land-registry"
                >
                  HM Land Registry Price Paid Data
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-visible mt-4">
            <CardContent className="pt-6 pb-5 px-6">
              <h3 className="font-semibold text-slate-900 mb-1">OGL Exemptions & Data Privacy</h3>
              <p className="text-xs font-medium text-slate-400 mb-3">How we handle licence exemptions</p>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                The Open Government Licence excludes certain categories of information from re-use.
                We have reviewed the exemptions that could apply to the council address data used by this service:
              </p>
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-[180px_1fr] gap-6 py-4 first:pt-0">
                  <div className="pt-0.5">
                    <span className="font-semibold text-slate-700 text-sm">Personal data.</span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    The OGL does not cover personal data. Please ensure you take responsibility
                    for following data protection law if you use this data.
                  </p>
                </div>
                <div className="grid grid-cols-[180px_1fr] gap-6 py-4">
                  <div className="pt-0.5">
                    <span className="font-semibold text-slate-700 text-sm leading-snug">
                      Third-party rights —
                      <span className="block font-medium text-amber-600">disputed (updated May 2026).</span>
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 leading-relaxed space-y-3">
                    <p>
                      The OGL does not cover intellectual property the council is not authorised to license.
                      Ordnance Survey and GeoPlace have written to Datadaptive claiming that most of the
                      council tax datasets contain OS/GeoPlace/Royal Mail intellectual property, because they
                      believe that councils typically maintain their address lists using Local Land and Property
                      Gazetteers (LLPGs), which are built on OS-licensed data. OS say that they only consider{" "}
                      <strong className="text-slate-700">Leeds, Wigan, and Bradford</strong> councils' data
                      as free of their third-party IP. For all other councils, OS say re-use without their
                      consent may infringe their rights.
                    </p>
                    <p>
                      Datadaptive's Owen Boswarva disputes this position, arguing the councils legitimately
                      released the data as open data, that OS's legal approach is flawed, and that they have
                      not provided evidence for some of their statements.
                    </p>
                    <p>
                      You can read{" "}
                      <a
                        href="https://www.owenboswarva.com/FOI/20260508%20EMF%20OS%20Legal%20re%20Council%20Tax%20address%20datasets.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-slate-700 hover:text-slate-900"
                      >
                        Ordnance Survey's letter (8 May 2026)
                      </a>{" "}
                      and{" "}
                      <a
                        href="https://www.owenboswarva.com/blog/post-addr88.htm"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-slate-700 hover:text-slate-900"
                      >
                        Owen Boswarva's reply (22 May 2026)
                      </a>{" "}
                      to form your own view. The dispute is unresolved.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-[180px_1fr] gap-6 py-4">
                  <div className="pt-0.5">
                    <span className="font-semibold text-slate-700 text-sm">Non-endorsement.</span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Use of this data does not imply official status or endorsement by any council or
                    government body. Results should be treated as indicative and not as an official
                    confirmation of address status.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12"
        >
          <ValidationHistory validations={validations} isLoading={isLoading} />
        </motion.section>

        <footer className="mt-20 border-t border-slate-200 pt-8 text-center text-sm text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} UK Address Validator. All data processed securely.
          </p>
          <p className="mt-1 text-xs">
            Contains Royal Mail data &copy; Royal Mail copyright and database right.
            Contains HM Land Registry data &copy; Crown copyright and database right.
            Contains public sector information licensed under the Open Government Licence v3.0.
          </p>
        </footer>
      </div>
    </div>
  );
}
