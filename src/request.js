import https from 'https';

export default function request(body, method, opts) {
  const { hostname, path, token, contentType } = opts;
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

    req.write(JSON.stringify(body));
    req.end();
  });
}
