/**
 * 通用搜索解析脚本
 */
(function(options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      // 判断是否已登录
      if (
        options.entry.loggedRegex &&
        !new RegExp(options.entry.loggedRegex, "").test(options.responseText)
      ) {
        // 需要登录后再搜索
        options.status = ESearchResultParseStatus.needLogin;
        return;
      }

      options.isLogged = true;

      this.haveData = true;
      this.site = options.site;
    }

    /**
     * 获取搜索结果
     */
    getResult() {
	   console.log("Common schemas search js");
      if (!this.haveData) {
        return [];
      }
      let selector = options.resultSelector;
      let dataRowSelector = options.entry.dataRowSelector || "> tbody > tr";
      selector = selector.replace(dataRowSelector, "");
      let cellSelector = options.entry.dataCellSelector || ">td";
      // 获取数据表格
      let table = options.page.find(selector);
      // 获取种子列表行
      let rows = table.find(dataRowSelector);
      if (rows.length == 0) {
        // 没有定位到种子列表，或没有相关的种子
        options.status = ESearchResultParseStatus.torrentTableIsEmpty;
        return [];
      }
      let results = [];
      let beginRowIndex = options.entry.firstDataRowIndex || 0;

      // 用于定位每个字段所列的位置
      let fieldIndex = options.entry.fieldIndex || {
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
        author: -1,
        // 分类
        category: -1
      };

      try {
        // 遍历数据行
        for (let index = beginRowIndex; index < rows.length; index++) {
          const row = rows.eq(index);
          let cells = row.find(cellSelector);

          let title = this.getTitle(row, cells, fieldIndex);

          // 没有获取标题时，继续下一个
          if (!title) {
            continue;
          }
          let link = this.getFieldValue(row, cells, fieldIndex, "link");

          // 获取下载链接
          let url = this.getFieldValue(row, cells, fieldIndex, "url");

          if (!url || !link) {
            continue;
          }

          let data = {
            title: title,
            subTitle: this.getFieldValue(row, cells, fieldIndex, "subTitle"),
            link: this.getFullURL(link),
            url: this.getFullURL(url),
            size: this.getFieldValue(row, cells, fieldIndex, "size") || 0,
            time: this.getFieldValue(row, cells, fieldIndex, "time"),
            author: this.getFieldValue(row, cells, fieldIndex, "author") || "",
            seeders: this.getFieldValue(row, cells, fieldIndex, "seeders") || 0,
            leechers:
              this.getFieldValue(row, cells, fieldIndex, "leechers") || 0,
            completed:
              this.getFieldValue(row, cells, fieldIndex, "completed") || 0,
            comments:
              this.getFieldValue(row, cells, fieldIndex, "comments") || 0,
            site: this.site,
            tags: Searcher.getRowTags(this.site, row),
            entryName: options.entry.name,
            category: this.getFieldValue(row, cells, fieldIndex, "category"),
            progress: this.getFieldValue(row, cells, fieldIndex, "progress"),
            status: this.getFieldValue(row, cells, fieldIndex, "status")
          };
          results.push(data);
        }
      } catch (error) {
        // 获取种子信息出错
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack;
      }

      // 没有搜索到相关的种子
      if (results.length == 0 && !options.errorMsg) {
        options.status = ESearchResultParseStatus.noTorrents;
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

      if (!result && cell && result !== 0) {
        if (returnCell) {
          return cell;
        }
        result = cell.text();
      }

      return result;
    }

    /**
     * 获取完整的URL地址
     * @param {string} url
     */
    getFullURL(url) {
      let URL = PTServiceFilters.parseURL(this.site.url);
      if (url.substr(0, 2) === "//") {
        url = `${URL.protocol}${url}`;
      } else if (url.substr(0, 1) === "/") {
        url = `${URL.origin}${url}`;
      } else if (url.substr(0, 4) !== "http") {
        url = `${URL.origin}/${url}`;
      }
      return url;
    }

    /**
     * 获取标题
     */
    getTitle(row, cells, fieldIndex) {
      let title = this.getFieldValue(row, cells, fieldIndex, "title", true);

      if (!title) {
        return "";
      }

      if (typeof title === "string") {
        return title;
      }

      // 对title进行处理，防止出现cf的email protect
      let cfemail = title.find("span.__cf_email__");
      if (cfemail.length > 0) {
        cfemail.each((index, el) => {
          $(el).replaceWith(Searcher.cfDecodeEmail($(el).data("cfemail")));
        });
      }

      return title.text();
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, options.searcher);
