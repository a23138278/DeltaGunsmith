/**
 * 三角洲行动枪械数据同步脚本
 * 
 * 支持两种方式：
 * 1. 自动抓取：从 dpcamp.cn 抓取（需要网络环境支持）
 * 2. 手动导入：从本地 HTML 文件或数据文件导入
 * 
 * 使用方法:
 *   node scripts/sync-guns.js              # 自动同步（从网络）
 *   node scripts/sync-guns.js --dry        # 预览变更，不写入文件
 *   node scripts/sync-guns.js --force      # 强制全量更新
 *   node scripts/sync-guns.js --import file.html  # 从HTML文件导入
 *   node scripts/sync-guns.js --import-data data.json  # 从JSON导入
 */

const fs = require('fs')
const path = require('path')

// 主数据源：df-build.com（最新，包含S8/S9新枪）
const DATA_SOURCE_URL = 'https://df-build.com/builds/?mode=operations'
// 备用数据源：dpcamp.cn（官方武器数据）
const BACKUP_SOURCE_URL = 'https://www.dpcamp.cn/beizhan/wqjcsjyl/default.html'
const GUNS_JSON_PATH = path.join(__dirname, '..', 'data', 'guns.json')
const IMPORT_DIR = path.join(__dirname, '..', 'data', 'imports')

// 确保导入目录存在
if (!fs.existsSync(IMPORT_DIR)) {
  fs.mkdirSync(IMPORT_DIR, { recursive: true })
}

// 分类映射
function extractCategory(name) {
  if (name.includes('冲锋枪')) return '冲锋枪'
  if (name.includes('轻机枪') || name.includes('通用机枪')) return '轻机枪'
  if (name.includes('射手步枪')) return '射手步枪'
  if (name.includes('狙击步枪')) return '狙击步枪'
  if (name.includes('战斗步枪')) return '战斗步枪'
  if (name.includes('突击步枪')) return '突击步枪'
  if (name.includes('手枪') || ['G18', '93R', 'M1911', 'G17', '沙漠之鹰', '.357左轮'].includes(name)) return '手枪'
  if (name.includes('霰弹枪')) return '霰弹枪'
  return '其他'
}

// 生成唯一ID
function generateId(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/冲锋枪|突击步枪|狙击步枪|射手步枪|战斗步枪|轻机枪|通用机枪|霰弹枪|手枪/g, '')
  return base || name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// 默认描述
function getDefaultDescription(name, category) {
  const descriptions = {
    '冲锋枪': '射速快，适合近距离作战',
    '突击步枪': '性能均衡，适应多种作战环境',
    '狙击步枪': '高精度，远距离精准打击',
    '射手步枪': '半自动精准射击，中远距离优势',
    '战斗步枪': '大威力，中远距离压制',
    '轻机枪': '火力持续，适合压制和防守',
    '手枪': '便携副武器，近距离自卫',
    '霰弹枪': '近距离爆发，面杀伤',
  }
  return descriptions[category] || '三角洲行动武器'
}

// 从 dpcamp.cn HTML 解析数据
function parseGunDataFromHTML(html) {
  const guns = []
  const rowRegex = /<tr[^>]*>\s*<td[^>]*>.*?<img[^>]+src="([^"]+)"[^>]*>.*?<\/td>\s*<td[^>]*>([^<]+)<\/td>/gs
  
  let match
  while ((match = rowRegex.exec(html)) !== null) {
    const imageUrl = match[1].trim()
    const name = match[2].trim()
    
    if (name && imageUrl && !name.includes('物品图片')) {
      const category = extractCategory(name)
      guns.push({
        id: generateId(name),
        name,
        category,
        description: getDefaultDescription(name, category),
        image: imageUrl
      })
    }
  }
  
  // 去重
  const seen = new Set()
  return guns.filter(gun => {
    if (seen.has(gun.id)) return false
    seen.add(gun.id)
    return true
  })
}

// 从 df-build.com HTML 解析数据
function parseDfBuildData(html) {
  const guns = []
  
  // 匹配武器卡片
  const cardRegex = /<a[^>]+href="\/builds\/([^\/"]+)\/\?[^"]*"[^>]*>\s*<article[^>]*>.*?<img[^>]+src="([^"]+)"[^>]*>.*?<h3[^>]*>(.*?)<\/h3>.*?<span[^>]*>(.*?)<\/span>/gs
  
  let match
  while ((match = cardRegex.exec(html)) !== null) {
    const slug = match[1].trim()
    const imageUrl = match[2].trim()
    const name = match[3].trim().replace(/<[^>]+>/g, '')
    const category = match[4].trim()
    
    if (name && imageUrl) {
      const mappedCategory = mapDfBuildCategory(category)
      guns.push({
        id: slug,
        name,
        category: mappedCategory,
        description: getDefaultDescription(name, mappedCategory),
        image: imageUrl
      })
    }
  }
  
  // 去重
  const seen = new Set()
  return guns.filter(gun => {
    if (seen.has(gun.id)) return false
    seen.add(gun.id)
    return true
  })
}

