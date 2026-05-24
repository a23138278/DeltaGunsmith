# 设计文档：改枪方案数据实时显示

## 当前架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      当前架构（有问题）                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户提交 ──▶ POST /api/builds ──▶ Vercel Blob (private)       │
│              ✅ 写入成功          ✅ 写入成功                    │
│                                                                 │
│  首页刷新 ──▶ import builds from '../../data/builds.json'      │
│              ❌ 静态导入，构建时数据，不实时                      │
│                                                                 │
│  API 读取 ──▶ get(BLOB_PATH) ──▶ fetch(blob.url)               │
│              ❌ private 权限，fetch 失败，返回 []                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 目标架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      目标架构（修复后）                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户提交 ──▶ POST /api/builds ──▶ Vercel Blob (private)       │
│              ✅ 写入成功          ✅ 写入成功                    │
│                                                                 │
│  首页 ──▶ 客户端组件 ──▶ fetch('/api/builds')                  │
│           ✅ 实时获取最新数据                                    │
│                                                                 │
│  枪械详情页 ──▶ 客户端组件 ──▶ fetch('/api/builds')            │
│               ✅ 实时获取最新数据                                │
│                                                                 │
│  API ──▶ get(BLOB_PATH) ──▶ 直接返回 JSON                       │
│          ✅ SDK 内部处理认证，无需 fetch blob.url                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 关键改动

### 1. API 层（无需改动）

`app/api/builds/route.js` 的 `readBuilds()` 函数使用 `@vercel/blob` SDK 的 `get()` 方法，在 Vercel 服务器端运行时会自动处理认证，**不需要改动**。

### 2. 首页（app/page.js）

**当前**：静态导入 `builds.json`
```javascript
import builds from '../data/builds.json'
```

**改为**：客户端组件 + useEffect 动态获取
```javascript
'use client'
import { useState, useEffect } from 'react'

function HomeContent({ guns, initialBuildsCount }) {
  const [builds, setBuilds] = useState(initialBuildsCount)
  
  useEffect(() => {
    fetch('/api/builds').then(res => res.json()).then(data => {
      setBuilds(data.builds)
    })
  }, [])
  
  // 使用 builds 渲染
}
```

### 3. 枪械详情页（app/guns/[id]/page.js）

**当前**：静态导入 `builds.json`
```javascript
import builds from '../../../data/builds.json'
const gunBuilds = builds.filter(b => b.gunId === id)
```

**改为**：客户端组件 + useState 动态获取
```javascript
'use client'
import { useState, useEffect } from 'react'

function GunPageContent({ gun, params }) {
  const [gunBuilds, setGunBuilds] = useState([])
  
  useEffect(() => {
    fetch('/api/builds').then(res => res.json()).then(data => {
      setGunBuilds(data.builds.filter(b => b.gunId === gun.id))
    })
  }, [gun.id])
  
  // 使用 gunBuilds 渲染
}
```

## 数据流对比

```
修复前：
  构建时 ──▶ JSON 打包进 JS ──▶ 浏览器加载静态数据
                              ❌ 提交后不更新

修复后：
  页面加载 ──▶ 客户端组件渲染 ──▶ useEffect 调用 API
                              ──▶ 获取最新数据 ──▶ 更新 UI
                              ✅ 提交后刷新即显示
```

## 注意事项

1. **SEO 影响**：改为客户端组件后，首页和详情页的 builds 数量在 SSR 阶段无法获取
   - 解决方案：SSR 阶段显示"加载中"或从静态 JSON 获取初始计数，客户端再更新详情

2. **首屏性能**：客户端获取数据会增加一次网络请求
   - 解决方案：SSR 阶段从静态 JSON 读取初始数据，客户端 hydration 后再同步最新数据

3. **加载状态**：需要添加 loading 状态，避免闪烁
