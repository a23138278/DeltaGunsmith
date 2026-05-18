'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import guns from '../../../data/guns.json'
import builds from '../../../data/builds.json'

export default function GunPage({ params }) {
  const { id } = use(params)
  const gun = guns.find(g => g.id === id)
  if (!gun) notFound()

  const [gunBuilds, setGunBuilds] = useState(builds.filter(b => b.gunId === id))
  const [copiedId, setCopiedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (buildId) => {
    if (!confirm('确定要删除这个改枪方案吗？此操作不可恢复。')) {
      return
    }

    setDeletingId(buildId)
    try {
      const res = await fetch(`/api/builds?id=${buildId}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        setGunBuilds(gunBuilds.filter(b => b.id !== buildId))
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
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors duration-300 text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </Link>

      <section className="glass rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row items-start gap-8">
          <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/10 flex items-center justify-center flex-shrink-0">
            {gun.image ? (
              <img
                src={gun.image}
                alt={gun.name}
                className="h-32 w-auto object-contain drop-shadow-2xl"
              />
            ) : (
              <span className="text-8xl">🔫</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {gun.category}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">{gun.name}</h1>
            <p className="text-gray-400 text-lg leading-relaxed">{gun.description}</p>
            <div className="mt-6 flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{gunBuilds.length}</div>
                <div className="text-xs text-gray-500">改枪方案</div>
              </div>
              <div className="w-px h-10 bg-white/[0.06]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {gunBuilds.length > 0 ? gunBuilds.reduce((acc, b) => acc + Object.keys(b.parts).length, 0) : 0}
                </div>
                <div className="text-xs text-gray-500">配件搭配</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title mb-0">
            改枪方案
            <span className="text-sm font-normal text-gray-500 ml-2">
              {gunBuilds.length} 套
            </span>
          </h2>
          <Link
            href={`/submit?gun=${gun.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/20 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            提交方案
          </Link>
        </div>

        {gunBuilds.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="text-6xl mb-4">🤔</div>
            <p className="text-gray-400 text-lg mb-2">暂无改枪方案</p>
            <p className="text-gray-600 text-sm mb-6">成为第一个为 {gun.name} 提交方案的人</p>
            <Link
              href={`/submit?gun=${gun.id}`}
              className="btn-primary inline-block"
            >
              提交改枪码
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {gunBuilds.map((build, index) => (
              <div
                key={build.id}
                className="glass rounded-2xl p-6 md:p-8 card-hover group"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-amber-400 transition-colors duration-300">
                        {build.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {build.author}
                        </span>
                        <span>·</span>
                        <span>{build.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleCopy(build.code, build.id)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-sm hover:bg-amber-500/20 transition-all duration-300"
                    >
                      {copiedId === build.id ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          已复制
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {build.code}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(build.id)}
                      disabled={deletingId === build.id}
                      className="p-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 disabled:opacity-50"
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
                </div>

                <p className="text-gray-300 mb-6 leading-relaxed">{build.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(build.parts).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] hover:border-amber-500/20 transition-colors duration-300"
                    >
                      <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">{key}</p>
                      <p className="text-white font-semibold text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
