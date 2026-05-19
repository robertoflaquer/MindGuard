# Wearables — Integração com Apple Watch e Galaxy Watch

> **Status:** Pesquisa / Planejamento  
> **Prioridade:** Alta — faz parte do roadmap Blua/MindGuard  
> **Última atualização:** 2026-05-11

---

## Visão Geral

O MindGuard precisa receber sinais fisiológicos (HRV, frequência cardíaca, sono, etc.) diretamente dos wearables do usuário, sem que ele precise preencher manualmente. O objetivo é ter uma sincronização automática toda manhã ao abrir o app — ou passiva em segundo plano.

### Sinais prioritários para coleta

| Sinal | Apple Watch | Galaxy Watch |
|---|---|---|
| HRV (variabilidade cardíaca) | ✅ HealthKit | ✅ Health Connect / Sensor SDK |
| Frequência cardíaca em repouso | ✅ | ✅ |
| Duração e qualidade do sono | ✅ | ✅ |
| Nível de estresse (estimado) | ❌ (indireto via HRV) | ✅ Samsung Sensor SDK |
| SpO₂ (saturação de oxigênio) | ✅ (Watch Series 6+) | ✅ |
| Passos e atividade física | ✅ | ✅ |

---

## Apple Watch — HealthKit

### Como funciona

O HealthKit é um framework nativo do iOS/watchOS. O Apple Watch **não tem API cloud direta** — os dados ficam no iPhone e são acessados pelo app via HealthKit. Não existe forma de buscar dados remotamente sem um app iOS instalado.

**Fluxo obrigatório:**
```
Apple Watch → iPhone (HealthKit) → App iOS (MindGuard) → Backend (REST)
```

### Passos para implementar

1. **Criar app iOS nativo** (Swift/SwiftUI) ou usar um SDK cross-platform como Open Wearables
2. **Solicitar permissões HealthKit** no app (`HKHealthStore.requestAuthorization`)
3. **Ativar Background Delivery** — entitlement `com.apple.developer.healthkit.background-delivery`
4. **Configurar `HKObserverQuery`** para receber notificações quando novos dados chegam (funciona mesmo com app fechado)
5. O app iOS envia os dados para o backend via REST na sincronização

### Autorização / Acesso

- **Não há aprovação da Apple** para usar HealthKit em apps pessoais
- Basta adicionar o capability `HealthKit` no Xcode e declarar no `Info.plist` o motivo de acesso
- Para apps publicados na App Store: a Apple revisa o uso, mas não exige pré-autorização
- **Custo:** Gratuito. Requer conta de desenvolvedor Apple ($99/ano para publicar na App Store)

### Limitações importantes

- HealthKit só funciona em iOS — não há SDK Android nem API cloud
- `Background Delivery` acorda o app no background mas com limitações de tempo
- Para sincronização confiável "toda manhã", a abordagem mais robusta é:
  - **Background App Refresh** com `BGProcessingTask` (iOS 13+)
  - Ou `HKObserverQuery` com `enableBackgroundDelivery(for:frequency:.immediate)`

### Links oficiais

- Documentação HealthKit: https://developer.apple.com/documentation/healthkit
- Background Delivery: https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_healthkit_background-delivery
- WWDC "Getting started with HealthKit": https://developer.apple.com/videos/play/wwdc2020/10664

---

## Galaxy Watch — Samsung Health + Health Connect

### Dois caminhos possíveis (importante)

Samsung oferece **duas APIs diferentes** e isso causou confusão durante a pesquisa:

| SDK | Para quê | Autorização necessária |
|---|---|---|
| **Samsung Health Data SDK** | Ler dados do app Samsung Health no Android | **Sim — parceria formal com Samsung** |
| **Android Health Connect** | Ler dados de qualquer app Android (incluindo Samsung Health) | Não — permissões de usuário apenas |
| **Samsung Health Sensor SDK** | Dados brutos do sensor BioActive (Galaxy Watch 4+) | Parceria recomendada |

### Caminho 1: Android Health Connect (recomendado para início)

O **Health Connect** é o framework nativo do Android (Google/AOSP), equivalente ao HealthKit no iOS. O Samsung Health já escreve automaticamente no Health Connect no Galaxy Watch 4 e posteriores.

**Fluxo:**
```
Galaxy Watch → Samsung Health App → Health Connect → App Android (MindGuard) → Backend
```

**Vantagens:**
- Gratuito, sem aprovação da Samsung
- Funciona com qualquer wearable Android (não só Galaxy Watch)
- API mantida pelo Google, padrão da plataforma
- SDK disponível em Kotlin/Java: `androidx.health.connect.client`

**Código básico (Kotlin):**
```kotlin
val client = HealthConnectClient.getOrCreate(context)
val response = client.readRecords(
    ReadRecordsRequest(
        recordType = HeartRateRecord::class,
        timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
    )
)
```

### Caminho 2: Samsung Health Data SDK (parceria Samsung)

Para acesso direto ao Samsung Health (mais dados, incluindo stress score proprietário):

1. Criar conta em https://developer.samsung.com/health
2. Desenvolver app Android com o SDK
3. **Solicitar parceria** via portal Samsung Developer para obter o `access code`
4. Após aprovação, o app pode tanto **ler** quanto **escrever** dados no Samsung Health

