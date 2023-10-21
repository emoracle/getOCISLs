/**
 * Validates the port parameter.
 * @param {number} port - The port to validate.
 * @throws {Error} - Throws an error if the port is invalid.
 */
export function validatePort(port) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid port number. Port must be an integer between 1 and 65535.');
  }
}

/**
 * Validates the IP address parameter.
 * @param {string} ip - The IP address to validate.
 * @throws {Error} - Throws an error if the IP address is invalid.
 */
export function validateIP(ip) {
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (!ipRegex.test(ip)) {
    throw new Error('Invalid IP address. IP must be in the format xxx.xxx.xxx.xxx where xxx is a number between 0 and 255.');
  }
}

/**
 * Validates all parameters passed to the script.
 * @param {object} params - An object containing optional `port`, `ip`, `description` e.a.
 * @throws {Error} - Throws an error if any of the parameters are invalid.
 */
export function validateParams(params) {
  if (Object.keys(params)[1] !== undefined) {
    throw new Error('Invalid arguments. Only one parameter is supported.');
  } else if (params.port !== undefined) {
    validatePort(params.port);
  } else if (params.ip !== undefined) {
    validateIP(params.ip);
  } else if (Object.keys(params)[0] !== undefined) {
    console.log("non-validated parameter. I hope that you know what your are doing...")
  }
}
