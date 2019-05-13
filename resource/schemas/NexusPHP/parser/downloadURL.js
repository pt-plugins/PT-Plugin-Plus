(function (options) {
  if (options.url && options.url.query && options.url.href.getQueryString) {
    let url = options.url.href;
    let passkey = options.site.passkey || options.url.href.getQueryString("passkey");
    if (url.indexOf("download.php") == -1) {
      let id = url.getQueryString("id");
      if (id) {
        // 如果站点没有配置禁用https，则默认添加https链接
        url = options.url.origin + "/download.php?id=" + id + (passkey ? "&passkey=" + passkey : "") + (options.site.disableHttps ? "" : "&https=1");
      } else {
        url = "";
      }
    }

    if (!url) {
      options.error = {
        success: false,
        msg: "无效的下载地址"
      }
      return;
    }

    options.result = url;
  }
})(options)