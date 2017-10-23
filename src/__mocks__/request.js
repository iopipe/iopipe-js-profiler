export default function request(body, method, opts) {
  // Signing API request
  if (method == 'POST') {
    return {
      status: 201,
      apiResponse: JSON.stringify({
        signedRequest: 'https://signingApi',
        url: 'https://profileUrl'
      })
    };
  } else {
    // PUT request
    return {
      status: 200
    };
  }
  return;
}
