'use strict';

var createError = require('./createError');

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  // 没有状态码，或者没有校验函数，或者有校验函数且校验为true时，走resolve
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    // 否则走reject，创建一个请求Error实例
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};
