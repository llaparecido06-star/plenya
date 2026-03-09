import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacidade: React.FC = () => (
  <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-2 text-primary mb-8 hover:underline">
      <ArrowLeft className="w-4 h-4" /> Voltar
    </Link>

    <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
    <p className="text-muted-foreground mb-8">Última atualização: 09 de Março de 2026</p>

    <div className="prose prose-sm dark:prose-invert space-y-6 text-muted-foreground">
      <section>
        <h2 className="text-lg font-semibold text-foreground">1. Informações que Coletamos</h2>
        <p>O Plenya coleta as seguintes informações para personalizar sua experiência:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Dados de cadastro:</strong> nome, e-mail e senha (armazenada com hash criptográfico).</li>
          <li><strong>Dados de saúde (sensíveis):</strong> ciclo menstrual, sintomas, humor, peso, alimentação, atividades físicas, dados de gravidez/pós-parto/menopausa e dados de intimidade — registrados voluntariamente por você.</li>
          <li><strong>Dados de uso:</strong> interações com o app para melhorar a experiência.</li>
          <li><strong>Dados do dispositivo:</strong> plataforma (iOS/Android/Web) para envio de notificações push.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">2. Base Legal para Tratamento (LGPD / GDPR)</h2>
        <p>Seus dados são tratados com base nas seguintes fundamentações legais:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Consentimento expresso (Art. 11, LGPD):</strong> para dados de saúde sensíveis, obtido no momento do cadastro ao aceitar os <Link to="/termos" className="text-primary underline">Termos de Uso</Link>.</li>
          <li><strong>Execução do contrato:</strong> para fornecer o serviço contratado (funcionalidades do app).</li>
          <li><strong>Legítimo interesse:</strong> para análises agregadas e anonimizadas visando a melhoria do serviço.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">3. Como Usamos seus Dados</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Personalizar insights e recomendações de saúde e bem-estar.</li>
          <li>Gerar relatórios de saúde sob sua solicitação.</li>
          <li>Fornecer respostas personalizadas via IA no chat.</li>
          <li>Enviar lembretes e notificações configurados por você.</li>
          <li>Melhorar o app por meio de análises agregadas e anonimizadas.</li>
        </ul>
        <p className="mt-2"><strong>Não utilizamos seus dados para fins publicitários de terceiros.</strong></p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">4. Compartilhamento de Dados</h2>
        <p>Não vendemos seus dados pessoais. Compartilhamos informações apenas com:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Provedores de infraestrutura</strong> (hospedagem e banco de dados) sob acordos de confidencialidade e proteção de dados.</li>
          <li><strong>Processadores de pagamento</strong> (Stripe) para gerenciar assinaturas — apenas dados de transação, nunca dados de saúde.</li>
          <li><strong>Provedores de IA</strong> — dados são enviados de forma anonimizada e não são utilizados para treinamento de modelos.</li>
          <li><strong>Autoridades legais</strong>, quando exigido por lei.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">5. Armazenamento e Segurança</h2>
        <p>Utilizamos as seguintes medidas para proteger seus dados:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Criptografia em trânsito (TLS/HTTPS) e em repouso.</li>
          <li>Autenticação segura com hashing de senhas.</li>
          <li>Políticas de acesso restrito por usuário (Row Level Security).</li>
          <li>Seus dados de saúde são armazenados com segurança e acessíveis apenas por você.</li>
        </ul>
        <p className="mt-2">Seus dados são armazenados em servidores seguros enquanto sua conta estiver ativa, ou até que você solicite a exclusão.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">6. Seus Direitos</h2>
        <p>Em conformidade com a LGPD e GDPR, você possui os seguintes direitos:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Acesso:</strong> visualizar todos os dados armazenados sobre você.</li>
          <li><strong>Correção:</strong> atualizar informações imprecisas a qualquer momento.</li>
          <li><strong>Exclusão completa:</strong> deletar sua conta e <strong>todos</strong> os dados associados a qualquer momento, diretamente no app (Perfil → Excluir Conta). A exclusão é irreversível e remove dados de todas as tabelas.</li>
          <li><strong>Portabilidade:</strong> exportar seus dados em formato PDF.</li>
          <li><strong>Revogação do consentimento:</strong> você pode revogar o consentimento a qualquer momento excluindo sua conta.</li>
          <li><strong>Oposição:</strong> solicitar a interrupção de determinado tratamento de dados.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">7. Dados de Menores</h2>
        <p>O Plenya é destinado a pessoas com 13 anos ou mais. Não coletamos intencionalmente dados de menores de 13 anos. Caso identifiquemos uma conta pertencente a um menor de 13 anos, ela será removida juntamente com todos os dados associados.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">8. Cookies e Armazenamento Local</h2>
        <p>Utilizamos armazenamento local do navegador para manter sua sessão ativa e preferências. Não usamos cookies de rastreamento de terceiros.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">9. Alterações nesta Política</h2>
        <p>Podemos atualizar esta política periodicamente. Alterações significativas serão comunicadas pelo app ou por e-mail. O uso continuado após as alterações constitui aceitação da nova política.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">10. Contato e Encarregado de Dados (DPO)</h2>
        <p>Para dúvidas sobre privacidade, exercer seus direitos ou entrar em contato com o encarregado de proteção de dados:</p>
        <p><strong>E-mail:</strong> privacidade@plenya.app</p>
      </section>
    </div>
  </div>
);

export default Privacidade;
