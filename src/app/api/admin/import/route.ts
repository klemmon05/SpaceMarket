import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const opportunitySchema = z.object({
  providerOrgId: z.string().uuid(),
  vehicle: z.string().min(1),
  missionName: z.string().min(1),
  launchSite: z.string().min(1),
  launchWindowStart: z.string(),
  launchWindowEnd: z.string(),
  orbitRegime: z.string().min(1),
  altitudeKm: z.number().optional(),
  inclinationDeg: z.number().optional(),
  dispenserType: z.string().optional(),
  maxMassKg: z.number().optional(),
  maxVolume: z.number().optional(),
  priceGuidanceUsd: z.number().optional(),
  capacityRemaining: z.number().int().optional().default(1),
  itarNotes: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED"]).optional().default("DRAFT"),
});

const importSchema = z.object({
  opportunities: z.array(opportunitySchema),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { opportunities } = importSchema.parse(body);

    let success = 0;
    const errors: string[] = [];

    for (const opp of opportunities) {
      try {
        const existing = await prisma.launchOpportunity.findFirst({
          where: {
            providerOrgId: opp.providerOrgId,
            missionName: opp.missionName,
            launchWindowStart: new Date(opp.launchWindowStart),
            launchWindowEnd: new Date(opp.launchWindowEnd),
          },
        });

        if (existing) {
          errors.push(`Skipped duplicate: ${opp.missionName}`);
          continue;
        }

        await prisma.launchOpportunity.create({
          data: {
            providerOrgId: opp.providerOrgId,
            vehicle: opp.vehicle,
            missionName: opp.missionName,
            launchSite: opp.launchSite,
            launchWindowStart: new Date(opp.launchWindowStart),
            launchWindowEnd: new Date(opp.launchWindowEnd),
            orbitRegime: opp.orbitRegime,
            altitudeKm: opp.altitudeKm,
            inclinationDeg: opp.inclinationDeg,
            dispenserType: opp.dispenserType,
            maxMassKg: opp.maxMassKg,
            maxVolume: opp.maxVolume,
            priceGuidanceUsd: opp.priceGuidanceUsd,
            capacityRemaining: opp.capacityRemaining ?? 1,
            itarNotes: opp.itarNotes,
            status: opp.status ?? "DRAFT",
          },
        });
        success++;
      } catch (err) {
        errors.push(`Error importing ${opp.missionName}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    return NextResponse.json({ success, errors });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: `Validation error: ${err.issues[0]?.message ?? "invalid"}` }, { status: 400 });
    }
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
