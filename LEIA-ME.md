# Portfólio @DevGuijas

Portfólio em **React + Node.js/Express + SQLite**, adaptado dos arquivos fornecidos. A página pública conserva o CSS, as fontes, o fundo, o menu circular, a composição das palavras em contorno, o cursor e as transições de tela do site de referência. A foto PNG fornecida substitui a imagem principal ausente. Logotipo, prêmios, textos institucionais e autoria da empresa foram substituídos por conteúdo de portfólio.

## Iniciar no Windows

1. Instale **Node.js 24 LTS** pelo site oficial: https://nodejs.org. O npm vem junto.
2. **Extraia o ZIP inteiro** para uma pasta local, por exemplo `C:\DevGuijas\Portfolio`. Não execute dentro do ZIP. Evite manter o banco SQLite em compartilhamento de rede, OneDrive ou outra pasta sincronizada enquanto o servidor estiver rodando.
3. Dê dois cliques em **INICIAR.bat**. A primeira execução instala as dependências e precisa de internet. A compilação é refeita ao iniciar para incorporar mudanças no código.
4. No primeiro acesso, crie seu usuário e uma senha de **12 a 128 caracteres** no terminal. A senha não aparece enquanto você digita. Não existe senha padrão.
5. O navegador abre o portfólio em **http://localhost:3000**. O painel fica em **http://localhost:3000/admin**. Use `localhost`, como configurado, para entrar no painel.
6. Mantenha o terminal aberto. Para parar, pressione `Ctrl+C` e confirme o encerramento do lote, se o Windows perguntar.

Se a porta estiver em uso, feche a instância anterior. Para alterar a porta, copie `.env.example` para `.env` e ajuste **PORT e PUBLIC_ORIGIN juntos**, por exemplo `PORT=3005` e `PUBLIC_ORIGIN=http://localhost:3005`.

## Painel

- **Projetos:** criar, editar, excluir, ordenar, destacar, salvar rascunho e publicar. Título, descrição e link são obrigatórios; capa, tecnologias e repositório são opcionais. Projetos publicados entram nas telas horizontais do site. Destaques aparecem primeiro, seguidos pela ordem numérica crescente.
- **Conteúdo do site:** nome, autoria, foto da abertura, imagem independente da segunda tela, palavras da abertura, indicação de rolagem, apresentação, habilidades, logos e descrições das tecnologias, menu, Instagram, LinkedIn, demais links, rodapé e metadados. Também permite ocultar as seções sobre, habilidades e contato.
- **Minha conta:** trocar a senha, encerrando todas as sessões.
- **Imagens:** PNG/JPG/WebP, até 5 MB e 25 megapixels. São reprocessadas para WebP, limitadas a 1600 pixels e têm metadados removidos. Salve o formulário depois de enviar a imagem.
- Textos são tratados como texto simples. Não é permitido inserir HTML ou scripts. Campos extensos podem rolar dentro da tela para não alterar a composição em tela cheia.

A abertura mantém `think`, `plan`, `make` por padrão; cada palavra pode ser alterada no painel. A navegação mantém as transições do original: roda do mouse/toque para passar de tela, setas ou PageUp/PageDown no teclado, Home para voltar ao começo. O menu aparece na abertura, como no original. Escape ou o botão de navegação acessível pelo Tab também abrem o menu.

Não foram incluídos projetos fictícios. A tela de projetos começa vazia, com texto editável e link para o GitHub. Confirme no painel se o endereço `https://github.com/DevGuijas` é o seu perfil e ajuste-o caso necessário.

## Dados, cópias e recuperação

- `data/portfolio.sqlite`: conta, conteúdo, projetos e sessões.
- `data/uploads/`: fotos e capas enviadas.
- A pasta `data` é criada no primeiro uso e **não vem preenchida no ZIP**.
- Para fazer backup, **pare o servidor e copie a pasta `data` inteira**, junto do `.env` se houver. Para restaurar, pare o servidor e recoloque essa pasta na mesma estrutura. Proteja a cópia: ela contém seu banco e o hash da senha.
- Para recuperar acesso, execute **RECUPERAR-ACESSO.bat** localmente. Ele redefine a conta administrativa e encerra sessões, preservando projetos e textos. Quem tiver acesso à pasta do servidor poderá executar essa recuperação; restrinja as permissões da pasta no Windows.
- Imagens removidas de um formulário não são apagadas automaticamente do disco; isso evita apagar uma imagem ainda usada por outro projeto. Para limpar arquivos antigos, faça backup e confira primeiro os usos no banco.

