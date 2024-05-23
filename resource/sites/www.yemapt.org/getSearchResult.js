(function (options) {
    class Parser {
        constructor() {
            this.haveData = false;
            this.categories = {};

            if (!options.page.success && options.page.errorCode == 400) {
                options.status = ESearchResultParseStatus.needLogin;
                return;
            }
            options.isLogged = true;
            this.haveData = true;
        }

        /**
         * 获取搜索结果
         */

        getResult() {
            if (!this.haveData) {
                return [];
            }
            let site = options.site;
            let groups = options.page.data;

            if (groups.length == 0) {
                options.status = ESearchResultParseStatus.noTorrents;
                return [];
            }
            let results = [];
            try {
                groups.forEach(group => {
                    let data = {
                        title: group.showName,
                        subTitle: group.shortDesc,
                        link: `${site.url}#/torrent/detail/${group.id}`,
                        url: `${site.url}api/torrent/download?id=${group.id}`,
                        size: group.fileSize,
                        time: new Date(group.gmtCreate).toLocaleString("zh-CN", { hour12: false }).replace(/\//g, '-'),
                        author: group.uploadUserName,
                        seeders: group.seedNum,
                        leechers: group.leechNum,
                        completed: group.completedNum,
                        comments: group.torrentCommentNum,
                        site: site,
                        tags: this.getTags(group.uploadPromotion, group.downloadPromotion),
                        entryName: options.entry.name,

                        category: group.categoryName,
                        imdbId: null,
                    };
                    results.push(data);
                });
                if (results.length == 0) {
                    options.status = ESearchResultParseStatus.noTorrents;
                }
            } catch (error) {
                console.log(error);
                options.status = ESearchResultParseStatus.parseError;
                options.errorMsg = error.stack;
            }
            return results;
        }

        getTags(uploadPromotion, downloadPromotion) {
            const tags = [];

            // uploadPromotion: none, one_half, double_upload
            switch (uploadPromotion) {
                case "one_half": {
                    tags.push({
                        name: "1.5xUP",
                        color: "light-green"
                    })
                    break;
                }
                case "double_upload": {
                    tags.push({
                        name: "2xUP",
                        color: "green"
                    })
                    break;
                }
            }

            // downloadPromotion: none, half, free
            switch (downloadPromotion) {
                case "half": {
                    tags.push({
                        name: "50%",
                        color: "orange"
                    })
                    break;
                }
                case "free": {
                    tags.push({
                        name: "Free",
                        color: "blue"
                    })
                    break
                }
            }

            return tags;
        }
    }

    let parser = new Parser(options);
    options.results = parser.getResult();
})(options);
