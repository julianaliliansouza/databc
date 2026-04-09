import { useState } from "react"
import api from "../services/api"

const formatos = [
  { id: "feed",     label: "Feed",     size: "1080×1080", icon: "⬜" },
  { id: "stories",  label: "Stories",  size: "1080×1920", icon: "📱" },
  { id: "banner",   label: "Banner",   size: "1920×1080", icon: "🖥️" },
  { id: "facebook", label: "Facebook", size: "1200×630",  icon: "📘" },
  { id: "whatsapp", label: "WhatsApp", size: "800×800",   icon: "💬" },
]
const publicos  = [{id:"familias",label:"Famílias",icon:"👨‍👩‍👧"},{id:"casais",label:"Casais",icon:"💕"},{id:"aventura",label:"Aventura",icon:"🏔️"},{id:"corporativo",label:"Corp.",icon:"💼"},{id:"jovens",label:"Jovens",icon:"🎉"},{id:"senior",label:"Sênior",icon:"🌿"}]
const objetivos = [{id:"engajamento",label:"Engajamento",icon:"❤️"},{id:"vendas",label:"Vendas",icon:"💰"},{id:"brand",label:"Marca",icon:"⭐"},{id:"info",label:"Informação",icon:"ℹ️"},{id:"promocao",label:"Promoção",icon:"🏷️"}]
const tons      = [{id:"inspiracional",label:"Inspiracional",icon:"✨"},{id:"elegante",label:"Elegante",icon:"🎩"},{id:"animado",label:"Animado",icon:"🎉"},{id:"aventureiro",label:"Aventura",icon:"🏔️"},{id:"romantico",label:"Romântico",icon:"💕"},{id:"direto",label:"Direto",icon:"📋"}]

export default function CriarComIA() {
  const [form, setForm]           = useState({formato:"feed",publico:"familias",objetivo:"engajamento",tom:"inspiracional",contexto:""})
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [erro, setErro]           = useState("")

  const select = (campo, valor) => setForm(prev => ({...prev, [campo]: valor}))

  async function gerar() {
    setLoading(true); setErro(""); setResultado(null)
    try {
      const res = await api.post("/ia/gerar-criativo", form)
      setResultado(res.data)
    } catch(e) {
      setErro("Erro ao gerar criativo. Tente novamente.")
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">✨ Criar com IA</h1>
        <p className="text-gray-500 text-sm mt-1">IA gera imagem + copy baseado no DNA da sua marca</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <Section title="1. Formato">
            <div className="grid grid-cols-3 gap-2">
              {formatos.map(f => (
                <button key={f.id} onClick={() => select("formato", f.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition ${form.formato===f.id?"border-blue-500 bg-blue-50 text-blue-700":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <span>{f.icon}</span><span className="font-medium">{f.label}</span><span className="opacity-60">{f.size}</span>
                </button>
              ))}
            </div>
          </Section>
          <Section title="2. Público-alvo">
            <div className="flex flex-wrap gap-2">
              {publicos.map(p => <Chip key={p.id} selected={form.publico===p.id} onClick={() => select("publico",p.id)}>{p.icon} {p.label}</Chip>)}
            </div>
          </Section>
          <Section title="3. Objetivo">
            <div className="flex flex-wrap gap-2">
              {objetivos.map(o => <Chip key={o.id} selected={form.objetivo===o.id} onClick={() => select("objetivo",o.id)}>{o.icon} {o.label}</Chip>)}
            </div>
          </Section>
          <Section title="4. Tom e estilo">
            <div className="flex flex-wrap gap-2">
              {tons.map(t => <Chip key={t.id} selected={form.tom===t.id} onClick={() => select("tom",t.id)}>{t.icon} {t.label}</Chip>)}
            </div>
          </Section>
          <Section title="5. Contexto (opcional)">
            <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3}
              placeholder="Ex: promoção de verão, lançamento de pacote..." value={form.contexto}
              onChange={e => setForm(prev => ({...prev, contexto: e.target.value}))} />
          </Section>
          <button onClick={gerar} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2">
            {loading ? <><span className="animate-spin">⏳</span> Gerando... pode levar até 30s</> : "✨ Gerar Criativo com IA"}
          </button>
          {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}
        </div>
        <div className="space-y-4">
          {resultado ? (
            <>
              {resultado.imagem_url && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <img src={resultado.imagem_url} alt="Criativo" className="w-full object-cover" />
                </div>
              )}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                <h3 className="font-bold text-gray-800 text-lg">{resultado.headline}</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{resultado.copy}</p>
                {resultado.cta && <div className="bg-blue-50 rounded-lg px-3 py-2 text-blue-700 text-sm font-medium">👉 {resultado.cta}</div>}
                {resultado.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resultado.hashtags.map((h,i) => <span key={i} className="text-blue-500 text-xs">{h}</span>)}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">🎨 Editor</button>
                  <button className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">💾 Salvar</button>
                  <a href={resultado.imagem_url} target="_blank" rel="noreferrer" className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50 text-center">⬇️ Download</a>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 h-96 flex flex-col items-center justify-center text-gray-400 space-y-2">
              <span className="text-5xl">✨</span>
              <p className="font-medium text-sm">Configure e clique em Gerar</p>
              <p className="text-xs">A IA usa o DNA da sua marca automaticamente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({title, children}) {
  return <div className="space-y-2"><p className="text-sm font-semibold text-gray-700">{title}</p>{children}</div>
}
function Chip({selected, onClick, children}) {
  return <button onClick={onClick} className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${selected?"border-blue-500 bg-blue-50 text-blue-700":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{children}</button>
}