## Segurança e publicação

O padrão escuta apenas no computador local (`127.0.0.1`). O `.bat` não publica o site na internet.

Foram implementados: scrypt com salt por senha, consultas parametrizadas, validação estrita no servidor, sessão opaca armazenada no SQLite por hash, cookies HttpOnly/SameSite=Strict, expiração de oito horas, renovação no login, uma sessão administrativa ativa, CSRF por sessão e verificação da origem, limite de login e de requisições, limites de corpo e imagens, reprocessamento das imagens, CSP e cabeçalhos Helmet. Banco, código e configurações não são servidos como arquivos públicos.

Para hospedar, use um servidor com disco persistente e **HTTPS por proxy reverso**. Configure `PUBLIC_ORIGIN=https://seu-dominio.com` (sem barra final). Só ajuste `HOST=0.0.0.0` quando for necessário e houver proteção de rede; mantenha a porta do Node acessível apenas ao proxy. Use `TRUST_PROXY=1` somente se houver exatamente um proxy confiável, removendo/substituindo cabeçalhos encaminhados do cliente. Com origem HTTPS, o cookie recebe `Secure` e prefixo `__Host-`.

O limite de requisições reside na memória do processo: este pacote destina-se a **uma instância**. Para múltiplas instâncias, use armazenamento compartilhado para limites e uma arquitetura de banco adequada. Mantenha o Node 24 e as dependências atualizados, faça backups e execute `npm audit` periodicamente. Controles automatizados não substituem uma revisão de segurança do ambiente de hospedagem.

Referências técnicas: [segurança no Express](https://expressjs.com/en/advanced/best-practice-security/) e [SQLite nativo do Node 24](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html).

## Desenvolvimento

```text
npm ci
npm run setup
npm run build
npm start
npm test
npm audit
```

- `src/Portfolio.jsx`: composição e transições da página pública adaptada.
- `src/original.css`: CSS de base fornecido, mantido na página pública. Apenas referências a dois arquivos ausentes e não utilizados foram neutralizadas.
- `src/original-fonts.css` e `public/fonts/`: fontes locais da referência, sem dependência de CDN.
- `src/portfolio.css`: ajustes específicos de foto, conteúdo editável, acessibilidade e rolagem de textos longos.
- `src/Admin.jsx` e `src/styles.css`: painel isolado da página pública.
- `server/app.mjs`: API, autenticação, validação e arquivos estáticos.
- `server/db.mjs`: esquema SQLite e valores iniciais.
- `server/security.mjs`: senhas e validações.
- `tests/security.test.mjs`: testes de publicação, persistência, upload e controles de segurança.

O `dist` já compilado está incluído. `node_modules` não é incluído; o `.bat` instala a partir do `package-lock.json`. Não há necessidade de instalar SQLite separadamente ou configurar um servidor de banco de dados.

## Imagens e licenças

A foto e o ícone metálico foram fornecidos pelo autor. As fontes Inter, Be Vietnam Pro e Rubik foram preservadas dos arquivos de referência e suas licenças OFL acompanham o projeto em `licenses/`.

As logos Node.js, React e SQLite são do [Devicon](https://github.com/devicons/devicon/tree/v2.17.0), sob licença MIT. As logos Instagram e LinkedIn são do [Font Awesome Free](https://github.com/FortAwesome/Font-Awesome/tree/6.x), sob CC BY 4.0 para os ícones. Os SVGs de origem e as versões PNG transparentes estão em `public/icons/`, e os textos das licenças estão em `licenses/`. As marcas pertencem aos seus respectivos titulares. Não há carregamento de imagens ou fontes por CDN durante a navegação.

## Validação da entrega

- Compilação de produção executada com sucesso.
- 15 testes automatizados passando: publicação, rascunhos, edição, exclusão, persistência, autenticação, sessões, CSRF, origem, validação de links, uploads, limites e arquivos privados.
- `npm audit`: nenhuma vulnerabilidade conhecida reportada na verificação desta entrega.
- Fluxos no navegador: login, publicação de projeto, salvamento de conteúdo, navegação, imagens e redes sociais.
- Primeiro uso do `INICIAR.bat` testado com uma conta temporária, sem dados de teste no pacote.
