'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = { // 拦截器
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }

  /**
   * 合并配置
   * axios本身有默认配置
   * 然后在调new Axios()第一次传入配置并合并，传入配置是公共配置
   * 在request上第二次传入配置并合并，传入配置是请求配置
   */
  config = mergeConfig(this.defaults, config);

  // Set config.method
  // 设置method，默认为get
  // 先找最新传入的配置中有没有设置method
  // 然后再找new的时候传入的配置有没有设置method
  // 最后再默认为get
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  /**
   * 下面几步的操作是这样的
   * chain是用来存放调用函数的数组，默认数组的中间有dispatchRequest跟undefined，
   * 是结束完请求前拦截之后调用的resolve跟reject，因为只有拦截器resolve了才会调用dispatchRequest，reject的话后面就不执行了，就是提供了一个undefined
   * 然后通过this.interceptors.request.forEach跟this.interceptors.response.forEach在数组两头存入请求拦截跟响应拦截
   * config包裹一层promise是为了后面可以走拦截器的逻辑。
   * 按代码的写法，第一层拦截器的reject方法应该是没有用的，可以直接设置为undefined
   * 然后在一对对的从chain头部提出拦截器resolve跟reject进行调用
   * 
   * 关键的请求在dispatchRequest中
   */

  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
// 这里提供了methods方法，是通过封装request来实现的，换言之所有逻辑都在request中
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;
