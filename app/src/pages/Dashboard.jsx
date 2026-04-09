import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { usuario, tenant, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-gray-900">{tenant?.nome}</h1>
          <p className="text-xs text-gray-500">Plano {tenant?.plano}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{usuario?.nome}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">Sair</button>
        </div>
      </nav>
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">Banco de imagens</p>
            <p className="text-2xl font-semibold mt-1">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">Criativos gerados</p>
            <p className="text-2xl font-semibold mt-1">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">Posts agendados</p>
            <p className="text-2xl font-semibold mt-1">0</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-medium text-gray-900 mb-4">Acesso rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Banco de Imagens', icon: '🖼️', href: '/banco' },
              { label: 'DNA da Marca', icon: '🧠', href: '/brand-profile' },
              { label: 'Criar com IA', icon: '✨', href: '/criar' },
              { label: 'Editor', icon: '🎨', href: '/editor' },
              { label: 'Calendário', icon: '📅', href: '/calendario' },
            ].map(item => (
              <a key={item.href} href={item.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm text-gray-700 text-center">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
