// Importa as bibliotecas necessárias
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
let pontos = {};

// Carrega os pontos do arquivo, se existir
if (fs.existsSync('pontos.json')) {
  try {
    pontos = JSON.parse(fs.readFileSync('pontos.json'));
    console.log('✅ Pontos carregados do arquivo.');
  } catch (err) {
    console.log('❌ Erro ao carregar pontos:', err);
  }
}
// Cria o cliente do bot com as permissões (intents)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,            
    GatewayIntentBits.GuildMessages,     
    GatewayIntentBits.MessageContent,    
    GatewayIntentBits.GuildMembers,      
    GatewayIntentBits.GuildVoiceStates   
  ]
});


  // Adiciona 2 pontos por mensagem
  pontos[member.id] += 2;
  salvarPontos();

  // Verifica se o usuário atingiu 3000 pontos e ainda não recebeu o cargo VIP Bronze
  const cargo = member.guild.roles.cache.find(r => r.name === "╭───𒌋𒀖 「💎・VIP BRONZE");
  if (pontos[member.id] >= 3000 && cargo && !member.roles.cache.has(cargo.id)) {
    await member.roles.add(cargo);
    console.log(`🎉 ${member.user.username} atingiu 3000 pontos e ganhou o cargo ╭───𒌋𒀖 「💎・VIP BRONZE!`);

    try {
      await member.send(`Parabéns, ${member.user.username}! Você atingiu 3000 pontos e ganhou o cargo ╭───𒌋𒀖 「💎・VIP BRONZE! `);
    } catch (err) {
      console.log(`❌ Não consegui enviar DM pra ${member.user.username}.`);
    }
  }
});


// Carrega o arquivo de pontos (ou cria um vazio se não existir)

// Função pra salvar os pontos sempre que mudarem
function salvarPontos() {
  fs.writeFileSync('pontos.json', JSON.stringify(pontos, null, 2));
}

// Função auxiliar pra adicionar pontos
function adicionarPontos(id, qtd) {
  if (!pontos[id]) pontos[id] = 0;
  pontos[id] += qtd;
  salvarPontos();
}

// Quando o bot estiver online
client.once('ready', async () => {
  console.log(`✅ Bot logado como ${client.user.tag}`);

  // Atualiza ranking automaticamente a cada 30 minutos
  setInterval(async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    // Tenta achar o canal chamado "【🏆】ranking"
    let canal = guild.channels.cache.find(c => c.name === '【🏆】ranking');

    // Se não existir, cria um
    if (!canal) {
      try {
        canal = await guild.channels.create({
          name: 'rank',
          type: 0 // Canal de texto
        });
        console.log('📊 Canal "【🏆】ranking" criado automaticamente.');
      } catch (err) {
        console.log('Erro ao criar canal de 【🏆】ranking:', err);
        return;
      }
    }
    
    // Monta o top 10
    const lista = Object.entries(pontos)
      .filter(([id, valor]) => !isNaN(valor))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let texto = '🏆 *Top 10 Jogadores do Servidor* 🏆\n\n';
    for (let i = 0; i < lista.length; i++) {
      const [id, valor] = lista[i];
      const user = await guild.members.fetch(id).catch(() => null);
      texto += `**${i + 1}.** ${user ? user.user.username : 'Usuário desconhecido'} — **${valor} pontos**\n`;
    }

    // Envia ou edita a mensagem de ranking
    try {
      const mensagens = await canal.messages.fetch({ limit: 10 });
      const msgExistente = mensagens.find(m => m.author.id === client.user.id);
      if (msgExistente) {
        await msgExistente.edit(texto);
      } else {
        await canal.send(texto);
      }
    } catch (err) {
      console.log('Erro ao atualizar o ranking:', err);
    }
  }, 30 * 60 * 1000); // 30 minutos
});

// 🟩 PONTOS POR MENSAGEM
client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  adicionarPontos(msg.author.id, 2); // +2 pontos por mensagem
});

// 🟦 PONTOS POR ENTRAR E SAIR DA CALL
const tempoCall = {};

