export interface GmailEmail {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  preview: string;
  receivedAt: string;
}

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";

function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: (match[1] ?? "").trim() || match[2]!, email: match[2]!.trim() };
  return { name: from.trim(), email: from.trim() };
}

/** Fetches unread Gmail messages using an OAuth access token. Throws on API failure. */
export async function fetchUnreadEmails(accessToken: string, max = 50): Promise<GmailEmail[]> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const listRes = await fetch(`${GMAIL}/messages?q=is:unread&maxResults=${max}`, { headers });
  if (!listRes.ok) throw new Error(`Gmail list failed: ${listRes.status}`);
  const list = (await listRes.json()) as { messages?: { id: string }[] };
  const ids = (list.messages ?? []).slice(0, max).map((m) => m.id);

  const results = await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(`${GMAIL}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, { headers });
      if (!res.ok) return null;
      const msg = (await res.json()) as {
        id: string;
        snippet?: string;
        internalDate?: string;
        payload?: { headers?: { name: string; value: string }[] };
      };
      const h = (name: string) =>
        msg.payload?.headers?.find((x) => x.name.toLowerCase() === name)?.value ?? "";
      const { name, email } = parseFrom(h("from"));
      return {
        id: msg.id,
        senderName: name,
        senderEmail: email,
        subject: h("subject") || "(no subject)",
        preview: msg.snippet ?? "",
        receivedAt: new Date(Number(msg.internalDate ?? Date.now())).toISOString(),
      } satisfies GmailEmail;
    }),
  );

  return results.filter((r): r is GmailEmail => r !== null);
}
