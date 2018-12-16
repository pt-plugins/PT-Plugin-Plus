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
  ]
}
```

- `name` : 架构名称；
- `ver` : 当前配置版本；
- `plugins` : 支持的插件列表，是一个数组
  - `name` : 插件名称；
  - `pages` : 表示该插件在哪些页面加载；
  - `scripts` : 插件对应的脚本文件，`JavaScript` 文件

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
