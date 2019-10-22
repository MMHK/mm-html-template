"use strict";

const glob = require("glob");
const path = require("path");
const matchAll = require("string.prototype.matchall");

module.exports = function (content, sourceMap) {
  this.cacheable && this.cacheable();
  let resourceDir = path.dirname(this.resourcePath);
  const ES6ImportRegex = /import +(.*) +from +['"]+(.*)['"]+/g;
  const CommonsJSRegex = /require\((['"]+)([^'"]+)(['"]+)\)/g;
  let modules = [];

  let getModules = function(dep) {
    return glob.sync(dep, {
      cwd: resourceDir
    })
  }

  let generateMapping = function(dep) {
    return dep.map((item) => {
      let extension = path.extname(item);
      let stringifiedFile = path.basename(item, extension)
      return `"${stringifiedFile}" : require("${item}")`;
    }).join(",\r\n");
  }

  let generateES6Mapping = function(dep, key) {
    let header = dep.map((item, index) => {
      let extension = path.extname(item);
      let stringifiedFile = path.basename(item, extension)
      return `import dep${index} from "${item}";`;
    }).join("\r\n");

    let mapping = dep.map((item, index) => {
      let extension = path.extname(item);
      let stringifiedFile = path.basename(item, extension)
      return `"${stringifiedFile}": dep${index}`;
    }).join(",\r\n")

    return  `${header}\r\n const ${key} = {${mapping}}`;
  }

  let matches = matchAll(content, ES6ImportRegex);
  let ES6Replace = [];
  for(const m of matches) {
    if (m.length > 2 && m[2].indexOf("*") > -1) {
      modules.push(m[2]);
      if (m[1].indexOf("*") < 0) {
        var tmp = generateES6Mapping(getModules(m[2]), m[1])
        ES6Replace.push({
          src: m[0],
          dist: tmp,
        });
      }
    }
  }

  ES6Replace.forEach((item) => {
    content = content.replace(item.src, item.dist);
  })

  let CommonsMatches = matchAll(content, CommonsJSRegex);
  
  let CommonsReplace = [];
  for (const match of CommonsMatches) {

    if (match.length > 2 && match[2].indexOf("*") > -1) {
      modules.push(match[2]);

      var tmp = generateMapping(getModules(match[2]))
      CommonsReplace.push({
        src: match[0],
        dist: ` {${tmp}}`,
      });
    }
  }

  CommonsReplace.forEach((item) => {
    content = content.replace(item.src, item.dist);
  })

  modules = modules.reduce((last, item) => {
    var list = glob.sync(item, {
      cwd: resourceDir
    })

    return last.concat(list)
  }, [])

  modules.forEach((file) => {
    this.addDependency(path.resolve(resourceDir, file));
  });

  return content;
};