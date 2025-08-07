import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import qrcodeTerminal from "qrcode-terminal";
import * as fs from "fs";
import promptSync from "prompt-sync";
import path from "path";

// --- Constantes de Configuração ---
const CHIPS_FILE = "chips.json";
const FRASES_FILE = "frases.txt";
const MEDIA_FOLDER = "media";

// Intervalo de tempo entre mensagens (em milissegundos)
const TEMPO_ENTRE_MENSAGENS = { min: 25000, max: 40000 }; 

// Probabilidades de cada tipo de ação
const CHANCE_TEXTO = 0.6;   // 60%
const CHANCE_FOTO = 0.2;    // 20%
const CHANCE_STICKER = 0.1; // 10%
const CHANCE_AUDIO = 0.1;   // 10%

// --- Tipos de Dados ---
type ChipStatus = "novo" | "aquecendo" | "pronto" | "banido" | "desconectado";

interface Chip {
    id: string;
    numero: string;
    status: ChipStatus;
}

// --- Funções Auxiliares ---
const prompt = promptSync();

function carregarChips(): Chip[] {
    if (!fs.existsSync(CHIPS_FILE)) return [];
    const data = fs.readFileSync(CHIPS_FILE, "utf8");
    return JSON.parse(data);
}

function salvarChips(chips: Chip[]): void {
    fs.writeFileSync(CHIPS_FILE, JSON.stringify(chips, null, 2));
}

async function lerFrases(): Promise<string[]> {
    if (!fs.existsSync(FRASES_FILE)) {
        console.warn(`Arquivo de frases "${FRASES_FILE}" não encontrado. Usando frase padrão.`);
        return ["A persistência realiza o impossível."];
    }
    const data = await fs.promises.readFile(FRASES_FILE, "utf8");
    return data.split("\n").filter(Boolean); // Filtra linhas em branco
}

function obterArquivoAleatorio(pasta: string): string | null {
    if (!fs.existsSync(pasta)) return null;
    const arquivos = fs.readdirSync(pasta).filter(arquivo => !arquivo.startsWith(".")); // Ignora arquivos ocultos
    if (arquivos.length === 0) return null;
    const arquivoAleatorio = arquivos[Math.floor(Math.random() * arquivos.length)];
    return path.join(pasta, arquivoAleatorio);
}

// --- Funções Principais do WhatsApp ---

async function inicializarChip(chipId: string): Promise<Client> {
    console.log(`Iniciando sessão para ${chipId}...`);
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: chipId }),
        puppeteer: { args: ["--no-sandbox", "--disable-setuid-sandbox"] }
    });

    client.on("qr", qr => {
        console.log(`[QR CODE] Escaneie o QR Code para ${chipId}:`);
        qrcodeTerminal.generate(qr, { small: true });
    });

    client.on("ready", () => console.log(`✅ ${chipId} está pronto e conectado!`));
    client.on("authenticated", () => console.log(`🔒 ${chipId} foi autenticado com sucesso!`));
    client.on("disconnected", () => console.warn(`🔌 ${chipId} foi desconectado!`));
    
    await client.initialize();
    return client;
}

async function simularDigitacaoEEnviar(sender: Client, receiverId: string, message: string | MessageMedia): Promise<void> {
    await sender.sendSeen(receiverId);
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500)); // Pequena pausa
    await sender.startTyping(receiverId);
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000)); // Tempo "digitando"
    await sender.stopTyping(receiverId);
    await sender.sendMessage(receiverId, message);
}

