import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

/**
 * GET /api/cron/sync
 * Vercel Cron 定时任务入口
 * 每天自动执行枪械数据同步
 * 
 * 安全验证：通过 CRON_SECRET 环境变量验证请求来源
 */
export async function GET(request) {
  // 验证请求来源（Vercel Cron 会自动携带 Authorization header）
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { success: false, message: '未授权访问' },
      { status: 401 }
    )
  }

  const startTime = Date.now()
  const logs = []
  
  try {
    // 记录同步开始
    logs.push(`[${new Date().toISOString()}] 开始同步...`)
    
    // 执行同步脚本
    const scriptPath = path.join(process.cwd(), 'scripts', 'sync-guns.js')
    const output = execSync(`node "${scriptPath}"`, {
      encoding: 'utf-8',
      timeout: 60000,
      cwd: process.cwd()
    })
    
    logs.push(...output.split('\n').filter(Boolean))
    
    // 检查是否有变更
    const gunsPath = path.join(process.cwd(), 'data', 'guns.json')
    const gitStatus = execSync('git status --porcelain data/guns.json', {
      encoding: 'utf-8',
      cwd: process.cwd()
    }).trim()
    
    const hasChanges = gitStatus.length > 0
    
    if (hasChanges) {
      // 自动提交变更（如果在Git环境中）
      try {
        execSync('git config user.email "cron@vercel.com"', { cwd: process.cwd() })
        execSync('git config user.name "Vercel Cron"', { cwd: process.cwd() })
        execSync('git add data/guns.json', { cwd: process.cwd() })
        execSync(`git commit -m "🔄 自动同步枪械数据 ${new Date().toLocaleString('zh-CN')}"`, {
          cwd: process.cwd()
        })
        
        logs.push('✅ 已自动提交变更到Git')
      } catch (gitError) {
        logs.push('⚠️  Git提交失败（可能不是Git仓库或无写入权限）')
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    logs.push(`[${new Date().toISOString()}] 同步完成，耗时 ${duration}s`)
    
    // 保存同步日志
    saveSyncLog(logs, hasChanges)
    
    return NextResponse.json({
      success: true,
      message: hasChanges ? '同步完成，数据已更新' : '同步完成，数据已是最新',
      hasChanges,
      duration: `${duration}s`,
      logs
    })
    
  } catch (error) {
    logs.push(`[${new Date().toISOString()}] ❌ 同步失败: ${error.message}`)
    saveSyncLog(logs, false)
    
    return NextResponse.json({
      success: false,
      message: '同步失败',
      error: error.message,
      logs
    }, { status: 500 })
  }
}

/**
 * 保存同步日志到文件
 */
function saveSyncLog(logs, hasChanges) {
  try {
    const logDir = path.join(process.cwd(), 'data', 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    
    const date = new Date().toISOString().split('T')[0]
    const logFile = path.join(logDir, `sync-${date}.log`)
    
    const logEntry = `\n=== ${new Date().toLocaleString('zh-CN')} ===\n${logs.join('\n')}\n`
    fs.appendFileSync(logFile, logEntry, 'utf-8')
  } catch (err) {
    console.error('保存日志失败:', err.message)
  }
}
