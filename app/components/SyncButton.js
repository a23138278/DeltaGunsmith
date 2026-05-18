'use client'

import { useState } from 'react'

/**
 * 同步按钮组件
 * 放在导航栏，点击后触发数据同步
 */
export default function SyncButton() {
  const [syncing, setSyncing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState(null)

  const handleSync = async () => {
    if (syncing) return
    
    setSyncing(true)
    setShowResult(false)

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false })
      })

      const data = await res.json()
      setResult(data)
      setShowResult(true)

      // 如果同步成功且有变更，3秒后刷新页面
      if (data.success) {
        const hasChanges = data.output?.some(line => line.includes('同步完成'))
        if (hasChanges) {
          setTimeout(() => {
            window.location.reload()
          }, 3000)
        }
      }
    } catch (err) {
      setResult({
        success: false,
        message: '同步失败',
        error: err.message
      })
      setShowResult(true)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-amber-400 hover:bg-white/[0.04] transition-all duration-300 disabled:opacity-50"
        title="同步最新枪械数据"
      >
        {syncing ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        <span className="hidden sm:inline">{syncing ? '同步中' : '同步'}</span>
      </button>

      {/* 同步结果提示 */}
      {showResult && result && (
        <div className={`absolute top-full right-0 mt-2 w-72 rounded-xl p-4 text-sm shadow-lg z-50 ${
          result.success ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{result.message}</span>
          </div>
          {result.output && result.output.length > 0 && (
            <div className="text-xs text-gray-400 font-mono max-h-32 overflow-y-auto">
              {result.output.slice(-5).map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
          {result.success && (
            <p className="text-xs text-gray-500 mt-2">页面即将刷新...</p>
          )}
        </div>
      )}
    </div>
  )
}
