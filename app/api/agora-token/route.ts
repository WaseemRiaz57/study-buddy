import { NextResponse } from "next/server";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const CHANNEL_NAME_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const channelName = String(searchParams.get("channelName") || "").trim();
  const uidParam = searchParams.get("uid");
  const uid = uidParam ? Number(uidParam) : 0;

  if (!CHANNEL_NAME_PATTERN.test(channelName)) {
    return NextResponse.json(
      { error: "channelName must be 1-64 characters and contain only letters, numbers, '_' or '-'" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(uid) || uid < 0) {
    return NextResponse.json({ error: "uid must be a non-negative integer" }, { status: 400 });
  }

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return NextResponse.json(
      { error: "Agora environment variables are not configured" },
      { status: 500 }
    );
  }

  const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 3600;

  const generatedToken = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpiredTs
  );

  return NextResponse.json({ token: generatedToken });
}
