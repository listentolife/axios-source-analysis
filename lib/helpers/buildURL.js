'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%40/gi, '@').
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) { // 如果没有设置params，就直接返回url
    return url;
  }

  // paramsSerializer是用户提供的params序列化函数
  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    // 如果没有paramsSerializer，则判断param是否是URLSearchParams的实例，是则直接toString()拿到字符串
    serializedParams = params.toString();
  } else {
    // 都没有就内部处理params to string
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      // 如果val为空就不处理
      if (val === null || typeof val === 'undefined') {
        return;
      }

      // 如果val是数组，就在key值后面加[]，否则就把val改成数组形式
      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      // 遍历val
      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          // 如果是日期，则toISOString输出一个ISO（ISO 8601 Extended Format）格式的字符串
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          // 如果是对象，则用JSON.stringify转字符串
          v = JSON.stringify(v);
        }
        // 然后拼到parts中
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    // 最后生成params的字符串格式
    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    // 如果serializedParams有值，则接入url中
    // 判断url上有没有#，有就去掉#后面，然后用?接上serializedParams
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};
