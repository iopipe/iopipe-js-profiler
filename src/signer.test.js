import getSignerHostname from './signer';

describe('configuring Signer hostname', () => {
  beforeEach(() => {
    // clear region for testing
    process.env.AWS_REGION = '';
  });

  it('returns a base hostname if nothing else', () => {
    expect(getSignerHostname()).toBe('signer.us-west-2.iopipe.com');
  });

  it('switches based on the region set in env vars', () => {
    process.env.AWS_REGION = 'ap-southeast-2';
    const apSoutheast2Signer = getSignerHostname();
    process.env.AWS_REGION = 'eu-west-1';
    const euWest1Signer = getSignerHostname();

    process.env.AWS_REGION = 'us-east-1';
    const east1Signer = getSignerHostname();
    process.env.AWS_REGION = 'us-east-2';
    const east2Signer = getSignerHostname();
    process.env.AWS_REGION = 'us-west-1';
    const west1Signer = getSignerHostname();
    process.env.AWS_REGION = 'us-west-2';
    const west2Signer = getSignerHostname();

    expect(apSoutheast2Signer).toBe('signer.ap-southeast-2.iopipe.com');
    expect(euWest1Signer).toBe('signer.eu-west-1.iopipe.com');
    expect(east1Signer).toBe('signer.us-east-1.iopipe.com');
    expect(east2Signer).toBe('signer.us-east-2.iopipe.com');
    expect(west1Signer).toBe('signer.us-west-1.iopipe.com');
    expect(west2Signer).toBe('signer.us-west-2.iopipe.com');
  });

  it('defaults if an uncovered region or malformed', () => {
    process.env.AWS_REGION = 'eu-west-2';
    const euWest2Signer = getSignerHostname('', {});

    process.env.AWS_REGION = 'NotARegion';
    const notRegionSigner = getSignerHostname('', {});

    process.env.AWS_REGION = '';
    const emptyRegionSigner = getSignerHostname('', {});

    expect(euWest2Signer).toBe('signer.us-west-2.iopipe.com');
    expect(notRegionSigner).toBe('signer.us-west-2.iopipe.com');
    expect(emptyRegionSigner).toBe('signer.us-west-2.iopipe.com');
  });
});
