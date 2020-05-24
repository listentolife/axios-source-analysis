'use strict';

/**
 * 高阶函数，返回一个函数，接收arguments
 * 把arguments转为数组，然后用apply绑定fn的this
 * 然后把arguments传入执行
 * 重写的原因是apply兼容的浏览器版本更早更多
 */
module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};
