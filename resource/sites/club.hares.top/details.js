(function ($, window) {
  console.log('this is details.js');

  class App extends window.NexusPHPCommon {
    init() {
      this.initButtons();
      // 设置当前页面
      PTService.pageApp = this;
    }

    /**
     * 初始化按钮列表
     */
    initButtons() {
      this.showTorrentSize();
      this.initDetailButtons();
    }

    /**
     * 通过尝试分析 href 获取真正下载链接
     */

    _getDownloadUrlByPossibleHrefs() {
      const query = $('button[lay-on="copyLink"]');
      if (query.length) {
        return query.data("link");
      }
    }

    showTorrentSize() {
      let query = $('.layui-view-gird span');
      if (query.length > 1) {
        PTService.addButton({
          title: "当前种子大小",
           icon: "attachment",
           label: query[0].textContent
         });
      }
    }

     initSayThanksButton() {
      let query = $('[lay-on="addThanks"]');
      if (query && query.length) {
        // 说谢谢
        PTService.addButton({
          title: this.t("buttons.sayThanksTip"),
          icon: "thumb_up",
          label: this.t("buttons.sayThanks"),
          key: "sayThanks",
          click: (success, error) => {
            query[0].click();
            setTimeout(() => {
              let btn = $('.layui-layer-btn0');
              if (btn && btn.length){
                btn[0].click();
                success();
                setTimeout(() => {
                  PTService.removeButton("sayThanks");
                }, 1000);
              }
            }, 250);
          }
        });
      }
    }

    /**
     * 获取下载链接
     */
    getDownloadURL() {
      let url = PTService.getFieldValue('downloadURL')
      if (!url) {
        return this._getDownloadUrlByPossibleHrefs()
      }
      return this.getFullURL(url);
    }

    /**
     * 获取当前种子标题
     */
    getTitle() {
      let query = $(".layui-torrent-detail-table-title-content");
      if (query && query.length > 2) {
        return query[1].textContent;
      }
      return query.text();
    }

    /**
     * 获取当前种子IMDb Id
     */
    getIMDbId() {
      let url = window.location.href
      let imdbId = null
      try {
        imdbId = PTService.getFieldValue('imdbId')
        if (!imdbId) {
          const link = $('a[href*=\'www.imdb.com/title/\']:first');
          if (link.length > 0) {
            let match = link.attr('href').match(/(tt\d+)/)
            if (match && match.length >= 2) {
              imdbId = match[1];
            }
          }
        }
      } catch (e) {
        console.log(`${url} 获取IMDb Id 失败`, e)
      }
      console.log(imdbId)
      return imdbId
    }
  }

  new App().init();
})(jQuery, window);
