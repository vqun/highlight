highlight
=========
An easy tool for code highlight.

#### `ChangeLogs for v2.0：`
1. 修复字符串中含注释和注释中含字符串的错误
2. 去除对象、方法等高亮
3. 使用HConfig配置关键字来确定需要高亮的关键字
4. 注释目前只支持C/C++模式的多行和单行注释(/*...*/和//...)，对其他注释，如：HTML注释，暂不支持
5. 采用正则匹配，V1.0使用的是全部匹配注释、字符串和关键字（这也是为什么会有1），目前采用的是从前到尾匹配，不会出现回溯匹配
6. `keywords源码中只添加了几个demo用的，需要的请自行补上`
7. 正则匹配方式，有待改进（v2.1）
#### `下一版本（v3.0）的计划`：
1. 去除正则匹配，改用逐字匹配，即：从第一个字符开始，一个个获取字符，再做匹配，类似于括号匹配
2. 与正则匹配做对比，比对两种方式的速度
3. 支持所有语言高亮，不再限制（如注释格式限制），完全采用配置方式

Files
==========
#####1. src/highlight.js/build/highlight.min.js: Main file
#####2. src/highlight.css/build/highlight.min.css: 代码高亮要用到的样式表
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
