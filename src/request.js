import https from 'https';

export default function request(body, method, opts) {
  const { hostname, path, token } = opts;
  const requestOptions = {
    hostname,
    path,
    port: 443,
    method: method
  };

  if (token) {
    requestOptions['headers'] = {
      authorization: token
    };
  }
  requestOptions['headers'] = requestOptions.headers || {};
  requestOptions.headers['content-length'] = Buffer.byteLength(body);
  return new Promise((resolve, reject) => {
    const req = https
      .request(requestOptions, res => {
        var apiResponse = '';

        res.on('data', chunk => {
          apiResponse += chunk;
        });

        res.on('end', () => {
          resolve({ status: res.statusCode, apiResponse });
        });
      })
      .on('error', err => {
        reject(err);
      });

    req.write(body);
    req.end();
  });
}
