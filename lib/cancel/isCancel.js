'use strict';

// 判断变量是否为Cancel的实例
module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};
