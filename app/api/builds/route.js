import { NextResponse } from 'next/server'
import { get, put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

const BLOB_PATH = 'data/builds.json'
const LOCAL_PATH = path.join(process.cwd(), 'data', 'builds.json')

// 判断运行环境：本地开发用本地文件，Vercel 用 Blob
// NODE_ENV=production 且 VERCEL 环境变量存在时，认为是 Vercel 环境
const isLocal = process.env.NODE_ENV !== 'production' || !process.env.VERCEL
console.log('[ENV] NODE_ENV:', process.env.NODE_ENV, 'VERCEL:', process.env.VERCEL, 'isLocal:', isLocal)

/**
 * 读取 builds 数据
 * 本地开发用本地 JSON 文件，Vercel 用 Blob 存储
 */
async function readBuilds() {
  try {
    console.log('[readBuilds] starting...', isLocal ? '(local mode)' : '(blob mode)')

    if (isLocal) {
      // 本地模式：直接读取本地 JSON 文件
      if (!fs.existsSync(LOCAL_PATH)) {
        console.log('[readBuilds] local file not found, returning empty')
        return []
      }
      const content = fs.readFileSync(LOCAL_PATH, 'utf-8')
      console.log('[readBuilds] local read', content.length, 'bytes')
      const data = JSON.parse(content)
      console.log('[readBuilds] local parsed', data.length, 'items')
      return Array.isArray(data) ? data : []
    }

    // Vercel 模式：从 Blob 读取
    const result = await get(BLOB_PATH, { access: 'private' })
    console.log('[readBuilds] get result:', result ? 'found' : 'null', 'statusCode:', result?.statusCode)

    if (!result || result.statusCode !== 200) {
      console.log('[readBuilds] no data or status', result?.statusCode)
      return []
    }

    const text = await new Response(result.stream).text()
    console.log('[readBuilds] read', text.length, 'bytes')
    const data = JSON.parse(text)
    console.log('[readBuilds] parsed', data.length, 'items')
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('[readBuilds] error:', error)
    return []
  }
}

/**
 * 写入 builds 数据
 * 本地开发用本地 JSON 文件，Vercel 用 Blob 存储
 */
async function writeBuilds(builds) {
  try {
    console.log('[writeBuilds] writing', builds.length, 'items...', isLocal ? '(local mode)' : '(blob mode)')

    if (isLocal) {
      // 本地模式：直接写入本地 JSON 文件
      fs.writeFileSync(LOCAL_PATH, JSON.stringify(builds, null, 2), 'utf-8')
      console.log('[writeBuilds] local success:', LOCAL_PATH)
      return true
    }

    // Vercel 模式：上传到 Blob
    const result = await put(BLOB_PATH, JSON.stringify(builds, null, 2), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    console.log('[writeBuilds] success:', result?.pathname)
    return true
  } catch (error) {
    console.error('[writeBuilds] error:', error)
    return false
  }
}

// GET - 获取所有改枪方案
export async function GET() {
  try {
    console.log('[GET /api/builds] starting...')
    const builds = await readBuilds()
    console.log('[GET /api/builds] returning', builds.length, 'builds')
    return NextResponse.json({ success: true, builds })
  } catch (error) {
    console.error('[GET /api/builds] error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// POST - 添加新改枪方案
export async function POST(request) {
  try {
    console.log('[POST /api/builds] starting...')
    const body = await request.json()
    const { gunId, title, author, code, parts } = body

    if (!gunId || !title || !author || !code) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    console.log('[POST /api/builds] received:', { gunId, title, author, code })
    const builds = await readBuilds()
    console.log('[POST /api/builds] read', builds.length, 'existing builds')

    const newBuild = {
      id: `${gunId}-build-${Date.now()}`,
      gunId,
      title,
      author,
      code,
      parts: parts || {},
      createdAt: new Date().toISOString().split('T')[0],
    }

    builds.push(newBuild)
    console.log('[POST /api/builds] after push:', builds.length, 'builds')

    const writeResult = await writeBuilds(builds)
    console.log('[POST /api/builds] write result:', writeResult)

    if (!writeResult) {
      return NextResponse.json(
        { error: '保存失败，请稍后重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, build: newBuild })
  } catch (error) {
    console.error('[POST /api/builds] error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// DELETE - 删除改枪方案
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: '缺少方案ID' },
        { status: 400 }
      )
    }

    const builds = await readBuilds()
    const filteredBuilds = builds.filter(build => build.id !== id)

    if (filteredBuilds.length === builds.length) {
      return NextResponse.json(
        { error: '方案不存在' },
        { status: 404 }
      )
    }

    await writeBuilds(filteredBuilds)

    return NextResponse.json({
      success: true,
      message: '删除成功',
      deletedId: id
    })
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
