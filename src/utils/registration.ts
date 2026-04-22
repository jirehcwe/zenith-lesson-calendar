import { Session } from "@/types";
import { replaceUrlPlaceholders } from "./campaign";

export function buildRegistrationUrl(
  baseFormUrl: string,
  session: Pick<Session, "prefill" | "prefillField">
): string {
  const joiner = baseFormUrl.includes("?") ? "&" : "?";
  const raw = `${baseFormUrl}${joiner}entry.${session.prefillField}=${encodeURIComponent(session.prefill)}`;
  return replaceUrlPlaceholders(raw);
}