// df-build.com 分类映射
function mapDfBuildCategory(category) {
  const map = {
    'Assault Rifle': '突击步枪',
    'Battle Rifle': '战斗步枪',
    'SMG': '冲锋枪',
    'Shotgun': '霰弹枪',
    'LMG': '轻机枪',
    'Sniper Rifle': '狙击步枪',
    'Marksman Rifle': '射手步枪',
    'Pistol': '手枪'
  }
  return map[category] || '其他'
}

// 从 df-build.com 抓取
async function fetchFromDfBuild() {
  console.log('📡 尝试从 df-build.com 获取数据...')
  try {
    const response = await fetch(DATA_SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    const guns = parseDfBuildData(html)
    console.log(`   ✓ 从 df-build.com 获取到 ${guns.length} 款枪械`)
    return guns
  } catch (error) {
    console.log(`   ✗ df-build.com 获取失败: ${error.message}`)
    return null
  }
}

// 从 dpcamp.cn 抓取（备用）
async function fetchFromDpcamp() {
  console.log('📡 尝试从 dpcamp.cn 获取数据...')
  try {
    const response = await fetch(BACKUP_SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    const guns = parseGunDataFromHTML(html)
    console.log(`   ✓ 从 dpcamp.cn 获取到 ${guns.length} 款枪械`)
    return guns
  } catch (error) {
    console.log(`   ✗ dpcamp.cn 获取失败: ${error.message}`)
    return null
  }
}

// 从导入目录读取
function readFromImports() {
  console.log('📁 检查导入目录...')
  
  const files = fs.readdirSync(IMPORT_DIR)
    .filter(f => f.endsWith('.html') || f.endsWith('.json'))
    .sort()
    .reverse()
  
  if (files.length === 0) {
    console.log('   ✗ 导入目录为空')
    return null
  }
  
  // 读取最新的文件
  const latestFile = files[0]
  const filePath = path.join(IMPORT_DIR, latestFile)
  
  console.log(`   ✓ 读取导入文件: ${latestFile}`)
  
  const content = fs.readFileSync(filePath, 'utf-8')
  
  if (latestFile.endsWith('.json')) {
    const data = JSON.parse(content)
    const guns = Array.isArray(data) ? data : data.guns || []
    console.log(`   ✓ 从JSON导入 ${guns.length} 款枪械`)
    return guns
  }
  
  const guns = parseGunDataFromHTML(content)
  console.log(`   ✓ 从HTML导入 ${guns.length} 款枪械`)
  return guns
}

// 从指定文件导入
function importFromFile(filePath) {
  console.log(`📄 从文件导入: ${filePath}`)
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`)
  }
  
  const content = fs.readFileSync(filePath, 'utf-8')
  
  if (filePath.endsWith('.json')) {
    const data = JSON.parse(content)
    return Array.isArray(data) ? data : data.guns || []
  }
  
  return parseGunDataFromHTML(content)
}

// 读取本地数据
function loadLocalGuns() {
  try {
    if (fs.existsSync(GUNS_JSON_PATH)) {
      return JSON.parse(fs.readFileSync(GUNS_JSON_PATH, 'utf-8'))
    }
  } catch (error) {
    console.warn('读取本地数据失败:', error.message)
  }
  return []
}

// 保存数据
function saveGuns(guns) {
  fs.writeFileSync(GUNS_JSON_PATH, JSON.stringify(guns, null, 2) + '\n', 'utf-8')
}

// 计算差异
function computeDiff(localGuns, remoteGuns) {
  const localMap = new Map(localGuns.map(g => [g.id, g]))
  const remoteMap = new Map(remoteGuns.map(g => [g.id, g]))
  
  const added = []
  const modified = []
  const removed = []
  
  for (const remote of remoteGuns) {
    const local = localMap.get(remote.id)
    if (!local) {
      added.push(remote)
    } else if (JSON.stringify(local) !== JSON.stringify(remote)) {
      modified.push({ local, remote })
    }
  }
  
  for (const local of localGuns) {
    if (!remoteMap.has(local.id)) {
      removed.push(local)
    }
  }
  
  return { added, modified, removed }
}

// 合并数据（保留本地自定义描述）
function mergeGuns(localGuns, remoteGuns) {
  const localMap = new Map(localGuns.map(g => [g.id, g]))
  
  return remoteGuns.map(remote => {
    const local = localMap.get(remote.id)
    if (local) {
      const isCustomDesc = local.description && 
        local.description !== getDefaultDescription(local.name, local.category)
      return {
        ...remote,
        description: isCustomDesc ? local.description : remote.description
      }
    }
    return remote
  })
}

// 打印差异报告
function printDiff(diff) {
  console.log('\n📊 同步报告')
  console.log('───────────────────────────────')
  console.log(`   新增: ${diff.added.length} 款`)
  console.log(`   修改: ${diff.modified.length} 款`)
  console.log(`   删除: ${diff.removed.length} 款`)
  
  if (diff.added.length > 0) {
    console.log('\n   🆕 新增枪械:')
    diff.added.forEach(g => console.log(`      + ${g.name} (${g.category})`))
  }
  
  if (diff.modified.length > 0) {
    console.log('\n   📝 变更枪械:')
    diff.modified.forEach(({ remote }) => {
      console.log(`      ~ ${remote.name}`)
    })
  }
  
  if (diff.removed.length > 0) {
    console.log('\n   🗑️  移除枪械:')
    diff.removed.forEach(g => console.log(`      - ${g.name}`))
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry')
  const isForce = args.includes('--force')
  
  const importIndex = args.indexOf('--import')
  const importDataIndex = args.indexOf('--import-data')
  
  console.log('🔄 三角洲行动枪械数据同步')
  console.log('═══════════════════════════════')
  
  let remoteGuns = null
  
  // 1. 确定数据来源
  if (importIndex !== -1 && args[importIndex + 1]) {
    // 从指定HTML文件导入
    remoteGuns = importFromFile(args[importIndex + 1])
  } else if (importDataIndex !== -1 && args[importDataIndex + 1]) {
    // 从指定JSON文件导入
    remoteGuns = importFromFile(args[importDataIndex + 1])
  } else {
    // 1. 先尝试 df-build.com（最新，包含S8/S9新枪）
    remoteGuns = await fetchFromDfBuild()
    
    // 2. 失败则尝试 dpcamp.cn（备用）
    if (!remoteGuns) {
      remoteGuns = await fetchFromDpcamp()
    }
    
    // 3. 再失败则尝试本地导入
    if (!remoteGuns) {
      remoteGuns = readFromImports()
    }
  }
  
  if (!remoteGuns || remoteGuns.length === 0) {
    console.error('\n❌ 无法获取数据')
    console.log('\n💡 提示:')
    console.log('   1. 确保网络可以访问 df-build.com 或 dpcamp.cn')
    console.log('   2. 或将网页保存为HTML放到 data/imports/ 目录')
    console.log('   3. 或使用: node scripts/sync-guns.js --import file.html')
    process.exit(1)
  }
  
  // 2. 读取本地数据
  const localGuns = loadLocalGuns()
  console.log(`\n📦 本地现有 ${localGuns.length} 款枪械`)
  console.log(`📦 远程共有 ${remoteGuns.length} 款枪械`)
  
  // 3. 计算差异
  const diff = computeDiff(localGuns, remoteGuns)
  printDiff(diff)
  
  // 4. 执行同步
  if (isDryRun) {
    console.log('\n⏸️  预览模式，未写入文件')
    return
  }
  
  if (diff.added.length === 0 && diff.modified.length === 0 && diff.removed.length === 0) {
    console.log('\n✅ 数据已是最新，无需同步')
    return
  }
  
  const mergedGuns = isForce ? remoteGuns : mergeGuns(localGuns, remoteGuns)
  saveGuns(mergedGuns)
  
  // 更新版本号
  updateVersion(mergedGuns.length)
  
  console.log('\n✅ 同步完成！')
  console.log(`   已更新: ${GUNS_JSON_PATH}`)
  console.log(`   总计: ${mergedGuns.length} 款枪械`)
  console.log(`\n🚀 请刷新网页查看更新后的数据`)
}

// 更新版本号文件
function updateVersion(gunCount) {
  const versionPath = path.join(__dirname, '..', 'data', 'version.json')
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '')
  
  const version = {
    version: `${dateStr}-${timeStr}`,
    gunCount,
    lastSync: now.toISOString(),
    source: 'dpcamp.cn'
  }
  
  fs.writeFileSync(versionPath, JSON.stringify(version, null, 2) + '\n', 'utf-8')
  console.log(`   版本号已更新: ${version.version}`)
}

main().catch(err => {
  console.error('\n❌ 错误:', err.message)
  process.exit(1)
})
