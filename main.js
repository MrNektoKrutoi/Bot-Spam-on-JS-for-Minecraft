const mineflayer = require('mineflayer');
const readline = require('readline');

async function displayAd() {
  console.log('dev channel: TGK @KRIK_TGK');
  await new Promise(resolve => setTimeout(resolve, 1500));
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ''
});

function parseAddress(addressInput) {
  const parts = addressInput.split(':');
  const host = parts[0];
  const port = parts[1] ? parseInt(parts[1], 10) : 25565; 
  return { host, port };
}

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
      rl.prompt();
    });
  });
}

function generateRandomMessage(length, existingNames) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result;
  do {
    result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  } while (existingNames.includes(result));
  return result;
}

function createBot(host, port, usernameBase, serverVersion, index, messageInput, randomMessageLength, messageDelay, existingNames) {
  let username = usernameBase;
  if (index > 0) {
    username += ' - ' + index;
  }

  const bot = mineflayer.createBot({
    host: host,
    port: port,          
    username: username,
    version: serverVersion
  });

  bot.on('spawn', () => {
    if (messageInput && messageInput !== '/notext') {
      const sendMessage = () => {
        const messageToSend = messageInput === '/random' ? generateRandomMessage(randomMessageLength, existingNames) : messageInput;
        bot.chat(messageToSend);
      };

      if (messageDelay > 0) {
        setInterval(sendMessage, messageDelay);
      } else {
        const sendFast = () => {
          sendMessage();
          setImmediate(sendFast);
        };
        sendFast();
      }
    }
  });

  bot.on('error', (err) => {
    console.log(`[${username}] Ошибка: ${err.message}`);
  });
}

async function startBot() {
  await displayAd();
  
  const ipInput = await askQuestion('Введите IP-адрес сервера (можно с портом, например 127.0.0.1:25565): ');
  const { host, port } = parseAddress(ipInput);  
  
  let usernameBase = await askQuestion('Введите имя бота или /random для рандомного имени: ');
  let randomMessageLength = 0;
  let existingNames = [];

  if (usernameBase === '/random') {
    randomMessageLength = parseInt(await askQuestion('Введите длину рандомного имени: '), 10);
  }

  const serverVersion = await askQuestion('Введите версию сервера: ');
  const botsInput = await askQuestion('Введите количество ботов или /nolimit: ');
  let messageDelay;
  let messageInput;

  if (botsInput !== '/nolimit') {
    const numberOfBots = parseInt(botsInput, 10);
    messageInput = await askQuestion('Введите сообщение для спама или /random для спама рандомным сообщением, или же /notext если не хотите отправлять текст: ');

    if (messageInput === '/random') {
      randomMessageLength = parseInt(await askQuestion('Введите длину рандомного сообщения: '), 10);
      messageDelay = parseInt(await askQuestion('Введите задержку между сообщениями (в миллисекундах): '), 10);
    } else if (messageInput !== '/notext') {
      messageDelay = parseInt(await askQuestion('Введите задержку между сообщениями (в миллисекундах): '), 10);
    }

    for (let i = 0; i < numberOfBots; i++) {
      let username;
      if (usernameBase === '/random') {
        username = generateRandomMessage(randomMessageLength, existingNames);
        existingNames.push(username);
      } else {
        username = usernameBase;
      }
      createBot(host, port, username, serverVersion, i, messageInput, randomMessageLength, messageDelay, existingNames);
    }
  } else {
    let index = 0;
    const createAndConnectBot = () => {
      createBot(host, port, usernameBase, serverVersion, index, null, 0, 0, existingNames);
      index++;
      setImmediate(createAndConnectBot);
    };
    createAndConnectBot();
  }
}

startBot();