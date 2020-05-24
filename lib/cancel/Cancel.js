'use strict';

/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 * 
 * Cancel类，用来处理abort请求的
 */
function Cancel(message) {
  this.message = message;
}

// 重写totirng，改为返回message信息
Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

// 用来判断是否为Cancel类
Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;
