(function(C, undefined) {
  var KEYS = {
    "string": ["(\")(((\\\\\")?[^\"\n\r]+?[^\"\\\n\r]*?(\\\\\")*)*)\"", "(\')(((\\\\\')?[^\'\n\r]+?[^\'\\\n\r]*?(\\\\\')*)*)\'"],
    "jsComment": ["(/\\\*([^*]|[\\\r\\\n]|(\\\*+([^*/]|[\\\r\\\n])))*\\\*+/)|(//.*)"],
    "keyword": ["alert", "break", "case", "catch", "continue", "debugger",
      "default", "default", "delete", "do", "eval", "else", "finally",
      "for", "function", "if", "in", "instanceof", "new", "return",
      "switch", "this", "throw", "try", "typeof", "var", "void",
      "while", "with", "Object", "prototype", "Array", "Number",
      "String", "Boolean", "Null", "Undefined", "RegExp", "Function", "window",
      "\{", "\}", "console", "arguments", "setTimeout", "setInterval",
      "clearTimeout", "clearInterval"],
    "method": ["([\\w\\$\\_]+)\\("],
    "object": ["(([\\w\\$\\_]+)(\\.))+([\\w\\$\\_]+)?"],
    "css": [],
    "html": []
  }
  var CODE_TYPE = {"js":1, "css":1, "html":1}
  var HIGHLIGHT_LINE_TMPL = "<li class=\"line\">${code}</li>";
  C.Highlight = Highlight;
  function Highlight(coder, extra) {
    if(!coder) {
      throw new Error("Need the code container")
    }
    this.coder = coder;
    extra = extra || {};
    this.codeType = CODE_TYPE[extra.codeType] && extra.codeType || "js";
    this.indent = extra.indent || 4;
    this.highlight(coder, this.indent);
    this.tmpl = extra.tmpl || HIGHLIGHT_LINE_TMPL;
    this.container = extra.container || null;
    if(extra.container && extra.tmpl) {
      this.line(this.tmpl).render(extra.container)
    }
  }
  Highlight.prototype.highlight = function(coder, indent) {
    var _code = "", _codes = null;
    var codeType = this.codeType;
    _code = this.code(coder);
    _code = htmlEncode(_code);
    indent = indent || this.indent;
    var _indent = "";
    for(var k = 0;k<indent;k++) {
      _indent += "\u00A0"
    }
    _code = _code.replace(/\s*$/g, "");
    _code = _code.replace(/\t/gm, _indent);
    if(codeType === "js") {
      _code = this.jsHighlight(_code)
    }else if(codeType === "css") {
      _code = this.cssHighlight(_code)
    }else if(codeType === "html") {
      _code = this.htmlHighlight(_code)
    }
    _codes = _code.split(/\n|\r/gm);
    // 删除最后一个空行
    var lastLine = _codes[_codes.length-1];
    if(/^\s+$/.test(lastLine) || !lastLine) {
      _codes.pop();
    }
    this.codes = _codes;
    return this
  }
  Highlight.prototype.code = function(coder) {
    if(!coder) {
      return ""
    }
    var _code = "";
    if(coder.nodeType == 1) {
      var tag = coder.tagName.toLowerCase();
      if(tag == "textarea" || tag == "input") {
        _code = coder.value;
      }else {
        _code = coder.innerText || coder.textContent
      }
    }
    return _code
  }
  Highlight.prototype.jsHighlight = function(_code) {
    // 1. 字符串高亮
    var STRING_REG = new RegExp(KEYS.string.join("|"), "g");
    _code = _code.replace(STRING_REG, function() {
      var m = arguments[2] || arguments[7];
      var quote = arguments[1] || arguments[6];
      return quote + (m?("<i class=\"string\">"+m+"</i>"):"") + quote
    });
    // 0. 注释高亮
    var COMMENT_REG = new RegExp(KEYS.jsComment.join("|"), "g");
    _code = _code.replace(COMMENT_REG, function(m0) {
      var comments = m0.split(/[\n\r]/g);
      var cmt = "";
      for(var k = 0,steps=comments.length;k<steps;k++) {
        cmt = comments[k];
        comments[k]=cmt?"<i class=\"jsComment\">"+cmt+"</i>":""
      }
      return comments.join("\n")
    });
    // 2. 关键字高亮
    var KEY_WORDS_REG = new RegExp("\\b("+KEYS.keyword.join("|")+")\\b", "gm");
    _code = _code.replace(KEY_WORDS_REG, function(m0) {
      return "<i class=\"keyword\">"+m0+"</i>"
    });
    // 3. 方法高亮
    var METHOD_REG = new RegExp(KEYS.method.join("|"), "gm");
    _code = _code.replace(METHOD_REG, function(m0, m1) {
      return "<i class=\"method\">"+m1+"</i>" + "("
    });
    // 4. 对象和属性高亮
    var OBJECT_REG = new RegExp(KEYS.object.join("|"), "gm");
    _code = _code.replace(OBJECT_REG, function(m0) {
      var ns = m0.split(".");
      var lights = [];
      for(var k = 0, steps = ns.length;k<steps;k++) {
        if(!k) {
          lights.push("<i class=\"object\">"+ns[k]+"</i>")
        }else {
          lights[k]!="." && lights.push("<i class=\"property\">"+ns[k]+"</i>")
        }
      }
      return lights.join(".") + (lights[k-1]=="."?".":"")
    })
    return _code
  }
  Highlight.prototype.cssHighlight = function(_code) {}
  Highlight.prototype.htmlHighlight = function(_code) {}
  Highlight.prototype.line = function(tmpl) {
    this.tmpl = tmpl || this.tmpl || HIGHLIGHT_LINE_TMPL;
    tmpl = this.tmpl;
    var ret = [];
    var _codes = this.codes;
    for(var k = 0, len=_codes.length;k<len;k++) {
      ret.push(tmpl.replace("${code}", "<pre>"+(_codes[k]||" ")+"</pre>"))
    }
    this.codes = ret;
    ret = null;
    return this
  }
  Highlight.prototype.render = function(container) {
    this.container = container || this.container || document.body;
    container = this.container;
    container.className = "codeHighlight";
    container.innerHTML = this.codes.join("");
    return this
  }
  Highlight.prototype.reset = function(coder) {
    coder = coder || this.coder;
    var _code = this.highlight(coder);
    this.line().render();
  }
  Highlight.prototype.update = function() {
    this.reset(this.coder)
  }

  function htmlEncode(htmlStr) {
    htmlStr = htmlStr.replace("\<", "&lt;");
    htmlStr = htmlStr.replace("\>", "&gt;");
    return htmlStr
  }
})(this)