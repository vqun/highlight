(function(C){
  C.HConfig = {
    "js": {
      "keywords": []
    },
    "css": {
      "keywords": []
    },
    "html": {
      "keywords": []
    },
    "config": {
      "codeType": ["js", "css", "html"]
    }
  }
})(this);
(function(C, undefined) {
  var KEYWORDS_REG = "",
      STRING_REG = /("|')((?:[^\1]*?(?:(?:\\\\)*(?:\\"|\\')?)*[^\1]*?)*?)\1/gm, // 字符串匹配(虽然可以多行，但是，不会判断相应语言的多行字符串的格式)
      COMMENT_REG = /(?:\/\*(?:[^*]|[\r\n]|(?:\*+(?:[^(?:\*\/)]|[\r\n])))*\*+\/)|(?:\/\/.*)/gm;
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

    // create indent number of space(\u00A0)
    var _indent = new Array(indent+1).join("\u00A0");

    // del the space on the tail and replace the tab to indent
    _code = _code.replace(/\s*$/g, "").replace(/\t/gm, _indent);

    _code = this.compile(_code);

    // split with \n|\r as lines
    _codes = _code.split(/\n|\r/gm);
    // del the last one space line
    var lastLine = _codes[_codes.length-1];
    if(/^\s+$/.test(lastLine) || !lastLine) {
      _codes.pop();
    }
    this.codes = _codes;
    return this
  }
  // get code string from coder
  Highlight.prototype.code = function(coder) {
    if(!coder) {
      return ""
    }
    if(coder + "" == coder)
      return "" + coder;
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
  Highlight.prototype.compile = function compile(code) {
    // 1. String
    // 2. Comment
    // var t = "/*";var b ="*/"
    var ret = [], codeType = this.codeType;
    var str, cmmnt, _code = this.codes, str_idx, cmmnt_idx, str_len, cmmnt_len, s_i, c_i, idx = 0;
    while ((str = STRING_REG.exec(_code)) && (cmmnt = COMMENT_REG.exec(_code))){
      strinfo();
      cmmntinfo();
      if(str_idx < cmmnt_idx && s_i > c_i){
        // string in comment
        buildComment();
        STRING_REG.lastIndex = cmmnt_idx;
      }else{
        // comment in string
        buildString();
        COMMENT_REG.lastIndex = str_idx;
      }
    }
    if(str){
      strinfo();
      buildString();
      while(str = STRING_REG.exec(_code)){
        strinfo();
        buildString()
      }
    }
    if(cmmnt){
      cmmntinfo();
      buildComment();
      while(cmmnt = COMMENT_REG.exec(_code)){
        cmmntinfo();
        buildComment()
      }
    }
    ret.push(buildKW(_code.slice(idx)));
    return ret.join("");
    function strinfo() {
      str_idx = STRING_REG.lastIndex;
      str_len = str[2].split("").length;
      s_i = str_idx - str_len;
    }
    function buildString() {
      ret.push(buildKW(_code.slice(idx, s_i-1)));
      ret.push("<i class=\"string\">" + str[2] + "</i>");
      idx = str_idx - 1;
    }
    function cmmntinfo() {
      cmmnt_idx = COMMENT_REG.lastIndex;
      cmmnt_len = cmmnt[0].split("").length;
      c_i = cmmnt_idx - cmmnt_len;
    }
    function buildComment() {
      ret.push(buildKW(_code.slice(idx, c_i-1)));
      ret.push("<i class=\"jsComment\">" + cmmnt[0] + "</i>");
      idx = cmmnt_idx;
    }
    function buildKW(codes) {
      var cfg, keywords = (cfg = C.HConfig[codeType]) && cfg.keywords || [];
      for(var k = keywords.length; k--;)
        codes = codes.replace(new RegExp("("+keywords[k]+")", "gm"), "<i class=\"keyword\">$1</i>");
      return codes
    }
  }
  Highlight.prototype.jsHighlight = function(_code) {
    // 1. 字符串高亮
    _code = _code.replace(STRING_REG, function() {
      var m = arguments[2] || arguments[7];
      var quote = arguments[1] || arguments[6];
      return quote + (m?("<i class=\"string\">"+m+"</i>"):"") + quote
    });
    // 2. 注释高亮
    _code = _code.replace(COMMENT_REG, function(m0) {
      var comments = m0.split(/[\n\r]/g);
      var cmt = "";
      for(var k = 0,steps=comments.length;k<steps;k++) {
        cmt = comments[k];
        comments[k]=cmt?"<i class=\"jsComment\">"+cmt+"</i>":""
      }
      return comments.join("\n")
    });
    // 3. 关键字高亮
    _code = _code.replace(KEYWORDS_REG, function(m0) {
      return "<i class=\"keyword\">"+m0+"</i>"
    });
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