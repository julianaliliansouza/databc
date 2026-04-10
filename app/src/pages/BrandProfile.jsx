import { useState, useEffect, useRef } from "react"
import api from "../services/api"

const statusConfig = {
  pendente:   { label: "Aguardando preenchimento", color: "bg-gray-100 text-gray-600" },
  em_revisao: { label: "Em revisão pela equipe DataBC", color: "bg-yellow-100 text-yellow-700" },
  aprovado:   { label: "Tema aprovado ✅", color: "bg-green-100 text-green-700" },
  rejeitado:  { label: "Ajustes solicitados", color: "bg-red-100 text-red-700" },
}

const tabs = ["💬 Chat", "🏢 Identidade", "👥 Público", "🗣️ Comunicação", "🎨 Visual", "📊 Negócio"]

export default function BrandProfile() {
  const [tab, setTab]             = useState(0)
  const [mensagens, setMensagens] = useState([])
  const [input, setInput]         = useState("")
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [finalizado, setFinalizado] = useState(false)
  const [temaStatus, setTemaStatus] = useState("pendente")
  const [temaObs, setTemaObs]     = useState("")
  const [form, setForm]           = useState({
    missao: "", visao: "", valores: "", historia: "",
    tom_de_voz: "inspiracional",
    palavras_ok: "", palavras_nao: "",
    publico_alvo: "",
    cores_primarias: "", cores_secundarias: "",
    tipografias: "", estilo_visual: "clean",
    setor: "", nicho: "", servicos_principais: "",
    sazonalidades: "", diferenciais: ""
  })
  const bottomRef = useRef(null)

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
        const p = res.data.profile
        setTemaStatus(p.tema_status || "pendente")
        setTemaObs(p.tema_obs || "")
        setFinalizado(p.onboarding_concluido)
        setForm({
          missao:             p.missao || "",
          visao:              p.visao || "",
          valores:            p.valores || "",
          historia:           p.historia || "",
          tom_de_voz:         p.tom_de_voz || "inspiracional",
          palavras_ok:        (p.palavras_ok || []).join(", "),
          palavras_nao:       (p.palavras_nao || []).join(", "),
          publico_alvo:       (p.publico_alvo || []).join("\n"),
          cores_primarias:    (p.cores_primarias || []).join(", "),
          cores_secundarias:  (p.cores_secundarias || []).join(", "),
          tipografias:        (p.tipografias || []).join(", "),
          estilo_visual:      p.estilo_visual || "clean",
          setor:              p.setor || "",
          nicho:              p.nicho || "",
          servicos_principais:(p.servicos_principais || []).join(", "),
          sazonalidades:      (p.sazonalidades || []).join(", "),
          diferenciais:       p.diferenciais || "",
        })
      }
    } catch (e) { console.error(e) }
  }

  async function iniciarChat() {
    try {
      const res = await api.post("/brand-profile/iniciar")
      setMensagens([{ role: "assistant", text: res.data.mensagem }])
    } catch (e) { console.error(e) }
  }

  async function enviarChat() {
    if (!input.trim() || loading || finalizado) return
    const texto = input.trim()
    setInput("")
    setMensagens(prev => [...prev, { role: "user", text: texto }])
    setLoading(true)
    try {
      const res = await api.post("/brand-profile/chat", { mensagem: texto })
      setMensagens(prev => [...prev, { role: "assistant", text: res.data.mensagem }])
      if (res.data.finalizado) { setFinalizado(true); setTemaStatus("em_revisao"); await carregarDados() }
    } catch (e) {
      setMensagens(prev => [...prev, { role: "assistant", text: "Ops! Tive um problema. Tente novamente." }])
    } finally { setLoading(false) }
  }

  async function salvarPerfil() {
    setSaving(true)
    try {
      const toArray = (str) => str ? str.split(",").map(s => s.trim()).filter(Boolean) : []
      const toArrayLines = (str) => str ? str.split("\n").map(s => s.trim()).filter(Boolean) : []
      await api.post("/brand-profile/salvar", {
        missao:             form.missao,
        visao:              form.visao,
        valores:            form.valores,
        historia:           form.historia,
        tom_de_voz:         form.tom_de_voz,
        palavras_ok:        toArray(form.palavras_ok),
        palavras_nao:       toArray(form.palavras_nao),
        publico_alvo:       toArrayLines(form.publico_alvo),
        cores_primarias:    toArray(form.cores_primarias),
        cores_secundarias:  toArray(form.cores_secundarias),
        tipografias:        toArray(form.tipografias),
        estilo_visual:      form.estilo_visual,
        setor:              form.setor,
        nicho:              form.nicho,
        servicos_principais:toArray(form.servicos_principais),
        sazonalidades:      toArray(form.sazonalidades),
        diferenciais:       form.diferenciais,
        onboarding_concluido: true,
      })
      await api.post("/brand-profile/compilar")
      alert("✅ Perfil salvo e brand_prompt recompilado!")
    } catch(e) {
      alert("Erro ao salvar. Tente novamente.")
    } finally { setSaving(false) }
  }

  const status = statusConfig[temaStatus] || statusConfig.pendente
  const F = ({ label, name, type="text", rows=1, hint="" }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {rows > 1
        ? <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows={rows} value={form[name]} onChange={e => setForm(p => ({...p, [name]: e.target.value}))} />
        : <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" type={type} value={form[name]} onChange={e => setForm(p => ({...p, [name]: e.target.value}))} />
      }
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🧠 DNA da Marca</h1>
          <p className="text-gray-500 text-sm mt-1">A IA aprende sobre sua empresa para personalizar tudo</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>{status.label}</span>
      </div>

      {temaStatus === "rejeitado" && temaObs && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <strong>Observação:</strong> {temaObs}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition min-w-fit ${tab === i ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0 — Chat */}
      {tab === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col" style={{height:"520px"}}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">💬 Entrevista com IA</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensagens.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm text-gray-500 animate-pulse">Digitando...</div></div>}
            <div ref={bottomRef} />
          </div>
          <div className="p-4 border-t border-gray-100">
            {finalizado ? <p className="text-center text-sm text-green-600 font-medium">✅ Onboarding concluído! Complete os dados nas outras abas.</p> : (
              <div className="flex gap-2">
                <textarea className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2}
                  placeholder="Digite sua resposta..." value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarChat() }}} />
                <button onClick={enviarChat} disabled={loading || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 rounded-xl text-sm font-medium transition">
                  Enviar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 1 — Identidade */}
      {tab === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">🏢 Identidade da marca</h2>
          <F label="Missão" name="missao" rows={3} hint="Por que a empresa existe?" />
          <F label="Visão" name="visao" rows={2} hint="Onde quer chegar?" />
          <F label="Valores" name="valores" rows={2} hint="Ex: hospitalidade, autenticidade, sustentabilidade" />
          <F label="História" name="historia" rows={4} hint="Como a empresa nasceu e evoluiu?" />
        </div>
      )}

      {/* Tab 2 — Público */}
      {tab === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">👥 Público-alvo</h2>
          <F label="Segmentos de público" name="publico_alvo" rows={6} hint="Um segmento por linha. Ex: Famílias 30-45 anos, buscam segurança e experiências memoráveis" />
        </div>
      )}

      {/* Tab 3 — Comunicação */}
      {tab === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">🗣️ Tom de voz e comunicação</h2>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Tom de voz</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.tom_de_voz} onChange={e => setForm(p => ({...p, tom_de_voz: e.target.value}))}>
              {["formal","casual","inspiracional","aventureiro","romantico","direto"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <F label="Palavras que PODE usar" name="palavras_ok" hint="Separadas por vírgula. Ex: descobrir, experiência, inesquecível" />
          <F label="Palavras que NUNCA usa" name="palavras_nao" hint="Separadas por vírgula. Ex: barato, promoção relâmpago, corra já" />
        </div>
      )}

      {/* Tab 4 — Visual */}
      {tab === 4 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">🎨 Identidade visual</h2>
          <F label="Cores primárias (hex)" name="cores_primarias" hint="Separadas por vírgula. Ex: #2D6A9F, #FFFFFF" />
          <F label="Cores secundárias (hex)" name="cores_secundarias" hint="Separadas por vírgula. Ex: #F4A300, #E8E8E8" />
          <F label="Tipografias" name="tipografias" hint="Separadas por vírgula. Ex: Playfair Display, Nunito" />
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Estilo visual</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.estilo_visual} onChange={e => setForm(p => ({...p, estilo_visual: e.target.value}))}>
              {["clean","vibrante","minimalista","rustico","luxo","aventura"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {form.cores_primarias && (
            <div className="flex gap-3 flex-wrap pt-2">
              {form.cores_primarias.split(",").map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full border border-gray-200" style={{backgroundColor: c.trim()}} />
                  <span className="text-xs text-gray-500">{c.trim()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5 — Negócio */}
      {tab === 5 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">📊 Contexto do negócio</h2>
          <F label="Setor" name="setor" hint="Ex: Turismo, Gastronomia, Moda..." />
          <F label="Nicho" name="nicho" hint="Ex: Agência de turismo receptivo em Balneário Camboriú" />
          <F label="Serviços principais" name="servicos_principais" hint="Separados por vírgula. Ex: pacotes nacionais, turismo receptivo" />
          <F label="Sazonalidades" name="sazonalidades" hint="Separadas por vírgula. Ex: verão, carnaval, festas regionais" />
          <F label="Diferenciais" name="diferenciais" rows={3} hint="O que torna a empresa única?" />
        </div>
      )}

      {/* Botão salvar */}
      {tab > 0 && (
        <button onClick={salvarPerfil} disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition">
          {saving ? "Salvando..." : "💾 Salvar e recompilar DNA da marca"}
        </button>
      )}
    </div>
  )
}
