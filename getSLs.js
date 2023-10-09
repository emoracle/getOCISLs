/**
 * @file
 * This script interacts with Oracle Cloud Infrastructure (OCI) to manage
 * virtual cloud network (VCN) security lists, specifically, it fetches and displays
 * security rules, and allows filtering and writing of those to files.
 * usage:
 *   node getSLs 
 *   node getSLs port=xxxxx
 *   node getSLs ip=xxxx
 */
const { getVcnName, listAllSecurityLists } = require('./scripts/ociClient');
const { deleteFilesInDirectory, writeSecurityListToFile } = require('./scripts/fileHandler');

/**
 * The settings.json contains a single attrite compartmentId with the ocid of the compartment
 * of interest
 */
const settings = require('./config/settings.json');

/**
 * Checks if a security rule involves a specified port or IP.
 * @param {object} rule - The security rule to check.
 * @param {object} param1 - Object containing optional `port` and `ip`.
 * @returns {boolean} - True if the rule involves the port or IP, false otherwise.
 */
function ruleInvolvesParameter(rule, { port, ip }) {
    // Check port
    if (port) {
        const options = rule.tcpOptions || rule.udpOptions;
        if (options) {
            const sourcePortRange = options.sourcePortRange || {};
            const destPortRange = options.destinationPortRange || {};

            if ((sourcePortRange.min <= port && sourcePortRange.max >= port) ||
                (destPortRange.min <= port && destPortRange.max >= port)) {
                return true;
            }
        }
    }

    // Check IP
    if (ip) {
        const source = rule.source || '';
        const destination = rule.destination || '';

        if (source.includes(ip) || destination.includes(ip)) {
            return true;
        }
    }

    return false;
}

/**
 * Formats and returns a string representation of a security rule.
 * @param {object} rule - The security rule to format.
 * @returns {string} - A string representation of the security rule.
 */
function formatRule(rule, columnWidth = 20) {
    let protocol = rule.protocol;
    let description = rule.description||'';
    let fromPort = '-';
    let toPort = '-';
    let fromIP = rule.source || '-';
    let toIP = rule.destination || '-';

    if (protocol === '1') protocol = 'ICMP';
    else if (protocol === '6') protocol = 'TCP';
    else if (protocol === '17') protocol = 'UDP';

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
    const col1 = `from IP ${fromIP}`.padEnd(columnWidth);
    const col2 = `port ${fromPort}`.padEnd(columnWidth);
    const col3 = `to IP ${toIP}`.padEnd(columnWidth);
    const col4 = `port ${toPort}`.padEnd(columnWidth);
    const col5 = `protocol ${protocol}`.padEnd(columnWidth);

    return `${col1} ${col2} ${col3} ${col4} ${col5} ${description}`;
}

function validateParams(params) {
    const { port, ip } = params;

    // Validate port
    if (port !== undefined) {
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            throw new Error('Invalid port number. Port must be an integer between 1 and 65535.');
        }
    }

    // Validate IP
    if (ip !== undefined) {
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (!ipRegex.test(ip)) {
            throw new Error('Invalid IP address. IP must be in the format xxx.xxx.xxx.xxx where xxx is a number between 0 and 255.');
        }
    }
}

/**
 * Main execution block. Parses command-line parameters, fetches security lists,
 * optionally filters and logs their rules, and writes the lists to files.
 */
(async () => {
    const args = process.argv.slice(2);
    const params = {};

    args.forEach(arg => {
        const [key, value] = arg.split('=');
        params[key] = value;
    });

    if (params.port) {
        params.port = parseInt(params.port, 10);
    }

    try {
        validateParams(params);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }

    await deleteFilesInDirectory('./output');

    const securityLists = await listAllSecurityLists(settings.compartmentId);

    for (let sl of securityLists) {
        let headerIsWritten = false;

        let shouldWriteFile = Object.keys(params).length === 0; // Write file if no params are provided 
        const vcnName = await getVcnName(sl.vcnId);

        for (let rule of sl.ingressSecurityRules) {
            if (Object.keys(params).length === 0 || ruleInvolvesParameter(rule, params)) {
                if (!headerIsWritten) {
                    console.log(`\n${vcnName} Security List Name: ${sl.displayName}`);

                    headerIsWritten = true;
                }
                console.log("ingress " + formatRule(rule));
                shouldWriteFile = true;
            }
        }

        for (let rule of sl.egressSecurityRules) {
            if (Object.keys(params).length === 0 || ruleInvolvesParameter(rule, params)) {
                if (!headerIsWritten) {
                    console.log(`\n${vcnName} Security List Name: ${sl.displayName}`);

                    headerIsWritten = true;
                }

                console.log("egress " + formatRule(rule));
                shouldWriteFile = true;
            }
        }

        // Write JSON to file
        if (shouldWriteFile) {
            await writeSecurityListToFile(sl, vcnName);
        }
    }
})();
