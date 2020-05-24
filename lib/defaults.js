'use strict';

var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

// 接入适配器
// 如果在浏览器环境，存在XMLHttpRequest类，则用XMLHttpRequest类来实现
// 如果在node环境，则使用http来实现
function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') { // 判断是否存在XMLHttpRequest类
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  }
  return adapter;
}

var defaults = {
  adapter: getDefaultAdapter(),

  // `transformRequest` 允许在向服务器发送前，修改请求数据
  // 只能用在 'PUT', 'POST' 和 'PATCH' 这几个请求方法
  // 后面数组中的函数必须返回一个字符串，或 ArrayBuffer，或 Stream
  // transformRequest transformResponse是在dispatchRequest函数中的transformData函数中处理的
  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept'); // 替换Accpet属性
    normalizeHeaderName(headers, 'Content-Type'); // 替换Content-Type属性
    /**
     * 下面是对data做处理
     */
    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }
    return data;
  }],

  // `transformResponse` 在传递给 then/catch 前，允许修改响应数据
  transformResponse: [function transformResponse(data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0, // 超时设置

  /** 
   * axios请求配置对象中提供了 xsrfCookieName 和 xsrfHeaderName这两个属性，
   * 其中 xsrfCookieName 表示存储 token 的 cookie 名称，
   * xsrfHeaderName 表示请求 headers 中 token 对应的 header 名称。
   * 然后每次发送请求的时候，会自动从 cookie 中读取对应的 token 值，
   * 然后将其添加到请求 headers中。
   * */
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  validateStatus: function validateStatus(status) { // 校验状态码成功或失败
    return status >= 200 && status < 300;
  }
};

defaults.headers = { // 设置默认头部
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

/**
 * 设置默认的
 * 适配器
 * 请求转换器
 * 响应转换器
 * 超时
 * token在cookie键值命名及请求头命名
 * 状态码校验函数
 */
module.exports = defaults;
