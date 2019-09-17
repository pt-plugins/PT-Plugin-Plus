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
        <div class="subheading">{{ name }}</div>
        <div>{{ description }}</div>
      </v-card-title>

      <v-card-actions class="toolbar">
        <span class="ma-1">{{ count }}</span>
        <v-spacer></v-spacer>

        <template v-if="!readOnly">
          <template v-if="hover">
            <v-btn icon small @click.stop="rename" class="ma-0" :title="$t('common.edit')">
              <v-icon small>edit</v-icon>
            </v-btn>

            <v-btn icon small @click.stop="remove" class="ma-0" :title="$t('common.remove')">
              <v-icon small>delete</v-icon>
            </v-btn>

            <v-btn
              v-if="!isDefault"
              icon
              small
              @click.stop="setDefault"
              class="ma-0"
              :title="$t('common.setDefault')"
            >
              <v-icon small>favorite_border</v-icon>
            </v-btn>
          </template>

          <v-btn
            v-if="isDefault"
            icon
            small
            @click.stop="cancelDefault"
            class="ma-0"
            :title="$t('common.cancelDefault')"
          >
            <v-icon small>favorite</v-icon>
          </v-btn>

          <ColorSelector @change="changeColor" :dark="dark" class="ma-0" />
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

export default Vue.extend({
  components: {
    ColorSelector
  },
  props: {
    width: {
      type: [String, Number],
      default: "200px"
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
    isDefault: Boolean
  },
  data() {
    return {
      dark: true
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
    }
  }
});
</script>