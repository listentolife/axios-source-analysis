'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var cookies = require('./../helpers/cookies');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');

/**
 * xhrAdapter接收了axios的请求配置
 * 然后返回了一个请求的promise
 */
module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    // 判断data是否为FormData，是则删掉Content-Type
    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
      // 删除Content-Type ，浏览器会根据请求数据是FormData默认设置Content-Type为multipart/form-data
    }

    // 建一个http请求
    var request = new XMLHttpRequest();

    // HTTP basic authentication
    // 如果需要用户认证就设置认证信息
    // btoa编码用户认证信息
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    // 拼接请求url
    var fullPath = buildFullPath(config.baseURL, config.url);
    // 初始化请求
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    // 设置最大请求时间
    request.timeout = config.timeout;

    // Listen for ready state
    // 监听readyState 属性变化
    /**
     * readyState
     * 值	状态	            描述
     * 0	UNSENT	         代理被创建，但尚未调用 open() 方法。
     * 1	OPENED	         open() 方法已经被调用。
     * 2	HEADERS_RECEIVED send() 方法已经被调用，并且头部和状态已经可获得。
     * 3	LOADING	         下载中； responseText 属性已经包含部分数据。
     * 4	DONE	           下载操作已完成。
     */
    /**
     * status
     * HTTP 响应状态代码指示特定 HTTP 请求是否已成功完成。
     * 响应分为五类：信息响应(100–199)，成功响应(200–299)，
     * 重定向(300–399)，客户端错误(400–499)和服务器错误 (500–599)。
     */
    request.onreadystatechange = function handleLoad() {
      // 如果request没有了或者readyState不等于4，就不处理
      if (!request || request.readyState !== 4) {
        return;
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      // request.responseURL - 返回响应的序列化（serialized）URL，如果该 URL 为空，则返回空字符串。
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Prepare the response
      // request.getAllResponseHeaders - 以字符串的形式返回所有用 CRLF 分隔的响应头，如果没有收到响应，则返回 null。
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      var response = { // 把响应的内容整理起来
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    };

    // Handle browser request cancellation (as opposed to a manual cancellation)
    // 监听请求取消，然后reject掉Promise，传入取消请求的Error实例
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    // 监听请求失败，然后reject掉Promise，传入响应失败的Error实例
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    // 监听超时
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    // 判断是否是标准的浏览器环境
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      // 判断withCredentials为true则支持携带cookie，或者判断请求地址跟页面地址是否同域，且设置了xsrfCookieName键名
      // 是则读取cookie并在请求头上带上
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    // 如果存在设置请求头的方法setRequestHeader，则把config中header的部分设置进去
    // 当key为content-type且requestData为空时，不设置content-type
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    // 如果config.withCredentials有值，则设置请求实例上的withCredentials
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    // 如果config.responseType有值，则尝试设置，不支持则抛出错误
    // 参考阮一峰的http://www.ruanyifeng.com/blog/2012/09/xmlhttprequest_level_2.html
    // 这里做try catch是因为老版本的XMLHttpRequest只能返回文本类型，不能设置返回类型。
    // 但是如果请求返回类型为json，也可以继续执行
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    }

    // Handle progress if needed
    // 如果有声明下载进程函数，就做监听
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    // 如果有声明上传进程函数，就做监听
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    // 如果有设置cancelToken，就设置then中的处理
    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        // 如果请求已经清空，就不再处理
        if (!request) {
          return;
        }

        // 取消请求，然后reject调Promise，再清空request
        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    // 如果requestData没有，则设置为null
    if (!requestData) {
      requestData = null;
    }

    // Send the request
    // 设置完请求属性参数，就发送请求
    request.send(requestData);
  });
};
