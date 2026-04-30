'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  MessageSquare, 
  BookOpen, 
  Zap, 
  Heart, 
  UserPlus, 
  Thermometer, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Send,
  Loader2,
  Copy,
  CheckCircle2,
  Radar as RadarIcon,
  Skull,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { fetchWithProxy } from '@/lib/api';
import { GoogleGenAI } from '@google/genai';

// --- Constants & Types ---

async function generateAIContent(systemPrompt: string, userPrompt: string, expectsJSON = false) {
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: expectsJSON ? 'application/json' : 'text/plain',
        }
      });
      return response.text || '';
    } catch (e) {
      console.error('Gemini failed, will fallback to Pollinations', e);
    }
  }
  
  const res = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'openai',
      jsonMode: expectsJSON
    })
  });

  if (!res.ok) {
    throw new Error(`AI Error: ${res.status}`);
  }

  return await res.text();
}

enum Tab {
  Techniques = 'techniques',
  Chat = 'chat',
  Radar = 'radar'
}

interface Phase {
  id: number;
  title: string;
  time: string;
  description: string;
  examples: string[];
  tips: string[];
  icon: React.ReactNode;
}

const PHASES: Phase[] = [
  {
    id: 1,
    title: 'Abertura (Direct)',
    time: '0-30s',
    description: 'Sem enrolação. Demonstra confiança imediata e não perde o timing.',
    examples: [
      '“Oi… te vi ali e tive que vir falar com você”',
      '“Qual seu nome?”'
    ],
    tips: [
      'Mantenha contato visual',
      'Sorriso leve e relaxado',
      'Voz clara e firme'
    ],
    icon: <UserPlus className="w-5 h-5 text-blue-400" />
  },
  {
    id: 2,
    title: 'Atração (Teasing)',
    time: '30s-2m',
    description: 'Cria tensão emocional rápida através de provocações lúdicas.',
    examples: [
      '“Você tem cara de que dá trabalho”',
      '“Tô tentando entender se você é tranquila ou o puro caos”'
    ],
    tips: [
      'Use tom de brincadeira',
      'Observe a reação (ela deve rir ou rebater)',
      'Não seja ofensivo, seja desafiador'
    ],
    icon: <Flame className="w-5 h-5 text-orange-500" />
  },
  {
    id: 3,
    title: 'Conexão (Banter)',
    time: '2-5min',
    description: 'Nada de entrevista. Perguntas leves que fazem ela se interessar em falar de si mesma.',
    examples: [
      '“O que você está aprontando aqui hoje?”',
      '“Hmm… isso explica muita coisa 😏”'
    ],
    tips: [
      'Fale menos, ouça mais',
      'Faça ela se qualificar para você',
      'Mantenha a conversa divertida'
    ],
    icon: <Sparkles className="w-5 h-5 text-purple-400" />
  },
  {
    id: 4,
    title: 'O Primeiro Toque',
    time: '3-6min',
    description: 'Testa a receptividade física. Libera oxitocina e cria conexão real.',
    examples: [
      'Toque leve no braço enquanto ri',
      '“Sabia...” (acompanhado de um toque breve)'
    ],
    tips: [
      'Se ela recuar, desacelere',
      'Se ela aceitar, continue a progressão',
      'Deve parecer natural, não forçado'
    ],
    icon: <Zap className="w-5 h-5 text-yellow-400" />
  },
  {
    id: 5,
    title: 'Proximidade & Clima',
    time: '5-10min',
    description: 'Diminui a distância. Fala mais baixo para criar intimidade.',
    examples: [
      '“Vem um pouco mais pra cá, tá barulhento”',
      'Falar perto do ouvido (sutilmente)'
    ],
    tips: [
      'Convites para mudar de lugar são sinais verdes',
      'Mantenha contato visual intenso',
      'Calibre a energia do ambiente'
    ],
    icon: <Thermometer className="w-5 h-5 text-red-400" />
  },
  {
    id: 6,
    title: 'A Escalada',
    time: '10-15min',
    description: 'Aproximação física definitiva. Toque constante e natural.',
    examples: [
      'Ficar ombro a ombro',
      'Braço leve ou mão na lombar',
      '“Agora ficou melhor”'
    ],
    tips: [
      'Lidere o movimento',
      'Confie na sua intuição sobre o momento',
      'Sincronize com a respiração dela'
    ],
    icon: <ArrowRight className="w-5 h-5 text-pink-400" />
  },
  {
    id: 7,
    title: 'O Beijo',
    time: 'Momentum',
    description: 'Não é tempo, é sinal. O clímax da tensão criada.',
    examples: [
      'Triângulo do olhar (olho-olho-boca)',
      '“Vem cá...” (baixo e aproximando devagar)'
    ],
    tips: [
      'Pausa dramática antes de agir',
      'Abaixe o volume da voz',
      'Leia o sinal: ela mantém o contato visual?'
    ],
    icon: <Heart className="w-5 h-5 text-red-600" />
  }
];

