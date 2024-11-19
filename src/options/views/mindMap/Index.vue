<template>
    <div>
      <div class="toolbarContainer">
        <div v-if="!loading" class="toolbar">
          <div class="toolbarBlock px-3 py-2">
            <v-btn class="toolbarBtn" @click="backToRoot">
              {{ $t("common.rePosition") }}
              <v-icon>my_location</v-icon>
            </v-btn>
  
            <v-btn class="toolbarBtn" @click="toFullscreenShow">
              {{ $t("common.fullScreen") }}
              <v-icon>fullscreen</v-icon>
            </v-btn>
  
            <v-btn
              class="toolbarBtn"
              :loading="exportLoading"
              :disabled="exportLoading"
              @click="exportMap('svg')"
            >
              {{ $t("common.share") }} SVG
              <v-icon>share</v-icon>
            </v-btn>
  
            <v-btn
              class="toolbarBtn"
              :loading="exportLoading"
              :disabled="exportLoading"
              @click="exportMap('png')"
            >
              {{ $t("common.share") }} PNG
              <v-icon>image</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
      <div id="mindMapContainer" class="mindMapContainer"></div>
      <div class="loading-wrapper display-2" v-if="loading">
        {{ $t("common.loading") }}
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import Vue from "vue";
  import dayjs from "dayjs";
  import MindMap from "simple-mind-map";
  import TouchEvent from "simple-mind-map/src/plugins/TouchEvent.js";
  import Drag from "simple-mind-map/src/plugins/Drag.js";
  import AssociativeLine from "simple-mind-map/src/plugins/AssociativeLine.js";
  import Select from "simple-mind-map/src/plugins/Select.js";
  import Export from "simple-mind-map/src/plugins/Export.js";
  import RainbowLines from "simple-mind-map/src/plugins/RainbowLines.js";
  import OuterFrame from "simple-mind-map/src/plugins/OuterFrame.js";
  import Themes from "simple-mind-map-plugin-themes";
  // @ts-ignore
  import HandDrawnLikeStyle from "./handDrawnLikeStyle.esm.min.js";
  import RichText from "simple-mind-map/src/plugins/RichText.js";
  import { Site } from "@/interface/common";
  import MapData from "./data.json";
  interface Node {
    data: {
      text: string;
      expand: boolean;
      tag?: string[];
      hyperlink?: string;
      hyperlinkTitle?: string;
      fillColor?: string;
      color?: string;
    };
    children: Node[];
  }
  MindMap.usePlugin(TouchEvent)
    .usePlugin(Drag)
    .usePlugin(AssociativeLine)
    .usePlugin(OuterFrame)
    .usePlugin(RainbowLines)
    .usePlugin(Select)
    .usePlugin(Export)
    .usePlugin(RichText)
    .usePlugin(HandDrawnLikeStyle);
  Themes.init(MindMap);
  export default Vue.extend({
    data() {
      return {
        mindMap: null as MindMap | null,
        loading: true,
        exportLoading: false,
        darkMode: false,
        themeName: "",
      };
    },
    created() {
      if (localStorage.getItem("DarkMode"))
        this.darkMode = localStorage.getItem("DarkMode") == "true";
    },
    mounted() {
      // @ts-ignore
      this.mindMap = new MindMap({
        el: document.getElementById("mindMapContainer"),
        fit: true,
        mousewheelAction: "zoom",
        emptyTextMeasureHeightText: "",
        textAutoWrapWidth: 1000,
        exportPaddingX: 10,
        exportPaddingY: 10,
        addContentToFooter: () => {
          const el = document.createElement("div");
          el.className = "footer";
          el.innerHTML = ` 
            ${dayjs(new Date()).format(
              "YYYY-MM-DD HH:mm:ss"
            )} Created By ${this.$t("app.name").toString()}
          `;
          const cssText = `
              .footer {
                width: 100%;
                height: 30px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 20px;
                color: #979797;
              }
            `;
          return {
            el,
            cssText,
            height: 30,
          };
        },
        tagsColorMap: {
          综合: 'red',
          成人: '#ca9d00',
          影视: '#007db3'
        }
      });
      this.mindMap!.setFullData(MapData);
      this.setData();
      this.mindMap.on("node_tree_render_end", this.handleHideLoading);
      window.addEventListener("resize", this.handleResize);
      this.$root.$on("ToggleDarkMode", this.toggleDarkMode);
    },
    beforeDestroy() {
      this.$root.$off("ToggleDarkMode", this.toggleDarkMode);
      this.mindMap!.off("node_tree_render_end", this.handleHideLoading);
      window.removeEventListener("resize", this.handleResize);
      this.mindMap!.destroy();
    },
    methods: {
      generateTree(allSites: Site[]) {
        const groupedBySchema: { [schema: string]: Site[] } = allSites.reduce(
          (acc, item) => {
            if (!acc[item.schema]) {
              acc[item.schema] = [];
            }
            acc[item.schema].push(item);
            return acc;
          },
          {} as { [schema: string]: Site[] }
        );
        const rootNode: Node = {
          data: {
            text: this.$t("app.name").toString(),
            expand: true,
          },
          children: [],
        };
        for (const schema in groupedBySchema) {
          const schemaNode: Node = {
            data: {
              text: schema,
              expand: true,
            },
            children: [],
          };
          groupedBySchema[schema].forEach((item: Site) => {
            const childNode: Node = {
              data: {
                text: item.description
                  ? `${item.name}:${item.description}`
                  : item.name,
                expand: true,
                hyperlink: item.activeURL,
                hyperlinkTitle: item.name,
              },
              children: [],
            };
            if (item.tags) {
              childNode.data.tag = item.tags;
            }
            if (item.allowGetUserInfo) {
              childNode.data.fillColor = "rgba(164, 221, 0, 1)";
              childNode.data.color = "rgba(0, 0, 0, 1)";
            }
            schemaNode.children.push(childNode);
          });
          rootNode.children.push(schemaNode);
        }
        return rootNode;
      },
      setData() {
        this.handleShowLoading();
        this.mindMap!.setData(null);
        const allSites = this.$store.state.options.system.sites.map(
          (site: Site) => {
            const { description, name, schema, tags, url } = site;
            const matchingSite = this.$store.state.options.sites.find(
              (showSite: Site) => showSite.name === site.name
            );
            return {
              description,
              name,
              schema,
              tags,
              allowGetUserInfo: matchingSite
                ? matchingSite.allowGetUserInfo
                : false,
              activeURL: matchingSite ? matchingSite.activeURL : url,
            };
          }
        );
        this.mindMap!.setData(this.generateTree(allSites));
        this.themeName = this.mindMap!.getTheme();
        this.setThemeMode(this.darkMode);
        this.mindMap!.view.reset();
      },
      handleResize() {
        this.mindMap!.resize();
      },
      handleShowLoading() {
        this.loading = true;
      },
      handleHideLoading() {
        this.loading = false;
      },
      enterFullScreen(element: any) {
        if (element.requestFullScreen) {
          element.requestFullScreen();
        } else if (element.webkitRequestFullScreen) {
          element.webkitRequestFullScreen();
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
        }
      },
      toFullscreenShow() {
        this.enterFullScreen(this.mindMap!.el);
      },
      backToRoot() {
        this.mindMap!.renderer.setRootNodeCenter();
      },
      toggleDarkMode() {
        this.darkMode = !this.darkMode;
        this.setThemeMode(this.darkMode);
      },
      setThemeMode(darkMode: boolean) {
        this.handleShowLoading();
        if (darkMode) {
          this.mindMap!.setTheme("blackHumour");
        } else {
          this.mindMap!.setTheme(this.themeName);
        }
      },
      async exportMap(type: string) {
        try {
          this.exportLoading = true;
          await this.mindMap!.export(type, true, this.$t("app.name").toString());
          this.exportLoading = false;
        } catch (error) {
          console.log("error:", error);
          this.exportLoading = false;
        }
      },
    },
  });
  </script>
  
  <style lang="scss" scoped>
  .mindMapContainer {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: calc(100vh - 64px - 32px);
  }
  .loading-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: calc(100vh - 64px - 32px);
    background-color: rgba(255, 255, 255, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 3;
    color: #000;
    .progress {
      position: relative;
    }
  }
  .toolbarContainer {
    .toolbar {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      width: -moz-max-content;
      width: max-content;
      display: flex;
      z-index: 2;
    }
    .toolbarBtn {
      display: flex;
      justify-content: center;
      flex-direction: column;
      cursor: pointer;
      margin-right: 20px;
    }
    .toolbarBlock {
      display: flex;
      border-radius: 6px;
      background-color: #fff;
      box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.06);
      margin-right: 20px;
      flex-shrink: 0;
      position: relative;
    }
  }
  .theme--dark .toolbarContainer {
    .toolbarBlock {
      background-color: #262a2e;
    }
  }
  .theme--dark .loading-wrapper {
    background-color: rgba(0, 0, 0, 0.9);
    color: #fff;
  }
  </style>