# 马上下班官网与更新发布

这个仓库同时承载：

- GitHub Pages 官网
- `latest.json` 版本清单
- GitHub Releases 安装包
- 工位雷达 Cloudflare Worker / D1 服务端源码

## 发布新版本

1. 打开仓库的 **Releases** 页面，选择 **Draft a new release**。
2. 创建标签，例如 `v2.5.0`；Release 标题填写 `马上下班 2.5.0`。
3. 同时上传 `.dmg` 与 `.exe` 安装包，文件名分别使用 `mashangxiaban-版本号-macOS-Apple-Silicon.dmg` 和 `mashangxiaban-版本号-Windows-x64.exe`。
4. 在 Release 正文中填写更新说明，每项一行。这些内容会自动同步到官网更新日志。
5. 点击 **Publish release**。

发布后，GitHub Actions 会自动计算安装包 SHA-256、更新 `latest.json`、写入 `changelog.json`，并重新部署官网和更新日志页面。

> 安装包不要直接提交进 Git 仓库；请始终使用 Releases 上传。

## 工位雷达云端服务

`cloudflare/` 保存 Cloudflare Worker、D1 数据库迁移和 Wrangler 配置。线上服务为 `https://mashangxiaban-radar.vanyima1126.workers.dev`，数据库内容不公开，也不依赖 GitHub 表格或客户端令牌。桌面应用只有在用户切换到“云端真实数据”并主动开启附近发现后才上传匿名位置；mock 模式完全保留且不联网。
