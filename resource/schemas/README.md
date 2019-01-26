# 网站架构定义

> 网站架构是指当前网站使用了什么样的架构搭建的，国内大部分的 `PT` 网站都使用了 `NexusPHP` 这个架构

## 目录说明

该目录存放所有支持的网站架构，目录名为架构名称

```
--目录名
----config.json
----xxxx.js
```

- config.json : 架构的定义
- xxxx.js : 页面对应的脚本文件

### config.json 文件

```json
{
  "name": "NexusPHP",
  "ver": "0.0.1",
  "plugins": [
    {
      "name": "种子详情页面",
      "pages": ["/details.php", "/plugin_details.php"],
      "scripts": ["details.js"]
    },
    {
      "name": "种子列表",
      "pages": ["/torrents.php", "/music.php", "/movie.php", "/adult.php"],
      "scripts": ["torrents.js"]
    }
  ],
  "searchEntry": [
    {
      "entry": "/torrents.php?search=$key$",
      "name": "全部",
      "resultType": "html",
      "parseScriptFile": "getSearchResult.js",
      "resultSelector": "table.torrents:last > tbody > tr"
    }
  ],
  "patterns": {
    "torrentLinks": ["*://*/*"]
  },
  "parser": {
    "downloadURL": "解析脚本内容"
  }
}
```

- `name` : 架构名称；
- `ver` : 当前配置版本；
- `plugins` : 支持的插件列表，是一个数组
  - `name` : 插件名称；
  - `pages` : 表示该插件在哪些页面加载；
  - `scripts` : 插件对应的脚本文件，`JavaScript` 文件
- `searchEntry` : 搜索入口配置，需定义为数组
  - `entry` : 入口文件
  - `name` : 自定义入口的名称
  - `resultType` : 搜索返回的原始结果类型：html, json, xml
  - `parseScriptFile` : 解析原始结果的脚本文件
  - `resultSelector` : 定位种子列表的 `jQuery` 查询表达式
- `patterns` : （可选）页面匹配规则
  - `torrentLinks` : 用于匹配有效的种子链接，作用于右键菜单，如果不指定，则匹配所有链接；
- `parser` : （可选）解析器
  - `downloadURL` : 解析下载链接，用于解析和生成点击右键下载时的链接

### 关于脚本及其他资源文件路径说明

- 如果在第一个位置指定了 `/` ，则路径会被指向到：
  - `https://github.com/ronggang/PT-Plugin-Plus/tree/master/resource/`
- 如果第一个位置不是 `/` ，则表示当前路径为该架构所在目录，如 `NexusPHP` 的指向目录为：
  - `https://github.com/ronggang/PT-Plugin-Plus/tree/master/resource/schemas/NexusPHP/`

## 脚本中可用的全局对象

- `PTService` : 该对象由 `PT 助手` 挂载到 `window` 对象中的全局对象；目前提供以下方法：

  - `addButton`: 添加命令按钮方法

  ```js
  PTService.addButton({
    title: "按钮的提示信息",
    icon: "图标",
    label: "按钮标签",
    /**
     * 单击事件
     * @param success 成功回调事件
     * @param error 失败回调事件
     *
     * 两个事件必需执行一个，可以传递一个参数
     */
    click: (success, error) => {}
  });
  ```

  - `call`: 调用指定的命令

- `jQuery` : jQuery 对象

## NexusPHP 获取站点分类信息

```js
JSON.stringify(
  jQuery.map(jQuery("#ksearchboxmain").find("a[href*='cat']"), function(n) {
    return {
      id: parseInt(
        jQuery(n)
          .attr("href")
          .replace("?cat=", "")
      ),
      name:
        jQuery(n)
          .find("img")
          .attr("title") || jQuery(n).text()
    };
  })
);
```
