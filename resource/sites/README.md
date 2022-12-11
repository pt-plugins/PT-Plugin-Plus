# 站点定义

## 目录说明

该目录存放所有支持的网站，目录名为网站域名

```
--目录名
----parser
-------xxxx.js
----config.json
----xxxx.js
```

- parser : （可选）解析器目录，会在打包时自动将该目录下的所有 js 文件内容生成到 config.js 文件中的 `parser` 字段中
- config.json : 网站的定义
- xxxx.js : （可选）页面对应的脚本文件

### config.json 文件示例

```json
{
  "name": "OpenCD",
  "description": "皇后，专一的音乐类PT站，是目前国内最大的无损音乐PT",
  "url": "https://open.cd/",
  "icon": "https://open.cd/favicon.ico",
  "tags": ["音乐"],
  "schema": "NexusPHP",
  "host": "open.cd",
  "plugins": [
    {
      "name": "特殊插件",
      "pages": ["/torrents.php"],
      "scripts": ["/libs/album/album.js", "torrents.js"],
      "styles": ["/libs/album/style.css"]
    }
  ],
  "searchEntry": [
    {
      "entry": "/torrents.php?search=$key$",
      "name": "全部",
      "resultType": "html",
      "parseScriptFile": "/schemas/NexusPHP/getSearchResult.js",
      "resultSelector": "table.torrent_list:last > tbody > tr"
    }
  ],
  "patterns": {
    "torrentLinks": ["*://*/*"]
  },
  "parser": {
    "downloadURL": "解析脚本内容"
  },
  "torrentTagSelectors": [
    {
      "name": "Free",
      "selector": "img.pro_free",
      "color": "blue"
    }
  ],
  "categories": [
    {
      "entry": "*",
      "result": "cat$id$=1",
      "category": [
        {
          "id": 20,
          "name": "原盘(Full BD)"
        }
      ]
    }
  ]
}
```

### 属性说明：

- `name` : 网站名称；
- `description` : （可选）网站描述；
- `url` : 完整的网站地址，如果网站支持 `https` ，请优先考虑填写 `https` 的地址 ；
- `icon` : 网站图标地址；
- `tags` : （可选）标签，是一个数组，多个之间以 `,` 分隔；
- `schema` : 对应的网站架构；
- `host` : 域名；
- `plugins` : （可选）支持的插件列表，是一个数组
  - `name` : 插件名称；
  - `pages` : 表示该插件在哪些页面加载；
  - `scripts` : 插件对应的脚本文件，`JavaScript` 文件
- `searchEntry` : （可选）搜索入口配置，如果指定则必需为数组，如果不指定则以网站架构定义的为准
  - `entry` : 入口文件
  - `name` : 自定义入口的名称
  - `resultType` : 搜索返回的原始结果类型：html, json, xml
  - `parseScriptFile` : 解析原始结果的脚本文件
  - `resultSelector` : 定位种子列表的 `jQuery` 查询表达式
- `patterns` : （可选）页面匹配规则
  - `torrentLinks` : 用于匹配有效的种子链接，作用于右键菜单，如果不指定，则匹配所有链接；
- `parser` : （可选）解析器，打包时根据 parser 目录生成
  - `downloadURL` : 解析下载链接，用于解析和生成点击右键下载时的链接
- `torrentTagSelectors` : （可选）种子标签选择器，数组
  - `name` : 标签名称
  - `selector` : 选择器
  - `color` : 标签颜色
- `categories` : 站点对应搜索入口的种子分类信息，数组
  - `entry` : 需要匹配的入口，`*` 表示适用于所有入口；`torrents.php` 表示只适用于 `torrents.php` 的入口页面
  - `result` : 分类配置返回信息 `$id$` 会被替换为具体的分类编号，最终会拼接到入口地址后面，如：`&cat10=1&cat11=1`
  - `category` : 分类信息，数组
    - `id` : 分类编号
    - `name` : 分类名称

### 脚本及脚本文件定义

脚本文件及脚本片段，请使用 `闭包` ，以避免 `命名污染` 。

### 关于脚本及其他资源文件路径说明

- 如果在第一个位置指定了 `/` ，则路径会被指向到：
  - `https://github.com/pt-plugins/PT-Plugin-Plus/tree/master/resource/`
- 如果第一个位置不是 `/` ，则表示当前路径为该网站所在目录，如 `open.cd` 的指向目录为：
  - `https://github.com/pt-plugins/PT-Plugin-Plus/tree/master/resource/sites/open.cd/`

## 如何提交一个新的站点？

> 由于本人精力及能力有限，仅能维护部分站点，如果你有更多更好玩的站点需要在助手中直接下拉选择显示，并愿意分享给其他用户使用，那么赶紧通过以下方式提交吧；（怎么听着像广告~\_~）

1. 如果你有 `github` 账户，并知道如何使用 `git` ，那么可以按以下步骤进行提交

   - `Fork` 本项目；
   - 将 `Fork` 后的项目 `clone` 到本地；
   - 在项目的 `resource\sites` 目录下新建一个站点目录，如：`pt.mysite.com`
   - 在 `pt.mysite.com` 目录下新建一个 `config.json` 文件，内容参考上面的 `config.json 文件示例`；
   - 如有需要，再创建特定的脚本；
   - 以上操作完成后，使用 `git` 将修改内容 `push` 到自己的 `github` 仓库；
   - 最后在 `github` 仓库中发起一个 `PR(pull request)` 即可；

2. 加入开发交流 QQ 群：773500545，把你的配置文件分享给我们吧；
3. 通过 [该主题](https://github.com/pt-plugins/PT-Plugin-Plus/issues/30) 留言，按格式提交已测试可用的站点信息；

## PR 参考资料

- https://blog.csdn.net/vim_wj/article/details/78300239
- http://www.ruanyifeng.com/blog/2017/07/pull_request.html
- https://gist.github.com/zxhfighter/62847a087a2a8031fbdf
- https://github.com/geeeeeeeeek/git-recipes/wiki/3.3-%E5%88%9B%E5%BB%BA-Pull-Request
