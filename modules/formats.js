/**
 * Gets the protocol name from a numeric protocol code.
 * @param {string} protocolCode - The numeric protocol code.
 * @returns {string} - The protocol name (e.g., ICMP, TCP, UDP).
 */
function getProtocolName(protocolCode) {
    switch (protocolCode) {
        case '1':
            return 'ICMP';
        case '6':
            return 'TCP';
        case '17':
            return 'UDP';
        case '-1':
            return 'all'    
        default:
            return protocolCode;
    }
}

/**
 * Formats and returns a string representation of a security rule.
 * @param {object} rule - The security rule to format.
 * @returns {string} - A string representation of the security rule.
 */
export function formatSLRule(type, rule, columnWidth = 25) {
    let protocol = rule.protocol|| '-';
    let description = rule.description || '-';
    let fromPort = '-';
    let toPort = '-';
    let fromIP = rule.source || '-';
    let toIP = rule.destination || '-';
    let protocolName = getProtocolName(protocol);

    if (rule.tcpOptions) {
        fromPort = rule.tcpOptions.sourcePortRange ? rule.tcpOptions.sourcePortRange.min : fromPort;
        toPort = rule.tcpOptions.destinationPortRange ? rule.tcpOptions.destinationPortRange.max : toPort;
    } else if (rule.udpOptions) {
        fromPort = rule.udpOptions.sourcePortRange ? rule.udpOptions.sourcePortRange.min : fromPort;
        toPort = rule.udpOptions.destinationPortRange ? rule.udpOptions.destinationPortRange.max : toPort;
    } else if (rule.icmpOptions) {
        fromPort = rule.icmpOptions.type !== undefined ? rule.icmpOptions.type : fromPort;
        toPort = rule.icmpOptions.code !== undefined ? rule.icmpOptions.code : toPort;
    }
    const col0 = type.padEnd(10);
    const col1 = `from IP ${fromIP}`.padEnd(columnWidth);
    const col2 = `port ${fromPort}`.padEnd(columnWidth);
    const col3 = `to IP ${toIP}`.padEnd(columnWidth);
    const col4 = `port ${toPort}`.padEnd(columnWidth);
    const col5 = `protocol ${protocolName}`.padEnd(columnWidth);

    return `${col0} ${col1} ${col2} ${col3} ${col4} ${col5} ${description}`;
}

/**
 * Formats and returns a string representation of a Routing table rule.
 * @param {object} rule - The  rule to format.
 * @returns {string} - A string representation of the rule.
 */
export function formatRoutingRule(type, rule, columnWidth = 25) {
    let description = rule.description || '-';
    let toIP = rule.destination || '-';

    const col0 = type.padEnd(10);
    const col1 = `to ${toIP}`.padEnd(columnWidth);

    return `${col0} ${col1} ${description}`;
}

/**
 * Formats and returns a simple string representation of a Security list rule.
 * used by the checkSLs
 * @param {object} rule - The  rule to format.
 * @returns {string} - A string representation of the rule.
 */
export function simpleFmt(r) {
        const proto = getProtocolName(r.protocol);
        const pr = r.portRange ?? { from: r.fromPort ?? 0, to: r.toPort ?? 65535 };
        const ports = (proto === 'all' || (pr.from === 0 && pr.to === 65535)) ? 'all' : `${pr.from}-${pr.to}`;
        const from = r.fromCidr ?? r.fromip ?? '0.0.0.0/0';
        const to = r.toCidr ?? r.toip ?? '0.0.0.0/0';
        return `[${r.direction}] ${proto} ${ports} from ${from} to ${to}${r._sl ? ` (SL: ${r._sl})` : ''}`;
    }