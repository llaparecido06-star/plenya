import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Termos: React.FC = () => (
  <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-2 text-primary mb-8 hover:underline">
      <ArrowLeft className="w-4 h-4" /> Voltar
    </Link>

    <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
    <p className="text-muted-foreground mb-8">Última atualização: 09 de Março de 2026</p>

    <div className="prose prose-sm dark:prose-invert space-y-6 text-muted-foreground">
      <section>
        <h2 className="text-lg font-semibold text-foreground">1. Aceitação dos Termos</h2>
        <p>Ao criar uma conta ou utilizar o Plenya, você confirma que leu, entendeu e concorda com estes Termos de Uso e com a nossa <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>. Se não concordar com qualquer disposição, não utilize o aplicativo.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">2. Descrição do Serviço</h2>
        <p>O Plenya é um aplicativo de bem-estar feminino que oferece acompanhamento de ciclo menstrual, nutrição, treinos e saúde mental. O app utiliza inteligência artificial para personalizar recomendações com base nos dados fornecidos pela usuária.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">3. Classificação Etária e Elegibilidade</h2>
        <p>O Plenya é destinado a pessoas com 13 anos de idade ou mais. Se você possui entre 13 e 18 anos, confirma que possui o consentimento de um responsável legal para utilizar o aplicativo. Ao aceitar estes termos, você declara ter a idade mínima exigida ou possuir autorização parental.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">4. Aviso Médico Importante</h2>
        <p><strong>O Plenya NÃO é um dispositivo médico, não realiza diagnósticos e NÃO substitui aconselhamento médico profissional, diagnóstico ou tratamento.</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>As informações, previsões de ciclo e recomendações fornecidas são apenas para fins educacionais e de bem-estar geral.</li>
          <li>O app NÃO deve ser utilizado como método contraceptivo ou para planejamento familiar sem orientação médica.</li>
          <li>Consulte sempre um profissional de saúde qualificado antes de tomar decisões médicas baseadas em dados do aplicativo.</li>
          <li>Em caso de emergência médica, procure imediatamente atendimento de saúde.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">5. Conta do Usuário</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Você é responsável por manter a segurança e confidencialidade da sua conta.</li>
          <li>Informações fornecidas devem ser precisas e atualizadas.</li>
          <li>Cada conta é pessoal e intransferível.</li>
          <li>Você pode excluir sua conta e todos os dados associados a qualquer momento nas configurações do perfil.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">6. Dados de Saúde Sensíveis</h2>
        <p>O Plenya processa dados de saúde considerados sensíveis pela legislação de proteção de dados (LGPD, GDPR). Ao utilizar o aplicativo, você consente expressamente com o tratamento desses dados para os fins descritos na nossa <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>, incluindo:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Dados de ciclo menstrual, sintomas, humor e peso.</li>
          <li>Informações sobre gravidez, pós-parto e menopausa.</li>
          <li>Registros de alimentação, exercícios e sono.</li>
          <li>Dados de intimidade e saúde reprodutiva.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">7. Assinaturas e Pagamentos</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>O Plenya oferece planos gratuitos e premium.</li>
          <li>Pagamentos são processados via Stripe de forma segura.</li>
          <li>Assinaturas renovam automaticamente e podem ser canceladas a qualquer momento antes do próximo ciclo de cobrança.</li>
          <li>Reembolsos seguem a política da plataforma de distribuição (App Store ou Google Play) e do processador de pagamento.</li>
          <li>O período de teste gratuito, quando oferecido, será claramente indicado antes de qualquer cobrança.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">8. Uso de Inteligência Artificial</h2>
        <p>O Plenya utiliza modelos de IA para gerar insights, receitas, treinos e respostas no chat. Esses conteúdos são gerados automaticamente e podem conter imprecisões. A IA não substitui orientação profissional e os resultados devem ser interpretados como sugestões informativas.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">9. Propriedade Intelectual</h2>
        <p>Todo o conteúdo, design, marca e tecnologia do Plenya são protegidos por direitos autorais. Você não pode copiar, modificar, realizar engenharia reversa ou distribuir qualquer parte do app sem autorização expressa.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">10. Limitação de Responsabilidade</h2>
        <p>O Plenya é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros. O Plenya não se responsabiliza por decisões tomadas com base nas informações fornecidas pelo app. O uso é por sua conta e risco.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">11. Alterações nos Termos</h2>
        <p>Podemos atualizar estes termos periodicamente. Alterações significativas serão comunicadas pelo app ou por e-mail. O uso continuado após alterações constitui aceitação dos novos termos.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">12. Lei Aplicável</h2>
        <p>Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será submetida ao foro da comarca de domicílio do usuário.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">13. Contato</h2>
        <p>Dúvidas sobre estes termos? Entre em contato: <strong>contato@plenya.app</strong></p>
      </section>
    </div>
  </div>
);

export default Termos;
