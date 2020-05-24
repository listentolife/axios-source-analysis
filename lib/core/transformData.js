'use strict';

var utils = require('./../utils');

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 * 这里传入config.transformRequest的函数数组，来执行请求前或者返回then前对data和headers的处理
 */
module.exports = function transformData(data, headers, fns) {
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    // 这里为什么只返回data，是因为headers的数据只是修改，但是data的数据可能是替换
    // 所以每一次执行下一个fn都是修改headers(引用是相同的)，返回data(赋值处理)
    data = fn(data, headers);
  });

  return data;
};
