import * as FS from "fs";
import * as PATH from "path";

export type Dictionary<T> = { [key: string]: T };

export default function buildResource() {
    const resourcePath = PATH.resolve(__dirname, '..', './dist/resource');
    const resourceMap = ["sites", "schemas", "clients", "publicSites"];

    /**
     * 创建资源文件列表
     */
    function buildResource() {
        FS.writeFileSync(PATH.join(resourcePath, `systemConfig.json`), JSON.stringify(getSystemConfig()));
        FS.writeFileSync(PATH.join(resourcePath, `i18n.json`), JSON.stringify(geti18n()));
    }

    /**
     * 获取系统配置信息
     */
    function getSystemConfig() {
        const result = {};
        resourceMap.forEach((name: string) => {
            result[name] = getResourceConfig(name);
        });

        return result;
    }

    /**
     * 获取指定的资源配置信息
     * @param name
     */
    function getResourceConfig(name: string): any {
        const parentFolder = PATH.join(resourcePath, name);
        const list = FS.readdirSync(parentFolder);

        const results: any[] = [];
        list.forEach((path: string) => {
            const _path = PATH.join(parentFolder, path);
            const stat = FS.statSync(_path);
            // 仅获取目录
            if (stat && stat.isDirectory()) {
                const file = PATH.join(_path, `config.json`);
                if (FS.existsSync(file)) {
                    const content = JSON.parse(FS.readFileSync(file, "utf-8"));

                    // 获取解析器
                    const parser = getParser(PATH.join(_path, "parser"));
                    if (parser) {
                        content["parser"] = parser;
                    }
                    results.push(content);
                }
            }
        });

        return results;
    }

    /**
     * 创建架构和站点的解析器
     */
    function makeParser(name: string) {
        const parentFolder = PATH.join(resourcePath, name);
        const list = FS.readdirSync(parentFolder);

        list.forEach((path: string) => {
            const _path = PATH.join(parentFolder, path);
            const stat = FS.statSync(_path);
            // 仅获取目录
            if (stat && stat.isDirectory()) {
                const parser = getParser(PATH.join(_path, "parser"));
                if (parser) {
                    const fileName = PATH.join(_path, `config.json`);
                    const content = JSON.parse(FS.readFileSync(fileName, "utf-8"));
                    content["parser"] = parser;

                    FS.writeFileSync(fileName, JSON.stringify(content));
                }
            }
        });
    }

    /**
     * 获取解析器
     * @param parentFolder
     */
    function getParser(parentFolder): any {
        if (!FS.existsSync(parentFolder)) {
            return null;
        }
        const list = FS.readdirSync(parentFolder);

        const results: any = {};
        list.forEach((path: string) => {
            const _path = PATH.join(parentFolder, path);
            const stat = FS.statSync(_path);
            // 仅获取目录
            if (stat && stat.isFile() && PATH.extname(_path) == ".js") {
                results[PATH.basename(_path, ".js")] = FS.readFileSync(_path, "utf-8");
            }
        });

        return results;
    }

    /**
     * 获取已支持站点列表
     */
    function getSupportedSites() {
        const schemaFolder = PATH.join(resourcePath, "schemas");
        const schemaList = FS.readdirSync(schemaFolder);

        const schemas: any = {};
        schemaList.forEach((path: string) => {
            const file = PATH.join(schemaFolder, path);
            const stat = FS.statSync(file);
            // 仅获取目录
            if (stat && stat.isDirectory()) {
                schemas[path] = [];
            }
        });

        schemas["其他架构"] = [];

        const parentFolder = PATH.join(resourcePath, "sites");

        const list = FS.readdirSync(parentFolder);

        const itemTemplate =
            "| $schema$ | $name$ | $search$ | $imdbSearch$ | $userData$ | $sendTorrent$ | $torrentProgress$ | $collaborator$ |";

        list.forEach((path: string) => {
            const file = PATH.join(parentFolder, path);
            const stat = FS.statSync(file);
            // 仅获取目录
            if (stat && stat.isDirectory()) {
                const fileName = PATH.join(file, `config.json`);
                const content = JSON.parse(FS.readFileSync(fileName, "utf-8"));
                let schema = content.schema;
                if (!schemas[schema]) {
                    schema = "其他架构";
                }

                let supportedFeatures = {
                    search: true,
                    imdbSearch: true,
                    userData: true,
                    sendTorrent: true
                };

                if (content.supportedFeatures) {
                    supportedFeatures = Object.assign(supportedFeatures, content.supportedFeatures);
                }

                // 判断是否有跳过 IMDb 选项，有则定为不支持 IMDb
                if (content.searchEntryConfig) {
                    if (content.searchEntryConfig.skipIMDbId === true) {
                        supportedFeatures.imdbSearch = false;
                    }
                }

                const count = schemas[schema].length;
                const item = replaceKeys(itemTemplate, {
                    schema: count == 0 ? schema : "",
                    name: content.name,
                    search: supportedFeatures.search ? "√" : "",
                    imdbSearch: supportedFeatures.imdbSearch ? "√" : "",
                    userData: supportedFeatures.userData ? "√" : !supportedFeatures.userData ? "" : supportedFeatures.userData,
                    sendTorrent: supportedFeatures.sendTorrent ? "√" : "",
                    torrentProgress: content.searchEntryConfig?.fieldSelector?.progress ? "√" : "",
                    collaborator: getCollaborator(content.collaborator)
                });
                schemas[schema].push(item);
            }
        });

        console.log("\n");
        for (const key in schemas) {
            if (schemas.hasOwnProperty(key)) {
                const items: Array<any> = schemas[key];
                // console.log(`\n## ${key}`);

                items.forEach((item: string) => {
                    console.log(item);
                });
            }
        }
        console.log("\n");

        // console.log(results);
    }

    function getCollaborator(source: string | Array<string>): string {
        if (!source) {
            return "";
        }
        if (typeof source == "string") {
            return source;
        } else if (source.length > 0) {
            const result: Array<string> = [];
            source.forEach((item: string) => {
                result.push(item);
            });

            return result.join(", ");
        }
        return "";
    }

    /**
     * 获取语言配置信息
     */
    function geti18n() {
        const parentFolder = PATH.join(resourcePath, "i18n");

        const list = FS.readdirSync(parentFolder);
        const results: Array<any> = [];

        list.forEach((path: string) => {
            const file = PATH.join(parentFolder, path);
            const stat = FS.statSync(file);
            // 获取语言配置文件
            if (stat && stat.isFile() && PATH.extname(file) == ".json") {
                const content = JSON.parse(FS.readFileSync(file, "utf-8"));
                if (content && content.code && content.name) {
                    console.log(path, content.name);
                    results.push({
                        name: content.name,
                        code: content.code
                    });
                }
            }
        });
        return results;
    }

    /**
     * 替换指定的字符串列表
     * @param source
     * @param keys
     */
    function replaceKeys(source: string, keys: Dictionary<any>, prefix: string = ""): string {
        let result: string = source;

        for (const key in keys) {
            if (keys.hasOwnProperty(key)) {
                const value = keys[key];
                let search = "$" + key + "$";
                if (prefix) {
                    search = `$${prefix}.${key}$`;
                }
                result = result.replace(search, value);
            }
        }
        return result;
    }

    return {
        name: 'build_resource',
        buildEnd() {
            buildResource();
            getSupportedSites();
            FS.readdirSync(resourcePath).forEach((name: string) => {
                console.log(name);
            })
        }
    }
}
