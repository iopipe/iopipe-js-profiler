import https from 'https';

export default function request(body, method, opts, authorizationHeader) {
  const { hostname, path } = opts;
  const requestOptions = {
    hostname: hostname,
    path,
    port: 443,
    method: method
  };

  if (authorizationHeader) {
    requestOptions['headers'] = {
      authorization: authorizationHeader
    };
  }
  requestOptions['headers'] = requestOptions.headers || {};

  /* Not a stream... */
  if (!body.pipe) {
    requestOptions.headers['content-length'] = Buffer.byteLength(body);
  } else {
    requestOptions.headers['Transfer-Encoding'] = 'chunked';
  }

  return new Promise((resolve, reject) => {
    const req = https
      .request(requestOptions, res => {
        var apiResponse = '';

        res.on('data', chunk => {
          apiResponse += chunk;
        });

        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode > 201) {
            reject(
              new Error(
                `Error getting signed url, ${res.statusCode}, ${apiResponse}`
              )
            );
          }
          resolve(apiResponse);
        });
      })
      .on('error', err => {
        reject(err);
      });

    if (body.pipe) {
      body.pipe(req);
      body.on('end', () => {
        req.end();
      });
    } else {
      req.write(body);
      req.end();
    }
  });
}
