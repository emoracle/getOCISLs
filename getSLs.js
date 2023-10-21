/**
 * @file
 * This script interacts with Oracle Cloud Infrastructure (OCI) to manage
 * virtual cloud network (VCN) security lists, specifically, it fetches and displays
 * security rules, and allows filtering and writing of those to files.
 * usage:
 *   node getSLs 
 *   node getSLs port=xxxxx
 *   node getSLs ip=xxxx
 *   node getSLs description=xxx     (like)
 */
import { getVcnName, listAllSecurityLists } from './modules/ociClient.mjs';
import { writeSecurityListToFile, deleteFilesInDirectory } from './modules/fileHandler.mjs';
import { validateParams } from './modules/parameterValidator.js';
import { ruleInvolvesParameter, slInvolvesParameter } from './modules/filters.js';
import { formatRule } from './modules/formats.js';
import settings from './config/settings.json' assert { type: "json" };

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
    let overallSomethingIsfound = false;

    for (let sl of securityLists) {
        let headerIsWritten = false;

        let shouldWriteFile = Object.keys(params).length === 0; // Write all files if no params are provided 

        const vcnName = await getVcnName(sl.vcnId);
        sl.vcnName = vcnName;

        if (slInvolvesParameter(sl, params)) {
            console.log(`\n${sl.vcnName} Security List Name: ${sl.displayName}`);
            shouldWriteFile = true;
        } else {
            for (const [ruleType, rules] of Object.entries({
                ingress: sl.ingressSecurityRules,
                egress: sl.egressSecurityRules,
            })) {
                for (let rule of rules) {
                    if (Object.keys(params).length === 0 || ruleInvolvesParameter(rule, params)) {
                        if (!headerIsWritten) {
                            console.log(`\n${sl.vcnName} Security List Name: ${sl.displayName}`);
                            headerIsWritten = true;
                        }
                        console.log(formatRule(ruleType, rule));
                        shouldWriteFile = true;
                    }
                }
            }
        }
        if (shouldWriteFile) {
            overallSomethingIsfound = true;
            await writeSecurityListToFile(sl, sl.vcnName);
        }
    }
    if (!overallSomethingIsfound) {
        console.log("Nothing found. Perhaps the parameter is in another case.");
    }
})();
