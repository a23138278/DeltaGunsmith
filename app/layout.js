import './globals.css'
import SyncButton from './components/SyncButton'

export const metadata = {
  title: '三角洲改枪码收集站',
  description: '收集分享三角洲行动最佳改枪方案',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#0a0a0f] text-white">
        <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-all duration-300">
                  <span className="text-xl">🔧</span>
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                    改枪码工坊
                  </span>
                  <span className="hidden sm:block text-[10px] text-gray-500 tracking-widest uppercase">
                    Delta Gunsmith
                  </span>
                </div>
              </a>
              <div className="flex items-center gap-1">
                <a
                  href="/"
                  className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-all duration-300"
                >
                  首页
                </a>
                <a
                  href="/admin"
                  className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-all duration-300"
                >
                  管理
                </a>
                <SyncButton />
                <a
                  href="/submit"
                  className="px-4 py-2 rounded-lg text-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all duration-300"
                >
                  + 提交改枪码
                </a>
              </div>
            </div>
          </div>
        </nav>

        <main className="pt-[72px]">
          {children}
        </main>

        <footer className="border-t border-white/[0.04] mt-20">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <span className="text-sm">🔧</span>
                </div>
                <span className="text-sm text-gray-500">© 2026 三角洲改枪码收集站</span>
              </div>
              <p className="text-xs text-gray-600">仅供学习交流使用 · 非官方工具</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
