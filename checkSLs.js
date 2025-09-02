/**
 * This script analyzes Oracle Cloud Infrastructure (OCI) subnets and their associated security lists,
 * deduplicates overlapping or redundant security rules, and prints out which rules can be safely removed.
 *
 * @module checkSLs
 * @async
 */
import { getVcnName, listAllSubnets, getSecurityList } from './modules/ociClient.mjs';
import settings from './config/settings.json' with { type: "json" };
import { dedupeSubnetRules } from './modules/dedupeRules.mjs';
import { simpleFmt } from './modules/formats.js'

(async () => {
    
    const subnetsRaw = await listAllSubnets(settings.compartmentId);

    const vcnNameCache = new Map();

    const subnets = await Promise.all(
        subnetsRaw.map(async (s) => {
            let vcnName = vcnNameCache.get(s.vcnId);
            if (!vcnName) {
                vcnName = await getVcnName(s.vcnId);
                vcnNameCache.set(s.vcnId, vcnName);
            }

            const securityLists = await Promise.all(
                (s.securityListIds ?? []).map(async (securityListId) => {
                    const slResp = await getSecurityList(securityListId);
                    const sl = slResp?.securityList ?? slResp;

                    const toPorts = (r) => {
                        if (r?.tcpOptions?.destinationPortRange) {
                            return {
                                fromPort: r.tcpOptions.destinationPortRange.min,
                                toPort: r.tcpOptions.destinationPortRange.max
                            };
                        }
                        if (r?.udpOptions?.destinationPortRange) {
                            return {
                                fromPort: r.udpOptions.destinationPortRange.min,
                                toPort: r.udpOptions.destinationPortRange.max
                            };
                        }
                        return { fromPort: undefined, toPort: undefined }; // "all ports"
                    };

                    const ingressRules = (sl.ingressSecurityRules ?? []).map((r) => {
                        const pr = toPorts(r);
                        return {
                            direction: 'ingress',
                            protocol: r.protocol,       // '6'|'17'|'1'|'-1'
                            fromPort: pr.fromPort,
                            toPort: pr.toPort,
                            fromip: r.source,         // CIDR
                            toip: s.cidrBlock,      
                            raw: r,
                        };
                    });

                    const egressRules = (sl.egressSecurityRules ?? []).map((r) => {
                        const pr = toPorts(r);
                        return {
                            direction: 'egress',
                            protocol: r.protocol,
                            fromPort: pr.fromPort,
                            toPort: pr.toPort,
                            fromip: s.cidrBlock,
                            toip: r.destination,
                            raw: r,
                        };
                    });

                    return {
                        id: sl.id,
                        name: sl.displayName,
                        ingressRules,
                        egressRules,
                    };
                })
            );

            const deduped = dedupeSubnetRules({
                id: s.id,
                name: s.displayName,
                securityLists,
            });

            return {
                id: s.id,
                name: s.displayName,
                cidr: s.cidrBlock,
                vcnId: s.vcnId,
                vcnName,
                securityLists,
                deduped,
            };
        })
    );

    for (const subNet of subnets) {
        console.log(`\nSubnet ${subNet.name} (${subNet.cidr}) in VCN ${subNet.vcnName}`);
        const removedIngress = subNet.deduped.ingress.removed;
        const removedEgress = subNet.deduped.egress.removed;

        if (removedIngress.length === 0 && removedEgress.length === 0) {
            console.log('No rules to be removed.');
            continue;
        }

        if (removedIngress.length) {
            console.log('Ingress — TO BE REMOVED:');
            for (const r of removedIngress) {
                console.log('  -', simpleFmt(r));
                console.log('    covered by:', simpleFmt(r.coveredBy));
                console.log('    why:       ', r.why.join(' AND '));
                console.log('');
            }
        }

        if (removedEgress.length) {
            console.log('Egress — TO BE REMOVED:');
            for (const r of removedEgress) {
                console.log('  -', simpleFmt(r));
                console.log('    covered by:', simpleFmt(r.coveredBy));
                console.log('    why:       ', r.why.join(' AND '));
                console.log('');
            }
        }
    }

})();
