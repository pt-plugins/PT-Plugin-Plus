(function (options) {
  if (/takelogin\.php/.test(options.responseText)) {
    options.errorMsg = `[${options.site.name}]需要登录后再搜索`;
    return;
  }
  if (/没有种子|No [Tt]orrents?|Your search did not match anything|用准确的关键字重试/.test(options.responseText)) {
    options.errorMsg = `[${options.site.name}]没有搜索到相关的种子`;
    return;
  }

  let site = options.site;
  // 获取种子列表行
  let rows = options.page.find(options.resultSelector || "table#torrent_table:last > tbody > tr");
  let time_regex = /(\d{4}-\d{2}-\d{2}[^\d]+?\d{2}:\d{2}:\d{2})/;
  let time_regen_replace = /-(\d{2})[^\d]+?(\d{2}):/;

  // 用于定位每个字段所列的位置
  let fieldIndex = {
    // 时间
    time: 4,
    // 大小
    size: 6,
    // 上传人数
    seeders: 8,
    // 下载人数
    leechers: 8,
    // 完成人数
    completed: 7,
    // 评论人数
    comments: 3,
    // 发布人
    author: 9
  };

  if (site.url.lastIndexOf("/") != site.url.length - 1) {
    site.url += "/";
  }

  // 遍历数据行
  for (let index = 1; index < rows.length; index++) {
    const row = rows.eq(index);
    let cells = row.find(">td");

    let title = row.find("div.name_left > a");
    let titleStrings = title.html().split("<br>");
    let link = title.attr("href");
    if (link.substr(0, 4) !== "http") {
      link = `${site.url}${link}`;
    }

    let values = link.split("/");
    let id = values[values.length - 2];

    // 格式：vvvid|||passkey|||sslzz
    let key = (new Base64).encode("vvv" + id + "|||" + site.passkey + "|||sslzz");
    let url = `https://${site.host}/rssdd.php?par=${key}&ssl=yes`;

    let subTitle = "";
    if (titleStrings.length > 0) {
      subTitle = $("<span>").html(titleStrings[1]).text();
    }

    let data = {
      title: titleStrings[0],
      subTitle: subTitle || "",
      link,
      url: url,
      size: cells.eq(fieldIndex.size).html() || 0,
      time: cells.eq(fieldIndex.time).html().match(time_regex)[1].replace(time_regen_replace, "-$1 $2:") || cells.eq(fieldIndex.time).text(),
      author: cells.eq(fieldIndex.author).text() || "",
      seeders: cells.eq(fieldIndex.seeders).text().split("/")[0] || 0,
      leechers: cells.eq(fieldIndex.leechers).text().split("/")[1] || 0,
      completed: cells.eq(fieldIndex.completed).text() || 0,
      comments: cells.eq(fieldIndex.comments).text() || 0,
      site: site,
      entryName: options.entry.name
    };
    options.results.push(data);
  }

  console.log(options.results);
})(options)