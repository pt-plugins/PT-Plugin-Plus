<template>
  <div v-if="visible">
    <v-btn
      v-for="(item, index) in items"
      color="green lighten-3"
      small
      depressed
      class="mr-1 py-3 pr-1 pl-2"
      :href="item.link || item.url"
      target="_blank"
      :key="index"
      rel="noopener noreferrer nofollow"
    >
      <template>
        <img
          :src="`./assets/media-server/${item.icon}.svg`"
          style="width: 16px; height: 16px"
        />
        <span class="mx-1">{{ index + 1 }}</span>

        <!-- 标题 -->
        <v-chip
          label
          color="blue-grey darken-2"
          small
          text-color="white"
          class="ml-0 py-2 px-1 pr-2 chip-compact"
          style="margin-right: -1px"
          disabled
        >
          <v-icon class="mr-1" small left>dvr</v-icon>
          <span> {{ item.text }}</span>
        </v-chip>

        <!-- 时长 -->
        <v-chip
          label
          color="blue-grey"
          small
          text-color="white"
          class="py-2 px-1 pr-2 chip-compact"
          style="margin-right: -1px"
          disabled
        >
          <v-icon class="mr-1" small left>schedule</v-icon>
          <span style="text-transform: none">{{ item.runTime }}</span>
        </v-chip>

        <!-- 封装格式 -->
        <v-chip
          label
          color="blue-grey"
          small
          text-color="white"
          class="py-2 px-1 pr-2 chip-compact"
          style="margin-right: -1px"
          disabled
          :title="item.path"
        >
          <v-icon class="mr-1" small left>aspect_ratio</v-icon>
          <span>{{ item.container }}</span>
        </v-chip>

        <!-- 视频分辨率 -->
        <v-chip
          label
          color="blue-grey"
          small
          text-color="white"
          class="py-2 px-1 pr-2 chip-compact"
          style="margin-right: -1px"
          disabled
        >
          <v-icon class="mr-1" small left>movie</v-icon>
          <span>{{ item.media.video }}</span>
        </v-chip>

        <!-- 音频 -->
        <v-chip
          label
          color="blue-grey"
          small
          text-color="white"
          class="py-2 px-1 pr-2 chip-compact"
          style="margin-right: -1px"
          disabled
          :title="item.media.audios.join('\n')"
        >
          <v-icon class="mr-1" small left>graphic_eq</v-icon>
          <span>{{ item.media.audio }}</span>
        </v-chip>

        <!-- 字幕 -->
        <v-chip
          label
          color="blue-grey"
          small
          text-color="white"
          class="py-2 px-1 pr-2 mr-0 chip-compact"
          disabled
          :title="item.media.subtitles.join('\n')"
        >
          <v-icon class="mr-1" small left>closed_caption_off</v-icon>
          <span>{{ item.media.subtitle }}</span>
        </v-chip>
      </template>
    </v-btn>
  </div>
</template>
<script lang="ts">
import Vue from "vue";

import Extension from "@/service/extension";
import { EAction } from "@/interface/enum";
import { IMediaServer } from "@/interface/common";
import { filters } from "@/service/filters";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);
const extension = new Extension();

export default Vue.extend({
  props: {
    IMDbId: String
  },
  data() {
    return {
      visible: false,
      items: [] as any
    };
  },
  watch: {
    IMDbId() {
      this.reset();
    }
  },
  created() {
    this.reset();
  },
  methods: {
    reset() {
      this.visible = false;

      console.log(this.IMDbId);
      if (this.IMDbId) {
        this.visible = true;
        this.getMediaFromMediaServers();
      }
    },

    /**
     * 从已定义的媒体服务器获取信息
     */
    getMediaFromMediaServers() {
      this.items = [];
      try {
        this.$store.state.options.mediaServers?.forEach(async (server: IMediaServer) => {
          if (!server.enabled) {
            return;
          }
          const result = await extension.sendRequest(EAction.getMediaFromMediaServer, null, {
            server,
            imdbId: this.IMDbId
          });
          console.debug('result', result)
          if (result && result.Items) {
            let address = server.address;
            if (address.slice(-1) != '/') {
              address += '/'
            }
            result.Items.forEach((item: any) => {
              let texts = [];
              // 名称
              texts.push(item.Name);
              // 大小
              texts.push(filters.formatSize(item.Size).replace('iB', ''));

              let media = {
                video: '',
                audio: 0,
                audios: [] as string[],
                subtitle: 0,
                subtitles: [] as string[]
              }
              if (item.MediaSources) {
                item.MediaSources.forEach((MediaSource: any) => {
                  MediaSource.MediaStreams?.forEach((MediaStream: any) => {
                    if (MediaStream.Type == 'Video' && !media.video) {
                      media.video = MediaStream.DisplayTitle;
                    }

                    if (MediaStream.Type == 'Audio') {
                      media.audio++;
                      media.audios.push(MediaStream.DisplayTitle + ' ' + (MediaStream.Title || ''));
                    }

                    if (MediaStream.Type == 'Subtitle') {
                      media.subtitle++;
                      media.subtitles.push(MediaStream.DisplayTitle + ' ' + (MediaStream.Title || ''));
                    }
                  });
                });
              }

              this.items.push({
                url: `${address}web/index.html#!/item?id=${item.Id}&serverId=${item.ServerId}`,
                text: texts.join(' '),
                media: media,
                path: item.Path,
                container: item.Container,
                runTime: this.formatRunTimeTicks(item.RunTimeTicks),
                icon: server.type.toLowerCase()
              });
            });

          }
        });
      } catch (error) {

      }
    },

    formatRunTimeTicks(runTimeTicks: number) {
      const totalSeconds = runTimeTicks / 10_000_000;
      return dayjs.duration(totalSeconds, "seconds").format("H[h] m[m]");
    }
  },
  computed: {
  }
});
</script>

<style lang="scss" scoped></style>
