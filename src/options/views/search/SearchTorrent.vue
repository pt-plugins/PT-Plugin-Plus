<template>
  <div class="search-torrent">
    <MovieInfoCard
      :IMDbId="IMDbId"
      :doubanId="searchPayload.doubanId"
      v-if="!!options.showMoiveInfoCardOnSearch"
    />
    <v-alert :value="true" type="info" style="padding:8px 16px;">
      {{ $t("searchTorrent.title") }} [{{ key }}], {{ searchMsg }}
      {{ skipSites }}
      <v-btn
        flat
        icon
        small
        color="white"
        @click.stop="doSearch(searchPayload)"
        :title="$t('searchTorrent.reSearch')"
        v-if="!loading && key != ''"
      >
        <v-icon>cached</v-icon>
      </v-btn>

      <!-- 无结果的站点 -->
      <v-btn
        v-if="searchResult.noResultsSites.length > 0"
        class="mt-1"
        flat
        small
        color="white"
        @click.stop="showNoResultsSites = !showNoResultsSites"
      >
        <v-icon small class="mr-1" color="grey darken-2">face</v-icon>
        {{ $t("searchTorrent.noResultsSites") }}
        {{ searchResult.noResultsSites.length }}
      </v-btn>

      <!-- 失败的站点 -->
      <v-btn
        v-if="searchResult.failedSites.length > 0"
        class="mt-1"
        flat
        small
        color="white"
        @click.stop="showFailedSites = !showFailedSites"
      >
        <v-icon small class="mr-1" color="orange">warning</v-icon>
        {{ $t("searchTorrent.failedSites") }}
        {{ searchResult.failedSites.length }}
      </v-btn>

      <v-btn
        v-if="searchResult.failedSites.length > 0 && showFailedSites"
        class="mt-1"
        flat
        small
        color="white"
        @click.stop="reSearchFailedSites"
      >
        <v-icon small class="mr-1">autorenew</v-icon>
        {{ $t("searchTorrent.reSearchFailedSites") }}
      </v-btn>
    </v-alert>
    <!-- 搜索队列-->
    <v-list small v-if="searchQueue && searchQueue.length">
      <template v-for="(item, index) in searchQueue">
        <v-list-tile :key="item.site.host">
          <v-list-tile-action>
            <v-progress-circular :size="18" :width="2" indeterminate color="primary"></v-progress-circular>
          </v-list-tile-action>

          <v-list-tile-content>
            <v-list-tile-title>
              <v-avatar size="18" class="mr-2">
                <img :src="item.site.icon" />
              </v-avatar>
              {{ item.site.name }} {{ $t("searchTorrent.searching") }}
            </v-list-tile-title>
          </v-list-tile-content>

          <v-list-tile-action class="mr-5">
            <v-icon
              @click="abortSearch(item.site)"
              color="red"
              :title="$t('searchTorrent.cancelSearch')"
            >cancel</v-icon>
          </v-list-tile-action>
        </v-list-tile>
        <v-divider v-if="index + 1 < searchQueue.length" :key="'line' + item.site.host + index"></v-divider>
      </template>
    </v-list>

    <!-- 搜索结果列表 -->
    <v-card>
      <v-card-title style="padding: 0 5px 0 3px;">
        <v-flex xs12>
          <!-- 站点返回的搜索结果 -->
          <div v-if="searchSiteCount > 1">
            <template v-for="(item, key) in searchResult.sites">
              <v-chip
                :key="key"
                label
                :color="item.length ? 'blue-grey darken-2' : 'grey'"
                text-color="white"
                small
                class="mr-1 py-3 pl-1"
                @click.stop="resetDatas(item)"
                :disabled="!item.length"
              >
                <v-icon class="mr-1" left v-if="key === allSitesKey">public</v-icon>
                <template v-else>
                  <v-avatar class="mr-1" v-if="item.length > 0">
                    <img :src="item[0].site.icon" style="width:60%;height:60%;" />
                  </v-avatar>
                  <v-avatar class="mr-1" v-else>
                    <img :src="item.site.icon" style="width:60%;height:60%;" />
                  </v-avatar>
                </template>
                <span>
                  {{
                  key === allSitesKey ? $t("searchTorrent.allSites") : key
                  }}
                </span>
                <v-chip
                  label
                  :color="item.length ? 'blue-grey' : 'grey'"
                  small
                  text-color="white"
                  style="margin-right:-13px;"
                  class="ml-2 py-3"
                  disabled
                >
                  <span>{{ item.length || item.msg }}</span>
                </v-chip>
              </v-chip>
            </template>
          </div>

          <!-- 无结果的站点 -->
          <div v-if="searchResult.noResultsSites.length > 0 && showNoResultsSites">
            <template v-for="(item, index) in searchResult.noResultsSites">
              <v-chip
                :key="index"
                label
                color="grey darken-1"
                text-color="white"
                small
                class="mr-1 py-3 pl-1"
                disabled
              >
                <template>
                  <v-avatar class="mr-1">
                    <img :src="item.site.icon" style="width:60%;height:60%;" />
                  </v-avatar>
                </template>
                <a
                  v-if="item.site.activeURL || item.site.url"
                  :href="item.site.activeURL || item.site.url"
                  rel="noopener noreferrer nofollow"
                  target="_blank"
                >{{ item.site.name }}</a>
                <span v-else>{{ item.site.name }}</span>
                <v-chip
                  label
                  color="grey"
                  small
                  text-color="white"
                  style="margin-right:-13px;"
                  class="ml-2 py-3 chip-compact"
                  disabled
                >
                  <span>{{ item.msg }}</span>

                  <v-btn
                    flat
                    icon
                    small
                    color="grey lighten-2"
                    @click.stop="reSearchWithSite(item.site.host)"
                    :title="$t('searchTorrent.reSearch')"
                  >
                    <v-icon small>refresh</v-icon>
                  </v-btn>
                </v-chip>
              </v-chip>
            </template>
          </div>

          <!-- 站点返回的失败的站点 -->
          <div v-if="searchResult.failedSites.length > 0 && showFailedSites">
            <template v-for="(item, index) in searchResult.failedSites">
              <v-chip
                :key="index"
                label
                color="orange darken-3"
                text-color="white"
                small
                class="mr-1 py-3 pl-1"
                disabled
              >
                <template>
                  <v-avatar class="mr-1">
                    <img :src="item.site.icon" style="width:60%;height:60%;" />
                  </v-avatar>
                </template>
                <span>{{ item.site.name }}</span>
                <v-chip
                  label
                  :color="item.color"
                  small
                  text-color="white"
                  style="margin-right:-13px;"
                  class="ml-2 py-3"
                  disabled
                >
                  <a
                    v-if="item.url"
                    :href="item.url"
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                  >{{ item.msg }}</a>
                  <span v-if="!item.url">{{ item.msg }}</span>

                  <v-btn
                    flat
                    icon
                    small
                    color="grey lighten-2"
                    @click.stop="reSearchWithSite(item.site.host)"
                    :title="$t('searchTorrent.reSearch')"
                  >
                    <v-icon small>refresh</v-icon>
                  </v-btn>
                </v-chip>
              </v-chip>
            </template>
          </div>
        </v-flex>
        <v-flex xs6>
          <!-- 标签列表 -->
          <div class="mt-1">
            <template v-for="(item, key) in searchResult.tags">
              <v-chip
                :key="key"
                label
                :color="item.tag.color"
                text-color="white"
                small
                class="mr-1 pl-0"
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
          <!-- 分类列表 -->
          <div class="mt-1" v-if="showCategory">
            <template v-for="(item, key) in searchResult.categories">
              <v-chip
                :key="key"
                label
                color="grey darken-1"
                text-color="white"
                small
                class="mr-1 pl-0"
                @click.stop="resetDatas(item.items)"
              >
                <span>{{ key }}</span>
                <v-chip
                  label
                  color="grey"
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
          <div>
            <v-text-field
              v-model="filterKey"
              append-icon="search"
              :label="$t('searchTorrent.filterSearchResults')"
              single-line
              hide-details
              enterkeyhint="search"
            ></v-text-field>
          </div>
        </v-flex>
      </v-card-title>

      <!-- 操作按钮列表 -->
      <div ref="divToolbar" id="divToolbar">
        <div v-show="toolbarIsFixed" id="divToobarHeight"></div>
        <div id="divToobarInner" :class="toolbarClass">
          <!-- 排序，小屏幕显示 -->
          <div v-if="$vuetify.breakpoint.smAndDown" style="display: inline-flex;">
            <v-flex xs6 class="px-2" style="height: 50px;">
              <v-select
                :items="orderHeaders"
                :label="$t('common.orderBy')"
                v-model="pagination.sortBy"
              ></v-select>
            </v-flex>
            <v-flex xs6 class="px-0" style="height: 50px;">
              <v-radio-group v-model="currentOrderMode" row>
                <v-radio
                  class="mr-2"
                  v-for="(item, index) in orderMode"
                  :key="index"
                  :label="item.text"
                  :value="item.value"
                ></v-radio>
              </v-radio-group>
            </v-flex>
          </div>

          <div style="display: inline-flex;overflow-x:auto;width: 100%;overflow-y:hidden;">
            <!-- 行选择框，当工具栏被固定时显示 -->
            <v-checkbox
              v-show="checkBox && toolbarIsFixed"
              :indeterminate="indeterminate"
              style="margin: 8px 0 0 3px;padding: 0;height: 32px;flex: unset;"
              @click.stop="toggleAll"
              :value="selected.length > 0 && selected.length == datas.length"
            ></v-checkbox>
            <template v-if="selected.length > 0">
              <!-- 发送到下载服务器 -->
              <v-btn
                :disabled="selected.length == 0"
                color="success"
                small
                :title="$t('searchTorrent.sendToClientTip')"
                @click.stop="showAllContentMenus($event)"
                :class="$vuetify.breakpoint.smAndUp ? '' : 'mini'"
              >
                <v-icon small>cloud_download</v-icon>
                <span class="ml-2" v-if="$vuetify.breakpoint.smAndUp">
                  {{ $t("searchTorrent.sendToClient") }} ({{
                  selected.length
                  }})
                </span>
                <span class="ml-2" v-else>{{ selected.length }}</span>
                <span class="ml-1">{{ selectedSize | formatSize }}</span>
              </v-btn>

              <!-- 文件发送进度 -->
              <v-progress-circular
                v-if="sending.count > 0"
                :rotate="-90"
                :size="60"
                :width="10"
                :value="sending.progress"
                color="primary"
              >{{ sending.progress.toFixed(0) }}%</v-progress-circular>

              <!-- 复制下载链接 -->
              <v-btn
                :disabled="selected.length == 0"
                color="success"
                small
                :title="$t('searchTorrent.copyToClipboardTip')"
                @click="copySelectedToClipboard()"
                :class="$vuetify.breakpoint.smAndUp ? '' : 'mini'"
              >
                <v-icon small>file_copy</v-icon>
                <span class="ml-2" v-if="$vuetify.breakpoint.smAndUp">
                  {{ $t("searchTorrent.copyToClipboard") }} ({{
                  selected.length
                  }})
                </span>
                <span class="ml-2" v-else>{{ selected.length }}</span>
              </v-btn>

              <!-- 保存种子文件 -->
              <v-btn
                :disabled="selected.length == 0"
                @click="downloadSelected"
                color="success"
                small
                :title="$t('searchTorrent.saveTip')"
                v-if="$vuetify.breakpoint.mdAndUp"
              >
                <v-icon class="mr-2" small>save</v-icon>
                {{ $t("searchTorrent.save") }} ({{ selected.length }})
              </v-btn>
              <!-- 文件下载进度 -->
              <v-progress-circular
                v-if="downloading.count > 0"
                :rotate="-90"
                :size="60"
                :width="10"
                :value="downloading.progress"
                color="primary"
              >{{ downloading.progress.toFixed(0) }}%</v-progress-circular>

              <!-- 下载失败的种子 -->
              <v-btn
                v-if="downloadFailedTorrents.length > 0"
                class="error"
                @click="reDownloadFailedTorrents"
                small
                :title="$t('searchTorrent.downloadFailed')"
                :loading="downloading.count > 0"
              >
                <v-icon class="mr-2" small>get_app</v-icon>
                {{ $t("searchTorrent.downloadFailed") }} ({{
                downloadFailedTorrents.length
                }})
              </v-btn>

              <!-- 添加到收藏 -->
              <AddToCollectionGroup
                :disabled="selected.length == 0"
                :label="
                  $vuetify.breakpoint.smAndUp
                    ? $t('searchTorrent.collection') + ` (${selected.length})`
                    : selected.length
                "
                @add="addSelectedToCollection"
                small
              />

              <!-- 辅种 -->
              <KeepUpload
                :items="selected"
                :label="
                  $vuetify.breakpoint.smAndUp
                    ? `${$t('keepUploadTask.keepUpload')} (${selected.length})`
                    : selected.length
                "
                color="success"
              />
            </template>

            <!-- 保存搜索结果快照 -->
            <v-btn
              v-if="$store.state.options.allowSaveSnapshot"
              :loading="loading"
              color="cyan"
              small
              dark
              :title="$t('searchResultSnapshot.create')"
              @click.stop="createSearchResultSnapshot()"
              :class="$vuetify.breakpoint.smAndUp ? '' : 'mini'"
            >
              <v-icon small>add_a_photo</v-icon>
              <span class="ml-2" v-if="$vuetify.breakpoint.smAndUp">
                {{
                $t("searchResultSnapshot.create")
                }}
              </span>
            </v-btn>

            <!-- 设置 -->
            <v-menu :close-on-content-click="false" offset-y class="ml-2">
              <template v-slot:activator="{ on }">
                <v-btn
                  color="blue"
                  dark
                  v-on="on"
                  :title="$t('home.settings')"
                  small
                  :class="$vuetify.breakpoint.smAndUp ? '' : 'mini'"
                >
                  <v-icon small>settings</v-icon>
                </v-btn>
              </template>

              <v-card>
                <v-container grid-list-xs>
                  <!-- 显示多选框 -->
                  <v-switch
                    color="success"
                    v-model="checkBox"
                    :label="$t('searchTorrent.showCheckbox')"
                    @change="updateViewOptions"
                  ></v-switch>
                  <!-- 显示资源分类标签 -->
                  <v-switch
                    color="success"
                    v-model="showCategory"
                    :label="$t('searchTorrent.showCategory')"
                    @change="updateViewOptions"
                  ></v-switch>
                </v-container>
              </v-card>
            </v-menu>
          </div>
        </div>
      </div>

      <!-- 数据表格 -->
      <v-data-table
        v-model="selected"
        :search="filterKey"
        :custom-filter="searchResultFilter"
        :headers="headers"
        :items="datas"
        :pagination.sync="pagination"
        :loading="loading"
        item-key="link"
        :class="
          'torrent' +
            (fixedTable ? ' fixed-table fixed-header v-table__overflow' : '')
        "
        :select-all="checkBox"
        :rows-per-page-items="options.rowsPerPageItems"
      >
        <!-- 表头内容 -->
        <template v-slot:headers="props">
          <tr>
            <th v-if="checkBox">
              <v-checkbox
                :input-value="props.all"
                :indeterminate="props.indeterminate"
                primary
                hide-details
                @click.stop="toggleAll"
              ></v-checkbox>
            </th>
            <template v-for="header in props.headers">
              <th
                v-if="header.visible"
                :key="header.text"
                :class="getHeaderClass(header)"
                @click="header.sortable !== false && changeSort(header.value)"
                :style="header.width ? `width:${header.width};` : ''"
              >
                <v-icon small v-if="header.sortable !== false">arrow_upward</v-icon>
                {{ header.text }}
              </th>
            </template>
          </tr>
        </template>

        <!-- 表格内容 -->
        <template slot="items" slot-scope="props">
          <td v-if="checkBox">
            <v-checkbox
              v-model="props.selected"
              primary
              hide-details
              @change="shiftCheck($event, props.index)"
            ></v-checkbox>
          </td>
          <!-- 站点 -->
          <td class="center" v-if="$vuetify.breakpoint.mdAndUp">
            <v-avatar size="18">
              <img :src="props.item.site.icon" />
            </v-avatar>
            <template v-if="$vuetify.breakpoint.width > 1200">
              <br />
              <a
                :href="props.item.site.activeURL || props.item.site.url"
                target="_blank"
                v-html="props.item.site.name"
                rel="noopener noreferrer nofollow"
                class="captionText"
              ></a>
            </template>
          </td>
          <!-- 标题 -->
          <td :class="$vuetify.breakpoint.xs ? 'titleCell-mobile' : 'titleCell'">
            <v-avatar
              size="14"
              class="mr-1"
              style="vertical-align: unset;"
              v-if="$vuetify.breakpoint.smAndDown"
            >
              <img :src="props.item.site.icon" />
            </v-avatar>
            <a
              :href="props.item.link"
              target="_blank"
              v-html="props.item.titleHTML"
              :title="props.item.title"
              rel="noopener noreferrer nofollow"
              :class="[
                $vuetify.breakpoint.xs ? 'body-2' : 'subheading',
                'font-weight-medium',
              ]"
            ></a>
            <div
              class="sub-title captionText"
              v-if="
                (props.item.tags && props.item.tags.length) ||
                  props.item.subTitle
              "
            >
              <span class="mr-1" v-if="props.item.tags && props.item.tags.length">
                <span
                  :class="['tag', `${tag.color}`]"
                  :style="{'background-color':`${tag.color}`,'border-color':`${tag.color}`}"
                  v-for="(tag, index) in props.item.tags"
                  :key="index"
                  :title="tag.title"
                >{{ tag.name }}</span>
              </span>

              <span v-if="props.item.subTitle" :title="props.item.subTitle">{{ props.item.subTitle }}</span>
            </div>

            <v-layout v-if="$vuetify.breakpoint.xs">
              <v-flex xs3 class="pt-2 captionText">
                {{
                props.item.size | formatSize
                }}
              </v-flex>
              <v-flex xs3 class="pt-2 captionText">
                <v-icon style="font-size:12px;margin-bottom: 2px;">arrow_upward</v-icon>
                {{ props.item.seeders }}
                <v-icon style="font-size:12px;margin-bottom: 2px;">arrow_downward</v-icon>
                {{ props.item.leechers }}
              </v-flex>
              <v-flex xs3>
                <!-- 进度条 -->
                <TorrentProgress
                  class="progress"
                  style="position: unset; padding-top:2px;"
                  v-if="props.item.progress != null"
                  :progress="parseInt(props.item.progress)"
                  :status="props.item.status"
                ></TorrentProgress>
              </v-flex>

              <v-flex xs3>
                <!-- 工具栏 -->
                <Actions
                  v-if="$vuetify.breakpoint.xs"
                  :url="props.item.url"
                  :downloadMethod="props.item.site.downloadMethod"
                  :isCollectioned="isCollectioned(props.item.link)"
                  :item="props.item"
                  @copyLinkToClipboard="copyLinkToClipboard(props.item.url)"
                  @saveTorrentFile="saveTorrentFile(props.item)"
                  @addToCollection="addToCollection(props.item)"
                  @deleteCollection="deleteCollection(props.item)"
                  @downloadSuccess="downloadSuccess"
                  @downloadError="downloadError"
                />
              </v-flex>
            </v-layout>
          </td>
          <!-- 分类 -->
          <td class="category center" v-if="$vuetify.breakpoint.width > 1200">
            <span
              v-if="props.item.category && !!props.item.category.name"
              :title="props.item.category.name"
              class="captionText"
            >{{ props.item.category.name }}</span>
            <br />
            <span class="captionText">&lt;{{ props.item.entryName }}&gt;</span>
          </td>
          <td class="size" v-if="$vuetify.breakpoint.smAndUp">
            {{ props.item.size | formatSize }}
            <TorrentProgress
              class="progress"
              v-if="props.item.progress != null"
              :progress="parseInt(props.item.progress)"
              :status="props.item.status"
            ></TorrentProgress>
          </td>
          <td class="size" v-if="$vuetify.breakpoint.smAndUp">{{ props.item.seeders }}</td>
          <td class="size" v-if="$vuetify.breakpoint.mdAndUp">{{ props.item.leechers }}</td>
          <td class="size" v-if="$vuetify.breakpoint.mdAndUp">{{ props.item.completed }}</td>
          <td class="size" v-if="$vuetify.breakpoint.smAndUp">{{ props.item.comments }}</td>
          <!-- <td>{{ props.item.author }}</td> -->
          <td v-if="$vuetify.breakpoint.mdAndUp">{{ props.item.time | formatDate }}</td>
          <td class="text-xs-center" v-if="$vuetify.breakpoint.smAndUp">
            <template v-if="!!props.item.url">
              <Actions
                :url="props.item.url"
                :downloadMethod="props.item.site.downloadMethod"
                :isCollectioned="isCollectioned(props.item.link)"
                :item="props.item"
                @copyLinkToClipboard="copyLinkToClipboard(props.item.url)"
                @saveTorrentFile="saveTorrentFile(props.item)"
                @addToCollection="addToCollection(props.item)"
                @deleteCollection="deleteCollection(props.item)"
                @downloadSuccess="downloadSuccess"
                @downloadError="downloadError"
              />
            </template>
            <span v-else>{{ $t("searchTorrent.failUrl") }}</span>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="haveError" top :timeout="3000" multi-line color="error">
      <div v-html="errorMsg"></div>
    </v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" multi-line color="success">
      <div v-html="successMsg"></div>
    </v-snackbar>
  </div>
</template>
<script lang="ts" src="./SearchTorrent.ts"></script>
<style lang="scss" src="./SearchTorrent.scss"></style>
