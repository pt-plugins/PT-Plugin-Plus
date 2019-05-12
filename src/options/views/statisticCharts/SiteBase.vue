<template>
  <div class="container">
    <v-autocomplete
      v-model="selectedSite"
      :items="sites"
      :label="words.selectSite"
      persistent-hint
      single-line
      item-text="name"
      item-value="host"
      return-object
      @input="init(selectedSite.host)"
    >
      <template slot="selection" slot-scope="{ item }">
        <v-list-tile-avatar v-if="item.icon">
          <img :src="item.icon">
        </v-list-tile-avatar>
        <span v-text="item.name"></span>
      </template>
      <template slot="item" slot-scope="data">
        <v-list-tile-avatar v-if="data.item.icon">
          <img :src="data.item.icon">
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

    <v-layout row wrap>
      <v-btn depressed small to="/home">{{ words.goback }}</v-btn>
      <v-btn depressed small @click.stop="exportRawData">{{ words.exportRawData }}</v-btn>
      <v-spacer></v-spacer>
      <v-btn flat icon small @click="share" :title="words.share" v-if="!shareing">
        <v-icon small>share</v-icon>
      </v-btn>
      <v-progress-circular indeterminate :width="3" size="30" color="green" v-if="shareing"></v-progress-circular>
    </v-layout>

    <div ref="charts">
      <highcharts :options="chartBaseData"/>
      <highcharts :options="chartExtData" class="mt-4"/>

      <v-card-actions>
        <v-spacer></v-spacer>
        <span>{{ shareTime | formatDate('YYYY-MM-DD HH:mm:ss') }}</span>
        <span class="ml-1">Created By PT 助手 Plus {{ version }}</span>
      </v-card-actions>
    </div>

    <v-alert :value="true" type="info" color="grey">
      注：
      <br>1. 图表历史数据来自概览页，手动刷新或自动更新均会记录；
      <br>2. 助手从 v1.0.1 版开始正式记录每次刷新的数据，每个站每天仅保存一条；
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
import html2canvas from "html2canvas";
import FileSaver from "file-saver";

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
      words: {
        selectSite: "选择需要统计的站点",
        goback: "返回",
        share: "生成分享图片",
        exportRawData: "导出原数据"
      },
      chartBaseData: {},
      chartExtData: {},
      host: "",
      options: this.$store.state.options,
      selectedSite: {} as Site,
      shareing: false,
      shareTime: new Date(),
      version: "",
      userName: "",
      sites: [] as Site[],
      rawData: {} as Dictionary<any>
    };
  },

  mounted() {
    this.initEvents();
    this.init(this.$route.params["host"]);
  },

  created() {
    if (chrome && chrome.runtime) {
      let manifest = chrome.runtime.getManifest();
      this.version = "v" + (manifest.version_name || manifest.version);
    }

    // 插入到第一个位置
    this.sites.push({
      name: "<所有站点>",
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
          const siteData = source[host];
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

              if (data.lastUpdateStatus != EDataResultType.success) {
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
                  lastUpdateStatus: EDataResultType.success
                };
              }

              if (data.uploaded && data.uploaded > 0) {
                item.uploaded += parseFloat(data.uploaded);
              }

              if (data.downloaded && data.downloaded > 0) {
                item.downloaded += parseFloat(data.downloaded);
              }

              if (data.seeding && data.seeding > 0) {
                item.seeding += Math.round(data.seeding);
              }

              if (data.seedingSize && data.seedingSize > 0) {
                item.seedingSize += parseFloat(data.seedingSize);
              }

              if (data.bonus && data.bonus > 0) {
                item.bonus += parseFloat(data.bonus);
              }

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
    resetData(result: any) {
      if (this.host) {
        this.resetBaseData(result);
        this.resetExtData(result);
      } else {
        let data = this.getTotalData(result);
        console.log(data);
        this.selectedSite = { name: "<所有站点>", host: ECommonKey.allSite };
        this.resetBaseData(data);
        this.resetExtData(data);
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
          name: "上传",
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
          name: "下载",
          tooltip: {
            valueSuffix: " "
          },
          fillOpacity: fillOpacity,
          data: [] as any
        },
        {
          type: "spline",
          name: "积分",
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

      // 数据
      for (const date in result) {
        if (result.hasOwnProperty(date)) {
          const data = result[date];

          if (data.lastUpdateStatus != EDataResultType.success) {
            continue;
          }
          if (date == EUserDataRange.latest) {
            latest = data;
            continue;
          }

          datas[0].data.push(parseFloat(data.uploaded));
          datas[1].data.push(parseFloat(data.downloaded));
          datas[2].data.push(parseFloat(data.bonus));
          categories.push(date);
        }
      }

      var chart = {
        series: datas,
        colors: colors,
        // 版权信息
        credits: {
          enabled: false
        },
        subtitle: {
          text: `上传：${filters.formatSize(
            latest.uploaded
          )}, 下载：${filters.formatSize(
            latest.downloaded
          )}，积分：${filters.formatNumber(latest.bonus)}`
        },
        title: {
          text: `[${latest.name || this.userName}@${
            this.selectedSite.name
          }] 基本数据`
        },
        xAxis: {
          categories: categories,
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
              text: "数据",
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
              text: "积分",
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
          useHTML: true,
          formatter: function(): any {
            function createTipItem(text: string, color: string = "#000") {
              return `<div style='color:${color};'>${text}</div>`;
            }
            let _this = this as any;
            let tips: string[] = [];
            tips.push(createTipItem(_this.x));
            _this.points.forEach((point: any) => {
              let value = point.y;
              switch (point.series.name) {
                case "上传":
                case "下载":
                  value = filters.formatSize(point.y);
                  break;

                case "积分":
                  value = filters.formatNumber(point.y);
                  break;
              }

              tips.push(
                createTipItem(`${point.series.name}: ${value}`, point.color)
              );
            });

            let result = `<div>${tips.join("")}</div>`;
            console.log(result);
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
          name: "做种体积",
          fillOpacity: fillOpacity,
          data: [] as any
        },
        {
          type: "spline",
          name: "做种数",
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

          if (
            data.lastUpdateStatus != EDataResultType.success ||
            data.seeding == null
          ) {
            continue;
          }
          if (date == EUserDataRange.latest) {
            latest = data;
            continue;
          }

          datas[0].data.push(parseFloat(data.seedingSize));
          datas[1].data.push(parseFloat(data.seeding));
          categories.push(date);
        }
      }

      var chart = {
        series: datas,
        colors: colors,
        // 版权信息
        credits: {
          enabled: false
        },
        subtitle: {
          text: `做种体积：${filters.formatSize(latest.seedingSize)}, 数量：${
            latest.seeding
          } 个`
        },
        title: {
          text: `[${latest.name || this.userName}@${
            this.selectedSite.name
          }] 保种情况`
        },
        xAxis: {
          categories: categories,
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
              text: "体积",
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
              text: "数量",
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
          formatter: function(): any {
            function createTipItem(text: string, color: string = "#000") {
              return `<div style='color:${color};'>${text}</div>`;
            }
            let _this = this as any;
            let tips: string[] = [];
            tips.push(createTipItem(_this.x));
            _this.points.forEach((point: any) => {
              let value = point.y;
              switch (point.series.name) {
                case "做种体积":
                  value = filters.formatSize(point.y);
                  break;
              }

              tips.push(
                createTipItem(`${point.series.name}: ${value}`, point.color)
              );
            });

            let result = `<div>${tips.join("")}</div>`;
            console.log(result);
            return result;
          }
        }
      };

      this.chartExtData = chart;
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
      html2canvas(div, {}).then(canvas => {
        canvas.toBlob((blob: any) => {
          if (blob) {
            FileSaver.saveAs(blob, "PT-Plugin-Plus-Statistic.png");
          }
          this.shareing = false;
        });
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
    }
  }
});
</script>
<style lang="scss"  scoped>
.container {
  width: 900px;
  padding: 0;

  .chart {
    min-width: 320px;
    max-width: 800px;
    height: 240px;
    margin: 0 auto;
  }
}
</style>
