import { PrismaClient, Role, OrgType, OrgRole, OpportunityStatus, RequestStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding OrbitalSlots...");

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@orbitalslots.com" },
    update: {},
    create: {
      supabaseId: "dev_admin_00000000",
      email: "admin@orbitalslots.com",
      name: "Mission Control",
      role: Role.ADMIN,
    },
  });
  console.log("✓ Admin user");

  // Create buyer org + user
  const buyerOrg = await prisma.organization.upsert({
    where: { id: "buyer-org-00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "buyer-org-00000000-0000-0000-0000-000000000001",
      name: "Apex Satellite Systems",
      type: OrgType.BUYER,
    },
  });

  const buyerUser = await prisma.user.upsert({
    where: { email: "buyer@apexsat.com" },
    update: {},
    create: {
      supabaseId: "dev_buyer_00000000",
      email: "buyer@apexsat.com",
      name: "Sarah Chen",
      role: Role.BUYER,
    },
  });

  await prisma.organizationMember.upsert({
    where: { userId_orgId: { userId: buyerUser.id, orgId: buyerOrg.id } },
    update: {},
    create: {
      userId: buyerUser.id,
      orgId: buyerOrg.id,
      roleInOrg: OrgRole.OWNER,
    },
  });

  await prisma.buyerProfile.upsert({
    where: { orgId: buyerOrg.id },
    update: {},
    create: {
      orgId: buyerOrg.id,
      industry: "Commercial EO",
    },
  });
  console.log("✓ Buyer user + org");

  // Create provider org + user
  const providerOrg = await prisma.organization.upsert({
    where: { id: "provider-org-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "provider-org-0000-0000-0000-000000000001",
      name: "Orbital Express Launch",
      type: OrgType.PROVIDER,
    },
  });

  const providerUser = await prisma.user.upsert({
    where: { email: "provider@orbexpress.com" },
    update: {},
    create: {
      supabaseId: "dev_provider_000000",
      email: "provider@orbexpress.com",
      name: "Marcus Webb",
      role: Role.PROVIDER,
    },
  });

  await prisma.organizationMember.upsert({
    where: { userId_orgId: { userId: providerUser.id, orgId: providerOrg.id } },
    update: {},
    create: {
      userId: providerUser.id,
      orgId: providerOrg.id,
      roleInOrg: OrgRole.OWNER,
    },
  });

  await prisma.providerProfile.upsert({
    where: { orgId: providerOrg.id },
    update: {},
    create: {
      orgId: providerOrg.id,
      verificationStatus: "VERIFIED",
      pointOfContact: "Marcus Webb",
    },
  });
  console.log("✓ Provider user + org");

  // Create launch opportunities
  const opps = [
    {
      id: "opp-00000000-0000-0000-0000-000000000001",
      vehicle: "Falcon 9",
      missionName: "Transporter-15",
      launchSite: "SLC-40, Cape Canaveral",
      launchWindowStart: new Date("2025-06-01"),
      launchWindowEnd: new Date("2025-06-30"),
      orbitRegime: "SSO",
      altitudeKm: 525,
      inclinationDeg: 97.6,
      dispenserType: "6U CubeSat",
      maxMassKg: 200,
      maxVolume: 50,
      priceGuidanceUsd: 12000,
      capacityRemaining: 8,
      status: OpportunityStatus.PUBLISHED,
    },
    {
      id: "opp-00000000-0000-0000-0000-000000000002",
      vehicle: "Electron",
      missionName: "Make It Rain 3",
      launchSite: "Launch Complex 1, New Zealand",
      launchWindowStart: new Date("2025-07-15"),
      launchWindowEnd: new Date("2025-08-15"),
      orbitRegime: "LEO",
      altitudeKm: 500,
      inclinationDeg: 45,
      maxMassKg: 150,
      maxVolume: 12,
      priceGuidanceUsd: 28000,
      capacityRemaining: 2,
      status: OpportunityStatus.PUBLISHED,
    },
    {
      id: "opp-00000000-0000-0000-0000-000000000003",
      vehicle: "Vega-C",
      missionName: "SSMS POC 2",
      launchSite: "Kourou ELS, French Guiana",
      launchWindowStart: new Date("2025-09-01"),
      launchWindowEnd: new Date("2025-09-30"),
      orbitRegime: "SSO",
      altitudeKm: 700,
      inclinationDeg: 98.2,
      dispenserType: "12U CubeSat",
      maxMassKg: 400,
      maxVolume: 100,
      priceGuidanceUsd: 18000,
      capacityRemaining: 12,
      status: OpportunityStatus.PUBLISHED,
    },
    {
      id: "opp-00000000-0000-0000-0000-000000000004",
      vehicle: "Falcon 9",
      missionName: "Bandwagon-6",
      launchSite: "SLC-40, Cape Canaveral",
      launchWindowStart: new Date("2025-10-01"),
      launchWindowEnd: new Date("2025-11-30"),
      orbitRegime: "MEO",
      altitudeKm: 2000,
      inclinationDeg: 55,
      maxMassKg: 500,
      maxVolume: 200,
      capacityRemaining: 4,
      status: OpportunityStatus.DRAFT,
    },
    {
      id: "opp-00000000-0000-0000-0000-000000000005",
      vehicle: "PSLV-CA",
      missionName: "PSLV-C68 Rideshare",
      launchSite: "SDSC SHAR, India",
      launchWindowStart: new Date("2025-12-01"),
      launchWindowEnd: new Date("2025-12-31"),
      orbitRegime: "SSO",
      altitudeKm: 600,
      inclinationDeg: 97.8,
      maxMassKg: 100,
      maxVolume: 20,
      priceGuidanceUsd: 9500,
      capacityRemaining: 6,
      status: OpportunityStatus.PUBLISHED,
    },
  ];

  for (const opp of opps) {
    await prisma.launchOpportunity.upsert({
      where: { id: opp.id },
      update: {},
      create: { ...opp, providerOrgId: providerOrg.id },
    });
  }
  console.log("✓ 5 launch opportunities");

  // Create payloads
  const payloads = [
    {
      id: "payload-0000-0000-0000-000000000001",
      name: "APEX-SAT 1",
      massKg: 6.5,
      volumeU: 6,
      dimsCm: "10x22.7x36.6",
      powerW: 10,
      desiredOrbit: "SSO",
      targetLaunchWindow: "Q2-Q3 2025",
      earliestReadiness: new Date("2025-04-01"),
      latestReadiness: new Date("2025-08-01"),
    },
    {
      id: "payload-0000-0000-0000-000000000002",
      name: "APEX-SAT 2",
      massKg: 12,
      volumeU: 12,
      dimsCm: "10x22.7x73.2",
      powerW: 20,
      desiredOrbit: "SSO",
      targetLaunchWindow: "Q3 2025",
    },
    {
      id: "payload-0000-0000-0000-000000000003",
      name: "ExperimentBus A",
      massKg: 85,
      volumeU: null,
      dimsCm: "60x60x40",
      powerW: 150,
      desiredOrbit: "LEO",
      targetLaunchWindow: "H2 2025",
      specialConstraints: "Requires outgassing period of 48h prior to integration",
    },
  ];

  for (const p of payloads) {
    await prisma.payload.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, orgId: buyerOrg.id },
    });
  }
  console.log("✓ 3 payloads");

  // Create reservation requests
  const requests = [
    {
      id: "req-00000000-0000-0000-0000-000000000001",
      buyerOrgId: buyerOrg.id,
      payloadId: "payload-0000-0000-0000-000000000001",
      opportunityId: "opp-00000000-0000-0000-0000-000000000001",
      status: RequestStatus.UNDER_REVIEW,
      notes: "Prefer early June launch. Payload will be ready for I&T by April 15.",
    },
    {
      id: "req-00000000-0000-0000-0000-000000000002",
      buyerOrgId: buyerOrg.id,
      payloadId: "payload-0000-0000-0000-000000000002",
      opportunityId: null,
      status: RequestStatus.SUBMITTED,
      notes: "Flexible on orbit — SSO preferred but LEO acceptable. Budget ~$15k.",
    },
    {
      id: "req-00000000-0000-0000-0000-000000000003",
      buyerOrgId: buyerOrg.id,
      payloadId: "payload-0000-0000-0000-000000000003",
      opportunityId: "opp-00000000-0000-0000-0000-000000000002",
      status: RequestStatus.RESERVED,
      notes: "Contract finalized. Ready to proceed.",
    },
  ];

  for (const r of requests) {
    await prisma.reservationRequest.upsert({
      where: { id: r.id },
      update: {},
      create: r,
    });
  }
  console.log("✓ 3 reservation requests");

  // Create a message thread for request 1
  const thread = await prisma.messageThread.upsert({
    where: { requestId: "req-00000000-0000-0000-0000-000000000001" },
    update: {},
    create: { requestId: "req-00000000-0000-0000-0000-000000000001" },
  });

  await prisma.message.create({
    data: {
      threadId: thread.id,
      senderUserId: adminUser.id,
      body: "Hi Sarah, we're reviewing your request for APEX-SAT 1. Can you confirm the dispenser type compatibility with 6U standard rails?",
      visibility: "ALL",
    },
  });

  // Create admin note
  await prisma.adminNote.create({
    data: {
      requestId: "req-00000000-0000-0000-0000-000000000001",
      authorUserId: adminUser.id,
      body: "Payload specs look good. Need to confirm ITAR compliance with provider before matching.",
    },
  });

  // Create audit logs
  await prisma.auditLog.create({
    data: {
      actorUserId: adminUser.id,
      action: "UPDATE_STATUS",
      entityType: "ReservationRequest",
      entityId: "req-00000000-0000-0000-0000-000000000001",
      before: { status: "SUBMITTED" },
      after: { status: "UNDER_REVIEW" },
    },
  });

  console.log("✓ Seed messages, notes, audit logs");
  console.log("\n✅ Seed complete!");
  console.log("\nTest accounts (use Supabase Auth or DEV_AUTH_BYPASS):");
  console.log("  Admin:    admin@orbitalslots.com");
  console.log("  Buyer:    buyer@apexsat.com");
  console.log("  Provider: provider@orbexpress.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
