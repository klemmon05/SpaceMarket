import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0D10] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold tracking-tight text-sm">ORBITALSLOTS</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-[#A0A6B0] hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-white text-black hover:bg-white/90 text-xs font-medium">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-widest text-[#A0A6B0] uppercase mb-6">
            Launch Slot Brokerage Platform
          </p>
          <h1 className="text-4xl font-medium tracking-tight leading-tight mb-6">
            Reserve your launch slot.<br />Move your payload to orbit.
          </h1>
          <p className="text-[#A0A6B0] text-base leading-relaxed mb-10 max-w-lg">
            OrbitalSlots connects satellite operators with rideshare launch providers. 
            Browse verified launch opportunities, submit reservation requests, and manage 
            your manifest — all in one place.
          </p>
          <div className="flex gap-3">
            <Link href="/signup">
              <Button className="bg-white text-black hover:bg-white/90 text-sm font-medium">
                Request access
              </Button>
            </Link>
            <Link href="/app/opportunities">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 text-sm">
                Browse opportunities
              </Button>
            </Link>
          </div>
        </div>

        <Separator className="my-24 bg-white/10" />

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              label: "Discovery",
              title: "Browse the manifest",
              desc: "Filter upcoming rideshare slots by vehicle, orbit regime, altitude, inclination, and payload constraints.",
            },
            {
              label: "Workflow",
              title: "Managed reservations",
              desc: "Submit payload specs, receive matches from our brokerage team, and authorize deposits — all tracked in one place.",
            },
            {
              label: "Operations",
              title: "Mission control dashboard",
              desc: "Admins manage the full deal lifecycle from triage through launch, with full audit logging and CRM-style follow-ups.",
            },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-xs font-medium tracking-widest text-[#A0A6B0] uppercase mb-3">
                {f.label}
              </p>
              <h3 className="text-base font-medium mb-2">{f.title}</h3>
              <p className="text-sm text-[#A0A6B0] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <span className="text-xs text-[#A0A6B0]">ORBITALSLOTS</span>
          <span className="text-xs text-[#A0A6B0]">© 2025 All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
