import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'data', 'builds.json')

// 读取 builds 数据
function readBuilds() {
  try {
    const data = fs.readFileSync(dataPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// 写入 builds 数据
function writeBuilds(builds) {
  fs.writeFileSync(dataPath, JSON.stringify(builds, null, 2), 'utf-8')
}

// GET - 获取所有改枪方案
export async function GET() {
  try {
    const builds = readBuilds()
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

    const builds = readBuilds()

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
    writeBuilds(builds)

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

    const builds = readBuilds()
    const filteredBuilds = builds.filter(build => build.id !== id)

    if (filteredBuilds.length === builds.length) {
      return NextResponse.json(
        { error: '方案不存在' },
        { status: 404 }
      )
    }

    writeBuilds(filteredBuilds)

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
