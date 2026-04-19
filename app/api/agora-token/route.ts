import { NextResponse } from "next/server";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const channelName = searchParams.get("channelName");
  const uidParam = searchParams.get("uid");
  const uid = uidParam ? Number(uidParam) : 0;

  if (!channelName) {
    return NextResponse.json({ error: "channelName is required" }, { status: 400 });
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
