import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserProfile, UserPurpose } from "@/lib/types";

export const dynamic = "force-dynamic";

interface DbUserProfile {
  id: string;
  walletAddress: string;
  displayName: string;
  email: string | null;
  organizationName: string | null;
  purpose: string;
  purposeDetails: string | null;
  signedMessage: string;
  signature: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const validPurposes = new Set<UserPurpose>([
  "saving_money",
  "welfare_fund",
  "salary_dispensation",
]);

async function ensureUserProfileTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserProfile" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "walletAddress" TEXT NOT NULL,
      "displayName" TEXT NOT NULL,
      "email" TEXT,
      "organizationName" TEXT,
      "purpose" TEXT NOT NULL,
      "purposeDetails" TEXT,
      "signedMessage" TEXT NOT NULL,
      "signature" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_walletAddress_key"
    ON "UserProfile"("walletAddress")
  `);
}

function toTimestamp(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function toUserProfile(profile: DbUserProfile): UserProfile {
  return {
    id: profile.id,
    walletAddress: profile.walletAddress,
    displayName: profile.displayName,
    email: profile.email ?? undefined,
    organizationName: profile.organizationName ?? undefined,
    purpose: profile.purpose as UserPurpose,
    purposeDetails: profile.purposeDetails ?? undefined,
    signedMessage: profile.signedMessage,
    signature: profile.signature,
    createdAt: toTimestamp(profile.createdAt),
    updatedAt: toTimestamp(profile.updatedAt),
  };
}

export async function GET(req: NextRequest) {
  try {
    await ensureUserProfileTable();

    const walletAddress = req.nextUrl.searchParams.get("wallet")?.trim();
    if (!walletAddress) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const profiles = await prisma.$queryRaw<DbUserProfile[]>`
      SELECT id, walletAddress, displayName, email, organizationName, purpose,
             purposeDetails, signedMessage, signature, createdAt, updatedAt
      FROM UserProfile
      WHERE lower(walletAddress) = lower(${walletAddress})
      LIMIT 1
    `;

    return NextResponse.json(
      { profile: profiles[0] ? toUserProfile(profiles[0]) : null },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureUserProfileTable();

    const body = await req.json();
    const walletAddress = String(body.walletAddress ?? "").trim();
    const displayName = String(body.displayName ?? "").trim();
    const purpose = String(body.purpose ?? "") as UserPurpose;
    const signedMessage = String(body.signedMessage ?? "").trim();
    const signature = String(body.signature ?? "").trim();

    if (!walletAddress || !displayName || !validPurposes.has(purpose)) {
      return NextResponse.json({ error: "Missing required profile data" }, { status: 400 });
    }

    if (!signedMessage || !signature) {
      return NextResponse.json({ error: "Signed wallet message is required" }, { status: 400 });
    }

    const email = body.email ? String(body.email).trim() : null;
    const organizationName = body.organizationName
      ? String(body.organizationName).trim()
      : null;
    const purposeDetails = body.purposeDetails
      ? String(body.purposeDetails).trim()
      : null;
    const id = body.id ? String(body.id) : randomUUID();

    await prisma.$executeRaw`
      INSERT INTO UserProfile (
        id, walletAddress, displayName, email, organizationName, purpose,
        purposeDetails, signedMessage, signature, createdAt, updatedAt
      )
      VALUES (
        ${id}, ${walletAddress}, ${displayName}, ${email}, ${organizationName},
        ${purpose}, ${purposeDetails}, ${signedMessage}, ${signature},
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT(walletAddress) DO UPDATE SET
        displayName = excluded.displayName,
        email = excluded.email,
        organizationName = excluded.organizationName,
        purpose = excluded.purpose,
        purposeDetails = excluded.purposeDetails,
        signedMessage = excluded.signedMessage,
        signature = excluded.signature,
        updatedAt = CURRENT_TIMESTAMP
    `;

    const profiles = await prisma.$queryRaw<DbUserProfile[]>`
      SELECT id, walletAddress, displayName, email, organizationName, purpose,
             purposeDetails, signedMessage, signature, createdAt, updatedAt
      FROM UserProfile
      WHERE lower(walletAddress) = lower(${walletAddress})
      LIMIT 1
    `;

    if (!profiles[0]) {
      return NextResponse.json({ error: "Failed to reload saved profile" }, { status: 500 });
    }

    return NextResponse.json({ profile: toUserProfile(profiles[0]) }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save user profile" }, { status: 500 });
  }
}
