# MindGuard Frontend

Interface web do sistema MindGuard, construída com React + Vite + Tailwind CSS.

## Stack

- **React 18** + **Vite 5**
- **Tailwind CSS 3** para estilização
- **Zustand** para estado global
- **Recharts** para gráficos
- **Lucide React** para ícones
- **date-fns** para manipulação de datas
- **React Router DOM 6** para roteamento

## Pré-requisitos

- Node.js 18+
- Backend rodando em `http://localhost:3000`

## Instalação

```bash
cd mindguard-frontend
npm install
```

## Execução

```bash
npm run dev      # desenvolvimento — http://localhost:3001
npm run build    # build de produção (gera dist/)
npm run preview  # preview do build (vite preview)
npm start        # serve o build com `serve` na porta $PORT — usado no Railway
```

## Variáveis de ambiente

| Variável | Onde usar | Para quê |
|----------|-----------|----------|
| `VITE_API_URL` | Build do React | URL absoluta do backend (ex.: `https://mindguard-backend-xxxx.up.railway.app`). Em dev, deixar vazio usa o proxy do Vite para `http://localhost:3000` |

> ⚠️ `VITE_API_URL` é resolvida **no build**, não em runtime. Ao mudar essa variável no Railway, é obrigatório fazer **Redeploy** do serviço Frontend para o novo valor entrar em vigor.

## Páginas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/login` | `Login.jsx` | Autenticação |
| `/` | `Dashboard.jsx` | Painel principal + sinais + simulação wearable |
| `/questionnaires` | `Questionnaires.jsx` | PSS, GAD-7, CBI, OLBI, Daily Check-in |
| `/history` | `History.jsx` | Histórico de avaliações de risco |
| `/treatment` | `Treatment.jsx` | Agendamento de consultas |
| `/prescriptions` | `Prescriptions.jsx` | Prescrições médicas |
| `/settings` | `Settings.jsx` | Perfil e configurações |

## Stores Zustand

| Store | Responsabilidade |
|-------|-----------------|
| `useAuthStore` | Autenticação e JWT |
| `useSignalStore` | Sinais biométricos |
| `useRiskStore` | Avaliações de risco |
| `useQuestionnaireStore` | Questionários |
| `useAppointmentStore` | Agendamentos e especialistas |
| `useThemeStore` | Tema claro/escuro |
| `useToastStore` | Notificações toast |

## Estrutura

```
src/
├── components/   # GAD7Form, PrivateRoute, etc.
├── pages/        # uma pasta por rota
├── store/        # stores Zustand
├── services/     # api.js (axios)
└── assets/
```
