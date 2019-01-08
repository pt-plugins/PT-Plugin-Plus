if (!"".getQueryString) {
  String.prototype.getQueryString = function (name, split) {
    if (split == undefined) split = "&";
    var reg = new RegExp(
        "(^|" + split + "|\\?)" + name + "=([^" + split + "]*)(" + split + "|$)"
      ),
      r;
    if ((r = this.match(reg))) return decodeURI(r[2]);
    return null;
  };
}

(function (options) {
  if (/没有种子|No [Tt]orrents?|Your search did not match anything|用准确的关键字重试/.test(options.responseText)) {
    return;
  }

  let site = options.site;
  // 获取种子列表行
  let rows = options.page.find(options.resultSelector || "table.torrents:last > tbody > tr");
  // 获取表头
  let header = rows.eq(0).find("th,td");

  // 用于定位每个字段所列的位置
  let fieldIndex = {
    time: -1,
    size: -1,
    seeders: -1,
    leechers: -1,
    completed: -1,
    comments: -1,
    // 最后一栏确定为发布人
    author: header.length - 1
  };

  if (site.url.lastIndexOf("/") != site.url.length - 1) {
    site.url += "/";
  }

  // 获取字段所在的列
  for (let index = 0; index < header.length; index++) {
    const cell = header.eq(index);

    // 评论数
    if (cell.find("img.comments").length) {
      fieldIndex.comments = index;
      continue;
    }

    // 发布时间
    if (cell.find("img.time").length) {
      fieldIndex.time = index;
      continue;
    }

    // 大小
    if (cell.find("img.size").length) {
      fieldIndex.size = index;
      continue;
    }

    // 种子数
    if (cell.find("img.seeders").length) {
      fieldIndex.seeders = index;
      continue;
    }

    // 下载数
    if (cell.find("img.leechers").length) {
      fieldIndex.leechers = index;
      continue;
    }

    // 完成数
    if (cell.find("img.snatched").length) {
      fieldIndex.completed = index;
      continue;
    }
  }

  // 遍历数据行
  for (let index = 1; index < rows.length; index++) {
    const row = rows.eq(index);
    let cells = row.find(">td");

    let title = row.find("a[href*='hit'][title]").last();
    let link = title.attr("href");
    if (link.substr(0, 4) !== "http") {
      link = `${site.url}${link}`;
    }
    let url = row.find("img.download").parent();
    if (url.get(0).tagName !== "A") {
      let id = link.getQueryString("id");
      url = `download.php?id=${id}`;
    } else {
      url = url.attr("href");
    }

    if (url.substr(0, 4) !== "http") {
      url = `${site.url}${url}`;
    }

    let subTitle = title.parent().html().split("<br>");
    if (subTitle && subTitle.length > 0) {
      subTitle = $("<span>").html(subTitle[subTitle.length - 1]).text();
    }

    let data = {
      title: title.attr("title") || title.text(),
      subTitle: subTitle || "",
      link,
      url: url + (site && site.passkey ? "&passkey=" + site.passkey : ""),
      size: cells.eq(fieldIndex.size).html() || 0,
      time: fieldIndex.time == -1 ? "" : cells.eq(fieldIndex.time).find("span[title]").attr("title") || cells.eq(fieldIndex.time).text() || "",
      author: fieldIndex.author == -1 ? "" : cells.eq(fieldIndex.author).text() || "",
      seeders: fieldIndex.seeders == -1 ? "" : cells.eq(fieldIndex.seeders).text() || 0,
      leechers: fieldIndex.leechers == -1 ? "" : cells.eq(fieldIndex.leechers).text() || 0,
      completed: fieldIndex.completed == -1 ? "" : cells.eq(fieldIndex.completed).text() || 0,
      comments: fieldIndex.comments == -1 ? "" : cells.eq(fieldIndex.comments).text() || 0,
      site: site
    };
    options.results.push(data);
  }

  console.log(options.results);
})(options)