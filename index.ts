import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import qrcodeTerminal from "qrcode-terminal";
import * as fs from "fs";
import promptSync from "prompt-sync";
import path from "path";

const prompt = promptSync();
const CHIPS_FILE = "chips.json";
const FRASES_FILE = "frases.txt";
const MEDIA_FOLDER = "media";
const TEMPO_ENTRE_MENSAGENS = [25000, 35000];

function carregarChips() {
    return fs.existsSync(CHIPS_FILE) ? JSON.parse(fs.readFileSync(CHIPS_FILE, "utf8")) : [];
}

function salvarChips(chips) {
    fs.writeFileSync(CHIPS_FILE, JSON.stringify(chips, null, 2));
}

async function lerFrases(caminho) {
    if (!fs.existsSync(caminho)) return ["Acredite em você!"];
    return fs.readFileSync(caminho, "utf8").split("\n").filter(Boolean);
}

async function gerarMensagemAleatoria() {
    const frases = await lerFrases(FRASES_FILE);
    return frases[Math.floor(Math.random() * frases.length)];
}

function obterArquivoAleatorio(pasta) {
    if (!fs.existsSync(pasta)) return null;
    const arquivos = fs.readdirSync(pasta).filter(arquivo => !arquivo.startsWith("."));
    return arquivos.length > 0 ? path.join(pasta, arquivos[Math.floor(Math.random() * arquivos.length)]) : null;
}

async function inicializarChip(chipId) {
    return new Promise((resolve, reject) => {
        const client = new Client({
            authStrategy: new LocalAuth({ clientId: chipId }),
            puppeteer: { args: ["--no-sandbox", "--disable-setuid-sandbox"] }
        });

        client.on("qr", qr => {
            console.log(`Escaneie o QR Code para ${chipId}:`);
            qrcodeTerminal.generate(qr, { small: true });
        });

        client.on("ready", () => {
            console.log(`${chipId} pronto!`);
            resolve(client);
        });

        client.on("authenticated", () => console.log(`${chipId} Chip Autenticado!`));
        client.on("disconnected", () => console.log(`${chipId} Desconectado!`));
        client.on("error", err => console.error(`Erro no ${chipId}:`, err));

        client.initialize().catch(reject);
    });
}

async function iniciaAquecimento(chips) {
    let chipsAtivos = [];
    console.log("Iniciando chips...");
    for (const chip of chips) {
        try {
            const client = await inicializarChip(chip);
            chipsAtivos.push(client);
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (err) {
            console.error(`Erro ao iniciar ${chip}:`, err);
        }
    }

    console.log("Todos os chips foram inicializados!");

    while (true) {
        for (let sender of chipsAtivos) {
            if (!sender.info?.wid) continue;
            
            for (let receiver of chipsAtivos) {
                if (sender === receiver || Math.random() < 0.25) continue;

                const receiverId = receiver.info?.wid?._serialized;
                if (!receiverId) continue;

                const tipo = Math.random();

                let msg;
                if (tipo < 0.6) { // 60% de texto
                    msg = await gerarMensagemAleatoria();
                    await sender.sendMessage(receiverId, msg);
                    console.log(`${sender.options.authStrategy.clientId} -> ${receiverId}: Texto`);
                } else if (tipo < 0.8) { // 20% de foto
                    let arquivo = obterArquivoAleatorio(`${MEDIA_FOLDER}/images`);
                    if (arquivo) {
                        const media = MessageMedia.fromFilePath(arquivo);
                        await sender.sendMessage(receiverId, media);
                        console.log(`${sender.options.authStrategy.clientId} -> ${receiverId}: Foto`);
                    }
                } else if (tipo < 0.9) { // 10% de sticker
                    let arquivo = obterArquivoAleatorio(`${MEDIA_FOLDER}/stickers`);
                    if (arquivo) {
                        const media = MessageMedia.fromFilePath(arquivo);
                        await sender.sendMessage(receiverId, media);
                        console.log(`${sender.options.authStrategy.clientId} -> ${receiverId}: Sticker`);
                    }
                } else { // 10% de áudio
                    let arquivo = obterArquivoAleatorio(`${MEDIA_FOLDER}/audio`);
                    if (arquivo) {
                        const media = MessageMedia.fromFilePath(arquivo);
                        await sender.sendMessage(receiverId, media);
                        console.log(`${sender.options.authStrategy.clientId} -> ${receiverId}: Áudio`);
                    }
                }

                await new Promise(resolve => setTimeout(resolve, Math.random() * (TEMPO_ENTRE_MENSAGENS[1] - TEMPO_ENTRE_MENSAGENS[0]) + TEMPO_ENTRE_MENSAGENS[0]));
            }
        }
    }
}

async function menu() {
    let chips = carregarChips();

    while (true) {
        console.log("\nMenu:");
        console.log("1 - Adicionar novo chip");
        console.log("2 - Remover chip");
        console.log("3 - Listar chips");
        console.log("4 - Iniciar Aquecimento");
        console.log("5 - Sair");

        const escolha = prompt("Escolha uma opção: ");

        if (escolha === "1") {
            const novoChip = `Chip${chips.length + 1}`;
            chips.push(novoChip);
            salvarChips(chips);
            console.log(`Chip ${novoChip} adicionado!`);
        } else if (escolha === "2") {
            console.log("Chips disponíveis:", chips);
            const chipRemover = prompt("Digite o chip a remover: ");
            if (!chips.includes(chipRemover)) continue;
            chips = chips.filter(chip => chip !== chipRemover);
            salvarChips(chips);
            console.log(`Chip ${chipRemover} removido!`);
        } else if (escolha === "3") {
            console.log("Chips cadastrados:", chips.length ? chips.join(", ") : "Nenhum chip cadastrado.");
        } else if (escolha === "4") {
            if (chips.length === 0) continue;
            await iniciaAquecimento(chips);
        } else if (escolha === "5") {
            console.log("Saindo...");
            process.exit(0);
        }
    }
}

menu();
