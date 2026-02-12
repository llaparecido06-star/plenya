import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacidade: React.FC = () => (
  <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-2 text-primary mb-8 hover:underline">
      <ArrowLeft className="w-4 h-4" /> Voltar
    </Link>

    <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
    <p className="text-muted-foreground mb-8">Última atualização: 12 de Fevereiro de 2026</p>

    <div className="prose prose-sm dark:prose-invert space-y-6 text-muted-foreground">
      <section>
        <h2 className="text-lg font-semibold text-foreground">1. Informações que Coletamos</h2>
        <p>O Plenya coleta as seguintes informações para personalizar sua experiência:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Dados de cadastro:</strong> nome, e-mail e senha.</li>
          <li><strong>Dados de saúde:</strong> ciclo menstrual, sintomas, humor, peso, alimentação e atividades físicas — registrados voluntariamente por você.</li>
          <li><strong>Dados de uso:</strong> interações com o app para melhorar a experiência.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">2. Como Usamos seus Dados</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Personalizar insights e recomendações de saúde.</li>
          <li>Gerar relatórios médicos sob sua solicitação.</li>
          <li>Enviar lembretes e notificações configurados por você.</li>
          <li>Melhorar o app por meio de análises agregadas e anonimizadas.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">3. Compartilhamento de Dados</h2>
        <p>Não vendemos seus dados pessoais. Compartilhamos informações apenas com:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provedores de infraestrutura (hospedagem e banco de dados) sob acordos de confidencialidade.</li>
          <li>Processadores de pagamento (Stripe) para gerenciar assinaturas.</li>
          <li>Autoridades legais, quando exigido por lei.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">4. Segurança</h2>
        <p>Utilizamos criptografia, autenticação segura e políticas de acesso restrito para proteger seus dados. Seus dados de saúde são armazenados com segurança e acessíveis apenas por você.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">5. Seus Direitos</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Acesso:</strong> visualizar todos os dados armazenados sobre você.</li>
          <li><strong>Correção:</strong> atualizar informações imprecisas.</li>
          <li><strong>Exclusão:</strong> deletar sua conta e todos os dados associados a qualquer momento, diretamente no app.</li>
          <li><strong>Portabilidade:</strong> exportar seus dados em formato PDF.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">6. Cookies e Armazenamento Local</h2>
        <p>Utilizamos armazenamento local do navegador para manter sua sessão ativa e preferências. Não usamos cookies de rastreamento de terceiros.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">7. Contato</h2>
        <p>Para dúvidas sobre privacidade, entre em contato pelo e-mail: <strong>privacidade@plenya.app</strong></p>
      </section>
    </div>
  </div>
);

export default Privacidade;
