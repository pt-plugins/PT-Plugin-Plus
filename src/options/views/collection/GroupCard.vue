<template>
  <v-hover>
    <v-card
      :color="color"
      slot-scope="{ hover }"
      :class="`elevation-${hover||active ? 5 : 1} mr-2`"
      :style="styles"
      @click="click"
      :dark="dark"
    >
      <v-card-title class="ma-0 pa-2">
        <div>
          <span class="subheading">{{ name }}</span>
          <span class="ml-2 caption">({{ count }})</span>
        </div>
        <div>{{ description }}</div>
      </v-card-title>

      <v-card-actions class="toolbar">
        <span class="ma-1 caption" v-if="count>0">{{ size | formatSize}}</span>
        <v-spacer></v-spacer>

        <template v-if="hover && count>0">
          <!-- 下载到 -->
          <DownloadTo
            :downloadOptions="items"
            flat
            icon
            class="mx-0 btn-mini"
            @error="onDownloadError"
            @success="onDownloadSuccess"
          />

          <!-- 复制下载链接 -->
          <v-btn
            icon
            flat
            :title="$t('searchTorrent.copyToClipboardTip')"
            @click.stop="copyLinksToClipboard"
            class="mx-0 btn-mini"
          >
            <v-icon>file_copy</v-icon>
          </v-btn>
        </template>

        <template v-if="!readOnly">
          <template v-if="hover||colorBoxIsOpen">
            <!-- 编辑 -->
            <v-btn icon @click.stop="rename" class="ma-0 btn-mini" :title="$t('common.edit')">
              <v-icon>edit</v-icon>
            </v-btn>

            <!-- 删除 -->
            <v-btn icon @click.stop="remove" class="ma-0 btn-mini" :title="$t('common.remove')">
              <v-icon>delete</v-icon>
            </v-btn>

            <!-- 颜色选择 -->
            <ColorSelector
              @change="changeColor"
              :dark="dark"
              class="ma-0"
              mini
              @show="colorBoxIsOpen=true"
              @hide="colorBoxIsOpen=false"
              :title="$t('common.color')"
            />

            <v-btn
              v-if="!isDefault"
              icon
              @click.stop="setDefault"
              class="ma-0 btn-mini"
              :title="$t('common.setDefault')"
            >
              <v-icon>favorite_border</v-icon>
            </v-btn>
          </template>

          <v-btn
            v-if="isDefault"
            icon
            @click.stop="cancelDefault"
            class="ma-0 btn-mini"
            :title="$t('common.cancelDefault')"
          >
            <v-icon>favorite</v-icon>
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-hover>
</template>
<style lang="scss" scoped>
.toolbar {
  position: absolute;
  bottom: 0;
  height: 35px;
  width: 100%;
  padding: 5px;
}
</style>
<script lang="ts">
import Vue from "vue";
import { isNumber } from "util";
import ColorSelector from "@/options/components/ColorSelector.vue";
import DownloadTo from "@/options/components/DownloadTo.vue";
import { ICollection, EAction } from "@/interface/common";
import Extension from "@/service/extension";
const extension = new Extension();

export default Vue.extend({
  components: {
    ColorSelector,
    DownloadTo
  },
  props: {
    width: {
      type: [String, Number],
      default: "205px"
    },
    height: {
      type: [String, Number],
      default: "90px"
    },
    name: String,
    description: String,
    count: {
      type: Number,
      default: 0
    },
    color: {
      type: String,
      default: "grey"
    },
    group: {
      type: Object
    },
    active: Boolean,
    readOnly: Boolean,
    isDefault: Boolean,
    items: {
      type: Array,
      default: () => {
        return [] as ICollection[];
      }
    }
  },
  data() {
    return {
      dark: true,
      colorBoxIsOpen: false
    };
  },

  watch: {
    color() {
      if (this.color.indexOf("lighten") > 0) {
        this.dark = false;
      } else {
        this.dark = true;
      }
    }
  },

  methods: {
    remove() {
      this.$emit("remove", this.group);
    },

    changeColor(color: string) {
      this.$emit("changeColor", color, this.group);
    },

    click() {
      this.$emit("click", this.group);
    },

    rename() {
      let newValue = window.prompt(
        this.$t("collection.changeGroupName").toString(),
        this.name
      );
      if (newValue && newValue !== this.name) {
        this.$emit("rename", newValue, this.group);
      }
    },

    setDefault() {
      this.$emit("setDefault", this.group);
    },

    cancelDefault() {
      this.$emit("cancelDefault", this.group);
    },

    onDownloadSuccess(msg: any) {
      console.log("onDownloadSuccess");
      this.$emit("downloadSuccess", msg);
    },

    onDownloadError(msg: any) {
      this.$emit("downloadError", msg);
    },

    copyLinksToClipboard() {
      let urls: string[] = [];

      this.items.forEach((item: any) => {
        urls.push(item.url);
      });

      extension
        .sendRequest(EAction.copyTextToClipboard, null, urls.join("\n"))
        .then(result => {
          let msg = this.$t("searchTorrent.copySelectedToClipboardSuccess", {
            count: urls.length
          }).toString();
          this.$emit("downloadSuccess", msg);
        })
        .catch(() => {
          let msg = this.$t(
            "searchTorrent.copyLinkToClipboardError"
          ).toString();
          this.$emit("downloadError", msg);
        });
    }
  },

  computed: {
    styles() {
      let result = {
        width: this.width,
        height: this.height
      };

      if (isNumber(this.width)) {
        result.width = this.width.toString() + "px";
      } else {
        result.width = this.width;
      }
      if (isNumber(this.height)) {
        result.height = this.height.toString() + "px";
      } else {
        result.height = this.height;
      }

      return result;
    },

    size() {
      let size = 0;
      if (this.items && this.items.length > 0) {
        (this.items as any).forEach((item: ICollection) => {
          if (item.size && item.size > 0) {
            size += item.size;
          }
        });
      }

      return size;
    }
  }
});
</script>