const EXIT_LINES = [
  { title: "Saída Elegante", content: "“Olha, senti que a vibe não bateu tanto. Vou deixar você curtir com suas amigas, boa sorte!”" },
  { title: "Indireta de Valor", content: "“Acho que estamos em frequências muito diferentes agora. Prazer te conhecer, aproveite a noite.”" },
  { title: "O Cupido Ocupado", content: "“Vou ali encontrar uns amigos que acabaram de chegar. Foi legal o papo, tchau!”" },
  { title: "Anti-Drama", content: "“Notei que você não está no clima hoje. Não quero gastar seu tempo nem o meu, boa diversão.”" }
];

const SIGNALS = [
  { id: 'eye_contact', label: 'Contato Visual Prolongado', weight: 1, type: 'green' },
  { id: 'smiling', label: 'Sorriso ou Risada Frequente', weight: 1, type: 'green' },
  { id: 'asking_questions', label: 'Ela faz perguntas de volta', weight: 1, type: 'green' },
  { id: 'body_orientation', label: 'Corpo totalmente virado para você', weight: 1, type: 'green' },
  { id: 'touching', label: 'Ela te tocou (braço, ombro)', weight: 2, type: 'green' },
  { id: 'hair_fiddling', label: 'Mexer no cabelo enquanto fala', weight: 0.5, type: 'green' },
  { id: 'looking_away', label: 'Olhando ao redor/Celular', weight: 1, type: 'red' },
  { id: 'short_answers', label: 'Respostas curtas (Sim/Não)', weight: 1, type: 'red' },
  { id: 'body_away', label: 'Corpo virado para longe', weight: 1, type: 'red' },
  { id: 'fake_laugh', label: 'Risada forçada/educada', weight: 0.5, type: 'red' },
];

const INTENTS = [
  { id: 'initiate', label: 'Iniciar conversa', prompt: 'Crie um abridor magnético baseado no contexto.' },
  { id: 'reengage', label: 'Puxar assunto', prompt: 'Ela parou de responder ou está fria. Puxe um assunto novo e interessante.' },
  { id: 'escalate', label: 'Escalar clima', prompt: 'Aumente a tensão sexual de forma lúdica e charmosa.' },
  { id: 'close', label: 'Marcar encontro', prompt: 'Chame ela para sair ou ir para outro lugar de forma assertiva.' },
  { id: 'neutral', label: 'Neutro/Equilibrado', prompt: 'Uma resposta natural, equilibrada e pé no chão para manter o fluxo sem pressão.' },
];

interface ChatPair {
  me: string;
  her: string;
}

// --- Components ---

