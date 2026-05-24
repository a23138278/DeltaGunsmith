import { NextResponse } from 'next/server'
import { get, put, del, list } from '@vercel/blob'

const BLOB_PATH = 'data/builds.json'

/**
 * 读取 builds 数据
 * 从 Vercel Blob 存储中获取
 */
async function readBuilds() {
  try {
    const result = await get(BLOB_PATH)
    if (!result || result.statusCode !== 200) {
      console.log('readBuilds: no data or status', result?.statusCode)
      return []
    }

    // 读取流内容
    const text = await new Response(result.stream).text()
    console.log('readBuilds: read', text.length, 'bytes')
    const data = JSON.parse(text)
    console.log('readBuilds: parsed', data.length, 'items')
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('readBuilds error:', error)
    return []
  }
}

/**
 * 写入 builds 数据
 * 上传到 Vercel Blob 存储
 */
async function writeBuilds(builds) {
  try {
    await put(BLOB_PATH, JSON.stringify(builds, null, 2), {
      access: 'private',
      addRandomSuffix: false,
    })
    return true
  } catch (error) {
    console.error('Failed to write builds:', error)
    return false
  }
}

// GET - 获取所有改枪方案
export async function GET() {
  try {
    const builds = await readBuilds()
    return NextResponse.json({ success: true, builds })
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// POST - 添加新改枪方案
export async function POST(request) {
  try {
    const body = await request.json()
    const { gunId, title, author, code, parts } = body

    if (!gunId || !title || !author || !code) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    const builds = await readBuilds()

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
    await writeBuilds(builds)

    return NextResponse.json({ success: true, build: newBuild })
  } catch (error) {
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
