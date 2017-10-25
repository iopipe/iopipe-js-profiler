export default function request(body, method) {
  // Signing API request
  if (method == 'POST') {
    return {
      status: 201,
      apiResponse: JSON.stringify({
        signedRequest: 'https://signingApi',
        url: 'https://profileUrl'
      })
    };
  }
  // PUT request
  return {
    status: 200
  };
}
