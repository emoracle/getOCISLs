import { normalizeProtocol, ipToInt} from "./handleCIDR.mjs";

/**
 * Converts a CIDR notation string to a range of IP addresses represented as integer values.
 *
 * @param {string} cidr - The CIDR notation string (e.g., "192.168.1.0/24"). If empty or undefined, defaults to "0.0.0.0/0".
 * @returns {{ start: number, end: number }} An object containing the start and end of the IP range as unsigned 32-bit integers.
 * @throws {Error} If the CIDR mask is invalid (not a number between 0 and 32).
 */
function cidrToRange(cidr) {
  if (!cidr || cidr === '') cidr = '0.0.0.0/0';
  if (!cidr.includes('/')) return { start: ipToInt(cidr), end: ipToInt(cidr) };
  const [ip, maskStr] = cidr.split('/');
  const mask = Number(maskStr);
  if (Number.isNaN(mask) || mask < 0 || mask > 32) throw new Error(`Invalid CIDR: ${cidr}`);
  const ipInt = ipToInt(ip);
  const maskInt = mask === 0 ? 0 : (~((1 << (32 - mask)) - 1)) >>> 0;
  const start = (ipInt & maskInt) >>> 0;
  const end = (start + (2 ** (32 - mask)) - 1) >>> 0;
  return { start, end };
}

/**
 * Determines if range `a` fully contains range `b`.
 *
 * @param {{start: number, end: number}} a - The containing range.
 * @param {{start: number, end: number}} b - The range to check for containment.
 * @returns {boolean} True if `a` contains `b`, false otherwise.
 */
function rangeContains(a, b) {
  return a.start <= b.start && a.end >= b.end;
}

/**
 * Normalizes a port range object for network rules.
 *
 * @param {Object} [obj={}] - The object containing port information. Can have properties: fromPort, fromport, from, toPort, toport, to, or port.
 * @param {string} [protocol='all'] - The protocol type (e.g., 'all', 'icmp', 'tcp', 'udp').
 * @returns {{ from: number, to: number }} An object with normalized `from` and `to` port numbers.
 * @throws {Error} If the port numbers are invalid (not a number, out of range 0-65535).
 */
function normalizePortRange(obj = {}, protocol = 'all') {
  if (protocol === 'all' || protocol === 'icmp') {
    return { from: 0, to: 65535 };
  }
  const fp = obj.fromPort ?? obj.fromport ?? obj.from ?? obj.port ?? null;
  const tp = obj.toPort ?? obj.toport ?? obj.to ?? obj.port ?? null;
  if (fp == null && tp == null) return { from: 0, to: 65535 };
  const f = Number(fp);
  const t = Number(tp ?? fp);
  if ([f, t].some(n => Number.isNaN(n) || n < 0 || n > 65535)) {
    throw new Error(`Invalid port(s): ${fp}-${tp}`);
  }
  return { from: Math.min(f, t), to: Math.max(f, t) };
}

/**
 * Determines if port range `a` fully contains port range `b`.
 *
 * @param {{from: number, to: number}} a - The containing port range.
 * @param {{from: number, to: number}} b - The port range to check for containment.
 * @returns {boolean} True if range `a` contains range `b`, otherwise false.
 */
function portRangeContains(a, b) {
  return a.from <= b.from && a.to >= b.to;
}


/**
 * Normalizes a security rule object by standardizing its properties and computing additional fields.
 *
 * @param {Object} rule - The rule object to normalize.
 * @param {string} [rule.direction] - The direction of the rule ('ingress' or 'egress').
 * @param {string} [rule.protocol] - The protocol for the rule (e.g., 'tcp', 'udp', 'all').
 * @param {string|number} [rule.fromCidr] - The source CIDR block.
 * @param {string|number} [rule.fromip] - Alternative source IP or CIDR.
 * @param {string|number} [rule.source] - Alternative source IP or CIDR.
 * @param {string|number} [rule.toCidr] - The destination CIDR block.
 * @param {string|number} [rule.toip] - Alternative destination IP or CIDR.
 * @param {string|number} [rule.destination] - Alternative destination IP or CIDR.
 * @returns {Object} The normalized rule object with standardized properties and computed CIDR ranges.
 * @throws {Error} If the direction is missing or invalid.
 */
