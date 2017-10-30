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
    let apSoutheast2Signer = getSignerHostname();
    process.env.AWS_REGION = 'eu-west-1';
    let euWest1Signer = getSignerHostname();

    process.env.AWS_REGION = 'us-east-2';
    let east1URL = getSignerHostname();
    process.env.AWS_REGION = 'us-east-2';
    let east2Signer = getSignerHostname();
    process.env.AWS_REGION = 'us-west-1';
    let west1Signer = getSignerHostname();
    process.env.AWS_REGION = 'us-west-2';
    let west2Signer = getSignerHostname();

    expect(apSoutheast2Signer).toBe('signer.ap-southeast-2.iopipe.com');
    expect(euWest1Signer).toBe('signer.eu-west-1.iopipe.com');
    expect(east2Signer).toBe('signer.us-east-2.iopipe.com');
    expect(west1Signer).toBe('signer.us-west-1.iopipe.com');
    expect(west2Signer).toBe('signer.us-west-2.iopipe.com');
  });

  it('defaults if an uncovered region or malformed', () => {
    process.env.AWS_REGION = 'eu-west-2';
    let euWest2Signer = getSignerHostname('', {});

    process.env.AWS_REGION = 'NotARegion';
    let notRegionSigner = getSignerHostname('', {});

    process.env.AWS_REGION = '';
    let emptyRegionSigner = getSignerHostname('', {});

    expect(euWest2Signer).toBe('signer.us-west-2.iopipe.com');
    expect(notRegionSigner).toBe('signer.us-west-2.iopipe.com');
    expect(emptyRegionSigner).toBe('signer.us-west-2.iopipe.com');
  });
});
