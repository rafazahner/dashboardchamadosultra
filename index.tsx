
import React, { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  User,
  Timer,
  PauseCircle,
  PlusCircle,
  TrendingUp,
  XCircle,
  CalendarDays,
  History,
  Trophy
} from 'lucide-react';

/**
 * CONFIGURAÇÃO GLOBAL
 */
const CONFIG = {
  MOVIDESK_TOKEN: 'fb6ad8cd-1026-40b2-8224-f2a8dad2c97d',
  REFRESH_MS: 180000,
  NPS_REFRESH_MS: 60000,
  AVATAR_OPACITY: 0.25,
  AVATAR_FALLBACK_OPACITY: 0.08
};

const LOGO_URL = 'https://i.postimg.cc/C14PvBhv/Ultra-Academia-transparente.png';
const GOOGLE_SHEET_API = 'https://script.google.com/macros/s/AKfycbwow33xEPcD-y-1bkmgrLjAs7e65S9isuFw7Dw3AyQM1yG6dYC7SiPUNMpi9nRL62IU/exec';

const AGENTES_CONFIG = [
  { id: "Enzo", displayName: "Enzo", fullName: "Enzo Edner", avatar: "https://i.postimg.cc/Y9V35kWP/20260118-1607-Image-Generation-remix-01kf97zv0aetss6psayfc2efzd-removebg-preview.png" },
  { id: "Rafael", displayName: "Rafael", fullName: "Rafael Zahner", avatar: "https://i.postimg.cc/SN5hgzRZ/20260118-1613-Image-Generation-remix-01kf98bgatem9bbzz4md71z75y.png" },
  { id: "CAROLINE", displayName: "Carol", fullName: "CAROLINE ARAUJO DA COSTA", avatar: "https://i.postimg.cc/W4Zv5x24/unnamed-(7).jpg" },
  { id: "Rubens", displayName: "Rubão", fullName: "Rubens Rodrigues Junior", avatar: "https://i.postimg.cc/NfKyyBTW/rubao.png" }
];

const MOCK_RESUMO = {
  "pendentes": 0, "novos": 0, "em_atendimento": 0, "parados": 0, "abertos_hoje": 0,
  "abertos_mes": 0, "fora_prazo": 0, "reabertos": 0,
  "media_primeira_resposta": "0 min", "media_primeira_resposta_raw": 0,
  "media_primeira_resposta_mes": "0 min", "media_primeira_resposta_mes_raw": 0,
  "media_primeira_resposta_dia": "0 min", "media_primeira_resposta_dia_raw": 0,
  "media_solucao": "0h 00m", "media_solucao_raw": 0,
  "media_solucao_mes": "0h 00m", "media_solucao_mes_raw": 0,
  "media_solucao_dia": "0h 00m", "media_solucao_dia_raw": 0,
  "vencidos": { "venceram": 0, "vencem_hoje": 0, "vencem_semana": 0 }
};

