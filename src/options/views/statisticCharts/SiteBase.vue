<template>
  <div class="container">
    <v-autocomplete
      v-model="selectedSite"
      :items="sites"
      :label="$t('statistic.selectSite')"
      persistent-hint
      single-line
      item-text="name"
      item-value="host"
      return-object
      @input="init(selectedSite.host)"
    >
      <template slot="selection" slot-scope="{ item }">
        <v-list-tile-avatar v-if="item.icon">
          <img :src="item.icon" />
        </v-list-tile-avatar>
        <span v-text="item.name"></span>
      </template>
      <template slot="item" slot-scope="data">
        <v-list-tile-avatar v-if="data.item.icon">
          <img :src="data.item.icon" />
        </v-list-tile-avatar>
        <v-list-tile-content>
          <v-list-tile-title v-html="data.item.name"></v-list-tile-title>
          <v-list-tile-sub-title v-html="data.item.url"></v-list-tile-sub-title>
        </v-list-tile-content>
        <v-list-tile-action>
          <v-list-tile-action-text>{{ joinTags(data.item.tags) }}</v-list-tile-action-text>
        </v-list-tile-action>
      </template>
    </v-autocomplete>

    <v-layout row wrap class="mb-2">
      <v-btn depressed small to="/home">{{ $t('statistic.goback') }}</v-btn>
      <v-btn depressed small @click.stop="exportRawData">{{ $t('statistic.exportRawData') }}</v-btn>

      <v-spacer>
        <v-btn-toggle v-model="dateRange" class="ml-5">
          <v-btn flat value="7day" v-text="$t('statistic.dateRange.7day')"></v-btn>
          <v-btn flat value="30day" v-text="$t('statistic.dateRange.30day')"></v-btn>
          <v-btn flat value="60day" v-text="$t('statistic.dateRange.60day')"></v-btn>
          <v-btn flat value="90day" v-text="$t('statistic.dateRange.90day')"></v-btn>
          <v-btn flat value="180day" v-text="$t('statistic.dateRange.180day')"></v-btn>
          <v-btn flat value="all" v-text="$t('statistic.dateRange.all')"></v-btn>
        </v-btn-toggle>
      </v-spacer>
      <v-btn flat icon small @click="share" :title="$t('statistic.share')" v-if="!shareing">
        <v-icon small>share</v-icon>
      </v-btn>
      <v-progress-circular indeterminate :width="3" size="30" color="green" v-if="shareing" class="by_pass_canvas"></v-progress-circular>
    </v-layout>

    <div ref="charts" class="charts">
      <highcharts :options="chartBarData" />
      <highcharts :options="chartBaseData" class="mt-4" />
      <highcharts :options="chartExtData" class="mt-4" />

      <v-card-actions>
        <v-spacer></v-spacer>
        <span>{{ shareTime | formatDate('YYYY-MM-DD HH:mm:ss') }}</span>
        <span class="ml-1">Created By {{ $t('app.name') }} {{ version }}</span>
      </v-card-actions>
    </div>

    <v-alert :value="true" type="info" color="grey">
      <div v-html="$t('statistic.note')"></div>
    </v-alert>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Chart } from "highcharts-vue";
import { Route } from "vue-router";
import Extension from "@/service/extension";
import { filters } from "@/service/filters";
import {
  EAction,
  EUserDataRange,
  Site,
  DownloadClient,
  EDataResultType,
  Dictionary,
  ECommonKey
} from "@/interface/common";
import FileSaver from "file-saver";
import { PPF } from "@/service/public";
import dayjs from "dayjs";
import domtoimage from "dom-to-image";

const extension = new Extension();

function formatBonus(v: any) {
  let result: number | string = 0;
  let unit = "";
  switch (true) {
    case v >= 1000000000:
      return "∞";

    case v >= 100000000:
      unit = "亿";
      result = v / 100000000;
      break;

    case v >= 10000000:
      unit = "千万";
      result = v / 10000000;
      break;

    case v >= 1000000:
      unit = "百万";
      result = v / 1000000;
      break;

    case v >= 10000:
      unit = "万";
      result = v / 10000;
      break;

    case v >= 1000:
      unit = "千";
      result = v / 1000;
      break;

    default:
      return v;
  }

  return parseFloat(result.toString()).toFixed(2) + " " + unit;
}

