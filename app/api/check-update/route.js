import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * GET /api/check-update
 * 检查是否有新版本数据
 * 
 * 策略：
 * 1. 读取本地版本号
 * 2. 尝试从数据源获取远程版本信息
 * 3. 对比枪械数量判断是否有更新
 */
export async function GET() {
  try {
    // 读取本地版本
    const versionPath = path.join(process.cwd(), 'data', 'version.json')
    let localVersion = { gunCount: 0, version: 'unknown' }
    
    if (fs.existsSync(versionPath)) {
      localVersion = JSON.parse(fs.readFileSync(versionPath, 'utf-8'))
    }

    // 尝试从数据源获取远程版本
    // 由于跨域限制，我们通过抓取数据源页面的方式判断
    let remoteGunCount = localVersion.gunCount
    let hasUpdate = false
    
    try {
      const response = await fetch('https://www.dpcamp.cn/beizhan/wqjcsjyl/default.html', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        const html = await response.text()
        // 统计表格行数（每行一把枪）
        const gunMatches = html.match(/<tr[^>]*>.*?<img[^>]+src="[^"]+"[^>]*>.*?<\/tr>/gs)
        if (gunMatches) {
          remoteGunCount = gunMatches.length
          hasUpdate = remoteGunCount > localVersion.gunCount
        }
      }
    } catch (fetchErr) {
      // 网络请求失败，返回本地版本信息
      console.log('远程检查失败:', fetchErr.message)
    }

    return NextResponse.json({
      success: true,
      hasUpdate,
      version: {
        local: localVersion.gunCount,
        remote: remoteGunCount,
        localVersion: localVersion.version,
        lastSync: localVersion.lastSync
      },
      message: hasUpdate 
        ? `发现 ${remoteGunCount - localVersion.gunCount} 款新枪械`
        : '数据已是最新'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '检查更新失败',
      error: error.message
    }, { status: 500 })
  }
}
