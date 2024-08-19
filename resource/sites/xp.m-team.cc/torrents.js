(function ($) {
  console.log('this is torrent.js');

  class App extends window.NexusPHPCommon {
    init() {
      this.initButtons();
      this.initFreeSpaceButton();
      // 设置当前页面
      PTService.pageApp = this;
    }

    /**
     * 初始化按钮列表
     */
    initButtons() {
      this.initListButtons();
    }

    // eslint-disable-next-line
    async resolveDownloadURLs(func) {
      let ids = $('tr').map(function () {
        let rowIds = $(this).find('td').map(function() {
          let href = $(this).find('a').attr('href');
          if (href) {
            let match = href.match(/\/detail\/(\d+)/);
            return match ? match[1] : null;
          }
        }).toArray().filter(id => !!id);

        return rowIds;
      }).toArray().flat().filter(id => !!id);

      ids = [...new Set(ids)];
      console.log('ids', ids)
      let urls = []
      return new Promise(async (resolve, reject) => {
        try {
          for (let i = 0; i < ids.length; i++) {
            // 流控调整
            const id = ids[i], timeout = 8000
            let min = Math.ceil(timeout * (ids.length - i) / 1000 / 60)
            let msg = this.t('resolveURLsTip', {id, current: i + 1, total: ids.length, min})
            this.showStatusMessage(msg, 480)
            let url = PTService.resolveMTDownloadURL(id)
            if (url) {
              let res = url

              // handle custom function
              if (func) {
                res = {url, func: await func(url, id)}
              }
              urls.push(res)
            } else {
              // 限流
              console.error(`can't get download url by id: ${id}`)
              break
            }
            // 强制等待, 减缓站点压力. 觉得太慢自行修改站点每页种子数量
            await this.sleep(timeout)
          }
        } finally {
          $(this.statusBar).remove()
          console.log(`已解析 ${urls.length} 个下载链接`, urls)
          resolve(urls)
        }
      })
    }

    /**
     * 获取下载链接
     */
    getDownloadURLs() {
      console.log(`MT 不应该使用这个函数获取下载链接, 请使用 resolveDownloadURLs`)
      let urlParser = PTService.filters.parseURL(location.href);
      let site = PTService.getSiteFromHost(urlParser.host);

      let urls = PTService.getFieldValue('downloadURLs');

      return Promise.resolve(urls)
    }

    /**
     * 确认大小是否超限
     */
    confirmWhenExceedSize() {
      return this.confirmSize(
        $('table:contains(\'類別\'), table:contains(\'Type\')').find(
          'td:contains(\'MB\'),td:contains(\'GB\'),td:contains(\'TB\'),td:contains(\'MiB\'),td:contains(\'GiB\'),td:contains(\'TiB\')'
        )
      );
    }

    /**
     * 获取有效的拖放地址
     * @param {*} url
     */
    getDroperURL(url) {
      let id = url.split('/').pop()
      return PTService.resolveMTDownloadURL(id)
    }
  }

  new App().init();
})(jQuery);
