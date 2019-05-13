(function (options) {
  if (options.url && options.url.href) {
    if (!/(\/t\/(\d+)|\/dl\/(\d+)\/(\d+))/.test(options.url.href)) {
      options.error = {
        success: false,
        msg: "无效的下载地址"
      }
      return;
    }
    // 匹配直接下载地址
    if (/\/dl\/(\d+)\/(\d+)/.test(options.url.href)) {
      options.result = options.url.href;
      return;
    }

    // 匹配种子详细页面地址
    let id_match = options.url.href.match(/\/t\/(\d+)/);
    let passkey = options.site.passkey;
    if (passkey) {
      let id = id_match[1];
      // 格式：vvvid|||passkeyzz
      let key = (new Base64).encode("vvv" + id + "|||" + options.site.passkey + "zz");
      options.result = `https://${options.site.host}/rssdd.php?par=${key}&ssl=yes`;
    } else {
      options.error = {
        success: false,
        msg: "请先设置站点的passkey"
      }
    }
  } else {
    options.error = {
      success: false,
      msg: "无效的下载地址"
    }
  }
})(options)
