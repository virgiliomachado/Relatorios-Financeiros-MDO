import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function getDashboardData() {
  const supabase = await createClient()
  
  // Verificar se está logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar lojas
  const { data: lojas } = await supabase
    .from('lojas')
    .select('*')
    .order('codigo')

  // Buscar último DRE
  const { data: ultimoDre } = await supabase
    .from('dre')
    .select('*, lojas(nome)')
    .eq('versao', 'gestor')
    .order('ano', { ascending: false })
    .order('mes', { ascending: false })
    .limit(11)

  return { user, lojas, dre: ultimoDre }
}

export default async function DashboardPage() {
  const { user, lojas, dre } = await getDashboardData()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)
  }

  // Calcular totais se houver dados
  const totais = dre?.reduce((acc, item) => ({
    receita: acc.receita + (item.receita_liquida || 0),
    resultado: acc.resultado + (item.resultado_liquido || 0),
  }), { receita: 0, resultado: 0 }) || { receita: 0, resultado: 0 }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            <span className="text-blue-600">MDO</span> Relatórios
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="text-sm text-red-600 hover:text-red-700">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Receita Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totais.receita)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Resultado Total</p>
            <p className={`text-2xl font-bold ${totais.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totais.resultado)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Lojas Ativas</p>
            <p className="text-2xl font-bold text-gray-900">
              {lojas?.filter(l => l.codigo !== 'ADM').length || 0}
            </p>
          </div>
        </div>

        {/* Lista de lojas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Lojas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lojas?.map((loja) => (
                  <tr key={loja.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      {loja.codigo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {loja.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {loja.cidade}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {loja.estado}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {dre?.length === 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-xl p-6 text-center">
            <p className="text-yellow-800">
              Nenhum dado de DRE importado ainda. Execute os scripts de importação para popular o dashboard.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}