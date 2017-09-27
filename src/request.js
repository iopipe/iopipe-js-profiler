import https from 'https';

export default function request(body, opts) {
  const { hostname, servername, path, contentType = 'application/json' } = opts;
  return new Promise((resolve, reject) => {
    const req = https
      .request(
        {
          hostname,
          servername,
          path,
          port: 443,
          method: 'POST',
          headers: { 'content-type': contentType }
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