export default Vue.extend({
  components: {
    highcharts: Chart
  },
  data() {
    return {
      chartBaseData: {},
      chartExtData: {},
      chartBarData: {},
      host: "",
      options: this.$store.state.options,
      selectedSite: {} as Site,
      shareing: false,
      shareTime: new Date(),
      version: "",
      userName: "",
      sites: [] as Site[],
      rawData: {} as Dictionary<any>,
      beginDate: "",
      endDate: "",
      dateRange: "30day"
    };
  },

  mounted() {
    this.initEvents();
    this.init(this.$route.params["host"]);
  },

  created() {
    this.version = PPF.getVersion();

    // 插入到第一个位置
    this.sites.push({
      name: this.$t("statistic.allSite").toString(),
      host: ECommonKey.allSite,
      icon: "",
      url: "",
      tags: []
    });

    this.options.sites.forEach((site: Site) => {
      if (site.allowGetUserInfo) {
        this.sites.push(JSON.parse(JSON.stringify(site)));
      }
    });
  },

  methods: {
    initEvents() {},
    init(host: string = "") {
      if (host == ECommonKey.allSite) {
        host = "";
      }
      this.host = host;

      this.selectedSite = this.options.sites.find((item: Site) => {
        return item.host == this.host;
      });

      this.resetDateRange();

      extension
        .sendRequest(EAction.getUserHistoryData, null, this.host)
        .then((data: any) => {
          console.log(data);
          this.rawData = data;
          this.resetData(data);
        });
    },
    /**
     * 获取合计数据
     */
    getTotalData(source: any) {
      let result: Dictionary<any> = {};
      let nameInfo = { name: "", maxCount: 0 };
      let userNames: Dictionary<any> = {};
      let days: any[] = [];

      for (const host in source) {
        if (source.hasOwnProperty(host)) {
          const siteData = this.fillData(source[host]);
          let site: Site = this.options.sites.find((item: Site) => {
            return item.host == host;
          });

          if (!site) {
            continue;
          }

          if (!site.allowGetUserInfo) {
            continue;
          }

          for (const date in siteData) {
            if (siteData.hasOwnProperty(date)) {
              const data = siteData[date];

              if (
                !data.uploaded &&
                !data.downloaded &&
                !data.seedingSize &&
                !data.seeding
              ) {
                continue;
              }

              let item = result[date];
              if (!item) {
                item = {
                  uploaded: 0,
                  downloaded: 0,
                  seedingSize: 0,
                  seeding: 0,
                  bonus: 0,
                  name: "",
                  lastUpdateStatus: EDataResultType.success,
                };
              }

              item.uploaded += this.getNumber(data.uploaded);
              item.downloaded += this.getNumber(data.downloaded);

              if (data.seeding && data.seeding > 0) {
                item.seeding += Math.round(data.seeding);
              }

              item.seedingSize += this.getNumber(data.seedingSize);
              item.bonus += this.getNumber(data.bonus);

              if (!userNames[data.name]) {
                userNames[data.name] = 0;
              }
              userNames[data.name]++;

              // 获取使用最多的用户名
              if (userNames[data.name] > nameInfo.maxCount) {
                nameInfo.name = data.name;
                nameInfo.maxCount = userNames[data.name];
              }

              result[date] = item;

              if (!days.includes(date)) {
                days.push(date);
              }
            }
          }
        }
      }

      let datas: Dictionary<any> = {};
      days.sort().forEach(day => {
        datas[day] = result[day];
      });

      this.userName = nameInfo.name;

      return datas;
    },
    //-> { site: [ { date, relativeUploaded }] }
    getRelativeData(source: any) {
      const result: any = {};
      for (const [host, siteData] of Object.entries(source)) {
        const site: Site = this.options.sites.find((item: Site) => item.host == host);
        if (!site) {
          continue;
        }
        if (!site.allowGetUserInfo) {
          continue;
        }
        const newSiteData = this.fillData(siteData);

        // -> [ { date, uploaded }]
        const absoluteSiteData = [];
        for (const [date, item] of (Object.entries(newSiteData) as any[])) {
          if (date == EUserDataRange.latest) {
            continue;
          }
          absoluteSiteData.push({
            date: new Date(date),
            uploaded: item.uploaded,
          });
        }

        //-> [ { date, relativeUploaded }]
        const relativeSiteData = [];
        for (let i=1; i<absoluteSiteData.length; i++) {
          const a = absoluteSiteData[i-1];
          const b = absoluteSiteData[i];
          relativeSiteData.push({ date: a.date, relativeUploaded: b.uploaded - a.uploaded });
        }

        result[site.name] = relativeSiteData;
      }
      return result;
    },
    getNumber(source: any) {
      if (typeof source === "string") {
        source = source.replace(/,/g, "");
      }

      if (/^(-)?\d+(.\d+)?$/.test(source)) {
        return parseFloat(source.toString());
      }

      return 0;
    },
    /**
     * 填充数据，将两个日期中间空白的数据由前一天数据填充
     */
    fillData(result: any, fill: boolean = true) {
      let datas: any = {};
      let lastDate: any = null;
      let lastData: any = null;
      for (const key in result) {
        if (dayjs(key).isValid()) {
          let data = result[key];
          let isValidDate = true;

          // 如果当前数据不可用，则使用上一条数据
          if (
            !data.uploaded &&
            !data.downloaded &&
            !data.seedingSize &&
            !data.seeding
          ) {
            data = lastData;
          } else if (lastData && !data.id && !data.name) {
            data = lastData;
          }

          if (!data) {
            continue;
          }

          let date = dayjs(key);

          if (!lastDate) {
            lastDate = date;
          }

          if (!lastData) {
            lastData = PPF.clone(data);
          }

          if (fill) {
            let day = date.diff(lastDate, "day");
            if (day > 1) {
              for (let index = 0; index < day - 1; index++) {
                lastDate = lastDate.add(1, "day");
                if (this.inDateRange(lastDate)) {
                  datas[lastDate.format("YYYY-MM-DD")] = lastData;
                }
              }
            }
          }

          lastData = PPF.clone(data);
          lastDate = date;

          if (this.inDateRange(date)) {
            datas[key] = data;
          }
        }
      }

      datas["latest"] = result["latest"];

      return datas;
    },
    inDateRange(date: any) {
      // 小于起始日期时跳过
      if (
        dayjs(this.beginDate).isValid() &&
        date.diff(this.beginDate, "day") < 0
      ) {
        return false;
      }

      // 大于截止日期时跳过
      if (dayjs(this.endDate).isValid() && date.diff(this.endDate, "day") > 0) {
        return false;
      }

      return true;
    },
    resetData(result: any) {
      if (this.host) {
        const newResult = this.fillData(result, false);
        this.resetBaseData(newResult);
        this.resetExtData(newResult);
        this.resetBarData(this.getRelativeData({[this.host]: result}));
      } else {
        let data = this.getTotalData(result);
        this.selectedSite = {
          name: this.$t("statistic.allSite").toString(),
          host: ECommonKey.allSite
        };
        this.resetBaseData(data);
        this.resetExtData(data);
        this.resetBarData(this.getRelativeData(result));
      }
    },
    /**
     * 基础数据
     */
    resetBaseData(result: any) {
      var fillOpacity = 0.3;
      var datas = [
        {
          type: "spline",
          name: this.$t("statistic.upload").toString(),
          tooltip: {
            formatter: function(): any {
              let _this = this as any;
              return filters.formatSize(_this.x);
            }
          },
          fillOpacity: fillOpacity,
          data: [] as any
        },
        {
          type: "spline",
          name: this.$t("statistic.download").toString(),
          tooltip: {
            valueSuffix: " "
          },
          fillOpacity: fillOpacity,
          data: [] as any
        },
        {
          type: "spline",
          name: this.$t("statistic.bonus").toString(),
          yAxis: 1,
          tooltip: {
            valueSuffix: " "
          },
          fillOpacity: fillOpacity,
          data: [] as any
        }
      ];
      var types = {};
      var colors = ["#1b5e20", "#b71c1c", "#2f7ed8", "#03A9F4"];
      var categories = [];
      let latest = {
        downloaded: 0,
        uploaded: 0,
        bonus: 0,
        name: ""
      };

      let _self = this;

      // 数据
      for (const date in result) {
        if (result.hasOwnProperty(date)) {
          const data = result[date];

          if (!data.uploaded && !data.downloaded) {
            continue;
          }
          if (date == EUserDataRange.latest) {
            latest = data;
            continue;
          }

          const time = new Date(date).getTime();

          datas[0].data.push([time, this.getNumber(data.uploaded)]);
          datas[1].data.push([time, this.getNumber(data.downloaded)]);
          datas[2].data.push([time, this.getNumber(data.bonus)]);
          categories.push(date);
        }
      }

      var chart = {
        chart: {
          backgroundColor: null
        },
        series: datas,
        colors: colors,
        // 版权信息
        credits: {
          enabled: false
        },
        subtitle: {
          text: this.$t("statistic.baseDataSubTitle", {
            uploaded: filters.formatSize(latest.uploaded),
            downloaded: filters.formatSize(latest.downloaded),
            bonus: filters.formatNumber(latest.bonus)
          }).toString()
        },
        title: {
          text: this.$t("statistic.baseDataTitle", {
            userName: latest.name || this.userName,
            site: this.selectedSite.name
          }).toString()
        },
        xAxis: {
          type: "datetime",
          dateTimeLabelFormats: {
            day: "%Y-%m-%d",
            week: "%Y-%m-%d",
            month: "%Y-%m-%d",
            year: "%Y-%m-%d"
          },
          // categories: categories,
          gridLineDashStyle: "ShortDash",
          gridLineWidth: 1,
          gridLineColor: "#dddddd"
        },
        yAxis: [
          {
            labels: {
              formatter: function(): any {
                let _this = this as any;
                return filters.formatSize(_this.value);
              },
              style: {
                color: colors[3]
              }
            },
            title: {
              text: this.$t("statistic.data").toString(),
              style: {
                color: colors[3]
              }
            },
            lineWidth: 1,
            gridLineDashStyle: "ShortDash"
          },
          {
            opposite: true,
            labels: {
              formatter: function(): any {
                let _this = this as any;
                return formatBonus(_this.value);
              },
              style: {
                color: colors[2]
              }
            },
            title: {
              text: this.$t("statistic.bonus").toString(),
              style: {
                color: colors[2]
              }
            },
            lineWidth: 1,
            gridLineDashStyle: "ShortDash"
          }
        ],
        tooltip: {
          shared: true,
          crosshairs: {
            width: 1,
            color: "red",
            dashStyle: "shortdot"
          },
          useHTML: true,
          formatter: function(): any {
            function createTipItem(text: string, color: string = "#000") {
              return `<div style='color:${color};'>${text}</div>`;
            }
            let _this = this as any;
            let tips: string[] = [];
            // 标题（时间）
            tips.push(createTipItem(dayjs(_this.x).format("YYYY-MM-DD")));
            _this.points.forEach((point: any) => {
              let value = point.y;
              switch (point.series.name) {
                case _self.$t("statistic.upload").toString():
                case _self.$t("statistic.download").toString():
                  value = filters.formatSize(point.y);
                  break;

                case _self.$t("statistic.bonus").toString():
                  value = filters.formatNumber(point.y);
                  break;
              }

              tips.push(
                createTipItem(`${point.series.name}: ${value}`, point.color)
              );
            });

            let result = `<div>${tips.join("")}</div>`;
            return result;
          }
        }
      };

      this.chartBaseData = chart;
    },
    /**
     * 其他数据
     */
    resetExtData(result: any) {
      var fillOpacity = 0.3;
      var datas = [
        {
          type: "spline",
          name: this.$t("statistic.seedingSize").toString(),
          fillOpacity: fillOpacity,
          data: [] as any
        },
        {
          type: "spline",
          name: this.$t("statistic.seedingCount").toString(), //"做种数",
          yAxis: 1,
          fillOpacity: fillOpacity,
          data: [] as any
        }
      ];
      var types = {};
      var colors = ["#FF6F00", "#2E7D32", "#2f7ed8", "#03A9F4"];
      var categories = [];
      let latest = {
        seeding: 0,
        seedingSize: 0,
        name: ""
      };

      // 数据
      for (const date in result) {
        if (result.hasOwnProperty(date)) {
          const data = result[date];

          if (!data.seedingSize && !data.seeding) {
            continue;
          }
          if (date == EUserDataRange.latest) {
            latest = data;
            continue;
          }

          const time = new Date(date).getTime();

          datas[0].data.push([time, parseFloat(data.seedingSize)]);
          datas[1].data.push([time, parseFloat(data.seeding)]);
          categories.push(date);
        }
      }

      let _self = this;
      var chart = {
        chart: {
          backgroundColor: null
        },
        series: datas,
        colors: colors,
        // 版权信息
        credits: {
          enabled: false
        },
        subtitle: {
          text: this.$t("statistic.seedingDataSubTitle", {
            seedingSize: filters.formatSize(latest.seedingSize),
            count: latest.seeding
          }).toString()
        },
        title: {
          text: this.$t("statistic.seedingDataTitle", {
            userName: latest.name || this.userName,
            site: this.selectedSite.name
          }).toString()
        },
        xAxis: {
          // categories: categories,
          type: "datetime",
          dateTimeLabelFormats: {
            day: "%Y-%m-%d",
            week: "%Y-%m-%d",
            month: "%Y-%m-%d",
            year: "%Y-%m-%d"
          },
          gridLineDashStyle: "ShortDash",
          gridLineWidth: 1,
          gridLineColor: "#dddddd"
        },
        yAxis: [
          {
            labels: {
              formatter: function(): any {
                let _this = this as any;
                return filters.formatSize(_this.value);
              },
              style: {
                color: colors[0]
              }
            },
            title: {
              text: this.$t("statistic.size").toString(), //"体积",
              style: {
                color: colors[0]
              }
            },
            lineWidth: 1,
            gridLineDashStyle: "ShortDash"
          },
          {
            opposite: true,
            labels: {
              formatter: function(): any {
                let _this = this as any;
                return formatBonus(_this.value);
              },
              style: {
                color: colors[1]
              }
            },
            title: {
              text: this.$t("statistic.count").toString(), //"数量",
              style: {
                color: colors[1]
              }
            },
            lineWidth: 1,
            gridLineDashStyle: "ShortDash"
          }
        ],
        tooltip: {
          shared: true,
          useHTML: true,
          crosshairs: {
            width: 1,
            color: "red",
            dashStyle: "shortdot"
          },
          formatter: function(): any {
            function createTipItem(text: string, color: string = "#000") {
              return `<div style='color:${color};'>${text}</div>`;
            }
            let _this = this as any;
            let tips: string[] = [];
            // 标题（时间）
            tips.push(createTipItem(dayjs(_this.x).format("YYYY-MM-DD")));
            _this.points.forEach((point: any) => {
              let value = point.y;
              switch (point.series.name) {
                // "做种体积"
                case _self.$t("statistic.seedingSize").toString():
                  value = filters.formatSize(point.y);
                  break;
              }

              tips.push(
                createTipItem(`${point.series.name}: ${value}`, point.color)
              );
            });

            let result = `<div>${tips.join("")}</div>`;
            return result;
          }
        }
      };

      this.chartExtData = chart;
    },
    /**
     * Bar数据
     */
    resetBarData(result: any) {
      const $t = this.$t.bind(this);

      // -> [ { name: siteName, data: [ [ date, relativeUploaded ] ]}]
      const series = Object.entries(result).map(([siteName, data]: any[]) => ({
        name: siteName,
        data: data.map((v: any) => ([
          v.date.getTime(),
          v.relativeUploaded,
        ]))
      }));

      const chart = {
        series,
        chart: {
          backgroundColor: null,
          type: 'column'
        },
        credits: {
          enabled: false
        },
        title: {
          text: this.$t("statistic.barDataTitle", {
            userName: this.userName,
            site: this.selectedSite.name
          }).toString()
        },
        xAxis: {
          type: "datetime",
          dateTimeLabelFormats: {
            day: "%m-%d",
            week: "%m-%d",
            month: "%m-%d",
            year: "%m-%d"
          },
          gridLineDashStyle: "ShortDash",
          gridLineWidth: 1,
          gridLineColor: "#dddddd"
        },
        yAxis: {
          title: {
            text: this.$t("statistic.data").toString(),
          },
          lineWidth: 1,
          gridLineDashStyle: "ShortDash"
        },
        tooltip: {
          useHTML: true,
          formatter: function(): any {
            const { x, y, total, color, series: { name: siteName } }: any = this
            let sites = []
            for (const site of series) {
              const siteY = (site.data.find(([a]: any[]) => a === x) || [0, 0])[1]
              if (
                (y < 0 && siteY < 0) ||
                (y > 0 && siteY > 0)
               ) {
                const percentage = Math.ceil(siteY / total * 100)
                sites.push({
                  name: site.name,
                  value: siteY,
                  valueDisplay: filters.formatSizeWithNegative(siteY),
                  percentageDisplay: `${percentage}%`,
                  isActive: site.name === siteName,
                })
              }
            }
            sites.sort((a,b) => b.value-a.value)
            const date = dayjs(x).format("YYYY-MM-DD")
            const totalDisplay = filters.formatSizeWithNegative(total)
            const totalText = $t('statistic.total').toString()

            const createTr = ({ name, valueDisplay, percentageDisplay, isActive }: any) => {
              return `
                <tr style='color: ${isActive ? color : "inherit"};'>
                  <td>${name}</td>
                  <td style='padding-left: 5px;'>${valueDisplay}</td>
                  <td style='padding-left: 5px;'>${percentageDisplay}</td>
                </tr>
              `
            }

            return `
              ${date}<br/>
              <table>
                ${createTr({ name: totalText, valueDisplay: totalDisplay, percentageDisplay: '100%' })}
                ${sites.map(createTr).join('')}
              </table>
            `
          },
        },
        plotOptions: {
          column: {
            stacking: 'normal',
          }
        },
      };
      this.chartBarData = chart;
    },
    joinTags(tags: any): string {
      if (tags && tags.join) {
        return tags.join(", ");
      }
      return "";
    },
    share() {
      let div = this.$refs.charts as HTMLDivElement;
      this.shareing = true;
      this.shareTime = new Date();
      domtoimage.toJpeg(div, {
        filter: (node) => {
          if (node.nodeType === 1) {
            return !(node as Element).classList.contains('by_pass_canvas')
          }
          return true
        }
      }).then((dataUrl: any) => {
        if (dataUrl) {
          FileSaver.saveAs(dataUrl, "PT-Plugin-Plus-UserData.jpg");
        }
        this.shareing = false;
      });
    },
    /**
     * 导出原始数据
     */
    exportRawData() {
      const data = new Blob([JSON.stringify(this.rawData)], {
        type: "text/plain"
      });
      FileSaver.saveAs(
        data,
        `PT-Plugin-Plus-Statistic-${this.selectedSite.host}.json`
      );
    },

    resetDateRange() {
      const now = dayjs();
      this.endDate = now.toString();
      switch (this.dateRange) {
        case "7day":
          this.beginDate = now.add(-7, "day").toString();
          break;

        case "30day":
          this.beginDate = now.add(-30, "day").toString();
          break;

        case "60day":
          this.beginDate = now.add(-60, "day").toString();
          break;

        case "90day":
          this.beginDate = now.add(-90, "day").toString();
          break;

        case "180day":
          this.beginDate = now.add(-180, "day").toString();
          break;

        default:
          this.beginDate = "";
          break;
      }
    }
  },

  watch: {
    dateRange() {
      this.resetDateRange();
      this.resetData(this.rawData);
    }
  }
});
</script>
<style lang="scss"  scoped>
.container {
  width: 900px;
  padding: 0;

  .charts {
    background-color: white;
  }

  .chart {
    min-width: 320px;
    max-width: 800px;
    height: 240px;
    margin: 0 auto;
  }
}

.theme--dark .container {
  .charts {
    background-color: #9e9e9e;
  }
}
</style>
