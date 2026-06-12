// src/pages/TeamsPreview.jsx
// Mockup visual de como o MindGuard se integra ao Microsoft Teams via bot.
// Pagina puramente visual — demonstra integracao corporativa na apresentacao.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Search, Phone, Video, MoreHorizontal, Smile, Paperclip,
  Send, Heart, MessageSquare, Sparkles, Wind, ClipboardList,
} from 'lucide-react'

function TeamsLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14.5 6h6.5v6.5a3.25 3.25 0 1 1-6.5 0V6Z" fill="#6264A7" />
      <text x="17.75" y="10.8" fill="white" fontSize="5" fontWeight="800" textAnchor="middle" fontFamily="Segoe UI">T</text>
      <circle cx="9.5" cy="6" r="2.5" fill="#6264A7" />
      <rect x="2.5" y="9.5" width="14" height="10" rx="1.5" fill="#6264A7" />
      <text x="9.5" y="17" fill="white" fontSize="7" fontWeight="800" textAnchor="middle" fontFamily="Segoe UI">T</text>
    </svg>
  )
}

function MindGuardAvatar({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden>
      <rect width="36" height="36" rx="9" fill="url(#mgGradTeams)" />
      <path d="M11 18c0-3 2-5 5-5 1.5 0 2.5.6 3 1.5.5-.9 1.5-1.5 3-1.5 3 0 5 2 5 5 0 4.5-8 9-8 9s-8-4.5-8-9z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      <defs>
        <linearGradient id="mgGradTeams" x1="0" y1="0" x2="36" y2="36">
          <stop stopColor="#A78BFA" />
          <stop offset="1" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ===================================================================
//  Roteiro de mensagens — exibidas progressivamente para parecer chat
// ===================================================================
const SCRIPT = [
  {
    from: 'bot',
    time: '09:02',
    type: 'message',
    content: 'Bom dia, Roberto! ☀️ Hora do seu check-in matinal. Como você está se sentindo hoje?',
  },
  {
    from: 'user',
    time: '09:14',
    type: 'message',
    content: 'Cansado, dormi mal de novo.',
  },
  {
    from: 'bot',
    time: '09:14',
    type: 'card',
    content: {
      title: 'Recebi! Anotei: cansaço + sono ruim 😴',
      body: 'Vi nos seus dados: 5h38min de sono ontem (3a noite abaixo de 6h) e HRV em queda. Quer fazer um exercício rápido agora?',
      buttons: [
        { label: 'Respiração 5 min', icon: 'wind', primary: true },
        { label: 'Refazer PSS-10', icon: 'clipboard' },
        { label: 'Falar com Helena', icon: 'heart' },
      ],
    },
  },
  {
    from: 'user',
    time: '09:15',
    type: 'message',
    content: 'Pode mandar o exercicio',
  },
  {
    from: 'bot',
    time: '09:15',
    type: 'card',
    content: {
      title: '🧘 Box Breathing — 4-4-4-4',
      body: 'Inspire 4s, segure 4s, expire 4s, segure 4s. Vou guiar você por 5 minutos. Reduz cortisol em ~18% segundo Cohen et al.',
      buttons: [
        { label: 'Iniciar', icon: 'wind', primary: true },
      ],
    },
  },
  {
    from: 'bot',
    time: '14:33',
    type: 'message',
    content: '👍 Você completou a respiração matinal! HRV ja subiu de 38 para 44ms. Continue assim.',
  },
  {
    from: 'bot',
    time: '14:34',
    type: 'message',
    content: 'Notei que voce tem deadline ativo do projeto Apollo. Reservei 5 min na sua agenda do Teams as 15:30 para uma pausa consciente. Posso confirmar?',
  },
]

const SIDEBAR_CHATS = [
  { name: 'Equipe Apollo', preview: 'Marcos: Reunião confirmada para...', unread: 3, avatar: 'AP', color: '#0EA5E9' },
  { name: 'Helena Rodrigues', preview: 'Ola Roberto, conseguiu fazer o PSS...', avatar: 'HR', color: '#A78BFA' },
  { name: 'MindGuard', preview: 'Bom dia, Roberto! Hora do check-in...', unread: 1, active: true, isBot: true },
  { name: 'CarePlus RH', preview: 'Sua proxima consulta foi confirmada', avatar: 'CP', color: '#34D399' },
  { name: 'Carla (Coach)', preview: 'Bom trabalho hoje! Continue assim.', avatar: 'C', color: '#FB923C' },
]

export default function TeamsPreview() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(2)
  const [typing,  setTyping]  = useState(false)

  useEffect(() => {
    if (visible >= SCRIPT.length) return
    setTyping(true)
    const t = setTimeout(() => {
      setTyping(false)
      setVisible((v) => v + 1)
    }, 1800)
    return () => clearTimeout(t)
  }, [visible])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f3f2f1', color: '#252423' }}>
      {/* Top Banner (back to app) */}
      <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium" style={{ background: '#A78BFA', color: 'white' }}>
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 hover:opacity-80 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para MindGuard
        </button>
        <span className="mx-2 opacity-50">·</span>
        <Sparkles className="w-3.5 h-3.5" />
        <span>Mockup: integração MindGuard ↔ Microsoft Teams (demonstrativo)</span>
      </div>

      {/* Teams app shell */}
      <div className="flex-1 flex" style={{ minHeight: 'calc(100vh - 32px)' }}>
        {/* Left rail (Teams icons) */}
        <div className="hidden md:flex flex-col items-center gap-1 py-3 px-1.5 w-14" style={{ background: '#3b3a39', color: 'white' }}>
          <RailIcon icon="💬" label="Chat" active />
          <RailIcon icon="👥" label="Equipes" />
          <RailIcon icon="📅" label="Calendar" />
          <RailIcon icon="📞" label="Calls" />
          <RailIcon icon="📁" label="Files" />
          <div className="mt-auto">
            <RailIcon icon="…" label="More" />
          </div>
        </div>

        {/* Chat list */}
        <div className="hidden lg:flex flex-col w-72 border-r" style={{ background: '#fff', borderColor: '#e1dfdd' }}>
          <div className="px-3 py-3 border-b" style={{ borderColor: '#e1dfdd' }}>
            <h2 className="text-base font-bold mb-2" style={{ color: '#252423' }}>Chat</h2>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: '#f3f2f1' }}>
              <Search className="w-3.5 h-3.5" style={{ color: '#605e5c' }} />
              <input
                className="bg-transparent border-none outline-none flex-1 text-sm"
                placeholder="Buscar"
                style={{ color: '#252423' }}
                readOnly
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {SIDEBAR_CHATS.map((chat) => (
              <ChatItem key={chat.name} chat={chat} />
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: '#fff' }}>
          {/* Chat header */}
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#e1dfdd' }}>
            <div className="flex items-center gap-3 min-w-0">
              <MindGuardAvatar size={32} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: '#252423' }}>MindGuard</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#6264a7', color: 'white' }}>BOT</span>
                </div>
                <div className="text-xs" style={{ color: '#605e5c' }}>Online · Responde em segundos</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <IconBtn icon={Video} />
              <IconBtn icon={Phone} />
              <IconBtn icon={MoreHorizontal} />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-8 py-6" style={{ background: '#fff' }}>
            <div className="max-w-3xl mx-auto flex flex-col gap-3">
              {/* Day separator */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px" style={{ background: '#e1dfdd' }} />
                <span className="text-xs font-semibold" style={{ color: '#605e5c' }}>Hoje · 11 de junho</span>
                <div className="flex-1 h-px" style={{ background: '#e1dfdd' }} />
              </div>

              {SCRIPT.slice(0, visible).map((msg, i) => (
                <MessageRow key={i} msg={msg} />
              ))}

              {typing && visible < SCRIPT.length && (
                <div className="flex items-end gap-2">
                  <MindGuardAvatar size={28} />
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: '#f3f2f1' }}>
                    <div className="flex items-center gap-1">
                      <span className="dot-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="dot-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="dot-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="px-3 sm:px-8 py-3 border-t" style={{ borderColor: '#e1dfdd', background: '#fff' }}>
            <div className="max-w-3xl mx-auto rounded-lg flex items-center gap-2 px-3 py-2" style={{ background: '#f3f2f1', border: '1px solid #e1dfdd' }}>
              <button title="Anexar"><Paperclip className="w-4 h-4" style={{ color: '#605e5c' }} /></button>
              <button title="Emoji"><Smile className="w-4 h-4" style={{ color: '#605e5c' }} /></button>
              <input
                className="bg-transparent border-none outline-none flex-1 text-sm"
                placeholder="Digite uma mensagem"
                style={{ color: '#252423' }}
                readOnly
              />
              <button className="px-3 py-1.5 rounded flex items-center gap-1.5 text-xs font-semibold" style={{ background: '#6264a7', color: 'white' }}>
                <Send className="w-3.5 h-3.5" />
                Enviar
              </button>
            </div>
            <p className="max-w-3xl mx-auto text-[11px] mt-2 text-center" style={{ color: '#605e5c' }}>
              MindGuard nunca compartilha conteúdo individual com a empresa — apenas agregados anônimos.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .dot-bounce {
          width: 6px; height: 6px; border-radius: 50%;
          background: #6264a7; display: inline-block;
          animation: dotBounce 1s infinite ease-in-out;
        }
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ===================================================================
//  Subcomponents
// ===================================================================
function RailIcon({ icon, label, active }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded transition cursor-pointer"
      style={{ background: active ? '#252423' : 'transparent' }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span className="text-[9px] font-semibold" style={{ color: active ? 'white' : '#c8c6c4' }}>{label}</span>
    </div>
  )
}

function IconBtn({ icon: Icon }) {
  return (
    <button className="p-2 rounded hover:bg-gray-100 transition">
      <Icon className="w-4 h-4" style={{ color: '#605e5c' }} />
    </button>
  )
}

function ChatItem({ chat }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 cursor-pointer transition"
      style={{ background: chat.active ? '#f5f0fc' : 'transparent', borderLeft: chat.active ? '3px solid #6264a7' : '3px solid transparent' }}
    >
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: chat.isBot ? 'transparent' : chat.color }}>
        {chat.isBot ? <MindGuardAvatar size={36} /> : (
          <span className="text-xs font-bold text-white">{chat.avatar}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate" style={{ color: '#252423' }}>{chat.name}</span>
          <span className="text-[10px] flex-shrink-0" style={{ color: '#605e5c' }}>09:14</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs truncate" style={{ color: '#605e5c' }}>{chat.preview}</span>
          {chat.unread && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: '#6264a7' }}>
              {chat.unread}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageRow({ msg }) {
  const isBot = msg.from === 'bot'

  if (msg.type === 'card') {
    return (
      <div className={`flex items-end gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
        {isBot && <MindGuardAvatar size={28} />}
        <div className="flex flex-col max-w-md">
          <AdaptiveCard card={msg.content} />
          <span className={`text-[10px] mt-1 ${isBot ? '' : 'text-right'}`} style={{ color: '#605e5c' }}>{msg.time}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      {isBot && <MindGuardAvatar size={28} />}
      <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} max-w-md`}>
        <div
          className="px-4 py-2.5 text-sm leading-relaxed"
          style={{
            background: isBot ? '#f3f2f1' : '#6264a7',
            color: isBot ? '#252423' : 'white',
            borderRadius: isBot ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
            maxWidth: '100%',
            wordBreak: 'break-word',
          }}
        >
          {msg.content}
        </div>
        <span className="text-[10px] mt-1" style={{ color: '#605e5c' }}>{msg.time}</span>
      </div>
    </div>
  )
}

function AdaptiveCard({ card }) {
  const ICONS = { wind: Wind, clipboard: ClipboardList, heart: Heart }
  return (
    <div className="rounded-xl overflow-hidden border" style={{ background: '#fff', borderColor: '#e1dfdd', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: '#e1dfdd' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#A78BFA' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#A78BFA' }}>MindGuard AI</span>
        </div>
        <div className="font-bold text-sm mb-1" style={{ color: '#252423' }}>{card.title}</div>
        <div className="text-xs leading-relaxed" style={{ color: '#605e5c' }}>{card.body}</div>
      </div>
      <div className="px-3 py-2 flex flex-wrap gap-1.5" style={{ background: '#fafafa' }}>
        {card.buttons.map((btn, i) => {
          const Icon = ICONS[btn.icon] || MessageSquare
          const primary = btn.primary
          return (
            <button
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition"
              style={primary
                ? { background: '#6264a7', color: 'white' }
                : { background: '#f3f2f1', color: '#252423', border: '1px solid #e1dfdd' }
              }
            >
              <Icon className="w-3 h-3" />
              {btn.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
