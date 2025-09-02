import common from "oci-common";
import * as core from "oci-core";

const provider = new common.ConfigFileAuthenticationDetailsProvider();
const vcnClient = new core.VirtualNetworkClient({ authenticationDetailsProvider: provider });

/**
 * Retrieves the name of a Virtual Cloud Network (VCN) given its ID.
 * @param {string} vcnId - The OCID of the VCN.
 * @returns {Promise<string>} - The display name of the VCN.
 */
async function getVcnName(vcnId) {
    try {
        const vcn = await vcnClient.getVcn({ vcnId });
        return vcn.vcn.displayName;
    } catch (error) {
        console.error(`Error retrieving VCN name for ID ${vcnId}:`, error.message);
        throw error; // Re-throwing the error after logging it allows you to handle it upstream if needed
    }
}

/**
 * Lists all security lists within a specified compartment, retrieving all
 * pages of results.
 * @param {string} compartmentId - The OCID of the compartment.
 * @returns {Promise<Array>} - A promise that resolves to an array of security lists.
 */
async function listAllSecurityLists(compartmentId) {
    let securityLists = [];
    const request = { compartmentId };
    try {
        let response;
        do {
            response = await vcnClient.listSecurityLists(request);
            securityLists = securityLists.concat(response.items);
            request.page = response.opcNextPage;
        } while (response.opcNextPage);

        return securityLists;
    } catch (error) {
        console.error(`Error listing security lists in compartment ${compartmentId}:`, error.message);
        throw error;
    }
}

/**
 * Lists all routing lists within a specified compartment, retrieving all
 * pages of results.
 * @param {string} compartmentId - The OCID of the compartment.
 * @returns {Promise<Array>} - A promise that resolves to an array of lists.
 */

async function listAllRoutingLists(compartmentId) {
    let routingLists = [];
    const request = { compartmentId };
    try {
        let response;
        do {
            response = await vcnClient.listRouteTables(request)
            routingLists = routingLists.concat(response.items);
            request.page = response.opcNextPage;
        } while (response.opcNextPage);

        return routingLists;
    } catch (error) {
        console.error(`Error listing Routing tables in compartment ${compartmentId}:`, error.message);
        throw error;
    }
}

/**
 * All subnets in a compartment (by record iterator)
 * @param {string} compartmentId
 * @returns {Promise<Array<core.models.Subnet>>}
 */
async function listAllSubnets(compartmentId) {
  try {
    const out = [];
    for await (const sn of vcnClient.listSubnetsRecordIterator({ compartmentId })) {
      out.push(sn);
    }
    return out;
  } catch (error) {
    console.error(`Error listing subnets in compartment ${compartmentId}:`, error.message);
    throw error;
  }
}




/**
 * Gets a dedicated SecurityList on Id
 * @param {string} compartmentId - The OCID of the security list .
 * @returns {Promise<Array>} - A promise that resolves to an array of lists.
 */
async function getSecurityList(securityListId) {
    try {
        const response= await vcnClient.getSecurityList({ securityListId });
        return response.securityList;
    } catch (error) {
        console.error(`Error retrieving security list for ID ${securityListId}:`, error.message);
        throw error; // Re-throwing the error after logging it allows you to handle it upstream if needed
    }
}

export { getVcnName, listAllSecurityLists, listAllRoutingLists, listAllSubnets, getSecurityList };