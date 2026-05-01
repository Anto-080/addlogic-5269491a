/**
 * VPN / datacenter / proxy detection from ipapi.co's free JSON endpoint.
 *
 * Why: AddLogic's reward pool is region-priced. A user in a low-cost region
 * can otherwise spoof a high-CPM region (e.g. US/EU) via VPN and drain the
 * pool. We refuse the GPS multiplier bonus when the IP looks non-residential
 * or when GPS country and IP country disagree.
 */

export type IpInfo = {
  ip: string;
  country_code: string | null;
  country_name: string | null;
  asn: string | null;
  org: string | null;
  vpn_suspected: boolean;
  reason: string | null;
};

// Lightweight ASN/org substring blocklist. Hosting/VPN providers only — we
// deliberately don't include carrier ASNs.
const VPN_HOSTS = [
  "nordvpn", "expressvpn", "mullvad", "protonvpn", "surfshark", "private internet access",
  "pia", "windscribe", "cyberghost", "tunnelbear", "ivpn", "azirevpn",
  "digitalocean", "ovh", "hetzner", "linode", "vultr", "leaseweb", "m247",
  "amazon", "aws", "google cloud", "microsoft azure", "alibaba", "tencent",
  "choopa", "datacamp", "psychz", "constant", "contabo", "scaleway", "hostwinds",
];

export async function fetchIpInfo(): Promise<IpInfo | null> {
  try {
    const r = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const org = String(j?.org ?? "").toLowerCase();
    const asn = String(j?.asn ?? "");
    const lcAsn = asn.toLowerCase();
    const matchHost = VPN_HOSTS.find((h) => org.includes(h) || lcAsn.includes(h));
    return {
      ip: String(j?.ip ?? ""),
      country_code: j?.country_code ?? null,
      country_name: j?.country_name ?? null,
      asn,
      org: j?.org ?? null,
      vpn_suspected: !!matchHost,
      reason: matchHost ? `Datacenter / VPN ASN match: ${matchHost}` : null,
    };
  } catch {
    return null;
  }
}

/**
 * Reverse geocode using keyless geocode.maps.co (free tier). Returns ISO
 * country code, used to cross-check against the IP-derived country.
 */
export async function reverseGeocodeCountry(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { Accept: "application/json" } }
    );
    if (!r.ok) return null;
    const j = await r.json();
    const cc = j?.address?.country_code;
    return cc ? String(cc).toUpperCase() : null;
  } catch {
    return null;
  }
}
