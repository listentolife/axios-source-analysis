'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 * 创建axios实例
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  // 声明一个Axios实例
  var context = new Axios(defaultConfig);
  // 返回一个function，this指向context，即Axios实例
  // 相当于instance(args)会变成Axios.prototype.request.apply(context, args)
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  // 把Axios.prototype上的属性方法复制到instance上，this指向context
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  // 把context复制到instance
  utils.extend(instance, context);

  // 返回的instance上有Axios类上的方法，有Axios实例上所有属性跟方法
  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
// 暴露 Axios类 方便外部使用继承
axios.Axios = Axios;

// Factory for creating new instances
// 高阶函数，传入用户配置，合并axios默认配置后传入createInstance声明一个Axios实例
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;
