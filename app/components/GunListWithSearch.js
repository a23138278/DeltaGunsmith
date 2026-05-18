'use client'

import { useState } from 'react'
import Link from 'next/link'

const categoryIcons = {
  '突击步枪': '🎯',
  '狙击步枪': '🔭',
  '冲锋枪': '⚡',
  '轻机枪': '💥',
  '手枪': '🔫',
  '霰弹枪': '🔥',
}

export default function GunListWithSearch({ guns, builds }) {
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [...new Set(guns.map(g => g.category))]
  const totalBuilds = builds.length

  const getBuildCount = (gunId) => {
    return builds.filter(b => b.gunId === gunId).length
  }

  const filteredGuns = searchQuery.trim()
    ? guns.filter(gun =>
        gun.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gun.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gun.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : guns

  const filteredCategories = searchQuery.trim()
    ? [...new Set(filteredGuns.map(g => g.category))]
    : categories

  const hasResults = filteredGuns.length > 0

  return (
    <div id="categories" className="max-w-7xl mx-auto px-6 py-8 space-y-16">
      <div className="relative max-w-xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-12 pr-10 py-4 text-base rounded-2xl"
          placeholder="搜索枪械名称、分类或描述..."
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {searchQuery.trim() && (
        <div className="text-center text-sm text-gray-500">
          {hasResults ? (
            <>找到 <span className="text-amber-400 font-semibold">{filteredGuns.length}</span> 款匹配的枪械</>
          ) : (
            <>未找到匹配 "<span className="text-amber-400">{searchQuery}</span>" 的枪械</>
          )}
        </div>
      )}

      {hasResults ? (
        filteredCategories.map(category => {
          const categoryGuns = filteredGuns.filter(gun => gun.category === category)
          const icon = categoryIcons[category] || '🔫'

          return (
            <section key={category}>
              <h2 className="section-title">
                <span className="text-2xl">{icon}</span>
                {category}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {categoryGuns.length} 款
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categoryGuns.map(gun => (
                  <Link
                    key={gun.id}
                    href={`/guns/${gun.id}`}
                    className="glass rounded-2xl overflow-hidden card-hover group"
                  >
                    <div className="h-44 bg-gradient-to-br from-white/[0.02] to-transparent flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {gun.image ? (
                        <img
                          src={gun.image}
                          alt={gun.name}
                          className="h-36 w-auto object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-7xl group-hover:scale-110 transition-transform duration-500">
                          {icon}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors duration-300">
                          {gun.name}
                        </h3>
                        <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {getBuildCount(gun.id)} 方案
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm leading-relaxed">{gun.description}</p>
                      <div className="mt-4 flex items-center text-amber-500/60 text-sm group-hover:text-amber-400 transition-colors duration-300">
                        查看详情
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg mb-2">没有找到匹配的枪械</p>
          <p className="text-gray-600 text-sm">试试其他关键词，如"突击步枪"、"AK"等</p>
        </div>
      )}
    </div>
  )
}
