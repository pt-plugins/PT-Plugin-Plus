# 下载客户端定义说明

## 目录说明

该目录存放所有支持的下载客户端，目录名为架构名称

```
--目录名
----config.json
----init.js
```

- 目录名为该客户端的类型
- config.json : 下载客户端定义文件
- init.js : 下载客户端初始化脚本

## config.json 文件

示例：

```json
{
  "name": "qBittorrent",
  "type": "qbittorrent",
  "ver": "0.0.1",
  "icon": "https://www.qbittorrent.org/favicon.ico",
  "scripts": ["init.js"],
  "description": "当前支持 qBittorrent v4.1+，由于浏览器限制，需要禁用 qBittorrent 的『启用跨站请求伪造(CSRF)保护』功能才能正常使用",
  "warning": "注意：由于 qBittorrent 验证机制限制，第一次测试连接成功后，后续测试无论密码正确与否都会提示成功。",
  "allowCustomPath": true,
  "pathDescription": "当前目录列表配置是指定硬盘上的绝对路径，如 /volume1/music/ 或 D:\\download\\music\\"
}
```

- `name` : 客户端名称
- `type` : 客户端类型，必需和目录名相同
- `ver` : 当前定义的版本号，目前暂无特别用处
- `icon` : 用于显示客户端的图标
- `scripts`: <可选>数组，用于执行该客户端执行的脚本列表，目前暂无特别用处
- `description` : <可选>当前客户端描述
- `warning` : <可选>用于配置时显示的警告信息，要用于一些特殊提示
- `allowCustomPath` : <可选>是否允许自定义目录，默认为 false
- `pathDescription` : <可选>自定义目录说明

## init.js

> 客户端初始化脚本文件

- 脚本最终需要将自身挂载到 `window` 对象下，挂载名称必需和 `type` 相同，且区分大小写！
  - 如：type='uTorrent'
  - 那么挂载名称为 `window.uTorrent` = xxx;

* 客户端对象需对外暴露以下公用方法
  - `init` : 用于初始化客户端，接收一个参数：`options` 表示客户端定义的相关参数
    - 属性参考 [common.ts](https://github.com/pt-plugins/PT-Plugin-Plus/blob/master/src/interface/common.ts) 的 `DownloadClient`
  - `call` : 用于方法调用，接收两个参数：`action`, `data`，返回一个 `Promise` 对象
    - `action` : 字符串，需要执行的方法（动作）名称，方法说明：
      - `addTorrentFromURL` : 从指定的链接增加种子文件
      - `testClientConnectivity` : 测试当前客户端是否可连接
      - 更多方法参考 [common.ts](https://github.com/pt-plugins/PT-Plugin-Plus/blob/master/src/interface/common.ts) 的 `EAction`
    - `data` : 任意类型，接收的数据，根据 `action` 不同，数据格式也不同

- 在脚本中可用的系统对象
  - `PTBackgroundService` : 助手后台服务程序，详情参考 [service.ts](https://github.com/pt-plugins/PT-Plugin-Plus/blob/master/src/background/service.ts)
  - `PTSevriceFilters` : 系统定义的过滤器，详情参考 [filters.ts](https://github.com/pt-plugins/PT-Plugin-Plus/blob/master/src/service/filters.ts)
