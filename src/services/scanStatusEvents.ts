export const SCAN_STATUS_EVENT = 'abspider:scan-status';

export type ScanStatus = 'running' | 'completed' | 'failed' | 'paused' | 'stopped';

export interface ScanStatusEventDetail {
  id: string;
  target: string;
  status: Exclude<ScanStatus, 'running'>;
}

export const getScanStatusEventDetail = (
  scan: { id: string; target: string; status: ScanStatus },
): ScanStatusEventDetail | null => scan.status === 'running' ? null : {
  id: scan.id,
  target: scan.target,
  status: scan.status,
};
