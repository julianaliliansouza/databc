import { useState, useEffect, useRef } from "react"
import api from "../services/api"

const statusConfig = {
  pendente:   { label: "Aguardando preenchimento", color: "bg-gray-100 text-gray-600" },
  em_revisao: { label: "Em revisão pela equipe DataBC", color: "bg-yellow-100 text-yellow-700" },
  aprovado:   { label: "Tema aprovado ✅", color: "bg-green-100 text-green-700" },
  rejeitado:  { label: "Ajustes solicitados", color: "bg-red-100 text-red-700" },
}

export default function BrandProfile() {
  const [mensagens, setMensagens]   = useState([])
  const [input, setInput]           = useState("")
  const [loading, setLoading]       = useState(false)
  const [finalizado, setFinalizado] = useState(false)
  const [profile, setProfile]       = useState(null)
  const [temaStatus, setTemaStatus] = useState("pendente")
  const [temaObs, setTemaObs]       = useState("")
  const bottomRef                   = useRef(null)

  useEffect(() => { carregarDados() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [mensagens])

  async function carregarDados() {
    try {
      const res = await api.get("/brand-profile")
      if (res.data.historico?.length > 0) {
        setMensagens(res.data.historico.map(m => ({ role: m.role, text: m.content })))
      } else {
        await iniciarChat()
      }
      if (res.data.profile) {
        setProfile(res.data.profile)
        setTemaStatus(res.data.profile.tema_status || "pendente")
        setTemaObs(res.data.profile.tema_obs || "")
        setFinalizado(res.data.profile.onboarding_concluido)
      }
    } catch (e) { console.error(e) }
  }

  async function iniciarChat() {
    try {
      const res = await api.post("/brand-profile/iniciar")
      setMensagens([{ role: "assistant", text: res.data.mensagem }])
    } catch (e) { console.error(e) }
  }

  async function enviar() {
    if (!input.trim() || loading || finalizado) return
    const texto = input.trim()
    setInput("")
    setMensagens(prev => [...prev, { role: "user", text: texto }])
    setLoading(true)
    try {
      const res = await api.post("/brand-profile/chat", { mensagem: texto })
      setMensagens(prev => [...prev, { role: "assistant", text: res.data.mensagem }])
      if (res.data.finalizado) {
        setFinalizado(true)
        setTemaStatus("em_revisao")
        await carregarDados()
      }
    } catch (e) {
      setMensagens(prev => [...prev, { role: "assistant", text: "Ops! Tive um problema. Tente novamente." }])
    } finally { setLoading(false) }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  const status = statusConfig[temaStatus] || statusConfig.pendente

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🧠 DNA da Marca</h1>
          <p className="text-gray-500 text-sm mt-1">A IA aprende sobre sua empresa para personalizar tudo</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      {temaStatus === "rejeitado" && temaObs && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <strong>Observação da equipe DataBC:</strong> {temaObs}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col" style={{height:"520px"}}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">💬 Entrevista com IA</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensagens.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm text-sm text-gray-500">
                  <span className="animate-pulse">Digitando...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="p-4 border-t border-gray-100">
            {finalizado ? (
              <p className="text-center text-sm text-green-600 font-medium">
                ✅ Onboarding concluído! Aguardando aprovação do tema.
              </p>
            ) : (
              <div className="flex gap-2">
                <textarea
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Digite sua resposta..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                />
                <button
                  onClick={enviar}
                  disabled={loading || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 rounded-xl text-sm font-medium transition"
                >
                  Enviar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {profile && profile.onboarding_concluido ? (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                <h3 className="font-semibold text-gray-700">📋 Perfil extraído</h3>
                {profile.missao     && <InfoBlock label="Missão"     value={profile.missao} />}
                {profile.visao      && <InfoBlock label="Visão"      value={profile.visao} />}
                {profile.tom_de_voz && <InfoBlock label="Tom de voz" value={profile.tom_de_voz} />}
                {profile.setor      && <InfoBlock label="Setor"      value={`${profile.setor} — ${profile.nicho}`} />}
              </div>
              {profile.cores_primarias?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">🎨 Paleta de cores</h3>
                  <div className="flex gap-2 flex-wrap">
                    {profile.cores_primarias.map((cor, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" style={{backgroundColor: cor}} />
                        <span className="text-xs text-gray-400">{cor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6 text-center text-gray-400 text-sm">
              <p className="text-3xl mb-2">🧩</p>
              <p>O resumo aparece aqui após o onboarding.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5">{value}</p>
    </div>
  )
}
