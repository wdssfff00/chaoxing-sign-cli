import http, { ClientRequestArgs } from 'http';
import zlib from 'zlib';
import https from 'https';

enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

type RequestMethodType = RequestMethod | string;

interface RequestOptions {
  SSL?: boolean;
  headers?: ClientRequestArgs['headers'];
  method?: RequestMethodType;
  gzip?: boolean;
}

interface ResponseType {
  data: any;
  headers: http.IncomingHttpHeaders;
  statusCode?: number;
}

/**
 * @param url 接口地址
 * @param options headers, method, SSL 参数配置
 * @param payload 当进行POST请求时传入数据
 * @returns
 */
const request = (url: string, options: RequestOptions, payload?: any): Promise<ResponseType> => {
  // 设置默认值
  options.method = options.method || 'GET';

  let protocol = options.SSL ? https : http;

  const result = new Promise<ResponseType>((resolve, reject) => {
    let data = '';

    const req = protocol.request(url, { headers: options.headers, method: options.method }, (res) => {
      if (options.gzip) {
        // 若启用了gzip，进行转换再返回，否则乱码
        let gzip = zlib.createGunzip();
        res.pipe(gzip);
        gzip.on('data', (chunk) => {
          data += chunk;
        });
        gzip.on('end', () => {
          resolve({ data, headers: res.headers, statusCode: res.statusCode });
        });
      } else {
        // 返回内容为字符串的情况下直接拼接返回
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ data, headers: res.headers, statusCode: res.statusCode });
        });
        res.on('error', (e) => {
          reject(e);
        });
      }
    });

    options.method === RequestMethod.POST && req.write(payload);

    req.end();
  });

  return result;
};

export { request };