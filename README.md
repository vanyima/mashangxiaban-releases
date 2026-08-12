# 马上下班官网与更新发布

这个仓库同时承载：

- GitHub Pages 官网
- `latest.json` 版本清单
- GitHub Releases 安装包

## 发布新版本

1. 打开仓库的 **Releases** 页面，选择 **Draft a new release**。
2. 创建标签，例如 `v2.5.0`；Release 标题填写 `马上下班 2.5.0`。
3. 上传一个 `.dmg` 安装包，文件名需包含版本号。
4. 在 Release 正文中填写更新说明，每项一行。
5. 点击 **Publish release**。

发布后，GitHub Actions 会自动计算安装包 SHA-256、更新 `latest.json`，并重新部署官网。

> 安装包不要直接提交进 Git 仓库；请始终使用 Releases 上传。
