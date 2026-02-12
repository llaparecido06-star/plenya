import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Termos: React.FC = () => (
  <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-2 text-primary mb-8 hover:underline">
      <ArrowLeft className="w-4 h-4" /> Voltar
    </Link>

    <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
    <p className="text-muted-foreground mb-8">Última atualização: 12 de Fevereiro de 2026</p>

    <div className="prose prose-sm dark:prose-invert space-y-6 text-muted-foreground">
      <section>
        <h2 className="text-lg font-semibold text-foreground">1. Aceitação dos Termos</h2>
        <p>Ao usar o Plenya, você concorda com estes Termos de Uso e com a nossa Política de Privacidade. Se não concordar, não utilize o aplicativo.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">2. Descrição do Serviço</h2>
        <p>O Plenya é um aplicativo de biohacking feminino que oferece acompanhamento de ciclo menstrual, nutrição, treinos e bem-estar mental. O app utiliza inteligência artificial para personalizar recomendações.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">3. Aviso Médico Importante</h2>
        <p><strong>O Plenya NÃO é um substituto para aconselhamento médico profissional.</strong> As informações e recomendações fornecidas são apenas para fins educacionais e de bem-estar. Consulte um profissional de saúde qualificado para decisões médicas.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">4. Conta do Usuário</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Você é responsável por manter a segurança da sua conta.</li>
          <li>Informações fornecidas devem ser precisas e atualizadas.</li>
          <li>Você pode excluir sua conta a qualquer momento nas configurações do perfil.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">5. Assinaturas e Pagamentos</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>O Plenya oferece planos gratuitos e premium.</li>
          <li>Pagamentos são processados via Stripe de forma segura.</li>
          <li>Assinaturas renovam automaticamente e podem ser canceladas a qualquer momento.</li>
          <li>Reembolsos seguem a política da plataforma de pagamento.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">6. Propriedade Intelectual</h2>
        <p>Todo o conteúdo, design, marca e tecnologia do Plenya são protegidos por direitos autorais. Você não pode copiar, modificar ou distribuir qualquer parte do app sem autorização.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">7. Limitação de Responsabilidade</h2>
        <p>O Plenya não se responsabiliza por decisões tomadas com base nas informações fornecidas pelo app. O uso é por sua conta e risco.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">8. Alterações nos Termos</h2>
        <p>Podemos atualizar estes termos periodicamente. Alterações significativas serão comunicadas pelo app. O uso continuado após alterações constitui aceitação dos novos termos.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">9. Contato</h2>
        <p>Dúvidas sobre estes termos? Entre em contato: <strong>contato@plenya.app</strong></p>
      </section>
    </div>
  </div>
);

export default Termos;
