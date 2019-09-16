<template>
  <v-card :color="color" class="mr-2" :style="styles" @click="click" :dark="dark">
    <v-card-title>
      <div>
        <div class="title" @click="rename">{{ name }}</div>
        <span>{{ description }}</span>
      </div>
    </v-card-title>
    <v-card-actions>
      <span>{{ count }}</span>
      <v-spacer></v-spacer>

      <template v-if="!!group.id">
        <ColorSelector @change="changeColor" :dark="dark" />

        <v-btn icon small @click.stop="remove">
          <v-icon small>delete</v-icon>
        </v-btn>
      </template>
    </v-card-actions>
  </v-card>
</template>
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
    }
  },
  data() {
    return {
      styles: {
        width: "200px",
        height: "90px"
      },
      dark: true
    };
  },

  watch: {
    width() {
      if (isNumber(this.width)) {
        this.styles.width = this.width.toString() + "px";
      } else {
        this.styles.width = this.width;
      }
    },

    height() {
      if (isNumber(this.height)) {
        this.styles.height = this.height.toString() + "px";
      } else {
        this.styles.height = this.height;
      }
    },

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
    }
  }
});
</script>