async function iniciaAquecimento(chips: Chip[]) {
    const chipsAtivos: Client[] = [];
    console.log("\nIniciando e autenticando todos os chips...");
    for (const chip of chips) {
        try {
            const client = await inicializarChip(chip.id);
            chipsAtivos.push(client);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Pausa entre inicializações
        } catch (err) {
            console.error(`❌ Erro fatal ao iniciar ${chip.id}:`, err);
        }
    }

    console.log("\n🔥 Aquecimento iniciado! Pressione CTRL+C para parar.");
    const frases = await lerFrases();

    while (true) {
        for (const sender of chipsAtivos) {
            // Seleciona um destinatário aleatório que não seja ele mesmo
            const possiveisReceivers = chipsAtivos.filter(r => r !== sender);
            if (possiveisReceivers.length === 0) continue;
            const receiver = possiveisReceivers[Math.floor(Math.random() * possiveisReceivers.length)];

            try {
                const receiverId = receiver.info?.wid._serialized;
                if (!receiverId) continue;

                const tipo = Math.random();
                let logMessage = "";

                if (tipo < CHANCE_TEXTO) {
                    const msg = frases[Math.floor(Math.random() * frases.length)];
                    await simularDigitacaoEEnviar(sender, receiverId, msg);
                    logMessage = "Texto enviado";
                } else if (tipo < CHANCE_TEXTO + CHANCE_FOTO) {
                    const arquivo = obterArquivoAleatorio(path.join(MEDIA_FOLDER, "images"));
                    if (arquivo) {
                        const media = MessageMedia.fromFilePath(arquivo);
                        await simularDigitacaoEEnviar(sender, receiverId, media);
                        logMessage = `Foto enviada: ${path.basename(arquivo)}`;
                    }
                } else if (tipo < CHANCE_TEXTO + CHANCE_FOTO + CHANCE_STICKER) {
                     const arquivo = obterArquivoAleatorio(path.join(MEDIA_FOLDER, "stickers"));
                    if (arquivo) {
                        const media = MessageMedia.fromFilePath(arquivo);
                        await simularDigitacaoEEnviar(sender, receiverId, media);
                        logMessage = `Sticker enviado: ${path.basename(arquivo)}`;
                    }
                } else {
                     const arquivo = obterArquivoAleatorio(path.join(MEDIA_FOLDER, "audio"));
                    if (arquivo) {
                        const media = MessageMedia.fromFilePath(arquivo);
                        await simularDigitacaoEEnviar(sender, receiverId, { ptt: true });
                        logMessage = `Áudio (PTT) enviado: ${path.basename(arquivo)}`;
                    }
                }

                if (logMessage) {
                    console.log(`[${sender.info.pushname}] -> [${receiver.info.pushname}]: ${logMessage}`);
                }

                const delay = Math.random() * (TEMPO_ENTRE_MENSAGENS.max - TEMPO_ENTRE_MENSAGENS.min) + TEMPO_ENTRE_MENSAGENS.min;
                await new Promise(resolve => setTimeout(resolve, delay));

            } catch (error) {
                console.error(`\n🚨 ERRO no envio de [${sender.info?.pushname}]:`, error.message);
                console.error("Continuando para a próxima interação...\n");
            }
        }
    }
}

// --- Menu da Aplicação ---
async function menu() {
    let chips = carregarChips();

    while (true) {
        console.log("\n--- Maturador de Chip ---");
        console.log("1 - Adicionar novo chip");
        console.log("2 - Remover chip");
        console.log("3 - Listar chips");
        console.log("4 - Iniciar Aquecimento");
        console.log("5 - Sair");
        
        const escolha = prompt("Escolha uma opção: ");

        switch (escolha) {
            case "1":
                const id = `Chip${chips.length + 1}`;
                const numero = prompt(`Digite o número do ${id} (formato 55519...): `);
                if (numero) {
                    chips.push({ id, numero: `${numero}@c.us`, status: "novo" });
                    salvarChips(chips);
                    console.log(`Chip ${id} adicionado com sucesso!`);
                }
                break;
            case "2":
                const chipIdRemover = prompt("Digite o ID do chip a remover (ex: Chip1): ");
                chips = chips.filter(chip => chip.id !== chipIdRemover);
                salvarChips(chips);
                console.log(`Chip ${chipIdRemover} removido!`);
                break;
            case "3":
                console.log("\n--- Chips Cadastrados ---");
                chips.forEach(c => console.log(`ID: ${c.id}, Número: ${c.numero}, Status: ${c.status}`));
                if(chips.length === 0) console.log("Nenhum chip cadastrado.");
                break;
            case "4":
                if (chips.length < 2) {
                    console.log("É necessário ter pelo menos 2 chips para iniciar o aquecimento entre eles.");
                    continue;
                }
                await iniciaAquecimento(chips);
                break;
            case "5":
                console.log("Saindo...");
                // aqui seria client.destroy() em todos os clientes ativos.
                // mas como não tem uma lista de cliente já ta bom assim
                process.exit(0);
            default:
                console.log("Opção inválida. Tente novamente.");
        }
    }
}

menu();
