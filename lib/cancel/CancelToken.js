'use strict';

var Cancel = require('./Cancel');


/**
 * 
 * 理清思路
 * 其实cancelToken是一个axios实例的工具，
 * cancelToken其实只有一个属性promise，这个promise的resolve被传到外面，提供给了cancel方法
 * cancel方法通过new CancelToken时传给了传入的executor中，是外部可以获取到
 * 外部只要调用cancel方法，内部就会调用resolve，使promise执行进入then方法中
 * 
 * 而在adapter里，通过判断请求是否配置了cancelToken
 * 如果是，则在cancelToken.promise.then函数中执行请求abort的操作
 * 
 * 我们再看，
 * 如果是new CancelToken，我们拿到的是CancelToken的实例，那么我们需要传入executor来获取cancel方法
 * 如果是调用CancelToken.source()，那么内部其实也是执行了new CancelToken的逻辑，只是直接返回了实例跟cancel方法
 * 
 * 这个地方比较巧妙的是，通过cancelToken传入cancelToken实例，
 * 对应的使用cancel方法，可以准确无多余逻辑的启动取消对应的请求。
 * 
 */

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 * 
 * 支持通过传递一个 executor 函数到 CancelToken 的构造函数来创建 cancel token
 * 相当于CancelToken实例会给executor函数传入一个cancel的方法，这个方法可以abort请求
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  /**
  * 定义一个将来能执行取消请求的promise对象，当这个promise的状态为完成时(fullfilled),
  * 就会触发取消请求的操作（执行then函数）。而执行resolve就能将promise的状态置为完成状态。
  * 这里把resolve赋值给resolvePromise，就是为了在这个promise外能执行resolve而改变这个promise的状态
  * 注意这个promise对象被赋值给CancelToken实例的属性promise，将来定义then函数就是通过这个属性得到promise
  */
  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  /**
    * 将CancelToken实例赋值给token
    * 执行executor函数，将cancel方法传入executor，
    * cancel方法可调用resolvePromise方法，即触发取消请求的操作
    * 
    * Cancel实例其实是保存了CancelToken实例的取消状态
    * 如果多次调用cancel方法，内部只会执行一次resolvePromise方法
    */
  var token = this;
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 * 
 * 用来判断请求是否已经被取消了
 * 这个方法主要是用在dispatchRequest里
 * 也就是在请求在发出起，如果已经触发了cancel方法
 * 那么请求应该已经取消了
 * 就应该直接结束，调reject
 * 这里方法中判断有reason就直接抛报错，外部就直接走reject
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 * 这个方法方便外部一次性拿到token跟cancel
 * 然后把token设置给请求的cancelToken配置中，cancel用来需要取消请求时调用
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;
