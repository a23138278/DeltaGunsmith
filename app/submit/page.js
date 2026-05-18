'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import guns from '../../data/guns.json'

// 搜索参数包装组件
function SearchParamsWrapper({ children }) {
  return <Suspense fallback={<SubmitForm gunId="" />}>{children}</Suspense>
}

// 主页面组件
export default function SubmitPage() {
  return (
    <SearchParamsWrapper>
      <SubmitPageContent />
    </SearchParamsWrapper>
  )
}

// 实际内容组件
function SubmitPageContent() {
  const searchParams = useSearchParams()
  const preselectedGunId = searchParams.get('gun') || ''

  return <SubmitForm gunId={preselectedGunId} />
}

// 表单组件
function SubmitForm({ gunId: initialGunId }) {
  const [formData, setFormData] = useState({
    gunId: initialGunId,
    title: '',
    author: '',
    code: '',
    parts: {
      '枪管': '',
      '枪托': '',
      '握把': '',
      '瞄具': '',
      '弹匣': '',
      '枪口': ''
    }
  })

  // 如果有预选的枪械，自动填充
  useEffect(() => {
    if (initialGunId) {
      setFormData(prev => ({ ...prev, gunId: initialGunId }))
    }
  }, [initialGunId])

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '提交失败')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePartChange = (part, value) => {
    setFormData(prev => ({
      ...prev,
      parts: {
        ...prev.parts,
        [part]: value
      }
    }))
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="glass rounded-2xl p-12">
          <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">提交成功！</h2>
          <p className="text-gray-400 mb-8">感谢你的分享，改枪码已提交审核</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                setSubmitted(false)
                setFormData({
                  gunId: '',
                  title: '',
                  author: '',
                  code: '',
                  parts: { '枪管': '', '枪托': '', '握把': '', '瞄具': '', '弹匣': '', '枪口': '' }
                })
              }}
              className="btn-primary"
            >
              继续提交
            </button>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-all duration-300"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
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
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">提交改枪码</h1>
            <p className="text-gray-400">分享你的改枪方案，帮助其他玩家找到最佳配置</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-white font-semibold mb-2.5 text-sm">
                选择枪械 <span className="text-amber-500">*</span>
              </label>
              <select
                value={formData.gunId}
                onChange={(e) => setFormData({...formData, gunId: e.target.value})}
                className="input-field appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-gray-900">请选择枪械</option>
                {guns.map(gun => (
                  <option key={gun.id} value={gun.id} className="bg-gray-900">
                    {gun.name} - {gun.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-semibold mb-2.5 text-sm">
                  方案名称 <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="input-field"
                  placeholder="例如：AK-47 近战突击型"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2.5 text-sm">
                  你的昵称 <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  className="input-field"
                  placeholder="玩家A"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2.5 text-sm">
                改枪码 <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="input-field font-mono"
                placeholder="AK47-CQC-2024-001"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-4 text-sm">
                配件选择
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(formData.parts).map(([part, value]) => (
                  <div key={part}>
                    <label className="block text-gray-500 text-xs mb-1.5 uppercase tracking-wider">{part}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handlePartChange(part, e.target.value)}
                      className="input-field text-sm py-2.5"
                      placeholder="配件名称"
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl py-3 px-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-4 text-lg glow-amber disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '提交改枪码'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
