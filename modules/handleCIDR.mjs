import ip from 'ip';


const PROTO_MAP = {
    '-1': 'all', 'all': 'all',
    '6': 'tcp', 'tcp': 'tcp',
    '17': 'udp', 'udp': 'udp',
    '1': 'icmp', 'icmp': 'icmp',
};

/* We exclude default the zero range, because everything is true in the zero range */
let excludeNul = true;  // exclude 0.0.0.0/0

/**
 * Sets the `excludeNul` flag to false, indicating that null values should be included.
 * 
 * @function
 * @returns {void}
 */
export function includeNul() {
    excludeNul = false;
}

/**
 * Normalizes a protocol string by converting it to lowercase and mapping it using PROTO_MAP.
 * If the input is null or undefined, defaults to 'all'.
 * If the protocol is not found in PROTO_MAP, returns the normalized key.
 *
 * @param {string|null|undefined} p - The protocol to normalize.
 * @returns {string} The normalized protocol string.
 */
export function normalizeProtocol(p) {
    const key = String(p ?? 'all').toLowerCase();
    return PROTO_MAP[key] ?? key;
}

/**
 * Converts an IPv4 address string to its 32-bit integer representation.
 *
 * @param {string} ip - The IPv4 address in dotted-decimal notation (e.g., "192.168.1.1").
 * @returns {number|null} The 32-bit integer representation of the IP address, or null if the input is invalid.
 */
export function ipToInt(ip) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(n => Number.isNaN(n) || n < 0 || n > 255)) {
        return null;
    }
    return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

/**
 * Check if a given CIDR is valid.
 * @param {string} vcnId - The OCID of the VCN.
 * @returns {boolean} - True if the CIDR is valid, false otherwise.
 */
export function isValidCIDR(cidr) {
    // Regular expression to match CIDR format
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

    // Check if the CIDR matches the regular expression
    if (cidrRegex.test(cidr)) {
        // Further check each part of the IP to ensure values are within valid range
        const parts = cidr.split('/');
        const ipParts = parts[0].split('.').map(Number);
        const prefixLength = Number(parts[1]);

        // Ensure IP parts are within 0-255 and prefix length is within 0-32 for IPv4
        const isValidIP = ipParts.every(part => part >= 0 && part <= 255);
        const isValidPrefix = prefixLength >= 0 && prefixLength <= 32;

        return isValidIP && isValidPrefix;
    }
    return false;
}

/**
 * Retrieves ipFrom, ipTo, and ipInRange for a given CIDR.
 * @param {string} cidr - The CiDR to get the range from.
 * @param {string} checkOnIp - Check if the IP is in the CIDR range.
 * @returns {object} - An object containing ipFrom, ipTo, and ipInRange.
 */
export function getCIDRRange(cidr, checkOnIp = null) {
    if (!isValidCIDR(cidr)) {
        return {};
    }
    const range = ip.cidrSubnet(cidr);
    const ipFrom = range.firstAddress;
    const ipTo = range.lastAddress;
    const ipInRange = checkOnIp ? range.contains(checkOnIp) : null;

    return { ipFrom, ipTo, ipInRange };
}

/**
 * Check if a given IP address is in a CIDR range.
 * @param {string} ipAddress - The IP address to check.
 * @param {string} cidr - The CIDR range to check in.
 * @returns {boolean} - True if the IP is in the CIDR range, false otherwise.
 */
export function isIpInCIDR(ipAddress, cidr) {
    if (!isValidCIDR(cidr)) {
        return false;
    }
    if (excludeNul && cidr == "0.0.0.0/0") {
        return false;
    }
    // Utilize the existing logic from getCIDRRange to check if the IP is in range
    const { ipInRange } = getCIDRRange(cidr, ipAddress);
    return ipInRange;
}