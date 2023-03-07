(() => {

/** 所有模块对象 */
var __webpack_modules__ = {

'./src/lastname.js': ((module, exports, __webpack_require__) => {

module.exports = 'Chen';

}),
'./src/name.js': ((module, exports, __webpack_require__) => {

const lastname = __webpack_require__("./src/lastname.js");
console.log('name');
exports.fullname = 'Siky Chen';
exports.firstname = 'Siky';
exports.lastname = lastname;

}),
'./src/age.js': ((module, exports, __webpack_require__) => {

module.exports = {
  real: 30,
  fake: 18
};

}),
'./src/index.js': ((module, exports, __webpack_require__) => {

const name = __webpack_require__("./src/name.js");
const age = __webpack_require__("./src/age.js");
console.log('打印：', name, age);

})
}

/******************************************/
/***** 模板代码，包括缓存和 require 方法 *****/
var __webpack_module_cache__ = {};
function __webpack_require__(moduleId) {
  // 有缓存则只使用缓存
  var cachedModule = __webpack_module_cache__[moduleId];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }

  // 没有缓存则创建
  var module = __webpack_module_cache__[moduleId] = {
    id: moduleId,
    loaded: false,
    exports: {},
  }

  __webpack_modules__[moduleId](module, module.exports, __webpack_require__);

  module.loaded = true;

  return module.exports;
}
var __webpack_exports__ = {};
/******************************************/

/** 入口模块代码 */
const name = __webpack_require__("./src/name.js");
const age = __webpack_require__("./src/age.js");
console.log('打印：', name, age);

})();