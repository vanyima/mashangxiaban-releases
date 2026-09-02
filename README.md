# 马上下班官网与更新发布

这个仓库同时承载：

- GitHub Pages 官网
- `latest.json` 版本清单
- GitHub Releases 安装包

APP 与服务端源码保存在独立私有仓库，本仓库不包含可构建的 APP 源码。

## 发布新版本

1. 打开仓库的 **Releases** 页面，选择 **Draft a new release**。
2. 创建标签，例如 `v2.5.0`；Release 标题填写 `马上下班 2.5.0`。
3. 同时上传 `.dmg` 与 `.exe` 安装包，文件名分别使用 `mashangxiaban-版本号-macOS-Apple-Silicon.dmg` 和 `mashangxiaban-版本号-Windows-x64.exe`。
4. 在 Release 正文中填写更新说明，每项一行。这些内容会自动同步到官网更新日志。
5. 点击 **Publish release**。

发布后，GitHub Actions 会自动计算安装包 SHA-256、更新 `latest.json`、写入 `changelog.json`，并重新部署官网和更新日志页面。

> 安装包不要直接提交进 Git 仓库；请始终使用 Releases 上传。
