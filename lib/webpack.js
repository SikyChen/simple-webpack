const fs = require('fs');
const path = require('path');
const parser = require("@babel/parser");
const types = require("@babel/types");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;

// 根目录
const baseDir = process.cwd().replace(/\\/g, '/');

// 模块列表 [{ id, names, dependencies, _source }]
let modules = [];
// 代码块列表
let chunks = [];
// 资源列表 { fileName: code }
let assets = {};

function generateCode(chunk) {
  return (
`(() => {

/** 所有模块对象 */
var __webpack_modules__ = {
${chunk.modules.map(module => (`
'${module.id}': ((module, exports, __webpack_require__) => {

${module._source}

})`
))}
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
${chunk.entryModule._source}

})();`
  )
}

exports.webpack = function(options) {

  function run() {
    modules = [];
    chunks = [];
    assets = {};

    // 1. 获取入口文件，若是字符串配置的，则默认为 main
    let entry = {};
    if (typeof options.entry === 'string') {
      entry.main = options.entry;
    } else {
      entry = options.entry;
    }
  
    // 2. 从入口文件出发，编译模块
    // 目标：{ moduleId: module } 如 { './src/age.js': { id, names, dependencies, _source } }
    for (let entryName in entry) {
      // 入口文件绝对路径
      const entryFilePath = path.posix.join(baseDir, entry[entryName]);
      // 3. 生成入口文件的模块对象，entryName 作为打包后的代码块名称
      const entryModule = buildModule(entryName, entryFilePath);
      // 将入口文件的模块对象放入模块列表中
      modules.push(entryModule);
  
      // 5. 根据当前入口文件生成代码块 chunk
      const chunk = {
        name: entryName,
        entryModule,
        modules: modules.filter(module => module.names.includes(entryName)),
      }
      chunks.push(chunk);
    }
  
    // 6. 根据 chunks 信息生成目标代码资源列表
    chunks.forEach(chunk => {
      const fileName = options.output.filename.replace('[name]', chunk.name);
      assets[fileName] = generateCode(chunk);
    });
  
    // 7. 根据 assets 生成文件
    for (const fileName in assets) {
      let filePath = path.join(options.output.path, fileName);
      fs.writeFileSync(filePath, assets[fileName], 'utf8');
    }
  }

  // 3. 递归生层文件的模块对象，返回模块对象 { id, names, dependencies, _source }
  function buildModule(name, modulePath) {
    // 使用文件相对于根目录的地址作为模块id
    const moduleId = './' + path.posix.relative(baseDir, modulePath);
    // 获取源代码
    const sourceCode = fs.readFileSync(modulePath, 'utf8');

    // 创建模块对象
    const module = {
      id: moduleId,
      names: [name],    // 表示当前模块属于哪个代码块，代码块跟入口文件对应，就是入口文件模块的name
      dependencies: [],
      _source: '',
    }

    let ast = parser.parse(sourceCode, { sourceType: 'module' });
    traverse(ast, {
      CallExpression: (nodePath) => {
        const { node } = nodePath;
        if (node.callee.name === 'require') {
          // 当前模块所在目录
          let dirname = path.posix.dirname(modulePath);
          // 获取引入模块时，写入的地址，这里只考虑相对地址 './../abc' 这种
          let depModuleName = node.arguments[0].value;
          // 拼接出引入模块的绝对地址
          let depModulePath = path.posix.join(dirname, depModuleName);

          // 判断该文件是否存在，并确认实际文件的地址，兼容写和不写 .js 后缀名的情况
          if (fs.existsSync(depModulePath)) {
            depModulePath = depModulePath;
          }
          else if (fs.existsSync(depModulePath + '.js')) {
            depModulePath = depModulePath + '.js';
          }
          else {
            throw new Error('找不到该模块 ${depModulePath}');
          }

          // 根据引入模块相对于根目录的地址，生成模块id
          let depModuleId = './' + path.posix.relative(baseDir, depModulePath);
          // 将依赖模块路径改为依赖模块 id，即把依赖模块的相对路径改为相对于根目录的路径
          node.arguments = [types.stringLiteral(depModuleId)];
          // 将 require 方法改名为 __webpack_require__
          node.callee.name = '__webpack_require__';
          // 把依赖的模块添加进当前模块的依赖列表中
          module.dependencies.push({ depModuleId, depModulePath });
        }
      }
    });

    // 将转换后的 ast 生成新的代码
    const { code } = generator(ast);
    module._source = code;

    // 4. 遍历依赖列表，递归的为所有依赖的模块创建模块对象
    module.dependencies.forEach(({ depModuleId, depModulePath }) => {
      // 检查该模块是否已创建过对象
      let existModule = modules.find(module => module.id === depModuleId);
      if (existModule) {
        existModule.names.push(name);
      } else {
        // 对依赖的模块，进行编译，并把编译后得到的模块对象，放入 this.modules 中。代码块名字 name 透传下去，即所有属于当前入口模块依赖和间接依赖的模块，都属于当前代码块
        const depModule = buildModule(name, depModulePath);
        modules.push(depModule);
      }
    });

    return module;
  }

  return {
    run,
  };
}