> ⚠️ **A escrita de dados exige aprovação formal**. A leitura básica funciona sem parceria, mas com dados limitados.

**Tempo de aprovação:** Variável (dias a semanas). Samsung analisa caso a caso.

### Links oficiais

- Health Connect Android: https://developer.android.com/health-and-fitness/guides/health-connect
- Samsung Health Data SDK: https://developer.samsung.com/health/android/data/guide/overview.html
- Samsung Health Sensor SDK: https://developer.samsung.com/health/android/sensor/guide/overview.html
- Processo de parceria: https://developer.samsung.com/health/android/data/guide/app-creation-process.html

---

## Estratégia de Implementação Recomendada

### Fase 1 — MVP (sem app nativo próprio)

Usar uma plataforma de integração de terceiros que já tem os SDKs implementados:

| Plataforma | Suporte | Preço | Observação |
|---|---|---|---|
| **Open Wearables** | Apple Health, Health Connect, Garmin, Polar, Whoop | **Gratuito** (MIT, self-hosted) | Melhor opção para MindGuard — sem custo por usuário |
| **Terra API** | +60 wearables incluindo Apple, Samsung | $399/mês (100k créditos) | Bom para escala, mas caro no início |
| **Vital** | Apple Health, Health Connect, Fitbit, etc. | Plano gratuito limitado | |
| **Validic** | Enterprise, +130 dispositivos | Preço sob consulta | Escala hospitalar |

**Recomendação:** **Open Wearables** — é open source (MIT), self-hosted (sem custo por usuário), e já fornece SDK Flutter/React Native que lê HealthKit e Health Connect e envia para seu backend via REST.

### Fase 2 — App nativo (longo prazo)

Desenvolver app iOS (Swift) e Android (Kotlin) com integração direta:
- iOS: HealthKit + `HKObserverQuery` com background delivery
- Android: Health Connect SDK + `WorkManager` para sync periódico

---

## Como a Sincronização Matinal Funciona

### Apple Watch (iOS)

```
1. Usuário usa o Apple Watch durante a noite (sono, HRV)
2. Dados ficam no HealthKit do iPhone
3. App iOS acorda em background via BGProcessingTask (geralmente de madrugada)
   OU via HKObserverQuery com background delivery habilitado
4. App lê os dados das últimas 24h/8h do HealthKit
5. Envia via POST /api/signals/batch para o MindGuard backend
6. Backend processa e atualiza análise de risco
```

**Frequência recomendada:** `frequency: .daily` no `enableBackgroundDelivery` — iOS controla o horário mas geralmente dispara entre 3h e 7h da manhã.

### Galaxy Watch (Android)

```
1. Usuário usa o Galaxy Watch durante a noite
2. Samsung Health sincroniza com Health Connect no Android
3. WorkManager com constraint NETWORK_CONNECTED agenda tarefa diária
4. Task Kotlin lê Health Connect e envia para o backend
```

**Código WorkManager (Kotlin):**
```kotlin
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.CONNECTED)
    .build()

val syncWork = PeriodicWorkRequestBuilder<WearableSyncWorker>(1, TimeUnit.DAYS)
    .setConstraints(constraints)
    .setInitialDelay(calculateDelayUntil7AM(), TimeUnit.MILLISECONDS)
    .build()

WorkManager.getInstance(context).enqueueUniquePeriodicWork(
    "wearable_morning_sync",
    ExistingPeriodicWorkPolicy.KEEP,
    syncWork
)
```

---

## Resumo de Custos

| Abordagem | Custo | Complexidade | Prazo estimado |
|---|---|---|---|
| Open Wearables (self-hosted) | **Gratuito** (infraestrutura própria) | Média | 2–4 semanas |
| Health Connect direto (Android) | **Gratuito** | Baixa-Média | 1–2 semanas |
| HealthKit direto (iOS) | $99/ano (conta Apple Dev) | Média | 2–3 semanas |
| Terra API | $399/mês | Baixa (API pronta) | 1–3 dias |
| Samsung Health Data SDK (parceria) | Gratuito (após aprovação) | Alta + burocracia | 1–3 meses (aguardar aprovação) |

---

## Próximos Passos

- [ ] Definir se o MindGuard vai ter app iOS/Android nativo ou web + PWA
- [ ] Criar conta em https://developer.samsung.com/health e avaliar processo de parceria
- [ ] Criar conta de desenvolvedor Apple (se ainda não tiver)
- [ ] Testar Open Wearables SDK em ambiente local — https://openwearables.io
- [ ] Implementar endpoint `/api/signals/batch` para aceitar lotes de sinais vindos dos wearables (já existe, confirmar schema)
- [ ] Definir janela de dados: enviar somente dados das últimas 8h (sono) ou 24h?

---

## Referências

- https://developer.apple.com/documentation/healthkit
- https://developer.android.com/health-and-fitness/guides/health-connect
- https://developer.samsung.com/health/android/data/guide/overview.html
- https://openwearables.io
- https://tryterra.co
- https://www.themomentum.ai/blog/integrating-wearable-technology-into-your-mobile-health-app
- https://mindsea.com/apple-health-google-fit-health-connect
