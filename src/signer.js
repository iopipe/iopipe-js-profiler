export default function getSignerHostname() {
  var region = '';
  const supportedRegions = [
    'ap-northeast-1',
    'ap-southeast-2',
    'eu-west-1',
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2'
  ];
  if (supportedRegions.indexOf(process.env.AWS_REGION) > -1) {
    region = process.env.AWS_REGION;
  } else {
    region = 'us-west-2';
  }
  return `signer.${region}.iopipe.com`;
}
