/** PUBLIC RFC8032 test vectors only. These are not credentials or secure production keys. */
import type { ServiceVerifierConfiguration } from "../../../lib/monitoring/service-authority";
import { SCOPE } from "./runtime-fixture";
const publicPem = (hex: string) => {
  const bytes = Buffer.from("302a300506032b6570032100" + hex, "hex").toString("base64");
  return "-----BEGIN PUBLIC KEY-----\n" + bytes.match(/.{1,64}/g)!.join("\n") + "\n-----END PUBLIC KEY-----\n";
};
export const SERVICE_VERIFICATION: ServiceVerifierConfiguration = {
  scope: SCOPE, serviceId: "fictional-everymcp", evidenceClass: "synthetic-fixture",
  keys: [
    { keyId: "fictional-rfc8032-one", publicKey: publicPem("d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a"), validFrom: "2026-11-01T00:00:00Z", validUntil: "2026-12-01T00:00:00Z", revoked: false, fixtureOnly: true },
    { keyId: "fictional-rfc8032-two", publicKey: publicPem("3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c"), validFrom: "2026-11-01T00:00:00Z", validUntil: "2027-01-01T00:00:00Z", revoked: false, fixtureOnly: true },
  ],
};
