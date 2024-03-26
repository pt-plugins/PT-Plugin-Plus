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
      this.initDetailButtons();
    }

    /**
     * 通过尝试分析 href 获取真正下载链接
     */

    _getDownloadUrlByPossibleHrefs() {
      let id = window.location.pathname.split('/').pop()
      return $.ajax('/api/torrent/genDlToken', {
        method: 'POST',
        data: {id},
        headers: {
          "x-api-key": PTService.site.authToken
        },
        success: function (data) {
          if (data.code === '0') {
            console.log(`种子 ${id} 下载链接获取成功`, data)
            // return data.data
          } else {
            console.log(`种子 ${id} 下载链接获取失败, code != 0`, data)
            // return null
          }
        },
        error: function (data) {
          console.log(`种子 ${id} 下载链接获取失败`, data)
          // return null
        },
        async: false
      })
    }


    /**
     * 获取下载链接
     */
    getDownloadURL() {
      let url = PTService.getFieldValue('downloadURL')
      if (!url) {
        let res = this._getDownloadUrlByPossibleHrefs()
        if (res.status === 200 && res.responseJSON.code === '0') {
          url = res.responseJSON.data
        }
        return url ? url : ''
      }

      return this.getFullURL(url);
    }

    /**
     * 获取当前种子标题
     */
    getTitle() {
      let title = $('title').text();
      let datas = /\"(.*?)\"/.exec(title);
      if (datas && datas.length > 1) {
        return datas[1] || title;
      }
      return title;
    }

    /**
     * 获取当前种子IMDb Id
     */
    getIMDbId() {
      try {
        let imdbId = PTService.getFieldValue('imdbId');
        console.log(imdbId);
        if (imdbId)
          return imdbId;
        else {
          const link = $('a[href*=\'www.imdb.com/title/\']:first');
          if (link.length > 0) {
            let match = link.attr('href').match(/(tt\d+)/);

            if (match && match.length >= 2)
              return imdbId = match[1];

          }
        }
      } catch {
      }
      return null;
    }
  }

  new App().init();
})(jQuery, window);
