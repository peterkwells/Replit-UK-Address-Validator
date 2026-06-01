export function GridLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center p-8">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm w-full max-w-3xl p-6">
        <h3 className="font-semibold text-slate-900 mb-0.5">OGL Exemptions & Data Privacy</h3>
        <p className="text-xs font-medium text-slate-400 mb-4">How we handle licence exemptions</p>

        <p className="text-sm text-slate-500 leading-relaxed mb-5">
          The Open Government Licence excludes certain categories of information from re-use.
          We have reviewed the exemptions that could apply to the council address data used by this service:
        </p>

        <div className="divide-y divide-slate-100">

          {/* Row 1 — Personal data */}
          <div className="grid grid-cols-[200px_1fr] gap-6 py-4 first:pt-0">
            <div className="pt-0.5">
              <span className="font-semibold text-slate-700 text-sm">Personal data.</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              The OGL does not cover personal data. Please ensure you take responsibility
              for following data protection law if you use this data.
            </p>
          </div>

          {/* Row 2 — Third-party rights (disputed) */}
          <div className="grid grid-cols-[200px_1fr] gap-6 py-4">
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

          {/* Row 3 — Non-endorsement */}
          <div className="grid grid-cols-[200px_1fr] gap-6 py-4">
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
      </div>
    </div>
  );
}
