/**
 * NexusPHP 默认搜索结果解析类
 */
(function (options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/takelogin\.php|<form action="\?returnto=/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
        return;
      }

      options.isLogged = true;

      if (
        /没有种子|No [Tt]orrents?|Your search did not match anything|用准确的关键字重试/.test(
          options.responseText
        )
      ) {
        options.status = ESearchResultParseStatus.noTorrents; // `[${options.site.name}]没有搜索到相关的种子`;
        return;
      }

      this.haveData = true;
      this.site = options.site;
    }

    /**
     * 获取搜索结果
     */
    getResult() {
      if (!this.haveData) {
        return [];
      }
      let site = options.site;
      let site_url_help = PTServiceFilters.parseURL(site.url);
      let selector = options.resultSelector || "table.torrents:last";
      selector = selector.replace("> tbody > tr", "");
      let table = options.page.find(selector);
      // 获取种子列表行
      let rows = table.find("> tbody > tr");
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty; //`[${options.site.name}]没有定位到种子列表，或没有相关的种子`;
        return [];
      }
      let results = [];
      // 获取表头
      let header = table.find("> thead > tr > th");
      let beginRowIndex = 0;
      if (header.length == 0) {
        beginRowIndex = 1;
        header = rows.eq(0).find("th,td");
      }

      // 用于定位每个字段所列的位置
      let fieldIndex = {
        // 发布时间
        time: -1,
        // 大小
        size: -1,
        // 上传数量
        seeders: -1,
        // 下载数量
        leechers: -1,
        // 完成数量
        completed: -1,
        // 评论数量
        comments: -1,
        // 发布人
        author: header.length - 1,
        // 分类
        category: -1
      };

      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }
      //2023.5.10 fix byr.pt 不显示数据，下列div.icons.*是为了单独适配
      // 获取字段所在的列
      for (let index = 0; index < header.length; index++) {
        let cell = header.eq(index);
        let text = cell.text();

        // 评论数
        if (cell.find(".comments").length) {
          fieldIndex.comments = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 发布时间
        if (cell.find("img.time,div.date,div.icons.time").length) {
          fieldIndex.time = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 大小
        if (cell.find("img.size,div[alt='size'],div.icons.size").length) {
          fieldIndex.size = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 种子数
        if (cell.find("img.seeders,div[alt='seeders'],div.icons.seeders").length) {
          fieldIndex.seeders = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 下载数
        if (cell.find("img.leechers,div[alt='leechers'],div.icons.leechers").length) {
          fieldIndex.leechers = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 完成数
        if (cell.find("img.snatched,div[alt='snatched'],div.icons.snatched").length) {
          fieldIndex.completed = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 分类
        if (/(cat|类型|類型|分类|分類|Тип)/gi.test(text)) {
          fieldIndex.category = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }
      }

      if (options.entry.fieldIndex) {
        fieldIndex = Object.assign(fieldIndex, options.entry.fieldIndex);
      }

      try {
        // 遍历数据行
        for (let index = beginRowIndex; index < rows.length; index++) {
          const row = rows.eq(index);

          // FIX https://github.com/pt-plugins/PT-Plugin-Plus/issues/347
          row.attr('id') === 'zhiding' && row.removeAttr('id');

          let cells = row.find(">td");

          let title = this.getTitle(row, cells, fieldIndex);

          // 没有获取标题时，继续下一个
          if (title.length == 0) {
            continue;
          }
          let link = title.attr("href");
          if (link && link.substr(0, 2) === "//") {
            // 适配HUDBT、WHU这样以相对链接开头
            link = `${site_url_help.protocol}://${link}`;
          } else if (link && link.substr(0, 4) !== "http") {
            link = `${site.url}${link}`;
          }

          // 获取下载链接
          let url = this.getDownloadLink(row, link);
          if (url && url.substr(0, 2) === "//") {
            // 适配HUDBT、WHU这样以相对链接开头
            url = `${site_url_help.protocol}://${url}`;
          } else if (url && url.substr(0, 4) !== "http") {
            url = `${site.url}${url}`;
          }

          if (!url) {
            continue;
          }

          url = url +
            (site && site.passkey ? "&passkey=" + site.passkey : "");

          let data = {
            title: title.attr("title") || title.text(),
            subTitle: this.getSubTitle(title, row),
            link,
            url,
            size: this.getFieldValue(row, cells, fieldIndex, "size") || 0,
            time:
              fieldIndex.time == -1
                ? ""
                : this.getTime(cells.eq(fieldIndex.time)),
            author: this.getFieldValue(row, cells, fieldIndex, "author") || "",
            seeders: this.getFieldValue(row, cells, fieldIndex, "seeders") || 0,
            leechers:
              this.getFieldValue(row, cells, fieldIndex, "leechers") || 0,
            completed:
              this.getFieldValue(row, cells, fieldIndex, "completed") || 0,
            comments:
              this.getFieldValue(row, cells, fieldIndex, "comments") || 0,
            site: site,
            tags: Searcher.getRowTags(this.site, row),
            entryName: options.entry.name,
            category:
              fieldIndex.category == -1
                ? null
                : this.getFieldValue(row, cells, fieldIndex, "category") ||
                this.getCategory(cells.eq(fieldIndex.category)),
            progress: Searcher.getFieldValue(site, row, "progress"),
            status: Searcher.getFieldValue(site, row, "status"),
            imdbId: this.getIMDbId(row)
          };

          results.push(data);
        }
      } catch (error) {
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack;
        //`[${options.site.name}]获取种子信息出错: ${error.stack}`;
      }

      return results;
    }

    /**
     * 获取指定字段内容
     * @param {*} row
     * @param {*} cells
     * @param {*} fieldIndex
     * @param {*} fieldName
     */
    getFieldValue(row, cells, fieldIndex, fieldName, returnCell) {
      let parent = row;
      let cell = null;
      if (
        cells &&
        fieldIndex &&
        fieldIndex[fieldName] !== undefined &&
        fieldIndex[fieldName] !== -1
      ) {
        cell = cells.eq(fieldIndex[fieldName]);
        parent = cell || row;
      }

      let result = Searcher.getFieldValue(this.site, parent, fieldName);

      if (!result && cell) {
        if (returnCell) {
          return cell;
        }
        result = cell.text();
      }

      return result;
    }

    /**
     * 获取时间
     * @param {*} cell
     */
    getTime(cell) {
      let time = cell.find("span[title],time[title]").attr("title");
      if (!time) {
        time = $("<span>")
          .html(cell.html().replace("<br>", " "))
          .text();
      }
      if (options.site.host === "pt.sjtu.edu.cn") {
        if (time.match(/\d+[分时天月年]/g)) {
          time = Date.now() - this._parseTime(time)
          time = new Date(time).toLocaleString("zh-CN", { hour12: false }).replace(/\//g, '-')
        }
      }
      return time || "";
    }

    _parseTime(timeString) {
      const timeMatch = timeString.match(/\d+[分时天月年]/g)
      let length = 0
      timeMatch.forEach(time => {
        const timeMatch = time.match(/(\d+)([分时天月年])/)
        const number = parseInt(timeMatch[1])
        const unit = timeMatch[2]
        switch (true) {
          case unit === '分':
            length += number
            break
          case unit === '时':
            length += number * 60
            break
          case unit === '天':
            length += number * 60 * 24
            break
          case unit === '月':
            length += number * 60 * 24 * 30
            break
          case unit === '年':
            length += number * 60 * 24 * 365
            break
          default:
        }
      })
      return length * 60 * 1000
    }

    /**
     * 获取标题
     */
    getTitle(row, cells, fieldIndex) {
      let title =
        this.getFieldValue(row, cells, fieldIndex, "title", true) ||
        row.find("a[href*='hit'][title]:not(a[href*='comment'])").first();

      if (typeof title === "string") {
        return title;
      }

      if (title.length == 0) {
        title = row.find("a[href*='hit']:has(b)").first();
      }

      if (title.length == 0) {
        // 特殊情况处理
        switch (options.site.host) {
          case "u2.dmhy.org":
            title = row.find("a.tooltip[href*='hit']").first();
            break;
        }
      }

      // 对title进行处理，防止出现cf的email protect
      let cfemail = title.find("span.__cf_email__");
      if (cfemail.length > 0) {
        cfemail.each((index, el) => {
          $(el).replaceWith(Searcher.cfDecodeEmail($(el).data("cfemail")));
        });
      }

      return title;
    }

    /**
     * 获取IMDbId
     * @param {*} row
     */
    getIMDbId(row)
    {
      let imdbId = Searcher.getFieldValue(this.site, row, "imdbId");
      if (imdbId) {
        return imdbId;
      }

      try {
        let link = row.find("a[href*='imdb.com/title/tt']").first().attr("href");
        if (link)
        {
          imdbId = link.match(/(tt\d+)/);
          if (imdbId)
            return imdbId[0];
        }
      } catch (error){
        console.log(error)
        return null;
      }
      return null;
    }

    /**
     * 获取副标题
     * @param {*} title
     * @param {*} row
     */
    getSubTitle(title, row) {
      let subTitle = Searcher.getFieldValue(this.site, row, "subTitle");
      if (subTitle) {
        return subTitle;
      }

      try {
        subTitle = title
          .parent()
          .html()
          .split("<br>");
        if (subTitle && subTitle.length > 1) {
          subTitle = $("<span>")
            .html(subTitle[subTitle.length - 1])
            .text();
        } else {
          // 特殊情况处理
          switch (options.site.host) {
            case "hdchina.org":
              if (
                title
                  .parent()
                  .next()
                  .is("h4")
              ) {
                subTitle = title
                  .parent()
                  .next()
                  .text();
              }
              break;

            case "tp.m-team.cc":
            case "pt.m-team.cc":
            case "kp.m-team.cc":
              title = row.find("a[href*='hit'][title]").last();
              subTitle = title
                .parent()
                .html()
                .split("<br>");
              subTitle = $("<span>")
                .html(subTitle[subTitle.length - 1])
                .text();
              break;

            case "u2.dmhy.org":
              subTitle = $(".torrentname > tbody > tr:eq(1)", row)
                .find(".tooltip")
                .text();
              break;

            case "whu.pt":
            case "hudbt.hust.edu.cn":
              subTitle = $("h3", row).text();
              break;

            default:
              subTitle = "";
              break;
          }
        }

        return subTitle || "";
      } catch (error) {
        return "";
      }
    }

    // 很
    getDownloadLink(row, link) {
      let url;
      switch (options.site.host) {
        case 'hdsky.me': {
          let url_another = row.find('form[action*="download.php"]:eq(0)')
          if (url_another.length > 0) {
            url = url_another.attr('action')
            break;
          }

        }

        default: {
          let url_another = row.find("img.download").parent();

          if (url_another.length) {
            if (url_another.get(0).tagName !== "A") {
              let id = link.getQueryString("id");
              url = `download.php?id=${id}`;
            } else {
              url = url_another.attr("href");
            }
          } else {
            let id = link.getQueryString("id");
            url = `download.php?id=${id}`;
          }
          url = url + "&https=1"
        }
      }

      return url;
    }

    /**
     * 获取分类
     * @param {*} cell 当前列
     */
    getCategory(cell) {
      let result = {
        name: "",
        link: ""
      };
      let link = cell.find("a:first");
      let img = link.find("img:first");

      if (link.length) {
        result.link = link.attr("href");
        if (result.link.substr(0, 4) !== "http") {
          result.link = options.site.url + result.link;
        }
      }

      if (img.length) {
        result.name = img.attr("title") || img.attr("alt");
      } else {
        result.name = link.text();
      }
      return result;
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, options.searcher);
