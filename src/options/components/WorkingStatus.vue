<template>
  <div v-if="working">
    <v-list>
      <v-list-tile v-for="(item, index) in items" :key="index">
        <v-list-tile-action>
          <v-btn flat icon :loading="item.status=='loading'">
            <v-icon :color="getColor(item)">{{getIcon(item)}}</v-icon>
          </v-btn>
        </v-list-tile-action>

        <v-list-tile-content>
          <v-list-tile-title v-text="item.title"></v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { IWorkingStatusItem, EWorkingStatus } from "@/interface/common";

export default Vue.extend({
  props: {
    timeout: {
      type: Number,
      default: 5000
    }
  },

  data() {
    return {
      items: [] as IWorkingStatusItem[],
      working: true
    };
  },

  watch: {
    items: {
      handler() {
        this.change();
      },
      deep: true
    }
  },

  methods: {
    add(item: IWorkingStatusItem) {
      item.status = EWorkingStatus.loading;
      this.items.push(item);
    },

    update(key: string, status: EWorkingStatus) {
      let index = this.items.findIndex((_: IWorkingStatusItem) => {
        return _.key === key;
      });

      if (index != -1) {
        this.items[index].status = status;
      }
    },

    clear() {
      this.items = [];
    },

    change() {
      if (!this.items) {
        this.working = false;
        return;
      }

      if (this.items.length == 0) {
        this.working = false;
        return;
      }
      let workingCount = 0;
      this.items.forEach((item: IWorkingStatusItem) => {
        if (item.status === EWorkingStatus.loading) {
          workingCount++;
        }
      });

      if (workingCount > 0) {
        this.working = true;
      } else {
        setTimeout(() => {
          this.working = false;
        }, this.timeout);
      }
    },

    getColor(item: IWorkingStatusItem) {
      switch (item.status) {
        case EWorkingStatus.success:
        case EWorkingStatus.error:
          return item.status;

        default:
          return "info";
      }
    },

    getIcon(item: IWorkingStatusItem) {
      switch (item.status) {
        case EWorkingStatus.success:
          return "check";

        case EWorkingStatus.error:
          return "close";

        default:
          return "refresh";
      }
    }
  }
});
</script>