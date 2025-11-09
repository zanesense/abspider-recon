export interface SubnetInfo {
  ip: string;
  cidr: number;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstUsable: string;
  lastUsable: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: string;
}

const ipToInt = (ip: string): number => {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
};

const intToIp = (int: number): string => {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join('.');
};

const getIPClass = (firstOctet: number): string => {
  if (firstOctet >= 1 && firstOctet <= 126) return 'A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
  return 'E (Reserved)';
};

export const calculateSubnet = (ip: string, cidr: number): SubnetInfo => {
  console.log(`[Subnet Calculator] Calculating for ${ip}/${cidr}`);

  const ipInt = ipToInt(ip);
  const maskInt = (~0 << (32 - cidr)) >>> 0;
  const wildcardInt = ~maskInt >>> 0;

  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const firstUsableInt = networkInt + 1;
  const lastUsableInt = broadcastInt - 1;

  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = totalHosts - 2;

  const firstOctet = parseInt(ip.split('.')[0]);

  const result: SubnetInfo = {
    ip,
    cidr,
    networkAddress: intToIp(networkInt),
    broadcastAddress: intToIp(broadcastInt),
    subnetMask: intToIp(maskInt),
    wildcardMask: intToIp(wildcardInt),
    firstUsable: intToIp(firstUsableInt),
    lastUsable: intToIp(lastUsableInt),
    totalHosts,
    usableHosts,
    ipClass: getIPClass(firstOctet),
  };

  console.log(`[Subnet Calculator] Complete: ${usableHosts} usable hosts`);
  return result;
};