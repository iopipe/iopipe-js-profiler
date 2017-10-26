export default function request(body, method) {
  // Signing API request
  if (method == 'POST') {
    return JSON.stringify({
      signedRequest: 'https://signingApi',
      url: 'https://profileUrl'
    });
  }
  // PUT request
  return '';
}