function normalizeRule(rule) {
  const direction = String(rule.direction || '').toLowerCase();
  if (direction !== 'ingress' && direction !== 'egress') {
    throw new Error(`Rule missing/invalid direction: ${JSON.stringify(rule)}`);
  }

  const protocol = normalizeProtocol(rule.protocol ?? 'all');
  const portRange = normalizePortRange(rule, protocol);

  const fromCidr = rule.fromCidr ?? rule.fromip ?? rule.source ?? '0.0.0.0/0';
  const toCidr   = rule.toCidr   ?? rule.toip   ?? rule.destination ?? '0.0.0.0/0';

  return {
    ...rule,
    direction,
    protocol,
    portRange,
    fromCidr,
    toCidr,
    _fromRange: cidrToRange(fromCidr),
    _toRange: cidrToRange(toCidr),
  };
}

/**
 * Determines whether rule B covers rule A and provides reasons for the decision.
 *
 * @param {Object} A - The rule to check for coverage.
 * @param {Object} B - The rule to check as the potential covering rule.
 * @returns {{ covered: boolean, reasons: string[] }} An object indicating if B covers A and the reasons why or why not.
 */
function coverageWhy(A, B) {
  const reasons = [];
  if (A.direction !== B.direction) return { covered: false, reasons };

  // protocol
  const protocolOK = (B.protocol === 'all' || B.protocol === A.protocol);
  if (!protocolOK) return { covered: false, reasons };
  reasons.push(`protocol ${B.protocol} is a superset of ${A.protocol}`);

  // ports
  const portsOK = portRangeContains(B.portRange, A.portRange);
  if (!portsOK) return { covered: false, reasons };
  reasons.push(`ports ${B.portRange.from}-${B.portRange.to} is a superset of ${A.portRange.from}-${A.portRange.to}`);

  // IP ranges
  const fromOK = rangeContains(B._fromRange, A._fromRange);
  if (!fromOK) return { covered: false, reasons };
  reasons.push(`source ${B.fromCidr} is a superset of ${A.fromCidr}`);

  const toOK = rangeContains(B._toRange, A._toRange);
  if (!toOK) return { covered: false, reasons };
  reasons.push(`dest ${B.toCidr} is a superset of ${A.toCidr}`);

  return { covered: true, reasons };
}

/**
 * Filter redundant rules. Returned removed items bevatten uitleg.
 * @param {Array<Object>} rules
 * @returns {{ kept: Array<Object>, removed: Array<Object> }}
 */
export function filterRedundantRules(rules) {
  const norm = rules.map(normalizeRule);

  const kept = [];
  const removed = [];

  for (let i = 0; i < norm.length; i++) {
    const r = norm[i];
    let redundant = false;

    for (let j = 0; j < norm.length; j++) {
      if (i === j) continue;
      const o = norm[j];

      // identiek? -> weg met latere duplicaten
      const identical =
        r.direction === o.direction &&
        r.protocol === o.protocol &&
        r.portRange.from === o.portRange.from &&
        r.portRange.to === o.portRange.to &&
        r._fromRange.start === o._fromRange.start && r._fromRange.end === o._fromRange.end &&
        r._toRange.start === o._toRange.start && r._toRange.end === o._toRange.end;

      if (identical && j < i) {
        removed.push({ ...r, coveredByIdx: j, coveredBy: o, why: ['identical to earlier rule'] });
        redundant = true;
        break;
      }

      const { covered, reasons } = coverageWhy(r, o);
      if (covered) {
        removed.push({ ...r, coveredByIdx: j, coveredBy: o, why: reasons });
        redundant = true;
        break;
      }
    }

    if (!redundant) kept.push(r);
  }

  return { kept, removed };
}

/**
 * Deduplicates ingress and egress security rules for a given subnet.
 *
 * Iterates over all security lists attached to the subnet, collects all ingress and egress rules,
 * and applies `filterRedundantRules` to remove redundant rules. Returns an object containing
 * the subnet's ID, name, and the deduplicated ingress and egress rules.
 *
 * @param {Object} subnet - The subnet object containing security lists and metadata.
 * @returns {Object} An object with subnetId, subnetName, and deduplicated ingress and egress rules.
 */
export function dedupeSubnetRules(subnet) {
  const allIngress = [];
  const allEgress  = [];

  for (const sl of (subnet.securityLists ?? [])) {
    for (const r of (sl.ingressRules ?? [])) allIngress.push({ ...r, direction: 'ingress', _sl: sl.name });
    for (const r of (sl.egressRules  ?? [])) allEgress.push({ ...r,  direction: 'egress',  _sl: sl.name });
  }

  return {
    subnetId: subnet.id,
    subnetName: subnet.name,
    ingress: filterRedundantRules(allIngress),
    egress:  filterRedundantRules(allEgress),
  };
}