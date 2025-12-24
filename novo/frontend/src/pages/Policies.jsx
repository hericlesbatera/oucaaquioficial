import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../hooks/use-toast';
import { supabase } from '../lib/supabaseClient';

const Policies = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'privacy');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
      window.scrollTo(0, 0);
    }
  }, [searchParams]);
  const [submitting, setSubmitting] = useState(false);
  const [isRepresentative, setIsRepresentative] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    cep: '',
    country: '',
    cnpj: '',
    content_url: '',
    protected_content: '',
    copyright_holder: '',
    proof_of_ownership: '',
    reason: '',
    additional_info: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRepresentativeToggle = () => {
    setIsRepresentative(!isRepresentative);
    // Limpar campos específicos ao mudar
    if (!isRepresentative) {
      setFormData(prev => ({
        ...prev,
        phone: '',
        mobile: '',
        cnpj: ''
      }));
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.protected_content || !formData.copyright_holder) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios marcados com *',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('copyright_reports')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          mobile: formData.mobile || null,
          address: formData.address || null,
          cep: formData.cep || null,
          country: formData.country || null,
          cnpj: formData.cnpj || null,
          content_url: formData.content_url || null,
          protected_content: formData.protected_content,
          copyright_holder: formData.copyright_holder,
          proof_of_ownership: formData.proof_of_ownership || null,
          is_representative: isRepresentative,
          additional_info: formData.additional_info || null,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Denúncia enviada com sucesso',
        description: 'Sua denúncia foi recebida e será analisada pela nossa equipe em breve.'
      });

      // Limpar formulário
      setFormData({
        name: '',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        cep: '',
        country: '',
        cnpj: '',
        content_url: '',
        protected_content: '',
        copyright_holder: '',
        proof_of_ownership: '',
        reason: '',
        additional_info: ''
      });
      setIsRepresentative(false);
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro ao enviar denúncia',
        description: error.message || 'Ocorreu um erro ao processar sua denúncia. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'privacy', label: 'Política de Privacidade' },
    { id: 'terms', label: 'Termos de Uso' },
    { id: 'intellectual', label: 'Proteção de Propriedade Intelectual' },
    { id: 'report', label: 'Denúncia de Conteúdo' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 md:items-start">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="space-y-2 md:fixed md:w-56 md:top-28 md:max-h-screen md:overflow-y-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded font-semibold transition-all text-sm flex items-center justify-between ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {activeTab === tab.id && <ChevronRight size={18} />}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-4">
            {/* Privacy Policy */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h1 className="text-3xl font-bold mb-8 text-gray-900">Política de Privacidade</h1>
                
                <div className="space-y-6 text-gray-700 leading-relaxed">
                  <div>
                    <h2 className="text-lg font-bold mb-3 text-gray-900">1. PRIVACIDADE</h2>
                    <p className="mb-3">
                      Um dos maiores compromissos do portal Ouça Aqui ("Ouça Aqui", "Nós" ou "Portal") é o de proteger a privacidade de pessoas que, como você, são usuários do Portal. As informações que você eventualmente nos confiar, através deste Portal, se utilizadas, o serão exclusivamente para facilitar e aprimorar nosso relacionamento com você e com os demais visitantes do Portal.
                    </p>
                    <p className="mb-3">
                      O Ouça Aqui entende a importância da privacidade para você. Assim, envidaremos o máximo de esforços para preservá-la.
                    </p>
                    <p>
                      Ao aceitar os termos de nossa Política de Privacidade, você permite a coleta dos dados fornecidos por você, dos dados referentes ao seu uso do Ouça Aqui e concorda com o compartilhamento de seus dados, nos termos abaixo.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold mb-3 text-gray-900">2. TRANSPARÊNCIA E RAZÕES DA COLETA DE INFORMAÇÕES</h2>
                    <p className="mb-3">
                      O Ouça Aqui busca a transparência e o controle sobre as formas de coleta e de uso de informações individuais identificáveis. Neste sentido, informa que poderá, durante o processo de cadastro, solicitar informações pessoais, tais como nome, endereço residencial, e-mail, número de telefone ou quaisquer outras informações de visitantes do Portal, as quais, quando utilizadas sozinhas ou com outros dados, poderão identificar individualmente um visitante do Portal.
                    </p>
                    <p className="mb-3 font-semibold">
                      Esses são os principais objetivos da obtenção de informações de nossos usuários:
                    </p>
                    <ul className="list-disc list-inside space-y-2 mb-3 ml-2">
                      <li>Oferecer serviços mais orientados, tornando mais produtiva a sua visita ao Portal.</li>
                      <li>Manter os produtos, serviços e integrações do Portal seguros e protegidos</li>
                      <li>Proteger os direitos ou propriedades do Portal e de outros</li>
                      <li>Avaliar ou entender a eficiência dos anúncios que você e outras pessoas visualizam</li>
                      <li>Fazer sugestões para você e outros usuários do Portal</li>
                      <li>Operações internas, que incluem correção de erros, análise de dados, testes, pesquisa e desenvolvimento</li>
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold mb-3 text-gray-900">3. ARMAZENAMENTO E EXCLUSÃO</h2>
                    <p className="mb-3">
                      Suas informações são armazenadas pelo tempo necessário para o fornecimento dos produtos e serviços do Portal. Normalmente, as informações associadas à sua conta serão mantidas até sua conta ser excluída.
                    </p>
                    <p className="mb-3">
                      Se você deseja que suas informações sejam removidas, tem a opção de enviar um e-mail para contato@oucaaqui.com. Existem as seguintes opções:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><strong>Exclusão Definitiva:</strong> Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.</li>
                      <li><strong>Anonimização dos Dados Públicos:</strong> Seus dados públicos serão removidos dentro de 15 dias.</li>
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold mb-3 text-gray-900">4. DIREITOS DO USUÁRIO (LGPD)</h2>
                    <p>
                      De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar e corrigir suas informações pessoais. Para exercer esses direitos, entre em contato: <strong>contato@oucaaqui.com</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Terms of Use */}
            {activeTab === 'terms' && (
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h1 className="text-3xl font-bold mb-8 text-gray-900">Termos de Uso</h1>
                
                <div className="space-y-6 text-gray-700 leading-relaxed">
                   <div>
                    <h2 className="text-lg font-bold mb-3 text-gray-900">1. INTRODUÇÃO</h2>
                    <p className="mb-3">
                      O portal Ouça Aqui ("Ouça Aqui", "Nós" ou "Portal") é uma plataforma de rede social através da qual os Usuários e Visitantes (definidos no item 7 abaixo) poderão compartilhar e ter acesso aos Conteúdos (definido no item 14 abaixo), observadas as regras estabelecidas no presente documento ("Termos de Uso").
                    </p>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold mb-3 text-gray-900">2. CONCORDÂNCIA COM OS TERMOS</h2>
                    <p>
                      Ao acessar, usar, visitar e/ou utilizar as funcionalidades do Portal, incluindo todo e qualquer serviço ou produto disponibilizado através do Portal ("Serviços"), você expressamente manifesta sua ciência e concordância com os Termos de Uso, Política de Privacidade e Política de Denúncia de Violação de Direitos.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold mb-3 text-gray-900">3. TIPOS DE CONTA E FUNCIONALIDADES</h2>
                    <p className="mb-3 font-semibold">Usuário:</p>
                    <ul className="list-disc list-inside space-y-2 mb-4 ml-2">
                      <li>Pode acessar e ouvir músicas e conteúdos disponíveis na plataforma.</li>
                      <li>Pode compartilhar músicas com outros usuários e criar suas próprias playlists.</li>
                      <li>Não tem permissão para fazer upload de conteúdo.</li>
                    </ul>
                    
                    <p className="mb-3 font-semibold">Artista:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>Pode acessar e ouvir músicas, assim como os usuários.</li>
                      <li>Pode fazer upload de músicas e outros conteúdos.</li>
                      <li>Pode gerenciar e editar seus próprios conteúdos dentro da plataforma.</li>
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold mb-3 text-gray-900">4. PROPRIEDADE INTELECTUAL</h2>
                    <p className="mb-3">
                      O conteúdo do "Ouça Aqui", incluindo sua marca, design e funcionalidades, são protegidos por direitos autorais e não podem ser reproduzidos sem autorização prévia.
                    </p>
                    <p>
                      O conteúdo publicado por usuários é de sua propriedade, mas você concede ao "Ouça Aqui" uma licença para usá-lo conforme necessário para operar a plataforma.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold mb-3 text-gray-900">5. FORO</h2>
                    <p>
                      Qualquer disputa relacionada a estes Termos de Uso será resolvida no foro da cidade de São Vicente Férrer, Pernambuco, com exclusão de qualquer outro foro.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Intellectual Property */}
            {activeTab === 'intellectual' && (
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h1 className="text-3xl font-bold mb-8 text-gray-900">Política de Proteção da Propriedade Intelectual</h1>
                
                <div className="space-y-6 text-gray-700 leading-relaxed">
                  <div>
                    <h2 className="text-lg font-bold mb-3 text-gray-900">Definição e classificação de obras passíveis de direitos autorais</h2>
                    <p className="mb-3">
                      Ao criar determinada obra que seja original, isto é, obra criativa e fixada em qualquer meio, tangível ou intangível, o indivíduo passa a deter sua titularidade/propriedade e também os direitos sobre esta obra.
                    </p>
                    <p className="mb-3">
                      Como não poderia deixar de ser, tais direitos têm natureza exclusiva para sua utilização de forma determinada e específica.
                    </p>
                    <p>
                      No tocante ao Portal Ouça Aqui, os modelos de obras mais relevantes e que deve-se ter cautela acerca da proteção de direitos autorais são (i) gravações de som e composições musicais e (ii) obras dramáticas tal como musicais.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold mb-3 text-gray-900">Práticas que não ausentam sua responsabilidade por infração de direitos autorais</h2>
                    <p className="mb-3">
                      Observe-se que o conteúdo postado por você pode ainda sofrer reivindicação de violação de direitos autorais, muito embora tenha-se:
                    </p>
                    <ul className="list-disc list-inside space-y-2 mb-3 ml-2">
                      <li>Dado crédito ao titular/proprietário dos direitos autorais</li>
                      <li>Identificado a existência de outros arquivos semelhantes no Portal Ouça Aqui</li>
                      <li>Adquirido o arquivo fonográfico através de CDs e DVDs físicos, arquivos de mp3 em lojas online</li>
                      <li>Gravado o conteúdo em shows e eventos</li>
                      <li>Dentre outros artifícios que não têm o condão de afastar sua infração de direitos autorais de terceiros</li>
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold mb-3 text-gray-900">Portal Ouça Aqui não pode dirimir litígios referentes à propriedade de direitos autorais</h2>
                    <p className="mb-3">
                      O Portal Ouça Aqui não tem legitimidade, obrigação ou capacidade de dirimir conflitos relativos à propriedade de direitos autorais.
                    </p>
                    <p className="mb-3">
                      Sempre que receber uma notificação válida sobre suposta infração de direitos autorais e pedido para sua exclusão, o Portal Ouça Aqui removerá de seus servidores o conteúdo supostamente infrator.
                    </p>
                    <p>
                      Inclusive, conforme consta das nossas Políticas (Termos de Uso, Política de Privacidade e Política de Proteção da Propriedade Intelectual), nos reservamos o direito de notificar o Usuário responsável e, em caso de reincidência, banir o Usuário de nossa Comunidade destinada única e exclusivamente à promoção de artistas e bandas, sejam ela já consagradas ou em lançamento de carreira.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DMCA Report Form */}
            {activeTab === 'report' && (
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h1 className="text-3xl font-bold mb-8 text-gray-900">Denúncia de Conteúdo</h1>
                
                <form onSubmit={handleSubmitReport} className="space-y-6">
                  {/* When NOT representative */}
                  {!isRepresentative && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Nome completo *
                        </label>
                        <Input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Nome completo"
                          className="w-full bg-gray-100"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          E-mail *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="E-mail"
                          className="w-full bg-gray-100"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Endereço
                        </label>
                        <Input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Endereço"
                          className="w-full bg-gray-100"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            CEP
                          </label>
                          <Input
                            type="text"
                            name="cep"
                            value={formData.cep}
                            onChange={handleInputChange}
                            placeholder="CEP"
                            className="w-full bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            País
                          </label>
                          <Input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            placeholder="País"
                            className="w-full bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Telefone
                          </label>
                          <Input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Telefone"
                            className="w-full bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Celular
                          </label>
                          <Input
                            type="tel"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            placeholder="Celular"
                            className="w-full bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Representative Toggle */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <label className="text-sm font-medium text-gray-900">
                      Você é o procurador ou representante do detentor de direitos violados?
                    </label>
                    <button
                      type="button"
                      onClick={handleRepresentativeToggle}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        isRepresentative ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          isRepresentative ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    {isRepresentative && <span className="text-sm text-blue-600 font-semibold ml-2">Sim</span>}
                  </div>

                  {/* When IS representative */}
                  {isRepresentative && (
                    <div className="space-y-4 bg-gray-50 rounded-lg p-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Nome completo
                        </label>
                        <Input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Nome completo"
                          className="w-full bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          E-mail
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="E-mail"
                          className="w-full bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Endereço
                        </label>
                        <Input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Endereço"
                          className="w-full bg-gray-100"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            CEP
                          </label>
                          <Input
                            type="text"
                            name="cep"
                            value={formData.cep}
                            onChange={handleInputChange}
                            placeholder="CEP"
                            className="w-full bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            País
                          </label>
                          <Input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            placeholder="País"
                            className="w-full bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            CNPJ (Se houver)
                          </label>
                          <Input
                            type="text"
                            name="cnpj"
                            value={formData.cnpj}
                            onChange={handleInputChange}
                            placeholder="CNPJ (Se houver)"
                            className="w-full bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content Information */}
                  <div className="space-y-4 border-t pt-6">
                    <h2 className="text-lg font-semibold text-gray-900">Informações do Conteúdo</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Preencha o campo abaixo indicando a(s) URL(s) e/ou referências que permitam localização do conteúdo supostamente violador:
                      </label>
                      <Textarea
                        name="content_url"
                        value={formData.content_url}
                        onChange={handleInputChange}
                        placeholder=""
                        rows={3}
                        className="w-full bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Descreva ou identifique os Conteúdos Protegidos, objeto da suposta violação:
                      </label>
                      <Textarea
                        name="protected_content"
                        value={formData.protected_content}
                        onChange={handleInputChange}
                        placeholder=""
                        rows={4}
                        className="w-full bg-gray-100"
                        required
                      />
                    </div>
                  </div>

                  {/* Copyright Information */}
                  <div className="space-y-4 border-t pt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Proprietário dos Direitos Autorais *
                      </label>
                      <Input
                        type="text"
                        name="copyright_holder"
                        value={formData.copyright_holder}
                        onChange={handleInputChange}
                        placeholder="Proprietário dos Direitos Autorais"
                        className="w-full bg-gray-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Prova de Propriedade
                      </label>
                      <Textarea
                        name="proof_of_ownership"
                        value={formData.proof_of_ownership}
                        onChange={handleInputChange}
                        placeholder=""
                        rows={3}
                        className="w-full bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Informações Adicionais
                      </label>
                      <Textarea
                        name="additional_info"
                        value={formData.additional_info}
                        onChange={handleInputChange}
                        placeholder=""
                        rows={3}
                        className="w-full bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="border-t pt-6">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 font-semibold rounded-lg"
                    >
                      {submitting ? 'Enviando...' : 'Enviar Denúncia'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      * Campos obrigatórios. Sua denúncia será tratada de forma confidencial.<br />
                      Para mais informações: <strong>contato@oucaaqui.com</strong>
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policies;
