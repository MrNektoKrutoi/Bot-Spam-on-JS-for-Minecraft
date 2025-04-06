const mineflayer = require('mineflayer');
const readline = require('readline');

// Функция для вывода рекламного сообщения и задержки
async function displayAd() {
  console.log('dev channel: TGK @');
  await new Promise(resolve => setTimeout(resolve, 1500)); // Задержка 3 секунды
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ''
});

function cleanIp(ipAddress) {
  const [cleanIp] = ipAddress.split(':');
  return cleanIp;
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

function createBot(ipServer, usernameBase, serverVersion, index, messageInput, randomMessageLength, messageDelay, existingNames) {
  let username = usernameBase;
  // Если индекс больше 0, добавляем к имени суффикс с индексом
  if (index > 0) {
    username += ' - ' + index;
  }

  const bot = mineflayer.createBot({
    host: ipServer,
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
}

async function startBot() {
  await displayAd();
  const ipInput = await askQuestion('Введите IP-адрес сервера: ');
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

    const ipServer = cleanIp(ipInput);

    for (let i = 0; i < numberOfBots; i++) {
      let username;
      if (usernameBase === '/random') {
        username = generateRandomMessage(randomMessageLength, existingNames);
        existingNames.push(username);
      } else {
        username = usernameBase;
      }
      createBot(ipServer, username, serverVersion, i, messageInput, randomMessageLength, messageDelay, existingNames);
    }
  } else {
    let index = 0;
    const createAndConnectBot = () => {
      createBot(ipServer, usernameBase, serverVersion, index, null, 0, 0, existingNames);
      index++;
      setImmediate(createAndConnectBot);
    };
    createAndConnectBot();
  }
}

startBot();
