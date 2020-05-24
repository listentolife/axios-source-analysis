'use strict';

var utils = require('../utils');

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 * 
 * mergeConfig方法传入两个配置对象，返回合并后的配置对象
 * 这个方法主要用于合并axios默认配置及用户配置，后者将覆盖前者
 * 类似Object.assign(config1, config2)的功能，但是内部对配置项做了分类，部分配置项需要做深拷贝
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {}; // 排除无用户配置项
  var config = {}; // 最终返回的配置变量

  /**
   * valueFromConfig2Keys这个数组保存有需要从用户获得的配置项
   * mergeDeepPropertiesKeys这个数组保存有需要深拷贝的配置项
   * defaultToConfig2Keys这个数组保存有axios已有默认值的配置项
   */
  var valueFromConfig2Keys = ['url', 'method', 'data'];
  var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
  var defaultToConfig2Keys = [
    'baseURL', 'url', 'transformRequest', 'transformResponse', 'paramsSerializer',
    'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
    'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress',
    'maxContentLength', 'maxBodyLength', 'validateStatus', 'maxRedirects', 'httpAgent',
    'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
  ];

  // 利用utils.forEach处理需要从用户获得的配置项
  utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
    if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop];
    }
  });

  // 利用utils.forEach处理可能需要深拷贝的配置项
  utils.forEach(mergeDeepPropertiesKeys, function mergeDeepProperties(prop) {
    if (utils.isObject(config2[prop])) { // 如果config2配置项值为对象，则使用深拷贝赋值
      config[prop] = utils.deepMerge(config1[prop], config2[prop]);
    } else if (typeof config2[prop] !== 'undefined') { // 如果 config2配置项不为undefined，则直接赋值
      config[prop] = config2[prop];
    } else if (utils.isObject(config1[prop])) { // 以上判断完config2，就判断config1的配置值是否为Object，是着使用深拷贝赋值
      config[prop] = utils.deepMerge(config1[prop]);
    } else if (typeof config1[prop] !== 'undefined') { // 否则判断不为undefined就直接赋值
      config[prop] = config1[prop];
    }
  });

  // 利用utils.forEach来处理其他axios已有默认值的配置项
  utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
    if (typeof config2[prop] !== 'undefined') { // 如果config2中有配置且不为undefined，则赋值
      config[prop] = config2[prop];
    } else if (typeof config1[prop] !== 'undefined') { // 否则判断config1中配置不为undefined，则赋值
      config[prop] = config1[prop];
    }
  });

  // 合并所有前面已处理赋值的配置属性
  var axiosKeys = valueFromConfig2Keys
    .concat(mergeDeepPropertiesKeys)
    .concat(defaultToConfig2Keys);

  // 筛选出前面未处理到的用户配置属性
  var otherKeys = Object
    .keys(config2)
    .filter(function filterAxiosKeys(key) {
      return axiosKeys.indexOf(key) === -1;
    });

  // 处理前面未处理到的用户配置属性赋值
  utils.forEach(otherKeys, function otherKeysDefaultToConfig2(prop) {
    if (typeof config2[prop] !== 'undefined') { // 判断config2中配置非undefined则赋值
      config[prop] = config2[prop];
    } else if (typeof config1[prop] !== 'undefined') { // 否则再判断config1中是否哟默认非undefined值，有则赋值
      config[prop] = config1[prop];
    }
  });

  return config;
};
