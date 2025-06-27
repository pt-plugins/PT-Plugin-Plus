# 借助浏览器远程使用PT-Plugin Plus (新)

## 缘由

由于iOS系统天生限制，并无浏览器支持加载Chrome/Firefox浏览器插件（相对于Android而言，可以使用Yandex/Kiwi/狐猴），但又有iOS用户想要在手机上使用PTPP，即使iOS15已经支持浏览器插件，但移植难度与开发者证书问题使得想法不成立；又有用户提议将PTPP[作为服务运行](https://github.com/pt-plugins/PT-Plugin-Plus/issues/1045)，但它只是个插件且官方明确不会开发为服务……

一日看到其他教程提到内网浏览器，研究一番后心生想法，曲线救国——借助浏览器远程使用PT-Plugin Plus。

## 准备工作

- 一台长时间在线且能够安装Docker环境的设备并且能访问到下载器（比如NAS
- 公网IP 或 任意穿透内网的方法

## 开搞

如何安装Docker环境以及穿透内网不在本教程讨论范围，请读者按能力及需求解决。

- 安装浏览器
    
    这里使用 ~~[**~~vital987/chrome-novnc~~**](https://hub.docker.com/r/vital987/chrome-novnc)~~（vital987/chrome-novnc镜像不稳定而改用[kasmweb/chrome](https://hub.docker.com/r/kasmweb/chrome/)）的镜像安装Chrome浏览器。该镜像不提供latest标签，所以每次更新都需要手动修改版本号，在[这里查询](https://hub.docker.com/r/kasmweb/chrome/tags)。本教程中使用的`1.16.0`，请注意替换
    
    ```
    docker run -d \
      --name=chrome \
      -p 16901:6901 \
      -e VNC_PASS='password' \
      -e KASM_RESTRICTED_FILE_CHOOSER=false \
      -v <path to ext>:/home/mount \
      kasmweb/chrome:1.16.0
    
    ```
    
    这里做简单说明 以下按需进行设置：
    
    - 16901 为你想要使用的访问端口
    - password 为访问该服务的密码
    - <path to ext> 为映射宿主机的路径
    
    等待镜像拉取完毕后，在浏览器输入 `http://<Docker所在宿主机IP>:16901`，在弹出框内输入用户名kasm_user，密码为启动时设置的password
    
    ![](https://res.cloudinary.com/hdfawre/image/upload/v1728808615/chrome-novnc%2Bptpp/login_2cdad59143.webp)
    
- 安装插件
    
    下载插件**[PT-Plugin-Plus](https://github.com/pt-plugins/PT-Plugin-Plus)** 。因正式版许久未Release，这里使用**Action版**。
    
    下载Action版**需要Github账号**，如果没有账号的可以到[这个频道](https://t.me/ptpluginplus)（需要科学访问）下载。有账号的请按图步骤操作
    
    [](https://pic.cfandora.com/article/2022-06-01/PTPP_2.avif)
    
    而后在浏览器内点击右上方三个点按图步骤操作
    
    ![](https://res.cloudinary.com/hdfawre/image/upload/v1728808615/chrome-novnc%2Bptpp/load_rb8m6hcu2ffe3z2fjyvd.webp)
    
    加载完毕后就能在右上角的拼图图标内找到PTPP了，新安装可能是英文（因为浏览器的语言是英文且不知道为什么无法修改），不要惊慌，点击下方**Switch Language**即可切换至中文，熟悉的界面出现了~
    
    ![](https://res.cloudinary.com/hdfawre/image/upload/v1728808615/chrome-novnc%2Bptpp/switch_adqkq3dqkstzlb40ry9m.webp)
    
    如果需要加载备份，只需要将备份文件放置于与解压插件相同的路径下，再到PTPP内找到路径导入即可
    

## 一些问题

Chrome无法切换语言，只能为中文，好在也不需要进行太多设置

## 抛砖引玉

由于这是一个存在于局域网内的浏览器，所以它可以方便地让你访问内网的所有服务

- 访问NAS上的其他服务
- 进入路由器后台更改设置
- 操作内网的其他设备的WEBUI
- ……

只需要将此浏览器的端口进行转发，大大降低了暴露过多端口至公网带来的风险（这也需要对`VNC_PASS`设置地足够强度高），也降低了设置的难度，便于远程操作。

也可以为这个浏览器设置个带梨。。。

## 感谢

[kasmweb](https://github.com/kasmweb/)/[**chrome**](https://hub.docker.com/r/kasmweb/chrome/)

[PT-Plugin](https://github.com/pt-plugins)/[**PT-Plugin-Plus**](https://github.com/pt-plugins/PT-Plugin-Plus)