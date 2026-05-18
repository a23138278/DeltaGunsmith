import guns from '../data/guns.json'
import builds from '../data/builds.json'
import GunListWithSearch from './components/GunListWithSearch'
import AutoSyncBanner from './components/AutoSyncBanner'

export default function Home() {
  const categories = [...new Set(guns.map(g => g.category))]
  const totalBuilds = builds.length

  return (
    <div>
      <AutoSyncBanner />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              已收录 {guns.length} 款枪械 · {totalBuilds} 套方案
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                三角洲
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500 bg-clip-text text-transparent text-glow">
                改枪码收集站
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed">
              精选最优改枪方案，一键复制即用
              <br className="hidden md:block" />
              从近战突击到远程狙击，找到属于你的最佳配置
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/submit"
                className="btn-primary text-lg px-10 py-4 glow-amber"
              >
                提交你的改枪码
              </a>
              <a
                href="#categories"
                className="px-8 py-4 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 text-lg"
              >
                浏览方案 ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '枪械总数', value: guns.length, suffix: '款' },
            { label: '改枪方案', value: totalBuilds, suffix: '套' },
            { label: '枪械分类', value: categories.length, suffix: '类' },
            { label: '今日更新', value: 2, suffix: '条' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-5 text-center">
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                {stat.value}<span className="text-lg ml-1">{stat.suffix}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <GunListWithSearch guns={guns} builds={builds} />
    </div>
  )
}
