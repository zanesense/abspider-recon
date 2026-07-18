import { describe, expect, it } from 'vitest';
import { getScanStatusEventDetail } from './scanStatusEvents';

describe('scan status notifications', () => {
  it('announces terminal scan states but ignores running progress', () => {
    expect(getScanStatusEventDetail({ id: 'scan-1', target: 'example.com', status: 'running' })).toBeNull();
    expect(getScanStatusEventDetail({ id: 'scan-1', target: 'example.com', status: 'completed' })).toEqual({
      id: 'scan-1',
      target: 'example.com',
      status: 'completed',
    });
  });
});
