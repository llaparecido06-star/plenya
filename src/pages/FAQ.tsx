import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, Mail, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    category: 'Geral',
    items: [
      {
        q: 'O que é o Plenya?',
        a: 'O Plenya é um aplicativo de saúde e bem-estar feminino que acompanha seu ciclo menstrual, nutrição, exercícios e saúde mental, adaptando-se à sua fase de vida (menstruação, gravidez, pós-parto ou menopausa).',
      },
      {
        q: 'O Plenya substitui acompanhamento médico?',
        a: 'Não. O Plenya é uma ferramenta informativa e educacional. Sempre consulte seu médico(a) para diagnósticos, tratamentos e decisões de saúde.',
      },
      {
        q: 'Posso usar o app offline?',
        a: 'O Plenya funciona como PWA e algumas funcionalidades podem ser acessadas offline. Porém, a sincronização de dados requer conexão com a internet.',
      },
    ],
  },
  {
    category: 'Ciclo & Saúde',
    items: [
      {
        q: 'Como o app calcula minha fase do ciclo?',
        a: 'Utilizamos a data da sua última menstruação (DUM) e a duração média do seu ciclo para estimar as fases menstrual, folicular, ovulatória e lútea.',
      },
      {
        q: 'Os lembretes de pílula/injeção são confiáveis?',
        a: 'Os lembretes são baseados nas datas e frequências que você configura. São auxiliares e não substituem o acompanhamento do seu ginecologista.',
      },
      {
        q: 'Como funciona a previsão de menstruação?',
        a: 'A previsão é baseada na média dos seus últimos ciclos registrados. Quanto mais dados você registrar, mais precisa será a previsão.',
      },
    ],
  },
  {
    category: 'Conta & Privacidade',
    items: [
      {
        q: 'Meus dados de saúde são seguros?',
        a: 'Sim. Seus dados são criptografados e armazenados de forma segura. Seguimos as diretrizes da LGPD e não compartilhamos suas informações pessoais com terceiros.',
      },
      {
        q: 'Como excluir minha conta?',
        a: 'Vá em Perfil → Excluir Conta. Todos os seus dados serão permanentemente removidos de nossos servidores.',
      },
      {
        q: 'Posso exportar meus dados?',
        a: 'Sim, você pode gerar um relatório médico em PDF em Perfil → Relatório Médico, que inclui um resumo dos seus registros.',
      },
    ],
  },
  {
    category: 'Planos & Assinatura',
    items: [
      {
        q: 'O que está incluso no plano gratuito?',
        a: 'O plano gratuito inclui rastreamento de ciclo, registro de sintomas, humor e peso, e acesso básico ao Chef IA e treinos.',
      },
      {
        q: 'Como cancelar minha assinatura?',
        a: 'Você pode cancelar a qualquer momento pela loja onde realizou a assinatura (App Store ou Google Play) ou pelo menu Perfil → Planos.',
      },
    ],
  },
];

const FAQ: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">FAQ & Suporte</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Como podemos ajudar?</h2>
          <p className="text-sm text-muted-foreground">Encontre respostas para as dúvidas mais comuns</p>
        </motion.div>

        {faqs.map((section, i) => (
          <motion.div
            key={section.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <h3 className="text-sm font-semibold text-primary mb-2">{section.category}</h3>
            <div className="glass-card overflow-hidden">
              <Accordion type="single" collapsible>
                {section.items.map((item, j) => (
                  <AccordionItem key={j} value={`${i}-${j}`} className="border-border">
                    <AccordionTrigger className="px-4 text-left text-sm font-medium text-foreground">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 text-sm text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.div>
        ))}

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5 space-y-4"
        >
          <h3 className="font-semibold text-foreground">Ainda precisa de ajuda?</h3>
          <p className="text-sm text-muted-foreground">
            Entre em contato com nossa equipe de suporte.
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start gap-2" asChild>
              <a href="mailto:suporte@plenya.app">
                <Mail className="w-4 h-4" />
                suporte@plenya.app
              </a>
            </Button>
          </div>
        </motion.div>

        <div className="text-center text-xs text-muted-foreground pb-8">
          Versão 1.0.0 • Plenya © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
