import * as fs from "fs";
import * as archiver from "archiver";
import * as crx3 from "crx3";
import * as PATH from "path";
import * as ChromeExtension from "crx";

const version = `v${process.env.npm_package_version}`;
const packageName = `${process.env.npm_package_archiverName}-${version}`;

export default class Package {
  private zipFile = "";
  private crxFile = "";
  private rootPath = PATH.join(__dirname, "../");
  private crxURL = `https://github.com/ronggang/PT-Plugin-Plus/releases/download/${version}/${packageName}.crx`;
  private updateURL =
    "https://raw.githubusercontent.com/ronggang/PT-Plugin-Plus/master/update/index.xml";
  private manifestFile = "";

  constructor() {
    this.zipFile = PATH.join(this.rootPath, `releases/${packageName}.zip`);
    this.crxFile = PATH.join(this.rootPath, `releases/${packageName}.crx`);
    this.manifestFile = PATH.join(this.rootPath, "dist/manifest.json");
  }

  public start(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.updateManifestFile();
      this.zip().then(() => {
        this.updateManifestFile(false);
        this.crx().then(() => {
          resolve(this.zipFile);
        });
      });
    });
  }

  /**
   * 更新 manifest 文件，增加 update_url 已适配 crx 自动更新
   */
  public updateManifestFile(isZip: boolean = true) {
    let content = JSON.parse(fs.readFileSync(this.manifestFile).toString());
    if (isZip && content.update_url) {
      delete content.update_url;
    } else {
      content.update_url = this.updateURL;
    }

    fs.writeFileSync(this.manifestFile, JSON.stringify(content));
  }

  /**
   * 打包
   */
  public zip(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      console.log("正要准备打包……");
      const output = fs.createWriteStream(this.zipFile);
      const zip = archiver("zip", {
        zlib: { level: 9 }
      });

      output.on("close", () => {
        console.log("打包完成 %s", this.zipFile);
        resolve(this.zipFile);
      });

      zip.pipe(output);

      // 打包 dist 目录
      zip.directory(PATH.join(this.rootPath, "dist"), false);

      zip.finalize().catch(error => {
        reject(error);
      });
    });
  }

  /**
   * 打包 crx
   * 该方法打包时，可根据 minimum_chrome_version 来设置最低版本要求
   * 除 Google Chrome 浏览器外其他 Chromium 内核的浏览器版本不相同，故暂时采用该方法
   */
  public crx(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      const crx = new ChromeExtension({
        codebase: this.crxURL,
        privateKey: fs.readFileSync(
          PATH.join(this.rootPath, "releases/key.pem")
        )
      });

      crx
        .load(PATH.join(this.rootPath, "dist"))
        .then(crx => crx.pack())
        .then(crxBuffer => {
          const updateXML = crx.generateUpdateXML();

          fs.writeFileSync(
            PATH.join(this.rootPath, "update/index.xml"),
            updateXML
          );
          fs.writeFileSync(this.crxFile, crxBuffer);

          console.log("打包完成 %s", this.crxFile);
          resolve(this.crxFile);
        })
        .catch(err => {
          console.error(err);
          reject(err);
        });
    });
  }

  /**
   * 打包 crx3
   * 该方法打包时，会将 prodversionmin 限定为最低 '64.0.3242' ，会导致其他浏览器因版本问题无法更新
   */
  public crx3(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      console.log("正在打包 crx");
      crx3([PATH.join(this.rootPath, "dist/manifest.json")], {
        keyPath: PATH.join(this.rootPath, "releases/key.pem"),
        crxPath: this.crxFile,
        zipPath: this.zipFile,
        xmlPath: PATH.join(this.rootPath, "update/index.xml"),
        crxURL: this.crxURL
      })
        .then(() => {
          console.log("打包完成 %s", this.crxFile);
          resolve(this.crxFile);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}
