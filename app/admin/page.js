'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [status, setStatus] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [dryRun, setDryRun] = useState(false)
  
  // 改枪方案管理
  const [builds, setBuilds] = useState([])
  const [loadingBuilds, setLoadingBuilds] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // 获取同步状态和改枪方案
  useEffect(() => {
    fetchStatus()
    fetchBuilds()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/sync')
      const data = await res.json()
      if (data.success) {
        setStatus(data)
      }
    } catch (err) {
      console.error('获取状态失败:', err)
    }
  }

  // 触发同步
  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun })
      })

      const data = await res.json()
      setSyncResult(data)

      if (data.success && !dryRun) {
        fetchStatus()
      }
    } catch (err) {
      setSyncResult({
        success: false,
        message: '请求失败',
        error: err.message
      })
    } finally {
      setSyncing(false)
    }
  }

  // 获取改枪方案列表
  const fetchBuilds = async () => {
    setLoadingBuilds(true)
    try {
      const res = await fetch('/api/builds')
      const data = await res.json()
      if (data.success) {
        setBuilds(data.builds)
      }
    } catch (err) {
      console.error('获取改枪方案失败:', err)
    } finally {
      setLoadingBuilds(false)
    }
  }

  // 删除改枪方案
  const handleDeleteBuild = async (id) => {
    if (!confirm('确定要删除这个改枪方案吗？此操作不可恢复。')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/builds?id=${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        setBuilds(builds.filter(b => b.id !== id))
      } else {
        alert('删除失败: ' + (data.error || '未知错误'))
      }
    } catch (err) {
      alert('删除失败: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors duration-300 text-sm mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </Link>

      <div className="glass rounded-2xl p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">数据管理</h1>
            <p className="text-gray-400">同步三角洲行动最新枪械数据</p>
          </div>

          {/* 当前状态 */}
          {status && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-amber-400">{status.gunCount}</div>
                <div className="text-sm text-gray-500 mt-1">当前枪械数量</div>
              </div>
              <div className="glass rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-amber-400">{status.categories?.length || 0}</div>
                <div className="text-sm text-gray-500 mt-1">分类数量</div>
              </div>
              <div className="glass rounded-xl p-5 text-center">
                <div className="text-lg font-bold text-white">
                  {status.lastModified 
                    ? new Date(status.lastModified).toLocaleString('zh-CN')
                    : '从未同步'
                  }
                </div>
                <div className="text-sm text-gray-500 mt-1">最后更新时间</div>
              </div>
            </div>
          )}

          {/* 同步控制 */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-white/[0.04] text-amber-500 focus:ring-amber-500/50"
                />
                <span className="text-gray-300">仅预览变更（不写入文件）</span>
              </label>
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-primary w-full py-4 text-lg glow-amber disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {syncing ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  同步中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {dryRun ? '预览变更' : '立即同步数据'}
                </>
              )}
            </button>
          </div>

          {/* 同步结果 */}
          {syncResult && (
            <div className={`mt-8 rounded-xl p-6 ${syncResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <div className="flex items-center gap-3 mb-4">
                {syncResult.success ? (
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <h3 className={`text-lg font-bold ${syncResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {syncResult.message}
                </h3>
              </div>

              {syncResult.output && syncResult.output.length > 0 && (
                <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-gray-300 whitespace-pre-wrap">
                    {syncResult.output.join('\n')}
                  </pre>
                </div>
              )}

              {syncResult.error && (
                <p className="text-red-400 text-sm mt-4">{syncResult.error}</p>
              )}
            </div>
          )}

          {/* 改枪方案管理 */}
          <div className="mt-10 pt-8 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">改枪方案管理</h3>
              <span className="text-sm text-gray-500">共 {builds.length} 个方案</span>
            </div>

            {loadingBuilds ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : builds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无改枪方案</div>
            ) : (
              <div className="space-y-3">
                {builds.map(build => (
                  <div
                    key={build.id}
                    className="glass rounded-xl p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium truncate">{build.title}</h4>
                        <span className="text-xs text-gray-500 shrink-0">{build.gunId}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>作者: {build.author}</span>
                        <span>·</span>
                        <span className="font-mono text-amber-400/60">{build.code}</span>
                        <span>·</span>
                        <span>{build.createdAt}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBuild(build.id)}
                      disabled={deletingId === build.id}
                      className="ml-4 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50"
                      title="删除方案"
                    >
                      {deletingId === build.id ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 自动同步说明 */}
          <div className="mt-10 pt-8 border-t border-white/[0.06]">
            <h3 className="text-lg font-bold text-white mb-4">自动同步配置</h3>
            <div className="space-y-4 text-gray-400 text-sm">
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white font-semibold">GitHub Actions（推荐）</span>
                </div>
                <p>已配置每天凌晨3点自动同步，代码推送到GitHub后自动生效</p>
                <p className="mt-1 text-amber-400/80">路径：.github/workflows/sync-guns.yml</p>
              </div>
              
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-white font-semibold">Vercel Cron</span>
                </div>
                <p>部署到Vercel后，每天自动调用 API 执行同步</p>
                <p className="mt-1 text-amber-400/80">路径：vercel.json + /api/cron/sync</p>
              </div>

              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="text-white font-semibold">手动触发</span>
                </div>
                <p>点击上方"立即同步数据"按钮，或执行命令：</p>
                <code className="block mt-2 bg-black/30 px-3 py-2 rounded text-amber-400 font-mono text-xs">
                  node scripts/sync-guns.js
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
