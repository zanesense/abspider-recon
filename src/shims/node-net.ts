// This shim provides a basic, browser-compatible implementation for 'node:net'
// specifically for the 'isIP' function, which might be called by some libraries
// that are not fully browser-aware.

// Note: This is a workaround. The ideal solution is to identify and replace
// the library that is incorrectly trying to use 'node:net' in a browser environment.

// Browser-compatible IPv4 validation
const isIPv4 = (ip: string): boolean => {
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

// Browser-compatible IPv6 validation
const isIPv6 = (ip: string): boolean => {
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|::((:[0-9a-fA-F]{1,4}){1,7}|)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return ipv6Regex.test(ip);
};

// Mock the 'net' module if it's being accessed globally or via a shim
// The 'isIP' function returns 0 for invalid, 4 for IPv4, 6 for IPv6.
const isIP = (input: string): 0 | 4 | 6 => {
  if (isIPv4(input)) return 4;
  if (isIPv6(input)) return 6;
  return 0;
};

// Ensure globalThis.process and globalThis.Buffer are defined if needed by other shims
// This is often required for Node.js compatibility layers.
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {},
    // Add other minimal process properties if needed by specific libraries
  } as any;
}

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = {
    isBuffer: () => false,
    // Add other minimal Buffer properties if needed
  } as any;
}

// Attempt to define 'net' on globalThis or window if it's being accessed directly
// or if Vite's externalization mechanism expects it.
if (typeof globalThis.net === 'undefined') {
  globalThis.net = {
    isIP: isIP,
    isIPv4: isIPv4,
    isIPv6: isIPv6,
    // Add other minimal net properties if needed
  } as any;
}

// Also, for modules that might use 'node:net' directly, we can try to
// define it in a way that Vite might pick up for externalized modules.
try {
  const nodeNetModule = {
    isIP: isIP,
    isIPv4: isIPv4,
    isIPv6: isIPv6,
  };
} catch (e) {
  console.warn("Failed to set up node:net shim:", e);
}