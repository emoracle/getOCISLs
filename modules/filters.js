import { isIpInCIDR } from './handleCIDR.mjs';

/**
 * Checks if a security list involves a specified parameter
 * @param {object} sl - The security list to check.
 * @param {object} params - Object containing optional `port`, `ip`, and `description`.
 * @returns {boolean} - True if the rule involves parameter
 */
export function slInvolvesParameter(sl, params) {
  const firstParamKey = Object.keys(params)[0];

  if (firstParamKey !== undefined) {
    const filter = (sl[firstParamKey] || '').toLowerCase();

    if (filter.includes(params[firstParamKey].toString().toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a security rule involves a specified port or IP.
 * @param {object} rule - The security rule to check.
 * @param {object} params - Object containing optional `port`, `ip`,etc
 * @returns {boolean} - True if the rule involves the port, IP, or description, false otherwise.
 */
export function ruleInvolvesParameter(rule, params) {

  if (params.port !== undefined) {
    const options = rule.tcpOptions || rule.udpOptions;
    if (options) {
      const sourcePortRange = options.sourcePortRange || {};
      const destPortRange = options.destinationPortRange || {};

      if ((sourcePortRange.min <= params.port && sourcePortRange.max >= params.port) ||
        (destPortRange.min <= params.port && destPortRange.max >= params.port)) {
        return true;
      }
    }
  }

  if (params.ip !== undefined) {
    const source = rule.source || '';
    const destination = rule.destination || '';

    if (source.includes(params.ip) || destination.includes(params.ip) || isIpInCIDR(params.ip, source) || isIpInCIDR(params.ip, destination)) {
      return true;
    }
  }

  if (Object.keys(params)[0] !== undefined) {
    const attr = Object.keys(params)[0];
    const filter = (rule[attr] || '').toLowerCase();
    if (filter.includes(params[attr].toString().toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * Filters an array of security rules based on specified criteria.
 * @param {array} rules - An array of security rules.
 * @param {object} params - Object containing optional `port`, `ip`, `description` e.a.
 * @returns {array} - An array of filtered security rules.
 */
export function filterRules(rules, params) {
  return rules.filter((rule) => ruleInvolvesParameter(rule, params));
}
