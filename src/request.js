import https from 'https';

export default function request(body, method, opts) {
  const { hostname, path, token, contentType = 'application/json' } = opts;
  const headers = {
    'content-type': contentType
  };
  if (token) {
    headers['authorization'] = token;
  }

  return new Promise((resolve, reject) => {
    const req = https
      .request(
        {
          servername: hostname,
          hostname,
          path,
          port: 443,
          method: method,
          headers
        },
        res => {
          var apiResponse = '';

          res.on('data', chunk => {
            apiResponse += chunk;
          });

          res.on('end', () => {
            resolve({ status: res.statusCode, apiResponse });
          });
        }
      )
      .on('error', err => {
        reject(err);
      });

    req.write(JSON.stringify(body));
    req.end();
  });
}
