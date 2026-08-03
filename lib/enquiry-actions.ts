"use server";

import { createEnquiry } from "@/lib/listings";

export interface EnquiryState {
  error: string | null;
  sent?: boolean;
}

/**
 * Validated on the server even though the table has its own CHECK constraints.
 * The constraints are the guarantee; this is what turns a rejection into a
 * sentence a person can act on rather than a Postgres error code.
 */
export async function sendEnquiry(
  _prev: EnquiryState,
  formData: FormData
): Promise<EnquiryState> {
  const read = (k: string) => String(formData.get(k) ?? "").trim();

  const listingId = read("listingId");
  const name = read("name");
  const email = read("email");
  const phone = read("phone");
  const message = read("message");
  const preferredViewing = read("preferredViewing");

  if (!listingId) return { error: "That property could not be identified. Please reload." };
  if (!name || name.length > 120) return { error: "Please give your name." };
  if (!email.includes("@") || email.length > 254) {
    return { error: "Please give an email address the landlord can reply to." };
  }
  if (phone.length > 40) return { error: "That phone number is too long." };
  if (!message) return { error: "Please say something about what you are looking for." };
  if (message.length > 2000) return { error: "That message is longer than we can send." };

  const result = await createEnquiry({
    listingId,
    name,
    email,
    phone,
    message,
    preferredViewing,
  });

  return result.ok ? { error: null, sent: true } : { error: result.error };
}
