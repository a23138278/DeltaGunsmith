'use client'

import { useState, useEffect } from 'react'

/**
 * 自动同步提示横幅
 * 页面加载时自动检测是否有新数据，发现新版本时显示更新提示
 */
export default function AutoSyncBanner() {
  const [syncStatus, setSyncStatus] = useState('checking') // checking | uptodate | outdated | updating | error
  const [newGunCount, setNewGunCount] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkForUpdates()
  }, [])

  // 检测更新
  const checkForUpdates = async () => {
    try {
      // 获取本地版本
      const localVersionRes = await fetch('/data/version.json?t=' + Date.now())
      const localVersion = await localVersionRes.json()

      // 尝试从远程获取最新版本信息
      // 由于跨域限制，我们使用一个代理API来获取
      const remoteRes = await fetch('/api/check-update?t=' + Date.now())
      
      if (!remoteRes.ok) {
        // API 不可用，标记为检查失败但不显示错误
        setSyncStatus('uptodate')
        return
      }

      const remoteData = await remoteRes.json()

      if (!remoteData.success) {
        setSyncStatus('uptodate')
        return
      }

      const remoteVersion = remoteData.version

      // 对比版本
      if (remoteVersion.gunCount > localVersion.gunCount) {
        setNewGunCount(remoteVersion.gunCount - localVersion.gunCount)
        setSyncStatus('outdated')
        setMessage(`发现 ${remoteVersion.gunCount - localVersion.gunCount} 款新枪械！`)
      } else {
        setSyncStatus('uptodate')
      }
    } catch (err) {
      // 静默失败，不打扰用户
      console.log('版本检查失败:', err.message)
      setSyncStatus('uptodate')
    }
  }

  // 执行更新
  const handleUpdate = async () => {
    setSyncStatus('updating')
    
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false })
      })

      const data = await res.json()

      if (data.success) {
        setSyncStatus('uptodate')
        setMessage('更新成功！页面即将刷新...')
        
        // 3秒后刷新页面
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setSyncStatus('error')
        setMessage(data.message || '更新失败')
      }
    } catch (err) {
      setSyncStatus('error')
      setMessage('网络错误，请稍后重试')
    }
  }

  // 关闭提示
  const handleDismiss = () => {
    setSyncStatus('uptodate')
    // 记录本次忽略时间，24小时内不再提示
    localStorage.setItem('sync-dismissed', Date.now().toString())
  }

  // 如果用户24小时内忽略过，不显示
  useEffect(() => {
    const dismissed = localStorage.getItem('sync-dismissed')
    if (dismissed) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60)
      if (hoursSinceDismiss < 24) {
        setSyncStatus('uptodate')
      }
    }
  }, [])

  // 只在发现新版本时显示
  if (syncStatus !== 'outdated') return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
      <div className="glass rounded-xl p-4 border border-amber-500/30 shadow-lg shadow-amber-500/10 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">{message}</p>
            <p className="text-gray-500 text-xs mt-0.5">数据来源于 dpcamp.cn</p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 rounded-lg text-sm bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors duration-200"
            >
              立即更新
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