client.on('voiceStateUpdate', (oldState, newState) => {
  const user = newState.member;

  // Entrou na call
  if (!oldState.channelId && newState.channelId) {
    tempoCall[user.id] = Date.now();
  }

  // Saiu da call
  else if (oldState.channelId && !newState.channelId) {
    const tempo = (Date.now() - tempoCall[user.id]) / 1000 / 60 / 60; // em horas
    if (tempo >= 1) {
      const pontosGanhos = Math.floor(tempo) * 100;
      adicionarPontos(user.id, pontosGanhos);
    }
    delete tempoCall[user.id];
  }
});

// 🟨 PONTOS POR ENTRAR NO SERVIDOR
client.on('guildMemberAdd', member => {
  adicionarPontos(member.id, 300); // +300 pontos ao entrar
});

// 🟥 COMANDO: ver pontos e rank
client.on('messageCreate', msg => {
  if (msg.content.startsWith('!rank')) {
    const lista = Object.entries(pontos).sort((a, b) => b[1] - a[1]);
    const posicao = lista.findIndex(e => e[0] === msg.author.id) + 1;















    const total = pontos[msg.author.id] || 0;

    msg.reply(`🏆 Você tem **${total} pontos** e está em **#${posicao || 'N/A'}** no ranking!`);
  }
});
//novo
client.on('messageCreate', msg => {
  if (!msg.content.startsWith('!pontos')) return;

  const args = msg.content.split(' '); // separa por espaços
  const comando = args[1]; // pode ser 'add' ou 'remove'
  const member = msg.mentions.members.first(); // pega o @membro
  const valor = parseInt(args[3]); // transforma o valor em número

  if (!member || isNaN(valor)) {
    return msg.reply('❌ Uso correto: `!pontos add @usuário 10` ou `!pontos remove @usuário 5`');
  }

  // garante que o objeto existe
  if (!pontos[member.id]) pontos[member.id] = 0;

  if (comando === 'add') {
    pontos[member.id] += valor;
  } else if (comando === 'remove') {
    pontos[member.id] -= valor;
  } else {
    return msg.reply('❌ Comando inválido! Use `add` ou `remove`.');
  }

  // gera o ranking
  const lista = Object.entries(pontos).sort((a, b) => b[1] - a[1]);
  const posicao = lista.findIndex(e => e[0] === member.id) + 1;
  const total = pontos[member.id];

  msg.reply(`🏆 ${member} agora tem **${total} pontos** e está em **#${posicao || 'N/A'}** no ranking!`);
});


//novo




// 🟪 COMANDO: comprar evento (cargo temporário)
client.on('messageCreate', async msg => {
  if (msg.content.startsWith('!comprar evento')) {
    const role = msg.guild.roles.cache.find(r => r.name === 'event role⛳️');
    const member = msg.member;

    if (!role) return msg.reply('❌ Cargo "Evento" não encontrado!');
    if (member.roles.cache.has(role.id)) return msg.reply('⚠ Você já tem esse cargo!');

    // Dá o cargo
    await member.roles.add(role);
    msg.reply('✅ Você recebeu o cargo de *Evento* por 2 horas!');

    // Marca o horário no JSON
    if (!pontos.cargosTemporarios) pontos.cargosTemporarios = {};
    pontos.cargosTemporarios[member.id] = {
      cargoId: role.id,
      hora: Date.now()
    };
    salvarPontos();

    // Remove o cargo depois de 2 horas
    setTimeout(async () => {
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        delete pontos.cargosTemporarios[member.id];
        salvarPontos();
        try {
          await member.send('⏰ Seu tempo no evento acabou e o cargo foi removido.');
        } catch (err) {
          console.log('Não consegui mandar DM.');
        }
      }
    }, 2 * 60 * 60 * 1000); // 2 horas
  }
});





// 🧩 Ao iniciar o bot, verifica se há cargos temporários expirados
client.on('ready', async () => {
  if (pontos.cargosTemporarios) {
    for (const [id, info] of Object.entries(pontos.cargosTemporarios)) {
      const tempoPassado = Date.now() - info.hora;
      if (tempoPassado >= 2 * 60 * 60 * 1000) {
        try {
          const guild = client.guilds.cache.first();
          const member = await guild.members.fetch(id);
          const role = guild.roles.cache.get(info.cargoId);
          if (role && member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            console.log(`⏰ Cargo removido de ${member.user.tag}`);
          }
          delete pontos.cargosTemporarios[id];
          salvarPontos();
        } catch (err) {
          console.log('Erro ao remover cargo expirado:', err);
        }
      }
    }
  }
});

// Conecta o bot
client.login('seu token');

