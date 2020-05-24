'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        /**
         * 写入cookie
         * @param {*} name 键
         * @param {*} value 值
         * @param {*} expires 缓存时间
         * @param {*} path 缓存路径
         * @param {*} domain 域名
         * @param {*} secure 设置是否只能使用https协议发送服务器
         */
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        /**
         * 读取cookie
         * @param {*} name 需要读取cookie的键名
         * 正则匹配拿到数组，取下标为3的值，就是对应的值
         */
        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        /**
         * 清除cookie
         * @param {*} name 需要清除cookie的键名
         * 直接把缓存时间更新成已过期
         */
        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
  // 如果不是标准的浏览器环境，那么最后返回的对象也需要实现支持，只是内部没处理而已
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);