const Gauge: React.FC<{ value: number, max: number, color: string }> = ({ value, max, color }) => {
  const clampedValue = Math.min(value, max);
  const percentage = clampedValue / max;
  const rotation = -90 + (percentage * 180);
  const tickValues = [0, 1, 2, 3, 4, 5, 6].map(i => Math.round((i * max) / 6));
  const ticks = tickValues.map(v => {
    const angle = Math.PI - (v / max * Math.PI);
    const x1 = 50 + 34 * Math.cos(angle);
    const y1 = 50 - 34 * Math.sin(angle);
    const x2 = 50 + 41 * Math.cos(angle);
    const y2 = 50 - 41 * Math.sin(angle);
    const tx = 50 + 47 * Math.cos(angle);
    const ty = 50 - 47 * Math.sin(angle);
    return { v, x1, y1, x2, y2, tx, ty };
  });

  return (
    <div className="relative w-full max-w-[280px] aspect-[5/3] overflow-hidden">
      <svg viewBox="0 0 100 65" className="w-full h-full overflow-visible">
        <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="#f1f5f9" strokeWidth="11" strokeLinecap="round" />
        <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeDasharray="119.4" strokeDashoffset={119.4 * (1 - percentage)} className="transition-all duration-1000 ease-out" style={{ opacity: 0.9 }} />
        {ticks.map(t => (
          <Fragment key={t.v}>
            <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={color} strokeWidth="1.2" strokeOpacity="0.4" />
            <text x={t.tx} y={t.ty} fontSize="4.8" fontWeight="900" textAnchor="middle" fill={color} fillOpacity="0.8" className="tabular-nums font-inter select-none">{t.v}</text>
          </Fragment>
        ))}
        <g transform={`rotate(${rotation} 50 50)`} className="transition-transform duration-1000 ease-out">
          <path d="M 48 50 L 52 50 L 50 14 Z" fill={color} style={{ filter: 'drop-shadow(0px 3px 3px rgba(0,0,0,0.15))' }} />
          <circle cx="50" cy="50" r="4.5" fill={color} />
          <circle cx="50" cy="50" r="1.8" fill="white" />
        </g>
      </svg>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string, value: string | number, icon?: React.ReactNode, color: string, trend?: string,
  isUrgent?: boolean, gaugeValue?: number, gaugeMax?: number, className?: string
}> = ({ label, value, icon, color, trend, isUrgent, gaugeValue, gaugeMax = 60, className = "" }) => {
  const isTMA = gaugeValue !== undefined;
  return (
    <div className={`relative border-2 rounded-3xl p-6 flex flex-col items-center justify-between text-center shadow-md transition-all duration-700 group overflow-hidden ${isUrgent ? 'bg-red-50 border-red-500 animate-pulse' : 'bg-white border-slate-100 hover:border-[#2fabab]/30'} ${className}`}>
      <div style={{ color: isUrgent ? '#ef4444' : color }} className={`w-full flex justify-center transition-all duration-700`}>
        {isTMA ? <Gauge value={gaugeValue!} max={gaugeMax} color={isUrgent ? '#ef4444' : color} /> : <div className={`group-hover:scale-110 transition-transform mb-6 mt-4 ${isUrgent ? 'animate-bounce' : ''}`}>{icon}</div>}
      </div>
      <div className="flex flex-col items-center mt-auto w-full">
        <span className={`text-[12px] font-black uppercase tracking-[0.2em] mb-3 leading-tight px-4 ${isUrgent ? 'text-red-600' : 'text-slate-400'} select-none`}>{label}</span>
        <span className={`font-black tracking-tighter leading-none whitespace-nowrap px-2 ${String(value).length > 5 ? 'text-5xl' : String(value).length > 4 ? 'text-6xl' : 'text-7xl'}`} style={{ color: isUrgent ? '#ef4444' : color }}>{value}</span>
      </div>
      {trend && <span className={`mt-4 mb-2 text-[11px] font-bold px-4 py-1.5 rounded-full ${isUrgent ? 'bg-red-200 text-red-700' : 'text-[#2fabab] bg-[#2fabab]/5'}`}>{trend}</span>}
      {!trend && <div className="h-4" />}
    </div>
  );
};

const AgentShowcaseCard: React.FC<{ agent: any, rank: number }> = ({ agent, rank }) => {
  const config = AGENTES_CONFIG.find(c => c.id === agent.agente);
  const getPlayerBadge = (pos: number) => (
    <div className="flex items-center group/badge">
      <div className="relative">
        <div className="bg-slate-900 h-8 flex items-center px-4 transform -skew-x-12 border-l-2 border-[#ff69b4] shadow-md">
          <span className="text-white font-black text-xl italic tracking-tighter transform skew-x-12 select-none leading-none">
            <span className="text-[#ff69b4]">P</span>{pos}
          </span>
        </div>
        <div className="absolute -bottom-2.5 left-4 bg-[#ff69b4] text-[6px] px-1 font-bold text-slate-900 uppercase tracking-tighter transform -skew-x-12">READY</div>
      </div>
    </div>
  );

  return (
    <div className="relative bg-white border-2 border-slate-100 rounded-3xl p-8 flex flex-col justify-between shadow-xl overflow-hidden group transition-all duration-700">
      <div className="absolute inset-0 pointer-events-none transition-all duration-700">
        {config?.avatar ? <img src={config.avatar} alt="" className="w-full h-full object-cover scale-110" style={{ opacity: CONFIG.AVATAR_OPACITY }} /> : (
          <div className="absolute -top-12 -right-12 grayscale" style={{ opacity: CONFIG.AVATAR_FALLBACK_OPACITY }}><User size={280} className="text-slate-300" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/40" />
      </div>

      <div className="z-10">
        <div className="flex justify-between items-start mb-6">
          {getPlayerBadge(rank)}
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase truncate drop-shadow-sm">{config?.displayName || agent.agente}</h2>
      </div>

      <div className="z-10 flex flex-col items-center gap-2 mt-4">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Encerrados Hoje</span>
        <span className="text-[130px] font-black leading-none tracking-tighter text-slate-800 block tabular-nums group-hover:scale-105 transition-transform duration-700">
          {agent.encerrados}
        </span>
      </div>

      <div className="z-10 mt-6 w-full space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Atividade Recente</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="space-y-1.5">
          {agent.recentTickets && agent.recentTickets.length > 0 ? (
            agent.recentTickets.map((t: any, idx: number) => (
              <div key={idx} className="bg-slate-50/90 backdrop-blur-sm border border-slate-100 rounded-xl p-2.5 flex flex-col group/row hover:bg-white hover:shadow-sm transition-all overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <div className="bg-slate-900 text-[#ff69b4] text-[9px] font-black px-1.5 py-0.5 rounded italic transform -skew-x-12 shrink-0">#{t.id}</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">CRIADO: {t.criado}</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold text-slate-700 truncate leading-tight flex-1">{t.subject}</span>
                  <div className="text-[10px] font-black text-[#2fabab] tabular-nums shrink-0">{t.hora}</div>
                </div>
                <div className="text-[8px] font-black text-[#ff69b4] uppercase mt-1 opacity-80">{t.status}</div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Aguardando Missão...</div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full flex h-2 overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${rank === 1 ? 'w-[100%] bg-[#ff69b4]' : rank === 2 ? 'w-[80%] bg-[#ff69b4]/70' : rank === 3 ? 'w-[60%] bg-[#ff69b4]/40' : 'w-[40%] bg-[#ff69b4]/20'}`} />
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ label: string, value: number, icon: React.ReactNode, color: string, isUrgent?: boolean }> = ({ label, value, icon, color, isUrgent }) => (
  <div className={`bg-white border ${isUrgent ? 'border-red-400 shadow-red-100 shadow-xl' : 'border-slate-200'} rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden h-full transition-all duration-700`}>
    <div className="flex justify-between items-start">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <div style={{ color }} className={`opacity-70 ${isUrgent ? 'animate-bounce' : ''}`}>{icon}</div>
    </div>
    <div className={`text-6xl font-black leading-none ${isUrgent ? 'animate-pulse' : ''}`} style={{ color }}>{value}</div>
    <div className={`absolute bottom-0 left-0 w-full h-2 ${isUrgent ? 'animate-pulse' : ''}`} style={{ backgroundColor: color }} />
  </div>
);

const Dashboard = () => {
  const [resumo, setResumo] = useState(MOCK_RESUMO);
  const [agentes, setAgentes] = useState(AGENTES_CONFIG.map(a => ({ agente: a.id, encerrados: 0, vencidos: 0, recentTickets: [] })));
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentView, setCurrentView] = useState(0);
  const [npsStats, setNpsStats] = useState({ pessimo: 0, ruim: 0, regular: 0, bom: 0, otimo: 0, total: 0, nps: 0, encerrados: 0 });
  const [carouselTimer, setCarouselTimer] = useState(20);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [activeNotification, setActiveNotification] = useState<{ operator: string, avatar: string, score?: number, ticketId?: string } | null>(null);
  const lastProcessedTicketId = useRef<string | null>(null);
  const lastNpsCount = useRef<number | null>(null);
  const touchStartX = useRef(0);

  const triggerNotification = (operatorId: string, score?: number, ticketId?: string) => {
    const op = operatorId?.trim().toLowerCase();
    console.log(`[Notification Debug] Solicitado card para: "${operatorId}" (Score: ${score}, Ticket: ${ticketId})`);

    // Busca o agente de forma mais flexível (checa se o nome contém ou é contido)
    const config = AGENTES_CONFIG.find(c => {
      if (!op) return false;
      const cId = c.id.toLowerCase();
      const cDisplay = c.displayName.toLowerCase();
      const cFull = c.fullName?.toLowerCase();

      return op === cId || op === cDisplay || op === cFull ||
        (cFull && op.includes(cFull)) ||
        op.includes(cId) ||
        cId.includes(op);
    });

    if (config) {
      console.log(`[Notification Debug] Sucesso! Agente encontrado: ${config.id}`);
      setActiveNotification({ operator: config.displayName, avatar: config.avatar, score, ticketId });

      // Toca o som de notificação (Agora usando o arquivo local alerta.mp3)
      try {
        const audio = new Audio('/alerta.mp3');
        audio.volume = 0.7; // Aumentei um pouco o volume
        audio.load();
        audio.play().catch(e => console.warn('[Audio Debug] Para o som tocar, você precisa clicar na página uma vez após carregar.', e));
      } catch (e) {
        console.error('[Audio Debug] Erro ao carregar arquivo local alerta.mp3:', e);
      }

      // Remove a notificação após 10 segundos
      setTimeout(() => setActiveNotification(null), 10000);
    } else {
      console.error(`[Notification Debug] FALHA: Nenhum agente em AGENTES_CONFIG corresponde a "${operatorId}"`);
    }
  };

  const fetchJson = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  };

  const fetchCount = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return 0;
      const text = await res.text();
      const cleanText = text.replace(/"/g, '').trim();
      const num = parseInt(cleanText, 10);
      return isNaN(num) ? 0 : num;
    } catch (e) {
      return 0;
    }
  };

  // Função para buscar TODOS os registros com paginação (similar ao Python)
  const fetchAllPaginated = async (baseUrl: string, maxPages: number = 20) => {
    const allRecords: any[] = [];
    const top = 1000; // Máximo da API
    let skip = 0;

    for (let page = 0; page < maxPages; page++) {
      const url = `${baseUrl}&$top=${top}&$skip=${skip}`;
      const batch = await fetchJson(url);

      if (!Array.isArray(batch) || batch.length === 0) {
        break; // Acabou a lista
      }

      allRecords.push(...batch);
      // console.log(`[Paginação] Página ${page + 1}: ${batch.length} registros (Total: ${allRecords.length})`);

      if (batch.length < top) {
        break; // Última página
      }

      skip += top;
    }

    return allRecords;
  };

  // Função para calcular minutos úteis (horário comercial 9h-18h, dias úteis)
  const calcularMinutosUteis = (inicio: Date, fim: Date): number => {
    if (inicio >= fim) return 0;

    const HORA_INICIO = { hour: 9, minute: 0, second: 0 };
    const HORA_FIM = { hour: 18, minute: 0, second: 0 };

    let inicioAjustado = new Date(inicio);
    let fimAjustado = new Date(fim);

    // Ajusta início para dentro da janela 09-18
    const horaInicio = inicioAjustado.getHours();
    if (horaInicio < 9) {
      inicioAjustado.setHours(9, 0, 0, 0);
    } else if (horaInicio >= 18) {
      inicioAjustado.setDate(inicioAjustado.getDate() + 1);
      inicioAjustado.setHours(9, 0, 0, 0);
    }

    // Ajusta fim para dentro da janela 09-18
    const horaFim = fimAjustado.getHours();
    if (horaFim > 18 || (horaFim === 18 && fimAjustado.getMinutes() > 0)) {
      fimAjustado.setHours(18, 0, 0, 0);
    } else if (horaFim < 9) {
      fimAjustado.setDate(fimAjustado.getDate() - 1);
      fimAjustado.setHours(18, 0, 0, 0);
    }

    let minutosUteis = 0;
    let cursor = new Date(inicioAjustado);

    while (cursor < fimAjustado) {
      // Pula Sábado(6) e Domingo(0) - JavaScript usa 0=Domingo, 6=Sábado
      // Python usa 5=Sábado, 6=Domingo (weekday() >= 5)
      const diaSemana = cursor.getDay();
      if (diaSemana === 0 || diaSemana === 6) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(9, 0, 0, 0);
        continue;
      }

      const fimExpediente = new Date(cursor);
      fimExpediente.setHours(18, 0, 0, 0);

      const limiteAtual = fimAjustado < fimExpediente ? fimAjustado : fimExpediente;

      if (cursor > limiteAtual) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(9, 0, 0, 0);
        continue;
      }

      // Diferença em minutos
      minutosUteis += (limiteAtual.getTime() - cursor.getTime()) / 60000;
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(9, 0, 0, 0);
    }

    return minutosUteis;
  };


  const fetchNpsData = async () => {
    let countPessimo = 0;
    let countRuim = 0;
    let countRegular = 0;
    let countBom = 0;
    let countOtimo = 0;
    const now = new Date();

    try {
      const gRes = await fetchJson(GOOGLE_SHEET_API);
      if (gRes && gRes.data && Array.isArray(gRes.data)) {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const filteredData = gRes.data.filter((item: any) => {
          if (!item.Data) return false;
          const itemDate = new Date(item.Data);
          return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        });

        filteredData.forEach((item: any) => {
          const nota = Number(item.Nota);
          if (nota === 1) countPessimo++;
          else if (nota === 2) countRuim++;
          else if (nota === 3) countRegular++;
          else if (nota === 4) countBom++;
          else if (nota === 5) countOtimo++;
        });

        if (filteredData.length > 0) {
          const latestEntry = filteredData[filteredData.length - 1];
          const latestTicketId = String(latestEntry.Ticket || latestEntry.TicketID || latestEntry.ID || latestEntry.Numero || latestEntry["Número do Chamado"] || '');
          const operatorName = latestEntry.Operador || latestEntry.Atendente || latestEntry.Agente || '';
          const score = latestEntry.Nota ? Number(latestEntry.Nota) : undefined;

          console.log('[NPS Debug] Dados recebidos:', { latestTicketId, operatorName, score, total: filteredData.length });

          const isNewTicket = latestTicketId !== lastProcessedTicketId.current;
          const countIncreased = lastNpsCount.current !== null && filteredData.length > lastNpsCount.current;

          if (lastProcessedTicketId.current === null) {
            // Primeiro carregamento
            lastProcessedTicketId.current = latestTicketId;
            lastNpsCount.current = filteredData.length;

            // Se for novo (menos de 5 min), mostra no load para não perder nada
            const itemDate = new Date(latestEntry.Data);
            if ((now.getTime() - itemDate.getTime()) / 60000 < 5 && operatorName) {
              console.log('[NPS Debug] Detectado NPS fresquinho no carregamento inicial.');
              triggerNotification(operatorName, score, latestTicketId);
            }
          } else if ((isNewTicket || countIncreased) && operatorName) {
            console.log(`[NPS Debug] NOVO NPS DETECTADO!`);
            triggerNotification(operatorName, score, latestTicketId);
            lastProcessedTicketId.current = latestTicketId;
            lastNpsCount.current = filteredData.length;
          }
        }

        lastNpsCount.current = filteredData.length;

        const totalSurveys = countPessimo + countRuim + countRegular + countBom + countOtimo;
        const promoters = countOtimo;
        const detractors = countPessimo + countRuim + countRegular;
        const npsScore = totalSurveys > 0 ? ((promoters - detractors) / totalSurveys) * 100 : 0;

        setNpsStats(prev => ({
          ...prev,
          pessimo: countPessimo,
          ruim: countRuim,
          regular: countRegular,
          bom: countBom,
          otimo: countOtimo,
          total: totalSurveys,
          nps: Math.round(npsScore)
        }));
      }
    } catch (e) {
      console.error('Erro Google API', e);
    }
  };

  const fetchData = async () => {
    try {
      const now = new Date();
      const padL = (n: number) => String(n).padStart(2, "0");

      const year = now.getFullYear();
      const month = padL(now.getMonth() + 1);
      const day = padL(now.getDate());

      const todayStartStr = `${year}-${month}-${day}T03:00:00.000Z`;
      const dEnd = new Date(now);
      dEnd.setDate(dEnd.getDate() + 1);
      const todayEndStr = `${dEnd.getFullYear()}-${padL(dEnd.getMonth() + 1)}-${padL(dEnd.getDate())}T02:59:59.00z`;
      const monthStartStr = `${year}-${month}-01T03:00:00.00z`;

      // Calcular o primeiro dia do próximo mês (fim do mês atual)
      const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
      const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
      const monthEndStr = `${nextYear}-${padL(nextMonth + 1)}-01T00:00:00.000Z`;

      const isoNow = now.toISOString();

      const agentResultsPromises = AGENTES_CONFIG.map(async (ag) => {
        const filterEncerrados = encodeURIComponent(`resolvedIn ge ${todayStartStr} and contains(owner/businessName, '${ag.id}')`);
        console.log(`[Agente ${ag.id}] Filtro: resolvedIn ge ${todayStartStr} and contains(owner/businessName, '${ag.id}')`);

        // Busca tickets ao invés de usar /count
        const ticketsBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,resolvedIn,status,createdDate&$filter=${filterEncerrados}&$orderby=resolvedIn desc`;
        console.log(`[Agente ${ag.id}] URL Base: ${ticketsBaseUrl}`);

        const ticketsData = await fetchAllPaginated(ticketsBaseUrl);
        const encerradosCount = ticketsData.length;
        const recentTicketsData = ticketsData.slice(0, 3);

        console.log(`[Agente ${ag.id}] Resultado: ${encerradosCount} tickets`);

        return {
          agente: ag.id,
          encerrados: encerradosCount,
          vencidos: 0,
          recentTickets: Array.isArray(recentTicketsData) ? recentTicketsData.map((t: any) => {
            const dtCri = new Date(t.createdDate);
            return {
              id: t.id,
              subject: t.subject,
              status: t.status,
              criado: `${padL(dtCri.getDate())}/${padL(dtCri.getMonth() + 1)}`,
              hora: t.resolvedIn ? new Date(new Date(t.resolvedIn).getTime() - (3 * 3600000)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'
            };
          }) : []
        };
      });

      const nextAgentes = await Promise.all(agentResultsPromises);

      // --- LOGICA VENCIDOS GLOBAL (Filtro exato solicitado pelo usuário) ---
      // Lógica: slaSolutionDate ne null E data menor que agora E (status New OU InAttendance OU Stopped)
      const filterVencidosUser = encodeURIComponent(`slaSolutionDate ne null and slaSolutionDate lt ${isoNow} and (baseStatus eq 'New' or baseStatus eq 'InAttendance' or baseStatus eq 'Stopped')`);
      const vencidosUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,baseStatus,status,slaSolutionDate,lastUpdate&$filter=${filterVencidosUser}&$top=100&$skip=0`;
      const vencidosData = await fetchJson(vencidosUrl);
      const countVencidosGlobal = Array.isArray(vencidosData) ? vencidosData.length : 0;

      // --- LOGICA NOVOS ---
      const novosBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,status,baseStatus,createdDate,owner&$filter=${encodeURIComponent("baseStatus eq 'New'")}&$orderby=createdDate asc`;
      const novosData = await fetchAllPaginated(novosBaseUrl);
      const countNew = novosData.length;


      // --- LOGICA PARADOS ---
      const paradosBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,status,baseStatus,justification,createdDate&$filter=${encodeURIComponent("baseStatus eq 'Stopped'")}`;
      const paradosData = await fetchAllPaginated(paradosBaseUrl);
      const countParados = paradosData.length;

      // --- LOGICA PENDENTES ---
      const pendentesBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,status,baseStatus,owner,createdDate&$filter=${encodeURIComponent("(baseStatus eq 'New' or baseStatus eq 'InAttendance' or baseStatus eq 'Stopped')")}&$orderby=createdDate desc`;
      const pendentesData = await fetchAllPaginated(pendentesBaseUrl);
      const countPendentes = pendentesData.length;

      // --- LOGICA EM ATENDIMENTO ---
      const emAtendimentoBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,status,baseStatus,owner,createdDate&$filter=${encodeURIComponent("baseStatus eq 'InAttendance'")}`;
      const emAtendimentoData = await fetchAllPaginated(emAtendimentoBaseUrl);
      const countInAtt = emAtendimentoData.length;


      // --- LOGICA ABERTOS HOJE (COM PAGINAÇÃO COMPLETA) ---
      // Busca TODOS os chamados criados hoje (incluindo cancelados)
      const filterHoje = encodeURIComponent(`createdDate ge ${todayStartStr} and createdDate lt ${todayEndStr}`);
      const hojeBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,createdDate,baseStatus,status,owner&$filter=${filterHoje}&$orderby=createdDate desc`;
      const chamadosHojeData = await fetchAllPaginated(hojeBaseUrl);
      const countHoje = chamadosHojeData.length;


      // --- LOGICA CHAMADOS DO MÊS (COM PAGINAÇÃO COMPLETA) ---
      const filterMes = encodeURIComponent(`createdDate ge ${monthStartStr} and createdDate lt ${monthEndStr}`);
      const mesBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,createdDate,status,owner&$filter=${filterMes}&$orderby=createdDate desc`;
      const chamadosMesData = await fetchAllPaginated(mesBaseUrl);
      const countMes = chamadosMesData.length;

      // --- LOGICA FORA DO PRAZO (COM PAGINAÇÃO COMPLETA) ---
      // Busca tickets resolvidos no mês que foram resolvidos após o prazo SLA
      const filterForaPrazo = encodeURIComponent(`(baseStatus eq 'Resolved' or baseStatus eq 'Closed') and lastUpdate ge ${monthStartStr}`);
      const foraPrazoBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,subject,slaSolutionDate,resolvedIn,owner&$filter=${filterForaPrazo}&$orderby=resolvedIn desc`;
      const foraPrazoData = await fetchAllPaginated(foraPrazoBaseUrl);

      // Filtra apenas os que foram resolvidos NESTE mês e após o prazo
      const ticketsForaPrazo = foraPrazoData.filter((ticket: any) => {
        const prazo = ticket.slaSolutionDate;
        const resolucao = ticket.resolvedIn;

        if (!resolucao || !prazo) return false;

        // Garante que foi resolvido NESTE mês
        if (resolucao < monthStartStr || resolucao >= monthEndStr) return false;

        // Verifica se resolveu após o prazo
        return resolucao > prazo;
      });

      const countFora = ticketsForaPrazo.length;

      // --- LOGICA TMA 1ª RESPOSTA (COM PAGINAÇÃO E MINUTOS ÚTEIS) ---
      // Busca tickets desde 01/01/2026 que tenham slaRealResponseDate (igual ao Python)
      const dataInicio2026 = "2026-01-01T00:00:00.000Z";
      const filterTma1Resp = encodeURIComponent(`createdDate ge ${dataInicio2026}`);
      const tma1RespBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,createdDate,slaRealResponseDate&$filter=${filterTma1Resp}`;
      const tma1RespData = await fetchAllPaginated(tma1RespBaseUrl);



      // console.log(`[TMA] Total buscado: ${tma1RespData.length}`);
      const listaTempos: number[] = [];
      const listaTemposMes: number[] = [];
      const listaTemposDia: number[] = [];

      let semResposta = 0;
      tma1RespData.forEach((t: any) => {
        if (!t.slaRealResponseDate) {
          semResposta++;
          return;
        }

        // Conversão para Horário Brasil (-3h) - Exatamente como Python
        const dtCriacao = new Date(new Date(t.createdDate).getTime() - (3 * 3600000));
        const dtResposta = new Date(new Date(t.slaRealResponseDate).getTime() - (3 * 3600000));

        // Cálculo de minutos úteis (9h-18h, dias úteis)
        const minutos = calcularMinutosUteis(dtCriacao, dtResposta);
        listaTempos.push(minutos); // Python adiciona TODOS os minutos, inclusive 0

        // Filtra para Mês e Dia
        if (t.createdDate >= monthStartStr) {
          listaTemposMes.push(minutos);
        }
        if (t.createdDate >= todayStartStr) {
          listaTemposDia.push(minutos);
        }

        // Log do primeiro ticket para debug
        if (listaTempos.length === 1) {
          console.log(`[TMA Debug] Primeiro ticket:`);
          console.log(`  Criação: ${dtCriacao.toISOString()}`);
          console.log(`  Resposta: ${dtResposta.toISOString()}`);
          console.log(`  Minutos calculados: ${minutos}`);
        }
      });

      // console.log(`[TMA] Sem resposta: ${semResposta}, Com dados válidos: ${listaTempos.length}`);
      // console.log(`[TMA] Tickets: ${listaTempos.length}, Média: ${listaTempos.length > 0 ? listaTempos.reduce((a, b) => a + b, 0) / listaTempos.length : 0}`);
      const tma1Res = listaTempos.length > 0 ? Math.round(listaTempos.reduce((a, b) => a + b, 0) / listaTempos.length) : 0;
      const tma1ResMes = listaTemposMes.length > 0 ? Math.round(listaTemposMes.reduce((a, b) => a + b, 0) / listaTemposMes.length) : 0;
      const tma1ResDia = listaTemposDia.length > 0 ? Math.round(listaTemposDia.reduce((a, b) => a + b, 0) / listaTemposDia.length) : 0;

      // --- LOGICA TMA SOLUÇÃO (COM PAGINAÇÃO E MINUTOS ÚTEIS) ---
      // Busca tickets resolvidos desde 01/01/2026
      const dataInicio2026Sol = "2026-01-01T00:00:00.000Z";
      const filterTmaSol = encodeURIComponent(`resolvedIn ge ${dataInicio2026Sol}`);
      const tmaSolBaseUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,createdDate,resolvedIn,stoppedTimeWorkingTime&$filter=${filterTmaSol}`;
      const tmaSolData = await fetchAllPaginated(tmaSolBaseUrl);

      const temposFinais: number[] = [];
      const temposFinaisMes: number[] = [];
      const temposFinaisDia: number[] = [];

      tmaSolData.forEach((t: any) => {
        if (!t.resolvedIn) return;

        // Conversão para Horário Brasil (-3h)
        const criacao = new Date(new Date(t.createdDate).getTime() - (3 * 3600000));
        const resolucao = new Date(new Date(t.resolvedIn).getTime() - (3 * 3600000));

        // 1. Tempo Bruto em Horas Úteis
        const bruto = calcularMinutosUteis(criacao, resolucao);

        // 2. Tempo Parado em Horas Úteis (já vem em minutos da API)
        const parado = t.stoppedTimeWorkingTime || 0;

        // 3. Tempo Líquido
        let liquido = bruto - parado;
        if (liquido < 0) liquido = 0;

        temposFinais.push(liquido);

        if (t.resolvedIn >= monthStartStr) {
          temposFinaisMes.push(liquido);
        }
        if (t.resolvedIn >= todayStartStr) {
          temposFinaisDia.push(liquido);
        }
      });

      const tmaSolMinutos = temposFinais.length > 0 ? temposFinais.reduce((a, b) => a + b, 0) / temposFinais.length : 0;
      const tmaSolMinutosMes = temposFinaisMes.length > 0 ? temposFinaisMes.reduce((a, b) => a + b, 0) / temposFinaisMes.length : 0;
      const tmaSolMinutosDia = temposFinaisDia.length > 0 ? temposFinaisDia.reduce((a, b) => a + b, 0) / temposFinaisDia.length : 0;

      const tmaSol = Math.round(tmaSolMinutos * 10) / 10;
      const tmaSolMes = Math.round(tmaSolMinutosMes * 10) / 10;
      const tmaSolDia = Math.round(tmaSolMinutosDia * 10) / 10;

      // --- NOVA LÓGICA TMA SOLUÇÃO HOJE (USER REQUEST) ---
      // Lógica Baseada no Script Python: (lifeTimeWorkingTime - stoppedTimeWorkingTime) / count
      // Filtra por Resolved ou Canceled e Data >= Hoje
      const filterTmaSolHoje = encodeURIComponent(`(baseStatus eq 'Resolved' or baseStatus eq 'Canceled') and resolvedIn ge ${todayStartStr}`);
      const tmaSolHojeUrl = `https://api.movidesk.com/public/v1/tickets?token=${CONFIG.MOVIDESK_TOKEN}&$select=id,lifeTimeWorkingTime,stoppedTimeWorkingTime,baseStatus&$filter=${filterTmaSolHoje}&$orderby=resolvedIn desc`;
      const tmaSolHojeData = await fetchAllPaginated(tmaSolHojeUrl);

      let totalMinutesHoje = 0;
      let countHojeSol = 0;

      tmaSolHojeData.forEach((t: any) => {
        const life = t.lifeTimeWorkingTime || 0;
        const stopped = t.stoppedTimeWorkingTime || 0;
        let realWork = life - stopped;
        if (realWork < 0) realWork = 0;
        totalMinutesHoje += realWork;
        countHojeSol++;
      });

      const tmaSolMinutosDiaNew = countHojeSol > 0 ? totalMinutesHoje / countHojeSol : 0;
      const tmaSolDiaNew = Math.round(tmaSolMinutosDiaNew * 10) / 10;

      // --- LOGICA NPS / SATISFAÇÃO ---
      await fetchNpsData();
      setNpsStats(prev => ({ ...prev, encerrados: countMes }));

      setResumo(prev => ({
        ...prev,
        pendentes: countPendentes,
        novos: countNew,
        em_atendimento: countInAtt,
        parados: countParados,
        abertos_hoje: countHoje,
        abertos_mes: countMes,
        fora_prazo: countFora,
        media_primeira_resposta: `${tma1Res} min`,
        media_primeira_resposta_raw: tma1Res,
        media_primeira_resposta_mes: `${tma1ResMes} min`,
        media_primeira_resposta_mes_raw: tma1ResMes,
        media_primeira_resposta_dia: `${tma1ResDia} min`,
        media_primeira_resposta_dia_raw: tma1ResDia,
        media_solucao: `${Math.round(tmaSol)} min`,
        media_solucao_raw: tmaSol,
        media_solucao_mes: `${Math.round(tmaSolMes)} min`,
        media_solucao_mes_raw: tmaSolMes,
        media_solucao_dia: `${Math.round(tmaSolDiaNew)} min`,
        media_solucao_dia_raw: tmaSolDiaNew,
        vencidos: { venceram: countVencidosGlobal, vencem_hoje: 0, vencem_semana: 0 }
      }));

      setAgentes(nextAgentes);
      setLastUpdate(new Date());
      setIsOffline(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setIsOffline(true);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselTimer((prev) => {
        if (prev <= 1) {
          setCurrentView((v) => (v + 1) % 3);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    fetchData();
    const rt = setInterval(fetchData, CONFIG.REFRESH_MS);
    const npsRt = setInterval(fetchNpsData, CONFIG.NPS_REFRESH_MS);
    const ct = setInterval(() => setCurrentTime(new Date()), 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const numKey = parseInt(e.key);

      if (key === 'A') {
        console.log('[NPS Debug] Busca manual acionada (Tecla A)');
        fetchNpsData();
      } else if (!isNaN(numKey) && numKey >= 1 && numKey <= 5) {
        // Dispara uma notificação de teste para o Enzo com a nota pressionada
        triggerNotification('Enzo', numKey, '123456');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      clearInterval(rt);
      clearInterval(npsRt);
      clearInterval(ct);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragOffset(e.touches[0].clientX - touchStartX.current);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 30; // Apenas 30px — pequeno deslize ou toque já muda a tela
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset < 0) setCurrentView((v) => (v + 1) % 3);
      else setCurrentView((v) => (v - 1 + 3) % 3);
    }
    setDragOffset(0);
    setCarouselTimer(20);
  };

  const sortedAgentes = useMemo(() => [...agentes].sort((a, b) => b.encerrados - a.encerrados), [agentes]);
  const diffSeconds = Math.floor((currentTime.getTime() - lastUpdate.getTime()) / 1000);

  return (
    <div
      className="flex flex-col h-screen w-screen p-4 space-y-4 overflow-hidden bg-white text-slate-900 relative touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <header className="flex justify-between items-center shrink-0 h-20">
        <div className="flex items-center gap-6">
          <img src={LOGO_URL} alt="Ultra" className="h-16 w-auto" />
          <div className="h-12 w-px bg-slate-200" />
          <div>
            <h1 className="text-2xl font-black uppercase leading-none">
              {currentView === 0 ? 'Visão Geral do Suporte' : currentView === 1 ? 'Produtividade por Operador' : 'Satisfação do Cliente (NPS)'}
            </h1>
            <div className="flex items-center gap-4 mt-1.5 text-sm font-bold text-slate-400">
              <span className={isOffline ? 'text-red-500 font-black' : 'text-[#2fabab]'}>{isOffline ? 'DESCONECTADO' : 'CONECTADO AO MOVIDESK'}</span>
              <span>|</span>
              <span>Atualizado há {diffSeconds}s</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div
            onClick={() => { setCurrentView((v) => (v + 1) % 3); setCarouselTimer(20); }}
            className="inline-flex items-center justify-between gap-4 px-5 py-3 min-w-[230px] bg-[#F5FBFF] rounded-full shadow-[0_8px_18px_rgba(0,0,0,0.08)] select-none cursor-pointer active:scale-95 transition-transform"
            title="Clique para trocar de tela"
          >
            <div className="flex flex-col leading-none">
              <span className="text-[10px] tracking-[0.12em] font-bold text-[#8AA2AD] mb-1.5 font-sans whitespace-nowrap">PRÓXIMA TELA</span>
              <div className="text-[26px] font-black text-[#16B6BE] font-sans -mt-0.5">
                <span className="tabular-nums">{carouselTimer}</span><span className="text-xl">s</span>
              </div>
            </div>
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(22,182,190,0.18)" strokeWidth="5.5" />
                <circle
                  cx="22" cy="22" r="18"
                  fill="none"
                  stroke="#16B6BE"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeDasharray={113.097}
                  strokeDashoffset={113.097 * (1 - carouselTimer / 20)}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
            </div>
          </div>
          <div className="text-6xl font-black text-[#2fabab] tabular-nums tracking-tighter">
            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Container Deslizante */}
      <div className="flex-1 min-h-0 relative overflow-hidden rounded-3xl">
        <div
          className="flex h-full w-full"
          style={{
            transform: `translateX(calc(-${currentView * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {/* VIEW 0: Visão Geral */}
          <div className="min-w-full h-full p-1 flex flex-col space-y-6 overflow-y-auto">
            <div className="grid grid-cols-5 gap-4 shrink-0 h-44">
              <KpiCard label="Pendentes" value={resumo.pendentes} icon={<AlertCircle size={40} />} color="#1e293b" />
              <KpiCard label="Novos" value={resumo.novos} icon={<PlusCircle size={40} />} color="#2fabab" />
              <KpiCard label="Em Atendimento" value={resumo.em_atendimento} icon={<Timer size={40} />} color="#C23C8E" />
              <KpiCard label="Parados" value={resumo.parados} icon={<PauseCircle size={40} />} color="#f08228" />
              <KpiCard label="Vencidos" value={resumo.vencidos.venceram} icon={<XCircle size={40} />} color="#ef4444" isUrgent={resumo.vencidos.venceram > 0} />
            </div>
            <div className="flex-1 min-h-0 grid grid-cols-5 gap-6">
              <MetricCard label="Chamados no Mês" value={resumo.abertos_mes} icon={<CalendarDays size={48} />} color="#1e293b" />
              <MetricCard label="Fora do Prazo" value={resumo.fora_prazo} icon={<History size={48} />} color="#ef4444" />
              <MetricCard label="Abertos Hoje" value={resumo.abertos_hoje} icon={<TrendingUp size={48} />} color="#C23C8E" />
              <div className="flex flex-col gap-6">
                <MetricCard className="flex-1" label="TMA 1ª Resp Hoje" value={resumo.media_primeira_resposta_dia} color="#2fabab" gaugeValue={resumo.media_primeira_resposta_dia_raw} gaugeMax={60} isUrgent={resumo.media_primeira_resposta_dia_raw > 60} />
                <MetricCard className="flex-1" label="TMA 1ª Resp Mês" value={resumo.media_primeira_resposta_mes} color="#2fabab" gaugeValue={resumo.media_primeira_resposta_mes_raw} gaugeMax={60} isUrgent={resumo.media_primeira_resposta_mes_raw > 60} />
              </div>
              <div className="flex flex-col gap-6">
                <MetricCard className="flex-1" label="TMA Solução Hoje" value={resumo.media_solucao_dia} color="#2fabab" gaugeValue={resumo.media_solucao_dia_raw} gaugeMax={240} isUrgent={resumo.media_solucao_dia_raw > 120} />
                <MetricCard className="flex-1" label="TMA Solução Mês" value={resumo.media_solucao_mes} color="#2fabab" gaugeValue={resumo.media_solucao_mes_raw} gaugeMax={240} isUrgent={resumo.media_solucao_mes_raw > 120} />
              </div>
            </div>
          </div>

          {/* VIEW 1: Agentes */}
          <div className="min-w-full h-full p-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-6 h-full">
              {sortedAgentes.slice(0, 4).map((ag, idx) => <AgentShowcaseCard key={idx} agent={ag} rank={idx + 1} />)}
            </div>
          </div>

          {/* VIEW 2: NPS */}
          <div className="min-w-full h-full p-1 overflow-hidden flex flex-col gap-4">
            <div className="grid grid-cols-5 gap-6 flex-1 min-h-0">
              {/* Péssimo */}
              <div className="col-span-1 rounded-3xl p-6 flex flex-col items-center justify-center text-white shadow-xl relative overflow-hidden group bg-slate-900">
                <div className="absolute inset-0">
                  <img src="https://i.postimg.cc/FszKCyQx/Gemini-Generated-Image-3s4vr53s4vr53s4v.png" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                  {[...Array(60)].map((_, i) => (
                    <div key={`snow-1-${i}`} className="absolute bg-white rounded-full opacity-60 animate-snow" style={{ left: `${Math.random() * 100}%`, top: `-${Math.random() * 20}%`, width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`, animationDuration: `${Math.random() * 5 + 3}s`, animationDelay: `${Math.random() * 2}s`, animationTimingFunction: 'linear', animationIterationCount: 'infinite' } as React.CSSProperties} />
                  ))}
                  <style>{`@keyframes snow { to { transform: translateY(400px); } } .animate-snow { animation-name: snow; }`}</style>
                </div>
                <div className="relative z-30 flex flex-col items-center mt-32">
                  <span className="text-2xl font-black uppercase tracking-widest mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Péssimo</span>
                  <span className="text-8xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">{npsStats.pessimo}</span>
                  <div className="mt-6 text-2xl font-black bg-black/50 px-6 py-2 rounded-full backdrop-blur-md shadow-lg border border-white/20">{((npsStats.pessimo / npsStats.total || 0) * 100).toFixed(1)}%</div>
                </div>
              </div>
              {/* Ruim */}
              <div className="col-span-1 rounded-3xl p-6 flex flex-col items-center justify-center text-white shadow-xl relative overflow-hidden group bg-slate-800">
                <div className="absolute inset-0">
                  <img src="https://i.postimg.cc/sXfzQzjH/Gemini-Generated-Image-wqm9lnwqm9lnwqm9.png" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/30" />
                </div>
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                  {[...Array(80)].map((_, i) => (
                    <div key={`rain-${i}`} className="absolute bg-blue-200 opacity-50 animate-rain" style={{ left: `${Math.random() * 100}%`, top: `-${Math.random() * 20}%`, width: '1px', height: `${Math.random() * 15 + 20}px`, animationDuration: `${Math.random() * 0.4 + 0.3}s`, animationDelay: `${Math.random() * 2}s`, animationTimingFunction: 'linear', animationIterationCount: 'infinite' } as React.CSSProperties} />
                  ))}
                  <style>{`@keyframes rain { to { transform: translateY(600px); } } .animate-rain { animation-name: rain; }`}</style>
                </div>
                <div className="relative z-30 flex flex-col items-center mt-32">
                  <span className="text-2xl font-black uppercase tracking-widest mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Ruim</span>
                  <span className="text-8xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">{npsStats.ruim}</span>
                  <div className="mt-6 text-2xl font-black bg-black/50 px-6 py-2 rounded-full backdrop-blur-md shadow-lg border border-white/20">{((npsStats.ruim / npsStats.total || 0) * 100).toFixed(1)}%</div>
                </div>
              </div>
              {/* Regular */}
              <div className="col-span-1 rounded-3xl p-6 flex flex-col items-center justify-center text-white shadow-xl relative overflow-hidden group bg-yellow-900">
                <div className="absolute inset-0">
                  <img src="https://i.postimg.cc/j2zBZkSP/Gemini-Generated-Image-xrmixzxrmixzxrmi.png" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <div key={`wind-${i}`} className="absolute bg-white/20 rounded-full animate-wind" style={{ left: `-${Math.random() * 20}%`, top: `${Math.random() * 100}%`, width: `${Math.random() * 100 + 50}px`, height: `${Math.random() * 2 + 1}px`, animationDuration: `${Math.random() * 2 + 3}s`, animationDelay: `${Math.random() * 2}s`, animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite' } as React.CSSProperties} />
                  ))}
                  <style>{`@keyframes wind { to { transform: translateX(600px); } } .animate-wind { animation-name: wind; }`}</style>
                </div>
                <div className="relative z-30 flex flex-col items-center mt-32">
                  <span className="text-2xl font-black uppercase tracking-widest mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-yellow-100">Regular</span>
                  <span className="text-8xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-white">{npsStats.regular}</span>
                  <div className="mt-6 text-2xl font-black bg-black/50 text-white px-6 py-2 rounded-full backdrop-blur-md shadow-lg border border-white/20">{((npsStats.regular / npsStats.total || 0) * 100).toFixed(1)}%</div>
                </div>
              </div>
              {/* Bom */}
              <div className="col-span-1 rounded-3xl p-6 flex flex-col items-center justify-center text-white shadow-xl relative overflow-hidden group bg-teal-800">
                <div className="absolute inset-0">
                  <img src="https://i.postimg.cc/V6sSY23q/Gemini-Generated-Image-m9eruvm9eruvm9er.png" alt="" className="w-full h-full object-cover scale-110 transition-transform duration-700 group-hover:scale-125" />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                  {[...Array(15)].map((_, i) => (
                    <div key={`float-${i}`} className="absolute bg-white/40 rounded-full animate-float" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: `${Math.random() * 4 + 2}px`, height: `${Math.random() * 4 + 2}px`, animationDuration: `${Math.random() * 5 + 5}s`, animationDelay: `${Math.random() * 5}s`, animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite' } as React.CSSProperties} />
                  ))}
                  <style>{`@keyframes float { 0%, 100% { transform: translate(0, 0); opacity: 0.2; } 50% { transform: translate(10px, -20px); opacity: 0.6; } } .animate-float { animation-name: float; }`}</style>
                </div>
                <div className="relative z-30 flex flex-col items-center mt-32">
                  <span className="text-2xl font-black uppercase tracking-widest mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-teal-100">Bom</span>
                  <span className="text-8xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-white">{npsStats.bom}</span>
                  <div className="mt-6 text-2xl font-black bg-black/50 text-white px-6 py-2 rounded-full backdrop-blur-md shadow-lg border border-white/20">{((npsStats.bom / npsStats.total || 0) * 100).toFixed(1)}%</div>
                </div>
              </div>
              {/* Ótimo */}
              <div className="col-span-1 rounded-3xl p-6 flex flex-col items-center justify-center text-white shadow-xl relative overflow-hidden group bg-green-600">
                <div className="absolute inset-0">
                  <img src="https://i.postimg.cc/pdCT1qpP/Gemini-Generated-Image-9ej0189ej0189ej0.png" alt="" className="w-full h-full object-cover transition-transform duration-700 scale-110 group-hover:scale-125 -translate-y-12" />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden mix-blend-overlay">
                  <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,223,186,0.4)_20deg,transparent_40deg,rgba(255,223,186,0.4)_60deg,transparent_80deg,rgba(255,223,186,0.4)_100deg,transparent_120deg)] opacity-50 animate-sun-spin" />
                  <style>{`@keyframes sun-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-sun-spin { animation-name: sun-spin; animation-duration: 25s; animation-timing-function: linear; animation-iteration-count: infinite; }`}</style>
                </div>
                <div className="relative z-30 flex flex-col items-center mt-32">
                  <span className="text-2xl font-black uppercase tracking-widest mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-green-50">Ótimo</span>
                  <span className="text-8xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-white">{npsStats.otimo}</span>
                  <div className="mt-6 text-2xl font-black bg-black/50 text-white px-6 py-2 rounded-full backdrop-blur-md shadow-lg border border-white/20">{((npsStats.otimo / npsStats.total || 0) * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Cards inferiores NPS */}
            <div className="grid grid-cols-3 gap-6 h-40 shrink-0">
              <div className="bg-slate-900 rounded-3xl p-8 flex items-center justify-between text-white shadow-2xl relative overflow-hidden">
                <div className="absolute left-0 bottom-0 top-0 w-2 bg-[#6366f1]" />
                <div className="flex flex-col ml-6">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Tickets Encerrados</span>
                  <span className="text-6xl font-black">{npsStats.encerrados}</span>
                </div>
                <div className="pr-6 opacity-30 text-[#6366f1]"><History size={64} /></div>
              </div>
              <div className="bg-slate-900 rounded-3xl p-8 flex items-center justify-between text-white shadow-2xl relative overflow-hidden">
                <div className="absolute left-0 bottom-0 top-0 w-2 bg-[#2fabab]" />
                <div className="flex flex-col ml-6">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Usuários que Responderam</span>
                  <span className="text-6xl font-black">{npsStats.total}</span>
                </div>
                <div className="pr-6 opacity-30 text-[#2fabab]"><TrendingUp size={64} /></div>
              </div>
              <div className="bg-slate-900 rounded-3xl p-8 flex items-center justify-between text-white shadow-2xl relative overflow-hidden">
                <div className="absolute left-0 bottom-0 top-0 w-2 bg-[#ef4444]" />
                <div className="flex flex-col ml-6">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Usuários S/ Resposta</span>
                  <span className="text-6xl font-black text-red-400">{npsStats.encerrados - npsStats.total > 0 ? npsStats.encerrados - npsStats.total : 0}</span>
                </div>
                <div className="pr-6 opacity-30 text-[#ef4444]"><AlertCircle size={64} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
          <div className={`relative bg-white/90 backdrop-blur-3xl border-4 rounded-[40px] p-12 flex flex-col items-center shadow-[0_32px_64px_rgba(0,0,0,0.4)] animate-nps-notification overflow-hidden max-w-2xl
            ${activeNotification.score && activeNotification.score <= 2 ? 'border-red-500 scale-105' :
              activeNotification.score && activeNotification.score >= 4 ? 'border-[#2fabab] animate-glow-positive' : 'border-slate-200'}`}
          >
            {/* Background Effects */}
            {activeNotification.score && activeNotification.score >= 4 && (
              <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                {[...Array(20)].map((_, i) => (
                  <div key={`star-${i}`} className="absolute text-yellow-500 animate-pulse"
                    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, fontSize: `${Math.random() * 20 + 10}px` }}>★</div>
                ))}
              </div>
            )}
            {activeNotification.score && activeNotification.score <= 2 && (
              <div className="absolute inset-0 z-0 pointer-events-none bg-red-500/10 animate-pulse" />
            )}

            <div className="relative mb-8 z-10">
              <div className={`absolute inset-0 rounded-full animate-ping opacity-25 
                ${activeNotification.score && activeNotification.score <= 2 ? 'bg-red-500' : 'bg-[#2fabab]'}`} />
              <div className={`relative w-56 h-56 rounded-full border-4 overflow-hidden bg-slate-100 shadow-xl
                ${activeNotification.score && activeNotification.score <= 2 ? 'border-red-500' : 'border-[#2fabab]'}`}>
                <img src={activeNotification.avatar} alt="" className="w-full h-full object-cover" />
              </div>

              {/* Trophy Icon for high scores */}
              {activeNotification.score && activeNotification.score >= 4 && (
                <div className="absolute -top-6 -right-6 bg-yellow-400 p-4 rounded-full shadow-lg border-4 border-white animate-bounce z-20">
                  <Trophy size={40} className="text-white" fill="white" />
                </div>
              )}

              {/* Badge de Nota */}
              {activeNotification.score && (
                <div className={`absolute -bottom-4 right-0 w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-lg border-4 border-white
                  ${activeNotification.score <= 2 ? 'bg-red-500' : activeNotification.score >= 4 ? 'bg-[#2fabab]' : 'bg-slate-400'}`}>
                  {activeNotification.score}
                </div>
              )}
            </div>

            <div className="text-center z-10">
              <div className="flex items-center justify-center gap-3 mb-3">
                {activeNotification.score && activeNotification.score <= 2 && <AlertCircle className="text-red-500" size={32} />}
                <h3 className={`text-2xl font-black uppercase tracking-[0.3em] 
                  ${activeNotification.score && activeNotification.score <= 2 ? 'text-red-600' : 'text-slate-400'}`}>
                  {activeNotification.score && activeNotification.score <= 2 ? '🚨 Atenção: Crítica Recebida' : 'Novo NPS Respondido!'}
                </h3>
              </div>
              <p className="text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">
                {activeNotification.operator}
              </p>
              <div className="flex items-center justify-center gap-4">
                {activeNotification.score && (
                  <p className={`text-xl font-black uppercase tracking-widest px-8 py-2 rounded-full inline-block
                    ${activeNotification.score <= 2 ? 'bg-red-100 text-red-600' : activeNotification.score >= 4 ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-600'}`}>
                    Nota: {activeNotification.score === 1 ? 'Péssimo' : activeNotification.score === 2 ? 'Ruim' : activeNotification.score === 3 ? 'Regular' : activeNotification.score === 4 ? 'Bom' : 'Ótimo'}
                  </p>
                )}
                {activeNotification.ticketId && (
                  <p className="text-xl font-black bg-slate-900 text-white px-8 py-2 rounded-full uppercase tracking-widest">
                    Ticket: #{activeNotification.ticketId}
                  </p>
                )}
              </div>
            </div>

            <div className={`absolute -bottom-1 left-0 w-full h-3 animate-nps-bar
              ${activeNotification.score && activeNotification.score <= 2 ? 'bg-red-500' : 'bg-[#2fabab]'}`} />
          </div>
          <style>{`
            @keyframes nps-notification {
              0% { transform: scale(0.5) translateY(100px); opacity: 0; }
              5% { transform: scale(1.05) translateY(0); opacity: 1; }
              8% { transform: scale(1) translateY(0); opacity: 1; }
              92% { transform: scale(1) translateY(0); opacity: 1; }
              100% { transform: scale(0.9) translateY(-100px); opacity: 0; }
            }
            @keyframes nps-bar {
              from { width: 100%; }
              to { width: 0%; }
            }
            @keyframes glow-positive {
              0%, 100% { 
                box-shadow: 0 0 20px rgba(47, 171, 171, 0.4), 0 0 40px rgba(255, 215, 0, 0.2), 0 32px 64px rgba(0,0,0,0.4); 
                border-color: #2fabab; 
              }
              50% { 
                box-shadow: 0 0 60px rgba(47, 171, 171, 0.8), 0 0 80px rgba(255, 215, 0, 0.4), 0 32px 64px rgba(0,0,0,0.4); 
                border-color: #ffd700; 
              }
            }
            .animate-nps-notification {
              animation: nps-notification 10s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }
            .animate-nps-bar {
              animation: nps-bar 10s linear forwards;
            }
            .animate-glow-positive {
              animation: glow-positive 1.5s ease-in-out infinite;
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Dashboard />);
