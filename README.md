<p align="center">
<img src="https://github.com/ronggang/PT-Plugin-Plus/raw/master/public/assets/icon-128.png"><br/>
<a href="https://github.com/ronggang/PT-Plugin-Plus/releases" title="GitHub Releases"><img src="https://img.shields.io/github/release/ronggang/PT-Plugin-Plus.svg"></a>
<img src="https://img.shields.io/badge/used-TypeScript Vue-blue.svg">
<a href="https://chrome.google.com/webstore/detail/abkdiiddckphbigmakaojlnmakpllenb" title="已在Chrome 市场上发布的版本"><img src="https://img.shields.io/chrome-web-store/v/abkdiiddckphbigmakaojlnmakpllenb.svg"></a>
<a href="https://github.com/ronggang/PT-Plugin-Plus/LICENSE" title="GitHub license"><img src="https://img.shields.io/github/license/ronggang/PT-Plugin-Plus.svg"></a>
</p>

---

## 关于

PT 助手 Plus，是一款 Google Chrome 浏览器插件（Google Extensions），主要用于辅助下载 PT 站的种子。

适用于各 PT 站，可使下载种子等各项操作变化更简单、快捷。配合下载服务器（如 Transmission、µTorrent 等），可一键下载指定的种子。

该版本是对原来的 [PT 助手](https://github.com/ronggang/PT-Plugin) 进行了重构，去掉了繁琐的配置，以获得更好的使用体验；

> 注意：`1.0.0` 以下的配置不能直接用于该版本，请勿将 `1.0.0` 以下的版本配置进行导入操作。

## 功能

- 一键发送指定的种子到下载服务器，目前已支持：
  - Transmission
  - Synology Download Station
  - µTorrent
  - Deluge
  - qBittorrent `v4.1+`
- 比 RSS 更灵活的下载方式，可根据不同的站点发送到不同的默认服务器；
- 批量下载当前页所有种子（`需要设置站点 passkey`）；
- 批量复制当前页面所有种子的下载链接（`需要设置站点 passkey`）；
- 显示默认下载服务器当前可用空间，目前已支持：
  - Transmission
- 多站聚合搜索相同关键字的种子；
  - 已支持：
    - 理论上支持所有原生 `NexusPHP` 架构的站点；
    - TTG；
    - `Gazelle` 架构的站点；
- 根据当前站点显示专属功能，如：
  - 封面模式浏览种子页面；
- 保存下载历史记录（默认关闭）；
- 多语言支持（计划中）；

## 安装及使用

- 参考 [Wiki](https://github.com/ronggang/PT-Plugin-Plus/wiki) 的详细说明