export default function CharmaApp() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Techniques);
  const [chatPairs, setChatPairs] = useState<ChatPair[]>([{ me: '', her: '' }]);
  const [selectedIntent, setSelectedIntent] = useState<string>('initiate');
  const [responses, setResponses] = useState<{ type: string, content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Mentor Q&A State
  const [mentorQuestion, setMentorQuestion] = useState('');
  const [mentorAnswer, setMentorAnswer] = useState('');
  const [isMentorLoading, setIsMentorLoading] = useState(false);

  // Radar State
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);

  const toggleSignal = (id: string) => {
    setSelectedSignals(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getRadarStatus = () => {
    let score = 0;
    selectedSignals.forEach(id => {
      const signal = SIGNALS.find(s => s.id === id);
      if (signal) {
        score += signal.type === 'green' ? signal.weight : -signal.weight;
      }
    });

    if (score >= 2.5) return { label: 'VERDE', color: 'text-emerald-400', bg: 'bg-emerald-500/20', desc: 'Sinal verde! Avance para a Escalada Física.' };
    if (score <= -1) return { label: 'VERMELHO', color: 'text-red-500', bg: 'bg-red-500/20', desc: 'Abortar! Use o Modo Abortar Missão.' };
    return { label: 'AMARELO', color: 'text-yellow-400', bg: 'bg-yellow-500/20', desc: 'Mantenha a Conexão. Mais teasing necessário.' };
  };

  const status = getRadarStatus();

  const askMentor = async () => {
    if (!mentorQuestion.trim()) return;
    setIsMentorLoading(true);
    setMentorAnswer('');
    
    try {
      const systemP = `Act as "Charma AI", an expert men's dating and social dynamics mentor. The user is reading your practical guides and is asking you a question for advice (e.g. "I'm shy", "I didn't understand the pattern breaker"). 
Be direct, practical, and highly encouraging, like an experienced older brother addressing him in Brazilian Portuguese.
CRUCIAL:
- Your response MUST be in Brazilian Portuguese.
- Keep it short, strong, and highly applicable. No BS, no long paragraphs.`;
      
      const output = await generateAIContent(systemP, mentorQuestion, false);
      setMentorAnswer(output.trim());
    } catch (error) {
      setMentorAnswer('Erro ao contatar o mentor. Tente novamente mais tarde.');
    } finally {
      setIsMentorLoading(false);
    }
  };

  const addChatPair = () => {
    setChatPairs([...chatPairs, { me: '', her: '' }]);
  };

  const updateChatPair = (index: number, field: 'me' | 'her', value: string) => {
    const newPairs = [...chatPairs];
    newPairs[index][field] = value;
    setChatPairs(newPairs);
  };

  const removeChatPair = (index: number) => {
    if (chatPairs.length > 1) {
      setChatPairs(chatPairs.filter((_, i) => i !== index));
    }
  };

  const generateResponses = async () => {
    const validPairs = chatPairs.filter(p => p.me.trim() || p.her.trim());
    if (validPairs.length === 0) return;
    
    setIsLoading(true);
    setResponses([]);

    try {
      const intentObj = INTENTS.find(i => i.id === selectedIntent);
      const conversationHistory = validPairs.map(p => `Eu: ${p.me}\nEla: ${p.her}`).join('\n');

      const systemPrompt = `Você é um mestre em psicologia social, sedução (flirting) e dinâmicas sociais (Charma AI). 
O usuário está aplicando seus protocolos práticos e precisa de opções de respostas para o WhatsApp/Instagram.

REGRAS DE OURO PARA NÃO SER CRINGE (IMPORTANTE!):
1. SEJA EXTREMAMENTE CASUAL. Escreva como um jovem brasileiro "low profile" (sem letras maiúsculas forçadas, pontuação simples e direta).
2. FLERTAR NÃO É ELOGIAR. Use as técnicas de FLIRTING, TEASING, PUSH-PULL e QUEBRA DE PADRÃO.
3. PROIBIDO: Elogios melosos, cantadinhas, falar difícil, intensidade excessiva, textões longos. Seja desapegado (Takeaway).
4. CALIBRAÇÃO DE ENERGIA: Se a mulher respondeu curto ("oi"), devolva curto. Mantenha o mistério e a postura de prêmio ("Prize").

BASEIE AS RESPOSTAS NESTES 4 PILARES DO SEU PROTOCOLO:
1. "Atrevida" (Teasing / Push-Pull): Provoque com humor, discorde de brincadeira ou dê um "gancho" que exija que ela se qualifique. Flerte com ousadia e leve deboche.
2. "Direta" (Escalada / Liderança): Tome as rédeas da interação de forma prática, assertiva, e sem enrolação. Vá direto ao ponto.
3. "Empática" (Cold Reading / Grounding): Faça uma leitura fria sutil sobre ela ou mostre que você nota detalhes. Sem ser carente.
4. "Neutro/Equilibrado" (Desapego / Low Investment): Responda com naturalidade, como quem tem muitas opções (abundância).

Você DEVE retornar APENAS um JSON array válido com as 4 opções, sem NENHUM texto extra. Use EXATAMENTE este formato:
[
  {"type": "Atrevida", "content": "opa duda, com esse oi seco chuto que você é paulista haha"},
  {"type": "Direta", "content": "fala duda. tudo certo? iai o que manda hoje"},
  {"type": "Empática", "content": "duda... cara de quem não gosta de acordar cedo. suave?"},
  {"type": "Neutro/Equilibrado", "content": "opa duda, tudo bem?"}
]`;

      const userPrompt = `INTENTION: ${intentObj?.label}\nHISTORY:\n${conversationHistory}`;

      const output = await generateAIContent(systemPrompt, userPrompt, true);
      
      let cleanJson = output.replace(/```json|```/g, '').trim();
      
      // Fallback extraction se a IA enviar texto fora do JSON
      const match = cleanJson.match(/\[[\s\S]*\]/);
      if (match) {
        cleanJson = match[0];
      }
      // Se não encontrou array direto, verifica se tem um objeto com um array dentro (ex: {"result": [...]})
      else {
        const objMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (objMatch) {
            cleanJson = objMatch[0];
        }
      }

      // Cleanup common JSON syntax errors generated by the LLM
      cleanJson = cleanJson.replace(/",\s*"?\s*}/g, '"}'); // Fix trailing comma/quote after string in object
      cleanJson = cleanJson.replace(/",\s*"?\s*]/g, '"]'); // Fix trailing comma/quote after string in array
      cleanJson = cleanJson.replace(/},\s*]/g, '}]'); // Fix trailing comma after object in array
      
      let parsed = [];
      try {
        let rawObj = JSON.parse(cleanJson);
        // Se retornou um array
        if (Array.isArray(rawObj)) {
            parsed = rawObj;
        } 
        // Se retornou um objeto
        else if (typeof rawObj === 'object' && rawObj !== null) {
            // Se tiver uma propriedade que é um array (ex: { result: [...] })
            const possibleArray = Object.values(rawObj).find(val => Array.isArray(val));
            if (possibleArray) {
               parsed = possibleArray;
            } 
            // Se retornou as chaves como tipos (ex: {"Atrevida": "...", "Direta": "..."})
            else if (Object.keys(rawObj).some(k => k === 'Atrevida' || k === 'Direta')) {
                parsed = Object.entries(rawObj).map(([key, val]) => ({
                    type: key,
                    content: typeof val === 'string' ? val : JSON.stringify(val)
                }));
            }
            else {
               parsed = [rawObj];
            }
        }
      } catch (err) {
        console.error("Parse error na resposta AI:", err, output);
        parsed = [{ type: 'Erro', content: 'Formato inválido recebido da IA' }];
      }
      
      setResponses(parsed);
    } catch (error) {
      console.error('AI Error:', error);
      setResponses([{ type: 'Erro', content: 'Não consegui processar a missão agora.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 relative overflow-x-hidden">
      {/* Mesh Background Decor */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-xl font-bold">C</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">CHARMA <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded ml-2 text-purple-400 uppercase tracking-widest font-display">AI Wingman</span></h1>
          </div>
          <div className="flex gap-1.5 bg-white/5 p-1 rounded-full border border-white/10">
            <button 
              onClick={() => setActiveTab(Tab.Techniques)}
              className={`p-2 rounded-full transition-all duration-300 ${activeTab === Tab.Techniques ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white'}`}
              title="Técnicas"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveTab(Tab.Chat)}
              className={`p-2 rounded-full transition-all duration-300 ${activeTab === Tab.Chat ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white'}`}
              title="AI Wingman"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveTab(Tab.Radar)}
              className={`p-2 rounded-full transition-all duration-300 ${activeTab === Tab.Radar ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white'}`}
              title="Filtro de Interesse"
            >
              <RadarIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-lg lg:max-w-5xl mx-auto px-4 lg:px-8 py-8 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === Tab.Techniques ? (
            <motion.div
              key="techniques"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              <div className="lg:col-span-3 space-y-6">
                <div className="text-left space-y-2 mb-8">
                  <h2 className="text-3xl font-display font-bold tracking-tighter text-white">Manual do Protocolo</h2>
                  <p className="text-gray-400 text-sm tracking-wide">A arte da escalada acelerada (15-30 min).</p>
                </div>

                {PHASES.map((phase) => (
                <div key={phase.id} className="relative group">
                  <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-white/5 group-last:h-0" />
                  <div className="flex gap-4">
                    <div className="relative z-10 flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl group-hover:border-purple-500/50 transition-all duration-500 group-hover:scale-110">
                        {phase.icon}
                      </div>
                    </div>
                    <div className="space-y-3 pb-8 w-full">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg text-white font-display">
                          <span className="text-purple-500 mr-2 text-sm font-mono opacity-50">{phase.id}.</span> 
                          {phase.title}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-white/5 text-purple-400 px-2 py-0.5 rounded-full border border-white/5">
                          {phase.time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">
                        {phase.description}
                      </p>
                      
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">O que falar</p>
                        {phase.examples.map((ex, i) => (
                          <div key={i} className="bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl text-sm text-purple-200 italic shadow-inner group-hover:border-purple-500/20 transition-all duration-300">
                            {ex}
                          </div>
                        ))}
                      </div>

                      <div className="bg-purple-500/5 backdrop-blur-sm border border-purple-500/10 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                          <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Dicas Especialistas</p>
                        </div>
                        <ul className="space-y-1.5">
                          {phase.tips.map((tip, i) => (
                            <li key={i} className="text-[11px] text-gray-500 flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-purple-500/40 mt-1.5" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="backdrop-blur-2xl bg-white/5 border border-white/10 p-8 rounded-[2.5rem] mt-12 mb-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -mr-16 -mt-16 sm:group-hover:bg-purple-500/20 transition-all"></div>
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="bg-purple-600 rounded-xl p-2.5 shadow-lg shadow-purple-600/20">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-xl font-display">A Regra de Ouro</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed relative z-10">
                  A tensão é o que diferencia um &quot;amigo legal&quot; de um parceiro. 
                  Sempre use a técnica de <span className="text-purple-400 font-bold">Push-Pull</span>: 
                  suavize a provocação com um sorriso e intensifique o olhar quando ela reagir.
                </p>
              </div>
            </div>

            {/* Mentor Input Section */}
            <div className="lg:col-span-2 relative">
                <div className="sticky top-24">
                  <div className="backdrop-blur-2xl bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white/5 border border-white/10 p-6 rounded-[2.5rem] shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full"></div>
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                      <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-2 shadow-lg">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="font-bold text-lg font-display text-white">Mentor do Jogo</h3>
                    </div>
                    <p className="text-gray-400 text-xs mb-5 font-medium relative z-10 leading-relaxed md:text-[13px]">
                      Tem vergonha? Não entendeu uma fase? Não sabe como agir? O mentor te responde na hora.<br/>
                    </p>
                    
                    <div className="flex items-center gap-3 bg-black/50 border border-white/10 p-2 rounded-2xl ring-1 ring-white/5 focus-within:ring-purple-500/50 transition-all z-10 relative">
                      <input
                        type="text"
                        value={mentorQuestion}
                        onChange={(e) => setMentorQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && askMentor()}
                        disabled={isMentorLoading}
                        placeholder="Faça perguntas..."
                        className="w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none placeholder-white/20 font-medium"
                      />
                      <button
                        onClick={askMentor}
                        disabled={isMentorLoading || !mentorQuestion.trim()}
                        className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 rounded-[1.1rem] transition-all"
                      >
                        {isMentorLoading ? <Loader2 className="w-5 h-5 animate-spin text-white/50" /> : <Send className="w-5 h-5 text-white" />}
                      </button>
                    </div>

                    <AnimatePresence>
                      {mentorAnswer && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          className="overflow-hidden mt-4"
                        >
                          <div className="p-5 rounded-2xl bg-purple-900/10 border border-purple-500/20 text-purple-100 text-sm leading-relaxed italic shadow-inner relative">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 blur-xl"></div>
                            &quot;{mentorAnswer}&quot;
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === Tab.Chat ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-display font-bold tracking-tighter text-white">AI Wingman Assistant</h2>
                <p className="text-gray-400 text-sm tracking-wide">Descreva o contexto ou cole a conversa inteira.</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {INTENTS.map((intent) => (
                  <button
                    key={intent.id}
                    onClick={() => setSelectedIntent(intent.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${selectedIntent === intent.id ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}
                  >
                    {intent.label}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold block">Histórico da Conversa</label>
                    <button 
                      onClick={addChatPair}
                      className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      Adicionar Mensagem
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {chatPairs.map((pair, idx) => (
                      <div key={idx} className="space-y-3 p-4 rounded-2xl bg-black/20 border border-white/5 relative group/pair">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest ml-1">Eu:</span>
                            <input 
                              type="text"
                              value={pair.me}
                              onChange={(e) => updateChatPair(idx, 'me', e.target.value)}
                              placeholder="Sua mensagem..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-purple-500/60 uppercase tracking-widest ml-1">Ela/e:</span>
                            <input 
                              type="text"
                              value={pair.her}
                              onChange={(e) => updateChatPair(idx, 'her', e.target.value)}
                              placeholder="Resposta dela..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-purple-100 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                            />
                          </div>
                        </div>
                        {chatPairs.length > 1 && (
                          <button 
                            onClick={() => removeChatPair(idx)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/pair:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                          >
                            <span className="text-lg leading-none">×</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-6">
                    <button 
                      onClick={generateResponses}
                      disabled={isLoading || chatPairs.every(p => !p.me && !p.her)}
                      className="bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-gray-600 px-6 py-3 rounded-2xl transition-all shadow-xl shadow-purple-600/20 active:scale-95 flex items-center gap-2 group"
                    >
                      <span className="text-sm font-bold uppercase tracking-widest text-white">Analisar & Responder</span>
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <AnimatePresence>
                    {responses.map((resp, i) => {
                      const typeLower = resp.type.toLowerCase();
                      const colorClass = typeLower.includes('atrevida') || typeLower.includes('teasing') 
                        ? 'bg-purple-500 text-white' 
                        : typeLower.includes('direta') 
                        ? 'bg-blue-500 text-white' 
                        : typeLower.includes('neutro') || typeLower.includes('equilibrado')
                        ? 'bg-zinc-600 text-white'
                        : 'bg-emerald-500 text-white';
                      
                      const glassClass = typeLower.includes('atrevida') || typeLower.includes('teasing')
                        ? 'bg-purple-500/10 border-purple-500/20'
                        : typeLower.includes('direta')
                        ? 'bg-blue-500/10 border-blue-500/20'
                        : typeLower.includes('neutro') || typeLower.includes('equilibrado')
                        ? 'bg-white/5 border-white/10 shadow-inner'
                        : 'bg-emerald-500/10 border-emerald-500/20';

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="group relative"
                        >
                          <div className={`absolute -top-2.5 left-6 px-3 py-0.5 rounded-full ${colorClass} text-[10px] font-bold uppercase tracking-widest z-10 shadow-lg`}>
                            {resp.type}
                          </div>
                          <div className={`backdrop-blur-xl ${glassClass} border p-6 pt-8 rounded-3xl group-hover:scale-[1.02] transition-all duration-300 shadow-2xl flex justify-between items-start gap-4`}>
                            <p className="text-white text-sm leading-relaxed italic">&quot;{resp.content}&quot;</p>
                            <button 
                              onClick={() => copyToClipboard(resp.content, i)}
                              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors shadow-inner"
                              title="Copiar"
                            >
                              {copiedIndex === i ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Copy className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {!isLoading && responses.length === 0 && (
                <div className="text-center py-20 backdrop-blur-md bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] space-y-4">
                  <div className="bg-white/5 p-5 rounded-full w-fit mx-auto shadow-inner border border-white/5">
                    <Sparkles className="w-8 h-8 text-purple-400/50" />
                  </div>
                  <div className="space-y-1 px-8">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Aguardando Conexão</p>
                    <p className="text-gray-600 text-[10px] italic">&quot;O sucesso real exige intenção clara e execução calma.&quot;</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="radar"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-display font-bold tracking-tighter text-white">Radar de Calibragem</h2>
                <p className="text-gray-400 text-sm tracking-wide">Mapeie sinais e saiba o momento de agir ou sair.</p>
              </div>

              {/* Status Display */}
              <div className={`backdrop-blur-2xl ${status.bg} border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all duration-500`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5">
                       <RadarIcon className={`w-6 h-6 ${status.color}`} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Status da Interação</p>
                      <h3 className={`text-2xl font-black italic tracking-wider ${status.color}`}>{status.label}</h3>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-300 font-medium leading-relaxed">{status.desc}</p>
              </div>

              {/* Signals Checklist */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Sinais Observados</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {SIGNALS.map((signal) => (
                    <button
                      key={signal.id}
                      onClick={() => toggleSignal(signal.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedSignals.includes(signal.id) ? 'bg-purple-600/20 border-purple-500/50 shadow-lg shadow-purple-500/10' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                    >
                      <span className={`text-[13px] font-medium ${selectedSignals.includes(signal.id) ? 'text-white' : 'text-gray-400'}`}>
                        {signal.label}
                      </span>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedSignals.includes(signal.id) ? 'bg-purple-600 border-purple-400 ring-2 ring-purple-500/30' : 'border-white/10 bg-black/20'}`}>
                        {selectedSignals.includes(signal.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 bg-white rounded-sm" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Abort Mission Mode */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 mb-4">
                   <Skull className="w-4 h-4 text-red-400" />
                   <h3 className="text-xs font-bold uppercase tracking-widest text-red-400/70">Modo Abortar Missão</h3>
                </div>
                <div className="space-y-3">
                  {EXIT_LINES.map((line, i) => (
                    <div key={i} className="backdrop-blur-xl bg-red-950/10 border border-red-900/20 p-5 rounded-2xl group hover:border-red-500/30 transition-all">
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">{line.title}</p>
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-sm text-gray-400 italic leading-relaxed">{line.content}</p>
                        <button 
                          onClick={() => copyToClipboard(line.content, i + 100)}
                          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          {copiedIndex === i + 100 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-500" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 text-center italic mt-4">
                  Saiba quando sair. Seu tempo e autopreservação são suas maiores armas.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation Overlay */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-50">
        <div className="max-w-md mx-auto flex flex-col items-center gap-4 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex gap-1">
            <button 
              onClick={() => setActiveTab(Tab.Techniques)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-500 text-[10px] font-bold uppercase tracking-widest ${activeTab === Tab.Techniques ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Protocolos</span>
            </button>
            <button 
              onClick={() => setActiveTab(Tab.Chat)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-500 text-[10px] font-bold uppercase tracking-widest ${activeTab === Tab.Chat ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Wingman</span>
            </button>
            <button 
              onClick={() => setActiveTab(Tab.Radar)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-500 text-[10px] font-bold uppercase tracking-widest ${activeTab === Tab.Radar ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <RadarIcon className="w-3.5 h-3.5" />
              <span>Radar</span>
            </button>
          </div>
          
          <div className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em] bg-black/40 px-4 py-1 rounded-full border border-white/5 backdrop-blur-md">
            Charma Assistant v2.4 | Powered by Psychology AI
          </div>
        </div>
      </footer>
    </div>

  );
}
