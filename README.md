highlight
=========
An easy tool for code highlight.

Files
==========
#####1. src/highlight.js/build/highlight.min.js: Main file
#####2. src/highlight.css/build/highlight.min.css: 代码高亮要用到的样式表
#####3. src/base.js: 请忽略，只是demo里要用所以随便加进来的
---

API
==========
###1. Highlight: function(coder, extra)
    @param coder 代码所在元素，通常是textarea，也可是其他元素，比如script标签
    @param extra 高亮的configs
     {
        "codeType": string | "js", // 代码类型，目前只支持JS，因为一直没去维护
        "tmpl": htmlstring, // 高亮代码的行模板，默认："<li class=\"line\">${code}</li>"，${code}就是代码要放的地方
        "container": Node, // 高亮代码的container
        "indent": Number | 4 // 代码的缩进值
     }
    @return new Highlight
    @desc 构造函数，若参数extra.container缺少，并不会render，可之后调用render方法
###2. line: function(tmpl)
    @param tmpl 行的模版，与构造函数的extra.tmpl一样
    @return this
    @desc 将代码高亮代码按tmpl生成行
###3. render: function(container)
    @param tmpl 高亮代码的container，与构造函数的extra.container一样
    @return this
    @desc 将高亮的，并且已经由line生成了行之后render到container中
###4. reset: function(coder)
    @param coder 代码所在元素，与构造函数的extra.coder一样
    @return this
    @desc 重置要高亮的代码，该函数会re-line和re-render
###5. update: function
    @param 无
    @return this
    @desc 更新，纯更新，不改变任何参数
###6. 其他
    @desc 看过原码的人，应该会发现，目前还暴露了其他"接口"，但是，实际上，那些接口是不应该暴露的，PO主我有兴致再去将这些接口做成private吧，现在先这样了
Use
=========
    <script type="text/javascript" id="test">
      var txt = S.$("codeHighlightTest");
      var container_0 = S.$("container_0");
      var container_1 = S.$("container_1");
      var codes_0 = new Highlight(txt);
      codes_0.line().render(container_0);
      var codes_1 = new Highlight(S.$("test"), {
        "container": container_1,
        "indent": 2,
        "codeType": "js"
      })
      codes_1.line("<div class=\"line\">${code}</div>").render();
      var inputing = 0;
      S.on(txt, "keyup", function(evt) {
        clearTimeout(inputing);
        inputing = setTimeout(function() {
          codes_0.update();
        }, 100)
      })
    </script>
具体看demo
