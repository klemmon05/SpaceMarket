"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AdminImportPage() {
  const [json, setJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: number; errors?: string[]; error?: string } | null>(null);

  async function handleImport() {
    setLoading(true);
    setResult(null);
    try {
      const data = JSON.parse(json);
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const out = await res.json();
      setResult(out);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Invalid JSON" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/opportunities" className="text-xs text-[#A0A6B0] hover:text-white transition-colors">← Opportunities</Link>
        <h1 className="mt-3 text-xl font-medium text-white">JSON Import</h1>
        <p className="mt-1 text-sm text-[#A0A6B0]">
          Bulk import launch opportunities. Deduplication by providerOrgId + missionName + windowStart + windowEnd.
        </p>
      </div>

      <div className="rounded border border-white/10 bg-[#161A22] p-4 space-y-2">
        <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Expected Format</p>
        <pre className="text-xs text-[#A0A6B0] overflow-auto">
{`{
  "opportunities": [
    {
      "providerOrgId": "uuid",
      "vehicle": "Falcon 9",
      "missionName": "Transporter-15",
      "launchSite": "SLC-40",
      "launchWindowStart": "2025-06-01",
      "launchWindowEnd": "2025-06-30",
      "orbitRegime": "SSO",
      "altitudeKm": 550,
      "inclinationDeg": 97.6,
      "maxMassKg": 200,
      "capacityRemaining": 5,
      "status": "PUBLISHED"
    }
  ]
}`}
        </pre>
      </div>

      <div className="space-y-3">
        <Textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder='Paste JSON here...'
          rows={12}
          className="bg-[#12151B] border-white/10 text-white font-mono text-xs resize-none placeholder:text-[#A0A6B0]"
        />
        <Button
          onClick={handleImport}
          disabled={loading || !json.trim()}
          className="bg-white text-black hover:bg-white/90 text-sm font-medium"
        >
          {loading ? "Importing..." : "Import"}
        </Button>
      </div>

      {result && (
        <div className={`rounded border p-4 ${result.error ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
          {result.error ? (
            <p className="text-sm text-red-400">{result.error}</p>
          ) : (
            <div>
              <p className="text-sm text-emerald-400">{result.success} opportunity/ies imported.</p>
              {result.errors && result.errors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {result.errors.map((e, i) => <li key={i} className="text-xs text-amber-400">{e}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
