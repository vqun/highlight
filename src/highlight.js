(function(C){
  C.HConfig = {
    "js": {
      "keywords": ["var", "function", "this", "new", "String"]
    },
    "css": {
      "keywords": ["css", "height", "width", "border", "{", "}"]
    },
    "html": {
      "keywords": ["html", "head", "body", "div"]
    },
    "config": {
      "codeType": ["js", "css", "html"]
    }
  }
})(this);
(function(C, undefined) {
  var STRING_REG = /("|')(?:[^\1]*?(?:(?:\\\\)*(?:\\"|\\')?)*[^\1]*?)*?\1/gm, // 字符串匹配(虽然可以多行，但是，不会判断相应语言的多行字符串的格式)
      COMMENT_REG = /(?:\/\*(?:[^*]|[\r\n]|(?:\*+(?:[^(?:\*\/)]|[\r\n])))*\*+\/)|(?:\/\/.*)/gm;
  var CODE_TYPE = {"js":1, "css":1, "html":1}, HIGHLIGHT_LINE_TMPL = "<li class=\"line\">${code}</li>";
  C.Highlight = Highlight;
  function Highlight(coder, extra) {
    property.apply(this, arguments);
    init.apply(this, arguments);
  }
  Highlight.prototype = {
    "constructor": Highlight,
    "highlight": function(coder, indents) {
      var codes = this.originalCodes = getCode(coder);
      var codeType = this.codeType;
      indent = indents || this.indents;

      // create indent with space(\u00A0)
      var _indent = new Array(indent+1).join("\u00A0");

      // del the space on the tail and replace the tab to indent
      codes = codes.replace(/\s*$/g, "").replace(/\t/gm, _indent);

      codes = this.compile(codes);

      // split with \n|\r as lines
      codes = codes.split(/\n|\r/gm);
      // del the last space line
      var lastLine = codes[codes.length-1];
      if(/^\s+$/.test(lastLine) || !lastLine) {
        codes.pop();
      }
      this.codes = codes;
      return this
    },
    "compile": function(codes) {
      var ret = [], codeType = this.codeType;
      var str, cmmnt, str_idx, cmmnt_idx, str_len, cmmnt_len, s_i, c_i, idx = 0;
      while ((str = STRING_REG.exec(codes)), (cmmnt = COMMENT_REG.exec(codes)), str && cmmnt){
        strinfo(str[0]);
        cmmntinfo(cmmnt[0]);
        // IF /*...*/ ... "XXX" || /*..."XXX"...*/
        if(cmmnt_idx < s_i || c_i < s_i && str_idx <= cmmnt_idx){
          buildKW(codes.slice(idx, c_i));
          buildComment(cmmnt[0]);
          STRING_REG.lastIndex = idx = cmmnt_idx;
        }else {
          buildKW(codes.slice(idx, s_i));
          buildString(str[0]);
          COMMENT_REG.lastIndex = idx = str_idx;
        }
      }
      if(str){
        do{
          strinfo(str[0]);
          buildKW(codes.slice(idx, s_i));
          buildString(str[0]);
        }while(str = STRING_REG.exec(codes))
      }else if(cmmnt){
        do{
          cmmntinfo(cmmnt[0]);
          buildKW(codes.slice(idx, c_i));
          buildComment(cmmnt[0]);
        }while(cmmnt = COMMENT_REG.exec(codes))
      }
      ret.push(buildKW(codes.slice(idx)));
      // reset lastIndex for next compile
      STRING_REG.lastIndex = 0;
      COMMENT_REG.lastIndex = 0;
      return ret.join("");
      function strinfo(str) {
        str_idx = STRING_REG.lastIndex;
        str_len = str.split("").length;
        s_i = str_idx - str_len;
      }
      function buildString(str) {
        var quote = str.slice(0,1);
        ret.push(quote + "<i class=\"string\">" + str.slice(1, -1) + "</i>" + quote);
        idx = str_idx - 1;
      }
      function cmmntinfo(cmmnt) {
        cmmnt_idx = COMMENT_REG.lastIndex;
        cmmnt_len = cmmnt.split("").length;
        c_i = cmmnt_idx - cmmnt_len;
      }
      function buildComment(cmmnt) {
        ret.push("<i class=\"comment\">" + cmmnt + "</i>");
        idx = cmmnt_idx;
      }
      function buildKW(codes) {
        var cfg, keywords = (cfg = C.HConfig[codeType]) && cfg.keywords || [];
        for(var k = keywords.length; k--;)
          codes = codes.replace(new RegExp("("+keywords[k]+")", "gm"), "<i class=\"keyword\">$1</i>");
        ret.push(codes);
      }
    },
    "line": function(tmpl) {
      this.tmpl = tmpl || this.tmpl || HIGHLIGHT_LINE_TMPL;
      tmpl = this.tmpl;
      var ret = [];
      var _codes = this.codes;
      for(var k = 0, len=_codes.length;k<len;k++)
        ret.push(tmpl.replace("${code}", "<pre>"+(_codes[k]||" ")+"</pre>"));
      this.linedCodes = ret;
      ret = null;
      return this
    },
    "render": function(container) {
      this.container = container || this.container || document.body;
      container = this.container;
      var cls = container.className;
      if(cls.indexOf("codeHighlight") == -1)
        container.className += " codeHighlight";
      container.innerHTML = this.linedCodes.join("");
      return this
    },
    "reset": function(coder) {
      coder = coder || this.coder;
      var _code = this.highlight(coder);
      this.line().render();
    },
    "update": function() {
      this.reset(this.coder)
    }
  }
  function property(coder, extra) {
    extra = extra || {};
    this.coder = coder;
    this.codeType = CODE_TYPE[extra.codeType] && extra.codeType || "js";
    this.indents = extra.indents || 4;
    this.tmpl = extra.tmpl || HIGHLIGHT_LINE_TMPL;
    this.container = extra.container || null;
    this.originalCodes;
  }
  function init(coder, extra) {
    this.highlight(coder, this.indents);
    if(this.container && this.container.nodeType == 1)
      this.line().render();
  }
  function getCode(coder) {
    if(!coder) return "";
    if(Object.prototype.toString.call(coder) == "[object String]")
      return "" + coder;
    var code = "";
    if(coder.nodeType == 1) {
      var tag = coder.tagName.toLowerCase();
      if(tag == "textarea" || tag == "input")
        code = coder.value;
      else
        code = typeof coder.textContent == "string" ? coder.textContent : coder.innerText;
    }
    return code
  }
})(this)