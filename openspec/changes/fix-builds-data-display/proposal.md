# 修复改枪方案提交后前端页面无法显示的问题

## 问题描述

用户在 Vercel 部署的网站上提交改枪方案后，API 返回"提交成功"，但刷新页面后看不到新提交的数据。

## 根本原因

存在**双重问题**：

1. **API 读取失败**：Vercel Blob 存储桶设置为 `private` 权限，`readBuilds()` 函数中 `fetch(blob.url)` 因需要认证而失败，返回空数组 `[]`
2. **前端静态导入**：首页 (`app/page.js`) 和枪械详情页 (`app/guns/[id]/page.js`) 使用 `import builds from '../data/builds.json'` 静态导入，数据在构建时打包，运行时不更新

## 解决方案

**保持 Blob `private` 权限不变**，将前端页面改为从 `/api/builds` API 动态获取数据：

- API 在服务器端使用 `@vercel/blob` SDK 的 `get()` 方法读取，不受 `private` 权限限制
- 前端通过客户端组件调用 API，获取最新数据
- 提交后刷新页面即可看到新数据

## 优点

| 方面 | 说明 |
|------|------|
| 安全性 | Blob 保持 `private`，数据不公开暴露 |
| 实时性 | 前端从 API 获取，数据实时同步 |
| 架构合理 | API 作为唯一数据入口，职责清晰 |
