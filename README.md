# Maturador de Chip para WhatsApp 🔥

Este é um script de automação em TypeScript projetado para "aquecer" múltiplos chips (contas) de WhatsApp, fazendo com que eles interajam entre si para simular atividade humana e reduzir o risco de banimento por inatividade ou automação em massa.

## Funcionalidades Principais ✨

* **Gerenciamento de Múltiplos Chips:** Adicione, remova e liste várias contas de WhatsApp para aquecer simultaneamente.
* **Menu Interativo:** Controle o script facilmente através de um menu no terminal.
* **Interações Humanizadas:** O script simula comportamento humano, incluindo:
    * Envio de mensagens de texto aleatórias a partir de um arquivo.
    * Envio de mídias como fotos, stickers e áudios (PTT).
    * Simulação do status "digitando...".
    * Intervalos de tempo aleatórios entre as ações.
* **Sessões Persistentes:** Salva a sessão de autenticação para não precisar escanear o QR Code toda vez que o script for iniciado.

## Pré-requisitos 📋

* [Node.js](https://nodejs.org/) (versão 18 ou superior)
* NPM (geralmente instalado junto com o Node.js)

## Estrutura de Pastas 📂

Para que o script funcione corretamente, a sua pasta do projeto deve seguir esta estrutura:

```
.
├── media/
│   ├── images/
│   │   └── foto1.jpg
│   ├── stickers/
│   │   └── figurinha1.webp
│   └── audio/
│       └── som1.mp3
├── chips.json
├── frases.txt
├── index.ts
├── package.json
└── README.md
```

## Instalação e Configuração ⚙️

1.  **Clone ou Baixe os Arquivos:**
    Coloque todos os arquivos (`index.ts`, `package.json`, etc.) na pasta do seu projeto.

2.  **Instale as Dependências:**
    Abra o terminal na pasta do projeto e execute o seguinte comando para instalar todas as bibliotecas necessárias:
    ```bash
    npm install
    ```

3.  **Prepare os Arquivos de Dados:**
    * **`frases.txt`**: Adicione as frases que você deseja enviar, uma por linha.
    * **`media/`**: Dentro da pasta `media`, crie as subpastas `images`, `stickers` e `audio` e adicione os seus arquivos de mídia correspondentes.

## Como Executar 🚀

1.  Abra o terminal na pasta do projeto.
2.  Execute o comando:
    ```bash
    npm start
    ```
3.  O menu interativo será exibido. Use a opção **1 - Adicionar novo chip** para cadastrar suas contas. Você precisará escanear o QR Code para cada uma na primeira vez.
4.  Após cadastrar pelo menos dois chips, use a opção **4 - Iniciar Aquecimento**.

## Como Usar o Menu 🕹️

* **1 - Adicionar novo chip:** Cadastra uma nova conta. Você precisará digitar o número de telefone (ex: `5551999999999`) e depois escanear o QR Code que aparecerá no terminal.
* **2 - Remover chip:** Remove uma conta da lista de aquecimento.
* **3 - Listar chips:** Mostra todas as contas já cadastradas.
* **4 - Iniciar Aquecimento:** Inicia o processo de troca de mensagens entre os chips cadastrados.
* **5 - Sair:** Encerra o programa.

---

> **Aviso Importante:** A automação de contas de usuário viola os Termos de Serviço do WhatsApp. Use este script por sua conta e risco. O uso indevido pode levar ao banimento permanente dos números de telefone utilizados. Este projeto foi criado para fins de estudo e experimentação.
