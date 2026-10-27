const $ = s => document.querySelector(s);
const state = {
  clues: [], choices: [], trust: 0, heartWins: 0, flappyWins: 0,
  puzzleSolved: false, ending: null, visited: [], musicOn: false
};
let beatTimer=null, beatLoop=null, beatPos=0, beatDir=1, hits=0, beatRunning=false;
let birdRAF=null, bird=null, pipes=[], flappyRunning=false, flappyScore=0, lastFrame=0;
let menuMotion=true;

function updateHUD(chapter="00", route="???"){
  $("#chapter").textContent = "CAPÍTULO " + chapter;
  $("#clues").textContent = `PISTAS ${state.clues.length}/3`;
  $("#route").textContent = "CAMINHO: " + route;
}
function render(html, chapter, route){ stopGames(); $("#screen").innerHTML=html; updateHUD(chapter,route); }
function go(id){
  document.body.classList.toggle("menu-mode", id === "menu");
  state.visited.push(id);
  const views = {
  menu:()=>render(`
    <section class="main-menu" id="menuScene" aria-label="Menu principal do jogo">
      <div class="menu-shade"></div><div class="menu-sun-glow"></div>
      <div class="menu-copy">
        <div class="menu-kicker">✦ UMA HISTÓRIA FEITA À MÃO ✦</div>
        <h1 class="menu-title">para mi amor<span>♡</span></h1>
        <p class="menu-subtitle">um lugarzinho no mundo só nosso</p>
        <div class="menu-rule"><span>✦</span><i></i><span>✦</span></div>
        <p class="menu-prompt">Há lembranças escondidas nesse horizonte.<br>Quer descobrir o que deixei para você?</p>
      </div>
      <nav class="menu-buttons" aria-label="Opções do jogo">
        <button class="image-button" aria-label="Start — começar" onclick="go('intro')"><img src="assets/btn-start.png" alt="START"></button>
        <button class="image-button" aria-label="Level — capítulos" onclick="showMenuDialog('levels')"><img src="assets/btn-level.png" alt="LEVEL"></button>
        <button class="image-button" aria-label="Setting — configurações" onclick="showMenuDialog('settings')"><img src="assets/btn-setting.png" alt="SETTING"></button>
        <button class="image-button" aria-label="Options — sobre o jogo" onclick="showMenuDialog('options')"><img src="assets/btn-options.png" alt="OPTIONS"></button>
        <button class="image-button" aria-label="Quit — sair" onclick="showMenuDialog('quit')"><img src="assets/btn-quit.png" alt="QUIT"></button>
      </nav>
      <div class="menu-bottom"><span>GREEN × PURPLE</span><span>PRESS START TO BEGIN</span><span>♥ 2026</span></div>
      <div class="menu-dialog hidden" id="menuDialog" role="dialog" aria-modal="true" aria-labelledby="menuDialogTitle"></div>
    </section>`, "00", "MENU"),
  intro:()=>render(`
    <div class="eyebrow">ARQUIVO ENCONTRADO // 001</div>
    <div class="sceneart"><div class="stars"></div><div class="sprite">☾</div><div class="pixelheart">♥</div><div class="sprite">✦</div></div>
    <h1 class="title">para mi amor</h1><p class="subtitle">[ uma coisa pequena, feita especialmente para você ]</p>
    <p class="copy">Oi, mi amor.\\n\\nAlguém deixou este joguinho aqui. Dizem que ele tem três lembranças escondidas e uma pergunta no final.\\n\\nTem um fio verde, uma luz roxa e duas silhuetas esperando no começo de uma história. Você pode seguir as pistas no seu tempo.</p>
    <div class="actions"><button class="primary" onclick="go('room')">COMEÇAR ♥</button><button class="ghost" onclick="toggleNote()">ANTES, UMA COISINHA</button></div>
    <p id="note" class="note hidden">Este jogo é um presente, não uma prova. Não existe escolha errada — só caminhos diferentes para chegar à mensagem. ♡</p>`, "00","???"),
  room:()=>render(`
    <div class="eyebrow">CAPÍTULO 1 // UMA SALA QUE NÃO EXISTE</div><h2 class="title">O quarto verde e roxo</h2>
    <div class="sceneart"><div class="stars"></div><div class="sprite">🪟</div><div class="sprite">🌱</div><div class="sprite">💜</div></div>
    <p class="copy">Você desperta numa salinha de pixels verdes e roxos. Há uma janela, uma plantinha e uma caixa de música sem melodia. No canto, duas figuras parecem familiares: uma tem o olhar distante de Izana; a outra fica por perto, como Kakucho, sem precisar dizer muito.\\n\\nTrês objetos brilham na mesa.</p>
    <button class="choice" onclick="pickClue('leaf')">01. Uma folha dobrada <small>Um coração tortinho desenhado no canto.</small></button>
    <button class="choice" onclick="pickClue('ticket')">02. Um bilhete roxo <small>O verso tem uma frase apagada.</small></button>
    <button class="choice" onclick="pickClue('thread')">03. Um fio verde <small>Ele segue pela sala até uma porta fechada.</small></button>
    <p class="note">Esta é uma referência visual carinhosa a personagens que você gosta; depois podemos trocar os símbolos por sprites próprios.</p>`, "01","ENCONTRO"),
  memory:()=>render(`
    <div class="eyebrow">REGISTRO DE MEMÓRIA // 01</div><h2 class="title">As pequenas coisas</h2>
    <p class="copy">${state.choices.includes("leaf")?"A folha tem um desenho meio tortinho. Talvez o que importa nunca tenha sido fazer algo perfeito.":state.choices.includes("ticket")?"O bilhete parece ter sido guardado por muito tempo. Algumas coisas pequenas viram importantes só porque vieram de alguém especial.":"O fio verde é macio e quase brilha. Você segue seu caminho até encontrar um coração roxo."}</p>
    <div class="divider"></div><p class="copy">A caixa de música se abre. Na tampa, alguém escreveu:</p><p class="subtitle">“Às vezes, o amor mora nas coisas que a gente quase não percebe.”</p>
    <p class="copy">Dois corações aparecem na tela. Eles batem em ritmos diferentes, mas parecem estar tentando acompanhar um ao outro.</p>
    <div class="actions"><button class="primary" onclick="go('heart')">TENTAR SINCRONIZAR</button></div>`, "01","LEMBRANÇA"),
  heart:()=>{hits=0;beatPos=0;beatDir=1;beatRunning=true;render(`
    <div class="eyebrow">MINIGAME 01 // NO MESMO RITMO</div><h2 class="title">Dois corações</h2>
    <p class="copy">Pressione o botão quando a luz chegar perto do centro. Acerte cinco batidas para sincronizar os corações. Não precisa ser perfeito — tente de novo se quiser.</p>
    <div class="gamebox"><div class="gamehead"><span>BATIDAS CERTAS: <b id="hits">0</b>/5</span><span class="target" id="beatHint">SIGA O PULSO</span></div>
    <div class="heartarena"><div class="heart" id="h1">♥</div><div class="heart right" id="h2">♥</div><div class="beatline"></div></div>
    <div class="bar"><span id="beatbar"></span></div><button class="primary" style="width:100%" id="beatButton" onclick="beat()">♥ BATER JUNTO</button><div class="feedback" id="beatFeedback"></div></div>
    <p class="note">A mecânica é simbólica: dois ritmos diferentes encontrando um compasso comum.</p>`, "02","RITMO"); startBeat();},
  flappy:()=>{render(`
    <div class="eyebrow">MINIGAME 02 // UM PASSINHO DE CADA VEZ</div><h2 class="title">Voa, coração!</h2>
    <p class="copy">Toque na tela, clique ou pressione espaço para subir. Atravesse quatro portais para encontrar a próxima pista.</p>
    <div class="gamebox"><div class="gamehead"><span>PORTAIS: <b id="flapScore">0</b>/4</span><span id="flapHint">TOQUE PARA COMEÇAR</span></div>
    <div class="canvaswrap"><canvas id="flapCanvas" width="640" height="300" aria-label="Minigame de voo"></canvas></div>
    <div class="actions"><button class="primary" onclick="startFlappy()">COMEÇAR / TENTAR DE NOVO</button><button class="ghost" onclick="flapUp()">VOAR ↑</button></div>
    <div class="feedback" id="flapFeedback">Use espaço, clique ou toque.</div></div>`, "03","CORAGEM"); setupFlappy();},
  puzzle:()=>render(`
    <div class="eyebrow">CAPÍTULO 3 // PISTA ESCONDIDA</div><h2 class="title">A mensagem incompleta</h2>
    <p class="copy">Você encontrou três símbolos: ♥, ☾ e ✦. Na parte de trás do bilhete há uma charada:</p>
    <div class="riddle">“Não sou uma senha para abrir uma porta. Sou algo que cresce quando é dividido e fica mais forte quando é cuidado. O que sou?”</div>
    <div class="answerrow"><input id="puzzleAnswer" placeholder="Sua resposta..." autocomplete="off"><button class="primary" onclick="answerPuzzle()">RESPONDER</button></div>
    <div class="feedback" id="puzzleFeedback"></div>
    <p class="note">Dica: a resposta não é um objeto. É algo que pode existir entre duas pessoas.</p>
    <div class="actions"><button class="ghost" onclick="go('choice')">CONTINUAR MESMO ASSIM</button></div>`, "04","SEGREDO"),
  choice:()=>render(`
    <div class="eyebrow">CAPÍTULO 4 // DUAS SILHUETAS</div><h2 class="title">O que você guarda?</h2>
    <div class="sceneart"><div class="stars"></div><div class="sprite">☾</div><div class="sprite">💚</div><div class="sprite">💜</div></div>
    <p class="copy">No fim do corredor, as duas silhuetas estão diante de uma porta. Uma delas parece querer esconder a carta até que esteja perfeita. A outra acredita que até as palavras imperfeitas podem ser sinceras.</p>
    <button class="choice" onclick="choose('perfect')">“Eu esperaria até encontrar as palavras certas.”<small>Às vezes, a gente quer que o amor saia perfeito.</small></button>
    <button class="choice" onclick="choose('honest')">“Eu diria o que sinto, mesmo com vergonha.”<small>Às vezes, a coragem é falar com o coração tremendo.</small></button>
    <button class="choice" onclick="choose('together')">“Eu pediria para escrevermos juntas.”<small>Às vezes, o importante é construir algo lado a lado.</small></button>`, "05","ESCOLHA"),
  ending:()=>showEnding(),
  credits:()=>credits()
  };
  (views[id]||views.intro)();
}
function toggleNote(){const n=$("#note");if(n)n.classList.toggle("hidden")}
function showMenuDialog(kind){
 const box=$("#menuDialog"); if(!box)return;
 const contents={
  levels:`<h2 id="menuDialogTitle">SELECIONE SEU CAMINHO</h2><p>Este presente ainda está no começo da aventura. Você pode iniciar a história ou visitar o primeiro cenário.</p><div class="dialog-actions"><button onclick="closeMenuDialog();go('intro')">COMEÇAR DO INÍCIO</button><button onclick="closeMenuDialog();go('room')">VISITAR O QUARTO</button><button class="dialog-back" onclick="closeMenuDialog()">VOLTAR</button></div>`,
  settings:`<h2 id="menuDialogTitle">CONFIGURAÇÕES</h2><p>Personalize o movimento da tela. O fundo acompanha o mouse no computador e o toque no celular.</p><button id="motionToggle" onclick="toggleMenuMotion()">MOVIMENTO: ${menuMotion?'LIGADO':'DESLIGADO'}</button><div class="dialog-actions"><button class="dialog-back" onclick="closeMenuDialog()">VOLTAR</button></div>`,
  options:`<h2 id="menuDialogTitle">UM PRESENTE EM PIXELS</h2><p>Uma pequena aventura de mistério, lembranças e carinho. Explore no seu ritmo: não existe escolha errada aqui. ♡</p><div class="dialog-actions"><button class="dialog-back" onclick="closeMenuDialog()">ENTENDI ♥</button></div>`,
  quit:`<h2 id="menuDialogTitle">JÁ VAI? ♡</h2><p>O jogo não pode fechar o navegador por você, mas pode esperar até você voltar. Tem uma história guardada aqui para quando quiser.</p><div class="dialog-actions"><button onclick="closeMenuDialog()">FICAR MAIS UM POUCO</button><button class="dialog-back" onclick="go('intro')">SAIR DO MENU</button></div>`
 };
 box.innerHTML=`<div class="dialog-card">${contents[kind]||contents.options}<button class="dialog-x" aria-label="Fechar" onclick="closeMenuDialog()">×</button></div>`;
 box.classList.remove('hidden');
}
function closeMenuDialog(){const box=$("#menuDialog");if(box)box.classList.add('hidden')}
function toggleMenuMotion(){menuMotion=!menuMotion;document.body.classList.toggle('no-menu-motion',!menuMotion);const b=$("#motionToggle");if(b)b.textContent='MOVIMENTO: '+(menuMotion?'LIGADO':'DESLIGADO')}
document.addEventListener('pointermove',e=>{if(!document.body.classList.contains('menu-mode')||!menuMotion)return;const x=(e.clientX/window.innerWidth-.5)*2;const y=(e.clientY/window.innerHeight-.5)*2;document.documentElement.style.setProperty('--parallax-x',`${x*10}px`);document.documentElement.style.setProperty('--parallax-y',`${y*8}px`)});
document.addEventListener('pointerdown',e=>{if(!document.body.classList.contains('menu-mode')||!menuMotion)return;const x=(e.clientX/window.innerWidth-.5)*2;const y=(e.clientY/window.innerHeight-.5)*2;document.documentElement.style.setProperty('--parallax-x',`${x*12}px`);document.documentElement.style.setProperty('--parallax-y',`${y*10}px`)});
function pickClue(c){if(!state.clues.includes(c))state.clues.push(c);state.choices=state.choices.filter(x=>!["leaf","ticket","thread"].includes(x));state.choices.push(c);go("memory")}
function stopGames(){beatRunning=false;if(beatTimer){clearInterval(beatTimer);beatTimer=null}if(beatLoop){cancelAnimationFrame(beatLoop);beatLoop=null}if(birdRAF){cancelAnimationFrame(birdRAF);birdRAF=null}flappyRunning=false}
function startBeat(){
 const bar=$("#beatbar");if(!bar)return;
 beatTimer=setInterval(()=>{if(!beatRunning)return;beatPos+=beatDir*4.2;if(beatPos>=100){beatPos=100;beatDir=-1}if(beatPos<=0){beatPos=0;beatDir=1}
 bar.style.width=beatPos+"%";const h1=$("#h1"),h2=$("#h2");if(h1&&h2){const s=1+Math.sin(Date.now()/180)*.08;h1.style.transform=`scale(${s})`;h2.style.transform=`scale(${1+(Math.sin(Date.now()/180+0.5)*.08)}`;}
 },35);
}
function beat(){
 if(!beatRunning)return;
 const distance=Math.abs(beatPos-50), feedback=$("#beatFeedback"), hint=$("#beatHint");
 if(distance<13){hits++;$("#hits").textContent=hits;feedback.textContent=["Os ritmos se aproximam.","Mais uma batida em comum.","Você encontrou o compasso."][Math.min(hits-1,2)];hint.textContent="NO TEMPO CERTO";if(hits>=5){beatRunning=false;state.heartWins=1;feedback.textContent="SINCRONIZADOS ♥";$("#beatButton").textContent="CONTINUAR";$("#beatButton").onclick=()=>go("flappy");}}
 else{hits=Math.max(0,hits-1);$("#hits").textContent=hits;feedback.textContent="Quase! Espere o marcador chegar mais perto do centro.";hint.textContent="TENTE OUTRA VEZ";}
}
function setupFlappy(){
 const c=$("#flapCanvas");if(!c)return;const ctx=c.getContext("2d");ctx.imageSmoothingEnabled=false;
 bird={x:110,y:145,vy:0,r:10};pipes=[];flappyScore=0;flappyRunning=false;
 drawFlappy();
 c.onpointerdown=flapUp;
 document.onkeydown=flapKey;
}
function flapKey(e){if(e.code==="Space"){e.preventDefault();flapUp()}}
function flapUp(){if(!bird)return;if(!flappyRunning){startFlappy();return}bird.vy=-4.5}
function startFlappy(){
 const c=$("#flapCanvas");if(!c)return;
 bird={x:110,y:145,vy:0,r:10};pipes=[];flappyScore=0;flappyRunning=true;lastFrame=0;
 for(let i=0;i<4;i++)pipes.push({x:330+i*190,gapY:70+Math.random()*140,gap:105,passed:false});
 $("#flapScore").textContent="0";$("#flapHint").textContent="EM MOVIMENTO";$("#flapFeedback").textContent="Continue!";if(birdRAF)cancelAnimationFrame(birdRAF);birdRAF=requestAnimationFrame(tickFlappy);
}
function drawFlappy(){
 const c=$("#flapCanvas");if(!c)return;const ctx=c.getContext("2d"),w=c.width,h=c.height;
 ctx.clearRect(0,0,w,h);ctx.fillStyle="#171329";ctx.fillRect(0,0,w,h);
 for(let i=0;i<35;i++){ctx.fillStyle=i%2?"#b9a0ff":"#9be6b2";ctx.fillRect((i*97)%w,(i*43)%h,3,3)}
 ctx.fillStyle="#292142";ctx.fillRect(0,h-24,w,24);ctx.fillStyle="#9be6b2";ctx.fillRect(0,h-24,w,3);
 if(bird){ctx.fillStyle="#ffb9d0";ctx.fillRect(bird.x-9,bird.y-8,18,16);ctx.fillStyle="#b9a0ff";ctx.fillRect(bird.x-4,bird.y-3,7,7);ctx.fillStyle="#100e1b";ctx.fillRect(bird.x+3,bird.y-4,3,3)}
 pipes.forEach(p=>{ctx.fillStyle="#9be6b2";ctx.fillRect(p.x,0,36,p.gapY);ctx.fillRect(p.x,p.gapY+p.gap,36,h-(p.gapY+p.gap)-24);ctx.fillStyle="#5aa77b";ctx.fillRect(p.x-4,p.gapY-8,44,8);ctx.fillRect(p.x-4,p.gapY+p.gap,44,8)});
 if(!flappyRunning){ctx.fillStyle="#f5efff";ctx.font="16px monospace";ctx.textAlign="center";ctx.fillText("♥  VOE ENTRE OS PORTAIS  ♥",w/2,40)}
}
function tickFlappy(t){
 if(!flappyRunning)return;const c=$("#flapCanvas"),w=c.width,h=c.height;
 if(!lastFrame)lastFrame=t;const dt=Math.min(2,(t-lastFrame)/16.67);lastFrame=t;
 bird.vy+=.22*dt;bird.y+=bird.vy*dt;
 pipes.forEach(p=>{p.x-=2.25*dt;if(!p.passed&&p.x+36<bird.x){p.passed=true;flappyScore++;$("#flapScore").textContent=flappyScore;if(flappyScore>=4){flappyRunning=false;state.flappyWins=1;$("#flapHint").textContent="PORTAIS ATRAVESSADOS!";$("#flapFeedback").textContent="Você seguiu a luz até a próxima pista. ♥";const a=document.createElement("button");a.className="primary";a.textContent="IR PARA A PISTA";a.onclick=()=>go("puzzle");$("#flapFeedback").after(a);drawFlappy();return}}});
 while(pipes.length&&pipes[0].x<-45){pipes.shift();const last=pipes[pipes.length-1];pipes.push({x:last.x+190,gapY:70+Math.random()*140,gap:105,passed:false})}
 const hitWall=bird.y<0||bird.y+10>h-24;
 const hitPipe=pipes.some(p=>bird.x+8>p.x&&bird.x-8<p.x+36&&(bird.y-8<p.gapY||bird.y+8>p.gapY+p.gap));
 if(hitWall||hitPipe){flappyRunning=false;$("#flapHint").textContent="OPS!";$("#flapFeedback").textContent="Você pode tentar de novo. Todo recomeço também faz parte da história.";drawFlappy();return}
 drawFlappy();birdRAF=requestAnimationFrame(tickFlappy)
}
function answerPuzzle(){
 const v=($("#puzzleAnswer").value||"").trim().toLowerCase();const f=$("#puzzleFeedback");
 if(["amor","love","carinho","afeto"].includes(v)){state.puzzleSolved=true;state.trust++;if(!state.clues.includes("puzzle"))state.clues.push("puzzle");f.textContent="A fechadura se abre. A palavra era AMOR. Você encontrou a pista escondida. ♥";$("#clues").textContent=`PISTAS ${Math.min(3,state.clues.length)}/3`;}
 else{f.textContent="A fechadura ainda está fechada. Pense em algo que se constrói entre pessoas. (Dica: amor.)"}
}
function choose(c){state.choices.push(c);if(c==="honest")state.trust+=2;if(c==="together")state.trust+=1;go("ending")}
function showEnding(){
 let title,body,tag;
 if(state.trust>=2){title="A coragem de dizer";tag="FINAL VERDE";body="A carta não estava esperando por palavras perfeitas. Ela estava esperando para ser entregue.\\n\\nAs luzes verdes e roxas se misturam, e as duas silhuetas finalmente se viram para você. A mensagem escondida não era uma senha, nem um teste. Era uma forma de dizer: eu escolho compartilhar meus dias com você, inclusive os dias bagunçados."}
 else if(state.puzzleSolved||state.heartWins){title="O segredo entre as linhas";tag="FINAL ROXO";body="Você percebe que cada pista falava da mesma coisa: não é preciso entender tudo de primeira para que algo seja verdadeiro.\\n\\nA carta se abre. Por trás dos símbolos, há uma declaração simples: você faz parte das minhas pequenas coisas favoritas, e é por isso que eu quis transformar um pouco desse carinho em um mundo que você pudesse explorar."}
 else{title="Ainda assim, é amor";tag="FINAL ESTRELA";body="Nem todas as pistas foram encontradas, mas a porta se abre mesmo assim. Do outro lado não existe uma resposta certa. Só uma carta, escrita por alguém que queria te dar algo feito com tempo e intenção.\\n\\nO jogo termina, mas a mensagem não depende de pontuação: você é amada, mesmo quando não encontra todas as respostas."}
 render(`<div class="eyebrow">ARQUIVO FINAL // ${tag}</div><h2 class="title">${title}</h2>
 <div class="sceneart"><div class="stars"></div><div class="sprite">🌙</div><div class="pixelheart">♥</div><div class="sprite">💜</div></div>
 <div class="ending"><p class="copy">${body}</p><div class="divider"></div><p class="subtitle">Para mi amor,</p><p class="copy">Eu queria te dar alguma coisa que não fosse só mais uma mensagem na tela. Queria criar um lugarzinho onde você pudesse encontrar detalhes, surpresas e um pouco do que sinto por você. Cada pixel ainda é simples, cada cena ainda pode mudar — mas a intenção por trás dele é real.\\n\\nObrigada por existir na minha vida. Eu te amo. ♡</p><p class="note">P.S. Este texto é um rascunho personalizável. Troque-o pelas suas próprias palavras antes de entregar o jogo.</p></div>
 <div class="actions"><button class="primary" onclick="go('credits')">VER OS CRÉDITOS</button><button class="ghost" onclick="restart()">JOGAR DE NOVO</button></div>`, "06",tag);
}
function credits(){render(`<div class="eyebrow">FIM — MAS NÃO DO CARINHO</div><h2 class="title">feito para você</h2><p class="copy">Paleta: verde + roxo.\\nInspirações de clima: RPG indie, mistério delicado e histórias que deixam pistas.\\nReferências pessoais planejadas: Jão, Elnaukofake / Naukosick e Izana & Kakucho.\\n\\nAs músicas não estão embutidas neste protótipo. Você pode adicionar links oficiais ou arquivos de áudio que tenha direito de usar. Para publicar, prefira músicas próprias, licenciadas ou links para plataformas oficiais.</p><div class="divider"></div><p class="subtitle">O próximo passo é transformar este protótipo numa história longa, com cenas e minigames completos.</p><div class="actions"><button class="primary" onclick="restart()">RECOMEÇAR</button></div>`, "END","OBRIGADA")}
function restart(){state.clues=[];state.choices=[];state.trust=0;state.heartWins=0;state.flappyWins=0;state.puzzleSolved=false;state.visited=[];go("menu")}
go("menu");