# 站点定义

## 目录说明

该目录存放所有支持的网站，目录名为网站域名

```
--目录名
----config.json
----xxxx.js
```

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
  "plugins": [{
    "name": "特殊插件",
    "pages": ["/torrents.php"],
    "scripts": ["/libs/album/album.js", "torrents.js"],
    "styles": ["/libs/album/style.css"]
  }]
}
```

### 属性说明：
- `name` : 网站名称；
- `description` : （可选）网站描述；
- `url` : 完整的网站地址；
- `icon` : 网站图标地址；
- `tags` : （可选）标签，是一个数组，多个之间以 `,` 分隔；
- `schema` : 对应的网站架构；
- `host` : 域名；
- `plugins` : （可选）支持的插件列表，是一个数组
  - `name` : 插件名称；
  - `pages` : 表示该插件在哪些页面加载；
  - `scripts` : 插件对应的脚本文件，`JavaScript` 文件