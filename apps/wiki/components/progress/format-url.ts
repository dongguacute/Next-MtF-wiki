// Format function modified from nodejs
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

const slashedProtocols = /https?|ftp|gopher|file/;

function stringifyUrlQueryParam(param: unknown): string {
  if (
    typeof param === "string" ||
    (typeof param === "number" && !Number.isNaN(param)) ||
    typeof param === "boolean"
  ) {
    return String(param);
  } else {
    return "";
  }
}

export function urlQueryToSearchParams(
  urlQuery: Record<string, string | number | boolean | Array<string | number | boolean>>
): URLSearchParams {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(urlQuery)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        result.append(key, stringifyUrlQueryParam(item));
      }
    } else {
      result.set(key, stringifyUrlQueryParam(value));
    }
  }
  return result;
}

export function formatUrl(urlObj: {
  auth?: string;
  hostname?: string;
  protocol?: string;
  pathname?: string;
  hash?: string;
  query?: Record<string, string | number | boolean | Array<string | number | boolean>>;
  host?: string;
  port?: string;
  slashes?: boolean;
  search?: string;

}) {
  let { auth, hostname } = urlObj;
  let protocol = urlObj.protocol || "";
  let pathname = urlObj.pathname || "";
  let hash = urlObj.hash || "";
  let query = urlObj.query || "";
  let host: string | false = false;

  auth = auth ? `${encodeURIComponent(auth).replace(/%3A/i, ":")}@` : "";

  if (urlObj.host) {
    host = auth + urlObj.host;
  } else if (hostname) {
    host = auth + (~hostname.indexOf(":") ? `[${hostname}]` : hostname);
    if (urlObj.port) {
      host += `:${urlObj.port}`;
    }
  }

  if (query && typeof query === "object") {
    query = String(urlQueryToSearchParams(query));
  }

  let search = urlObj.search || (query && `?${query}`) || "";

  if (protocol && !protocol.endsWith(":")) protocol += ":";

  if (
    urlObj.slashes ||
    ((!protocol || slashedProtocols.test(protocol)) && host !== false)
  ) {
    host = `//${host || ""}`;
    if (pathname && pathname[0] !== "/") pathname = `/${pathname}`;
  } else if (!host) {
    host = "";
  }

  if (hash && hash[0] !== "#") hash = `#${hash}`;
  if (search && search[0] !== "?") search = `?${search}`;

  pathname = pathname.replace(/[?#]/g, encodeURIComponent);
  search = search.replace("#", "%23");

  return `${protocol}${host}${pathname}${search}${hash}`;
}