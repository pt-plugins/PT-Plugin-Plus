import { Dictionary, ERequestMethod } from "@/interface/common";
import FileSaver from "file-saver";

export type downloadFile = {
  url: string;
  fileName?: string;
  getDataOnly?: boolean;
  timeout?: number;
  method?: ERequestMethod;
};

export type downloadOptions = {
  files?: downloadFile[];
  autoStart?: boolean;
  tagIMDb?: boolean;
  onCompleted?: Function;
  onError?: Function;
  onProgress?: Function;
};

export class Downloader {
  public count: number = 0;
  public completedCount: number = 0;
  public downloadingCount: number = 0;

  private files: Dictionary<any> = {};
  private queues: any[] = [];

  constructor(public options: downloadOptions) {
    options.files &&
      options.files.forEach((item: downloadFile) => {
        this.push(item);
      });
  }

  // 添加下载
  public push(options: downloadFile) {
    if (!options.url || (options.url && this.files[options.url])) {
      return;
    }
    var file = new FileDownloader(options);

    file.onCompleted = () => {
      this.downloadingCount--;
      this.completedCount++;
      this.onCompleted(file);
      delete this.files[file.url];
    };
    file.onStart = () => {
      this.downloadingCount++;
    };
    file.onError = (e: any) => {
      this.downloadingCount--;
      this.completedCount++;
      if (this.options.onError) {
        this.options.onError.call(this, file, e);
      }
      delete this.files[file.url];
    };
    file.onProgress = (loaded: number, total: number, speed: number) => {
      if (this.options.onProgress) {
        this.options.onProgress.call(this, file, loaded, total, speed);
      }
    };
    // file.id = String.getRandomString(16);
    this.files[file.url] = file;
    this.queues.push(file);
    this.count++;
    if (this.options.autoStart) {
      file.start();
    }
  }

  public start() {}

  public onCompleted(file: FileDownloader) {
    if (this.options.onCompleted) {
      this.options.onCompleted.call(this, file);
    }
  }
}

export class FileDownloader {
  public lastTime: number = 0;
  public startTime: number = 0;
  public status: number = 0;
  public statusText: string = "";
  public url: string = "";
  public requestMethod: ERequestMethod = ERequestMethod.GET;
  public postData: any = null;
  public content: any;
  public fileName: string = "";
  public loaded: number = 0;
  public total: number = 0;
  public percent: number | string = 0;
  public speed: number = 0;
  public showSpeed: string = "";
  public onProgress: Function = function() {};
  public onCompleted: Function = function() {};
  public onError: Function = function() {};
  public onStart: Function = function() {};
  public getDataOnly: boolean = false;
  public timeout: number = 0;

  private xhr: XMLHttpRequest = new XMLHttpRequest();

  constructor(options: downloadFile) {
    this.fileName = options.fileName || "";
    this.url = options.url;
    this.getDataOnly = options.getDataOnly || false;
    this.timeout = options.timeout || 0;
    this.requestMethod = options.method || ERequestMethod.GET;
  }

  public start() {
    this.lastTime = +new Date();
    this.startTime = this.lastTime;
    this.statusText = "数据准备中……";

    if (this.timeout > 0) {
      this.xhr.timeout = this.timeout;
    }
    this.xhr.open(this.requestMethod, this.url, true);
    // 指定返回的实体类型"blob"，该类型表示可以为任意文件
    // https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest
    this.xhr.responseType = "blob";
    this.xhr.onreadystatechange = () => {
      switch (this.xhr.readyState) {
        // 下载完成 DONE
        case 4:
          switch (this.xhr.status) {
            case 200:
            case 302:
              this.content = this.xhr.response;
              this.downloadCompleted();
              break;

            default:
              if (this.xhr.status != 0) {
                this.downloadError(
                  `[${this.url}] 下载失败，返回的状态码为：${this.xhr.status}`
                );
              }

              break;
          }

          break;

        // 已获取响应头 HEADERS_RECEIVED
        case 2:
          var contentDisposition = this.xhr.getResponseHeader(
            "Content-Disposition"
          );
          // 从服务端获取文件名
          if (contentDisposition && !this.fileName && !this.getDataOnly) {
            this.fileName = this.getFileName(contentDisposition);
          }
          break;
      }
    };

    // 下载进度事件
    this.xhr.onprogress = (e: ProgressEvent) => {
      // 当前传输字节
      this.loaded = e.loaded;
      // 总字节
      this.total = e.total;
      // 当前进度（百分比）
      this.percent = (100 * (e.loaded / e.total)).toFixed(2);
      // 最后读取时间
      this.lastTime = +new Date();
      // 当前速度
      this.speed = this.loaded / (this.startTime - this.lastTime);
      this.updateProgress();
    };

    // 错误事件
    this.xhr.onerror = e => {
      this.downloadError(e);
    };

    // 超时
    this.xhr.ontimeout = () => {
      this.downloadError(`[${this.url}] 下载超时`);
    };

    var data = null;
    if (this.postData) {
      data = $.param(this.postData);
    }
    if (this.requestMethod == ERequestMethod.POST) {
      this.xhr.setRequestHeader(
        "Content-Type",
        "application/x-www-form-urlencoded"
      );
    }
    // 开始下载
    this.xhr.send(data);
    this.onStart && this.onStart.call(this);
  }

  public getFileName(contentDisposition: string = "") {
    let items = contentDisposition.split(";");
    let fields: Dictionary<any> = {};
    let result = "";

    for (let index = 0; index < items.length; index++) {
      let item = items[index];
      let tmp = item.replace(" ", "").split("=");
      if (tmp.length == 2) {
        fields[tmp[0]] = tmp[1].trim();
      }
    }
    let fileName;
    if ((fileName = fields["filename*"])) {
      let index = fileName.lastIndexOf("'");
      result = fileName.substr(index + 1);
    } else {
      result = fields["filename"];
    }

    // 替换双引号
    result = result.replace(/"/g, "");
    return decodeURI(result);
  }

  public downloadCompleted() {
    if (this.loaded > 0 && !this.getDataOnly) {
      // 保存文件
      FileSaver.saveAs(this.content, this.fileName);
    }

    if (this.onCompleted) {
      this.onCompleted.call(this);
    }
  }

  public downloadError(error: any) {
    if (this.onError) {
      this.onError.call(this, error);
    }
  }

  public updateProgress() {
    if (this.onProgress) {
      this.onProgress.call(this, this.loaded, this.total, this.speed);
    }
  }
}
