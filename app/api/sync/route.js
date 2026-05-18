import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import path from 'path'

/**
 * POST /api/sync
 * 触发枪械数据同步
 * 
 * 请求体:
 *   { "dryRun": false, "force": false }
 * 
 * 响应:
 *   { "success": true, "message": "...", "details": { ... } }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { dryRun = false, force = false } = body
    
    // 构建命令
    const scriptPath = path.join(process.cwd(), 'scripts', 'sync-guns.js')
    const args = []
    if (dryRun) args.push('--dry')
    if (force) args.push('--force')
    
    const command = `node "${scriptPath}" ${args.join(' ')}`
    
    // 执行同步脚本
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout: 30000,
      cwd: process.cwd()
    })
    
    // 解析输出
    const lines = output.split('\n').filter(Boolean)
    
    return NextResponse.json({
      success: true,
      message: '同步完成',
      dryRun,
      output: lines
    })
    
  } catch (error) {
    console.error('同步失败:', error)
    
    return NextResponse.json({
      success: false,
      message: '同步失败',
      error: error.message,
      output: error.stdout?.split('\n').filter(Boolean) || []
    }, { status: 500 })
  }
}

/**
 * GET /api/sync
 * 获取同步状态（最近一次同步时间等）
 */
export async function GET() {
  try {
    const fs = await import('fs')
    const gunsPath = path.join(process.cwd(), 'data', 'guns.json')
    
    const stats = fs.existsSync(gunsPath) 
      ? fs.statSync(gunsPath)
      : null
    
    const guns = stats 
      ? JSON.parse(fs.readFileSync(gunsPath, 'utf-8'))
      : []
    
    return NextResponse.json({
      success: true,
      lastModified: stats?.mtime?.toISOString() || null,
      gunCount: guns.length,
      categories: [...new Set(guns.map(g => g.category))]
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '获取状态失败',
      error: error.message
    }, { status: 500 })
  }
}
