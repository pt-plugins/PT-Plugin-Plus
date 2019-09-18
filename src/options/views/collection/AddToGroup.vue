<template>
  <v-btn
    :flat="flat"
    :icon="icon"
    :small="small"
    :loading="loading"
    :color="color"
    @click.stop="showContentMenus"
  >
    <v-icon v-if="haveSuccess" color="success" small>done</v-icon>
    <v-icon v-else-if="haveError" color="red" small>close</v-icon>
    <v-icon v-else small :title="$t('collection.addToGroup')">{{ iconText }}</v-icon>
  </v-btn>
</template>
<script lang="ts">
import Vue from "vue";
import {
  Options,
  EAction,
  ICollection,
  ICollectionGroup,
  ECommonKey
} from "@/interface/common";

import { PPF } from "@/service/public";

export default Vue.extend({
  props: {
    flat: Boolean,
    icon: Boolean,
    small: Boolean,
    iconText: {
      type: String,
      default: "add"
    },
    item: {
      type: Object,
      default: () => {
        return {} as ICollection;
      }
    },
    groups: Array,
    color: {
      type: String,
      default: "success"
    }
  },

  data() {
    return {
      options: this.$store.state.options as Options,
      contentMenus: [] as any[],
      loading: false,
      haveSuccess: false,
      haveError: false
    };
  },

  methods: {
    /**
     * 显示上下文菜单
     * @param options
     * @param event
     */
    showContentMenus(event?: any) {
      let menus: any[] = [];
      let groups: string[] = PPF.clone(this.item.groups || []);
      groups.push(ECommonKey.all);
      groups.push(ECommonKey.noGroup);
      this.groups.forEach((group: any) => {
        if (group.id && group.name && !groups.includes(group.id)) {
          menus.push({
            title: group.name,
            fn: () => {
              this.$emit("add", this.item, group);
            }
          });
        }
      });

      if (menus.length == 0) {
        return;
      }

      PPF.showContextMenu(menus, event);
    },

    clearStatus() {
      this.haveSuccess = false;
      this.haveError = false;
    }
  }
});
</script>