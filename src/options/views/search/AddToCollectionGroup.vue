<template>
  <v-btn
    :flat="flat"
    :icon="icon"
    :small="small"
    :loading="loading"
    :color="color"
    :disabled="disabled"
    @click.stop="showContentMenus"
    :class="$vuetify.breakpoint.smAndUp?'':'mini'"
    :title="$t('collection.add')"
    :dark="dark"
  >
    <v-icon v-if="haveSuccess" color="success" small>done</v-icon>
    <v-icon v-else-if="haveError" color="red" small>close</v-icon>
    <v-icon v-else small>{{ iconText }}</v-icon>
    <span class="ml-2">{{ label }}</span>
  </v-btn>
</template>
<script lang="ts">
import Vue from "vue";
import {
  Options,
  EAction,
  ICollection,
  ICollectionGroup,
  ECommonKey,
  BASE_COLORS
} from "@/interface/common";

import { PPF } from "@/service/public";
import Extension from "@/service/extension";
const extension = new Extension();

export default Vue.extend({
  props: {
    flat: Boolean,
    icon: Boolean,
    small: Boolean,
    dark: Boolean,
    iconText: {
      type: String,
      default: "favorite_border"
    },

    color: {
      type: String,
      default: "success"
    },
    label: {
      type: String,
      default: ""
    },

    disabled: Boolean
  },

  data() {
    return {
      options: this.$store.state.options as Options,
      contentMenus: [] as any[],
      loading: false,
      haveSuccess: false,
      haveError: false,
      groups: [] as ICollectionGroup[]
    };
  },

  methods: {
    /**
     * 显示上下文菜单
     * @param options
     * @param event
     */
    showContentMenus(event?: any) {
      extension.sendRequest(EAction.getTorrentCollectionGroups).then(result => {
        this.groups = result;
        let menus: any[] = [];

        this.groups.forEach((group: any) => {
          menus.push({
            title: group.name,
            fn: () => {
              this.$emit("add", group);
            }
          });
        });

        menus.push({});
        menus.push({
          title: this.$t("collection.addGroup"),
          fn: () => {
            this.createGroup();
          }
        });

        PPF.showContextMenu(menus, event);
      });
    },

    createGroup() {
      let name = window.prompt(this.$t("collection.inputGroupName").toString());
      if (name) {
        extension
          .sendRequest(EAction.addTorrentCollectionGroup, null, {
            name,
            color: BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)]
          })
          .then(result => {
            if (result) {
              this.$emit("add", result[result.length - 1]);
            }
          });
      }
    },

    clearStatus() {
      this.haveSuccess = false;
      this.haveError = false;
    }
  }
});
</script>