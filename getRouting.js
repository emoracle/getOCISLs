/**
 * @file
 * This script interacts with Oracle Cloud Infrastructure (OCI) to manage
 * virtual cloud network (VCN) routing tables, specifically, it fetches and displays
 * and allows filtering and writing of those to files.
 * usage:
 *   node getRouting 
 *   node getRouting ip=xxxx
 *   node getRouting description=xxx     (like)
 */
import { getVcnName, listAllRoutingLists } from './modules/ociClient.mjs';
import { writeListToFile, deleteFilesInDirectory } from './modules/fileHandler.mjs';
import { validateParams } from './modules/parameterValidator.js';
import { ruleInvolvesParameter, slInvolvesParameter } from './modules/filters.js';
import { formatRoutingRule } from './modules/formats.js';
import settings from './config/settings.json' assert { type: "json" };

/**
 * Main execution block. Parses command-line parameters, fetches routing lists,
 * optionally filters and logs their rules, and writes the lists to files.
 */
(async () => {
    const args = process.argv.slice(2);
    const params = {};

    args.forEach(arg => {
        const [key, value] = arg.split('=');
        params[key] = value;
    });
    if (Object.keys(params) == 'help' ) {
        console.log(`
        This script interacts with Oracle Cloud Infrastructure (OCI) to manage
        virtual cloud network (VCN) routing tables, specifically, it fetches and displays
        and allows filtering and writing of those to files.
        usage:
            node getRouting 
            node getRouting ip=xxxx
            node getRouting description=xxx     (like)`);
        process.exit(0);
    }
    try {
        validateParams(params);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }

    await deleteFilesInDirectory('./output/routing');

    const routingLists = await listAllRoutingLists(settings.compartmentId);
    let overallSomethingIsfound = false;

    for (let sl of routingLists) {
        let headerIsWritten = false;

        let shouldWriteFile = Object.keys(params).length === 0; // Write all files if no params are provided 

        const vcnName = await getVcnName(sl.vcnId);
        sl.vcnName = vcnName;
        if (slInvolvesParameter(sl, params)) {
            console.log(`\n${sl.vcnName} Routing List Name: ${sl.displayName}`);
            shouldWriteFile = true;
        } else {

            for (const [ruleType, rules] of Object.entries({
                ingress: sl.routeRules
            })) {
                for (let rule of rules) {
                    if (Object.keys(params).length === 0 || ruleInvolvesParameter(rule, params)) {
                        if (!headerIsWritten) {
                            console.log(`\n${sl.vcnName} Routing table Name: ${sl.displayName}`);
                            headerIsWritten = true;
                        }
                        console.log(formatRoutingRule(ruleType, rule));
                        shouldWriteFile = true;
                    }
                }
            }





        }


        if (shouldWriteFile) {
            overallSomethingIsfound = true;
            await writeListToFile(sl, sl.vcnName,'routing');
        }
    
    }

    if (!overallSomethingIsfound) {
        console.log("Nothing found. Perhaps the parameter is in another case.");
    }

}

) ();
