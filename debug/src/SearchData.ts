/**
 * 生成搜索测试数据
 */
export class SearchData {
  constructor(public config: any = {}) {}

  public generate() {
    let results: any[] = [];
    let count = Math.floor(Math.random() * 100);
    const status = [1, 2, 255, undefined];
    for (let i = 0; i < count; i++) {
      let host = this.getHost();
      let data = {
        title: this.getTitle(),
        subTitle: this.getSubTitle(),
        link: `https://${host}/details.php?id=${i}`,
        url: `https://${host}/download.php?id=${i}`,
        size: this.getSize(),
        time: Math.floor(
          new Date().getTime() / 1000 - Math.floor(Math.random() * 10000000)
        ),
        author: "匿名",
        seeders: Math.floor(Math.random() * 1000),
        leechers: Math.floor(Math.random() * 1000),
        completed: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 1000),
        host: host,
        tags: this.getTags(),
        entryName: "全部",
        progress: Math.floor(Math.random() * 100),
        status: status[Math.floor(Math.random() * status.length)]
      };

      results.push(data);
    }

    return JSON.stringify(results);
  }

  private getTitle() {
    let title: string[] = ["The Shawshank Redemption 1994"];
    let datas = ["BluRay", "720p", "1080p", "x265", "10bit"];

    const count = Math.floor(Math.random() * datas.length) - 1;
    if (count <= 0) {
      return title.join(" ");
    }

    for (let i = 0; i < count; i++) {
      let index = Math.floor(Math.random() * datas.length);
      title.push(datas[index]);
      datas.splice(index, 1);
    }

    return title.join(" ");
  }

  private getSubTitle() {
    let title: string[] = ["肖申克的救赎"];
    let datas = [" / 刺激1995(台)", " / 月黑高飞(港)", "英简繁特效"];

    const count = Math.floor(Math.random() * datas.length) - 1;
    if (count <= 0) {
      return title.join(" ");
    }

    for (let i = 0; i < count; i++) {
      let index = Math.floor(Math.random() * datas.length);
      title.push(datas[index]);
      datas.splice(index, 1);
    }

    return title.join(" ");
  }

  private getHost() {
    let index = Math.floor(Math.random() * this.config.sites.length);

    return this.config.sites[index].host;
  }

  private getTags() {
    let datas = [
      {
        name: "Free",
        color: "blue"
      },
      {
        name: "2xFree",
        color: "green"
      },
      {
        name: "2xUp",
        color: "lime"
      },
      {
        name: "2x50%",
        color: "light-green"
      },
      {
        name: "30%",
        color: "indigo"
      },
      {
        name: "50%",
        color: "orange"
      }
    ];

    const index = Math.floor(Math.random() * datas.length) - 1;
    if (index <= 0) {
      return [];
    }

    return [datas[index]];
  }

  private getSize() {
    const units = ["MB", "GB"];

    return (
      (Math.random() * 1000).toFixed(2) +
      units[Math.floor(Math.random() * units.length)]
    );
  }
}
