<template>
  <div class="search-torrent">
    <v-alert :value="true" type="info">{{ words.title }} [{{ key }}], {{searchMsg}} {{skipSites}}</v-alert>
    <!-- 搜索队列 -->
    <v-list small v-if="searchQueue && searchQueue.length">
      <template v-for="(item, index) in searchQueue">
        <v-list-tile :key="item.site.host">
          <v-list-tile-action>
            <v-progress-circular :size="18" :width="2" indeterminate color="primary"></v-progress-circular>
          </v-list-tile-action>

          <v-list-tile-content>
            <v-list-tile-title>
              <v-avatar size="18" class="mr-2">
                <img :src="item.site.icon">
              </v-avatar>
              {{item.site.name}} {{ words.searching }}
            </v-list-tile-title>
          </v-list-tile-content>

          <v-list-tile-action class="mr-5">
            <v-icon @click="abortSearch(item.site)" color="red" :title="words.cancelSearch">cancel</v-icon>
          </v-list-tile-action>
        </v-list-tile>
        <v-divider v-if="index + 1 < searchQueue.length" :key="'line'+item.site.host+index"></v-divider>
      </template>
    </v-list>
    <!-- 搜索结果列表 -->
    <v-card>
      <v-card-title>
        <v-flex xs6>
          <!-- 站点返回的搜索结果 -->
          <div>
            <template v-for="(item, key) in searchResult.sites">
              <v-chip
                :key="key"
                label
                color="blue-grey darken-2"
                text-color="white"
                small
                class="mr-2 py-3 pl-1"
                @click.stop="resetDatas(item)"
              >
                <v-icon class="mr-1" left v-if="key===words.allSites">public</v-icon>
                <v-avatar class="mr-1" v-else>
                  <img :src="item[0].site.icon" style="width:60%;height:60%;">
                </v-avatar>
                <span>{{ key }}</span>
                <v-chip
                  label
                  color="blue-grey"
                  small
                  text-color="white"
                  style="margin-right:-13px;"
                  class="ml-2 py-3"
                  disabled
                >
                  <span>{{ item.length }}</span>
                </v-chip>
              </v-chip>
            </template>
          </div>
          <!-- 标签列表 -->
          <div class="mt-1">
            <template v-for="(item, key) in searchResult.tags">
              <v-chip
                :key="key"
                label
                :color="item.tag.color"
                text-color="white"
                small
                class="mr-2 pl-0"
                @click.stop="resetDatas(item.items)"
              >
                <span>{{ key }}</span>
                <v-chip
                  label
                  color="blue-grey"
                  small
                  text-color="white"
                  style="margin-right:-13px;"
                  class="ml-2"
                  disabled
                >
                  <span>{{ item.items.length }}</span>
                </v-chip>
              </v-chip>
            </template>
          </div>
        </v-flex>
        <v-flex xs6>
          <v-layout align-center justify-end>
            <v-switch
              color="success"
              v-model="checkBox"
              :label="words.showCheckbox"
              style="width: 200px;flex:none;"
            ></v-switch>
            <v-btn :disabled="selected.length==0" color="success">
              <v-icon class="mr-2">cloud_download</v-icon>
              {{words.download}}
            </v-btn>
          </v-layout>
        </v-flex>
      </v-card-title>

      <!-- 数据表格 -->
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="datas"
        :pagination.sync="pagination"
        :loading="loading"
        item-key="uid"
        class="torrent"
        :select-all="checkBox"
        :rows-per-page-items="options.rowsPerPageItems"
        @update:pagination="updatePagination"
      >
        <template slot="items" slot-scope="props">
          <td v-if="checkBox">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td>
          <td class="center">
            <v-avatar size="18">
              <img :src="props.item.site.icon">
            </v-avatar>
            <br>
            <span class="captionText">{{ props.item.site.name }}</span>
          </td>
          <td class="title">
            <a
              :href="props.item.link"
              target="_blank"
              v-html="props.item.titleHTML"
              :title="props.item.title"
              rel="noopener noreferrer nofollow"
            ></a>
            <div
              class="sub-title captionText"
              v-if="props.item.tags && props.item.tags.length || props.item.subTitle"
            >
              <span class="mr-1" v-if="props.item.tags && props.item.tags.length">
                <span
                  :class="['tag', `${tag.color}`]"
                  v-for="(tag, index) in props.item.tags"
                  :key="index"
                >{{ tag.name }}</span>
              </span>
              
              <span v-if="props.item.subTitle">{{props.item.subTitle}}</span>
            </div>
          </td>
          <td class="size">{{props.item.size | formatSize}}</td>
          <!-- <td class="center">{{ props.item.comments }}</td> -->
          <td class="center">{{ props.item.seeders }}</td>
          <td class="center">{{ props.item.leechers }}</td>
          <td class="center">{{ props.item.completed }}</td>
          <!-- <td>{{ props.item.author }}</td> -->
          <td>{{ props.item.time | formatDate }}</td>
          <td>
            <v-icon
              small
              class="mr-2"
              @click="download(props.item.url, props.item.title)"
              :title="words.sendToClient"
            >cloud_download</v-icon>

            <a :href="props.item.url" target="_blank" rel="noopener noreferrer nofollow">
              <v-icon small class="mr-2" :title="words.save">get_app</v-icon>
            </a>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="haveError" top :timeout="3000" color="error">{{ errorMsg }}</v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" color="success">{{ successMsg }}</v-snackbar>
  </div>
</template>
<script lang="ts" src="./SearchTorrent.ts"></script>
<style lang="scss" src="./SearchTorrent.scss"></style>