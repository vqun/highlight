(function(global, undefined) {
  global.Saber = global.saber = global.S = {};
  var S = global.Saber;
  var ArraySlice = Array.prototype.slice,
    ObjToString = Object.prototype.toString;
  S.register = register;
  register("All", function($) {return document.getElementsByTagName("*")});
  register("dom.id", function($) {
    return function(id) {return document.getElementById(id)};
  }, "id");
  register("dom.id", null, "$");
  register("dom.tag", function($){
    return function(tag, ref) {ref = ref || document;return ref.getElementsByTagName(tag)};
  }, "T");
  register("dom.isNode", function($) {
    return function(who) {return !!who && who.nodeType===1}
  }, "isNode")
  register("util.is", function($) {
    var IsNode = $.isNode;
    return function(who, what) {
      if(what.toLowerCase() === 'node') {
        return IsNode(who)
      }
      var temp = ObjToString.call(who).slice(8, -1);
      return temp.toLowerCase() === what.toLowerCase()
    }
  }, "is");
  register("util.trim", function($) {
    var Is = $.is;
    return function (who) {
      if(!Is(who, 'string')) {return who}
      return who.replace(/^\s+|\s+$/, '')
    }
  }, "trim");
  register("util.clear", function($) {
    var Is = $.is;
    return function(who) {
      if(!Is(who, "string")) {
        return who
      }
      return who.replace(/\s+/g, "")
    }
  }, "clear");
  register("util.cls", function($) {
    var Is = $.is,
      IsNode = $.isNode,
      Trim = $.trim;
    return function(who, ref) {
      var re = [];
      if(!Is(who, 'string')) return re;
      who = Trim(who);
      try{
        var temp = ref && IsNode(ref) && ref.getElementsByClassName(who) || [];
        re = ArraySlice.call(temp)
      }catch(err) {
        var all = (ref && IsNode(ref) && ref.getElementsByTagName("*")) || S.All;
        var k = 0;
        var curr = null;
        var reg = new RegExp('\\b' + who + '\\b');
        while(curr = all[k]) {
          reg.test(curr.className) && re.push(curr);
          ++k;
        }
        all = curr = null;
      }
      return re;
    }
  }, "C");
  register("util.IE", function() {
    return +navigator.userAgent.replace(/.*?MSIE\s+(\d+\.\d*).*/, "$1")||0;
  }, "IE");
  register("util.indexOf", function($) {
    var Is = $.is;
    return function(target, list) {
      if(Is(list, "string") || Is(list, "array")&&list.indexOf) {
        return list.indexOf(target)
      }
      for(var k=0,len=list.length;k<len;k++) {
        if(target === list[k]) return k
      }
    }
  }, "indexOf");
  register("util.forEach", function($) {
    var Is = $.is;
    return function(who, handler, type) {
      if(Is(who, "array")){
        var re = [];
        for(var k = 0, len = who.length; k < len; k++) {
          re.push(handler(k, who[k]))
        }
      }else{
        if(Is(type, "array")) {
          re = [];
          for(var j in who) {
            re.push(handler(j, who[j]))
          }
        }else {
          re = {};
          for(var j in who) {
            re[j] = handler(j, who[j])
          }
        }
      }
      return re;
    }
  }, "forEach");
  register("util.emptyFunc", function($) {
    return function() {}
  }, "emptyFunc")
  register("util.parseParam", function($){
    var ForEach = $.forEach;
    return function(src, obj) {
      return ForEach(src, function(key, value) {
        return obj[key]||value
      })
    }
  }, "parseParam");
  register("dom.style", function($) {
    var IsNode = $.isNode,
      IE = $.IE;
    return function(who, what, value) {
      if(!IsNode(who)) {
        return '';
      }
      var ret = "";
      if(value != undefined) {
        if(IE&&IE<9) {
          switch(what){
            case "opacity":
              who.style.filter="alpah(opacity="+(+value*100)+")";
              if (!who.currentStyle || !who.currentStyle.hasLayout) {
                who.style.zoom = 1;
              }
            return value;
            case "float":
              what = "styleFloat";
            break;
          }
        }else {
          if(what=="float") {
            what="cssFloat"
          }
        }
        return (who.style[what] = value);
      }
      if(IE&&IE<9) {
        ret = 100;
        switch(what){
          case "opacity":
            try{
              ret = who.filters["alpha"].opacity
            }catch(e) {
              try{
                ret = who.filters["DXImageTransform.Microsoft.Alpha"].opacity
              }catch(e) {}
            }
          return ret/100;
          case "float":
            what = "styleFloat";
          break;
        }
      }else {
        if(what=="float") {
          what="cssFloat"
        }
      }
      var computed = who.currentStyle || (document.defaultView && document.defaultView.getComputedStyle(who, null));
      ret = computed[what];
      if(what == 'width' || what == 'height') {
        what = what == 'width' ? 'offsetWidth': 'offsetHeight';
        ret = ret === 'auto' ? who[what] : ret
      }
      return ret || ""
    }
  }, "style");
  // Delete/Add the dashes to change the keys in format "webkitBorderRadius"/"-webkit-border-radius"
  register("dom.cssFormat", function($) {
    var ForEach = $.forEach;
    // Delete/Add the dashes to change the keys in format "webkitBorderRadius"/"-webkit-border-radius"
    return function(who, add) {
      var ret = {}
      add = typeof add !== "undefined" ? add : true;
      ForEach(who, function(key, value) {
        if(add && !/\-/.test(key)){
          // format "webkitBorderRadius" to "-webkit-border-radius"
          ret[addDash(key)] = value
          return value
        }else{
          return (ret[key]=value);
        }
        ret[removeDash(key)]=value;
        return value
      })
      return ret
    }
  }, "cssFormat");
  // parse the css json to a cssText string and add the units to the styles
  register("dom.cssParser", function($){
    var CssFormat = $.cssFormat,
      ForEach = $.forEach;
    var IE = $.IE;
    return function(who) {
      var prefix = ";";
      var formated = CssFormat(who, true);
      var cssArr = ForEach(formated, function(key, value) {
        if(key=="opacity" && IE&&IE<9){
          key = "filter";
          value = "alpha(opacity="+(+value*100)+")"
        }
        return key + ":" + value
      }, [])
      return prefix + cssArr.join(";")
    }
  }, "cssParser");
  register("dom.styles", function($) {
    var IsNode = $.isNode,
      Style = $.style,
      CssParser = $.cssParser;
    var ForEach = $.forEach;
    return function(who, what, set) {
      if(!IsNode(who)) {
        return {}
      }
      if(!!set){
        var oldCssText = who.style.cssText;
        return (who.style.cssText = oldCssText + CssParser(what));
      }else {
        return ForEach(what, function(key, value) {
          return Style(who, key)
        })
      }
    }
  }, "styles");
  // add the units to the styles
  register("dom.cssUnits", function($){
    var Maps = /fontSize|height|width|left|top|padding|margin|right|bottom|radius/i;
    var ForEach = $.forEach,
      Is = $.is;
    return function (who) {
      var controlor = {};
      controlor.add = function() {
        return ForEach(who, function(key, value) {
          var ret = value;
          if(Maps.test(key) && Is(value, "number")) {
            ret += "px"
          }
          return ret
        })
      }
      controlor.remove = function() {
        return ForEach(who, function(key, value) {
          if(Maps.test(key)){
            return parseFloat(value)||0
          }else {return value}
          // return /^(\d+(\.\d*)?)[a-zA-Z]*/.test(value) && parseFloat(value) || value
        })
      }
      return controlor
    }
  }, "cssUnits");
  register("dom.cssText", function($){
    var IsNode = $.isNode,
      Trim = $.trim,
      ForEach = $.forEach,
      CssUnits = $.cssUnits,
      CssParser = $.cssParser;
    return function(who) {
      if(!IsNode(who)) {
        return null
      }
      var cssTextArr = who.style.cssText.split(";");
      var cssText = {};
      for(var k in cssTextArr) {
        var temp = cssTextArr[k].split(":")
        temp.length == 2 && (cssText[removeDash(Trim(temp[0]).toLowerCase())] = Trim(temp[1]))
      }
      var controlor = {};
      controlor.push = function(who) {
        ForEach(who, function(key, value) {
          cssText[key] = value
          return value
        })
        return this
      }
      controlor.toString  = function() {
        cssText = CssUnits(cssText).add();
        return CssParser(cssText)
      }
      return controlor
    }
  }, "cssText");
  register("dom.first", function($) {
    var IsNode = $.isNode;
    return function(who) {
      if(!IsNode(who)) {
        return null;
      }
      var c = null;
      c = who.firstElementChild || (function(el){
        var tmp = el;
        while(c = tmp.firstChild) {
          if(c.nodeType === 1) break;
          tmp = c;
        }
        return c;
      })(who)
      return c
    }
  }, "first");
  register("evt.on", function($){
    return function(el, type, handler) {return evtAccess(el, type, handler)}
  }, "on");
  register("evt.off", function($){
    return function(el, type, handler) {return evtAccess(el, type, handler, 1)}
  }, "off");
  register("str.firstUpper", function($) {
    return FirstUpper
  }, "firstUpper");

  register("io.Http", function($) {
    var CONFIG = {
      "method": "GET",
      "data": {},
      "charset": "UTF-8",
      "type": "json",
      "ansyc": true,
      "header": {},
      "success": $.emptyFunc,
      "fail": $.emptyFunc,
      "requesting": $.emptyFunc,
      "timeout": 60*1000
    };
    function Http() {
      this.xhr = XHR();
    }
    Http.prototype.request = function(url, conf) {
      if(!url && !$.is(url, "string")) {
        throw new Error("Need A Request URL")
      }
      var xhr = this.xhr||XHR();
      if(!xhr) {return false}
      var config = $.parseParam(CONFIG, conf);
      config.method = config.method.toUpperCase();
      if(!config["header"]["Content-Type"]){
        config["header"]["Content-Type"] = "application/x-www-form-urlencoded";
      }
      if(!config["header"]["X-Requested-With"]){
        config["header"]["X-Requested-With"] = "XMLHttpRequest";
      }
      var isGet = !!(config.method=="GET");
      var data = $.forEach(config.data, function(key, value) {
        return key+"="+value
      }, []).join("&");
      var tout = setTimeout(function() {
        xhr.abort()
        config.fail(null, xhr)
      }, config.timeout)
      if(config.ansyc) {
        xhr.onreadystatechange = function() {
          if(xhr.readyState==4) {
            clearTimeout(tout);
            var res = getResponse(config.type, xhr);
            if(xhr.status>=200&&xhr.status<400){
              config.success(res, xhr)
            }else{
              config.fail(null, xhr)
            }
          }else{
            config.requesting(xhr.readyState)
          }
        }
      }
      xhr.open(config.method, url+(isGet&&data?"?"+data:""), config.ansyc);
      $.forEach(config.header, function(key, value) {
        xhr.setRequestHeader(key, value);
        return value
      });
      xhr.send(isGet?null:data)
    }
    Http.prototype.abort = function() {
      this.xhr.abort()
    }
    Http.request = function(url, conf) {
      var http = new Http();
      http.request(url, conf);
      return http
    }
    function XHR() {
      var xhr = null;
      try{
        xhr = new XMLHttpRequest()
      }catch(e) {
        try{
          xhr = new ActiveXObject("Msxml2.XMLHTTP")
        }catch(e){
          try{
            xhr = new ActiveXObject("Microsoft.XMLHTTP")
          }catch(e){
            xhr = null
          }
        }
      }
      return xhr
    }
    function getResponse(type, xhr) {
      var res = null;
      if(type=="json") {
        xhr.responseText&&$.is(xhr.responseText, "string") ? eval("res=("+xhr.responseText+")") : (res = {})
      }else if(type=="text") {
        res = xhr.responseText
      }else if(type=="xml") {
        res = xhr.responseXML
      }
      return res
    }
    return Http
  }, "Http");
  
  function register(ns, fn, shortName) {
    if(typeof ns !== 'string') {
      return false;
    }
    ns = ns.split('.');
    var step = S;
    var f = null;
    while(f = ns.shift()) {
      if(ns.length) {
        if(step[f] === undefined) {
          step[f] = {};
        }
        step = step[f];
      }else {
        if(step[f]  === undefined) {
          step[f] = fn.call(S, S);
        }
        !!shortName && (S[shortName] = step[f]);
        return true;
      }
    }
    return false;
  }
  function addDash(who) {
    return who.replace(/[A-Z]/g, function(m){return "-"+m.toLowerCase()})
  }
  function removeDash(who) {
    var keys = who.split("-");
    var newKeys = null;
    var start = 1;
    if(!keys[0] && (keys[1]=="ms"||keys[1]=="webkit")) {
      // the ms and webkit is in format of "ms" or "webkit", start = 2
      // the others is in format of "MozBorderRadius" || "borderRadius", start = 1
      start = 2;
    }
    newKeys = S.forEach(keys.slice(start), function(k, v) {
      return FirstUpper(v)
    })
    newKeys.splice(0, 0, keys[start-1]);
    return newKeys.join("")
  }
  function evtAccess(el, type, handler, off) {
    if(!S.isNode(el) || !type || !S.is(handler, 'function')) {
      return false
    }
    var action = (!off && 'addEventListener') || 'removeEventListener';
    try{
      el[action](type, handler, true);
    }catch(e1) {
      try {
        action = !off && 'attachEvent' || 'detachEvent';
        el[action]('on'+type, handler);
      }catch(e2) {
        el['on'+type] = handler;
      }
    }
  }
  function FirstUpper(who) {
    if(!S.is(who, "string")) {
      return who
    }
    return who.replace(/(^.)(.*)/, function(m0,m1,m2){return m1.toUpperCase()+m2})
    // var ret = who.split("");
    // return ret[0].toUpperCase()+ret.slice(1).join("")
  }
})(this)