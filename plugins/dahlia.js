const {
    smd,
    sleep
    } = require('../lib'),teddyM = {"smd" : "asta" }

smd({
    cmdname: "dahlia",    
    type: "fun",    
    info: "cute dahlia",   
    on: "text" ,
    filename: __filename,
},async(citel,match , {smd}) => {
  let isteddy = smd ==="dahlia"?true : citel.isPublic && match.toLowerCase().includes("dahlia") ? true : ""       
      if (isteddy && !teddyM[citel.id]) {
      teddyM[citel.id] =true;
      let teddy = ['❤', '💕', '😻', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥', '💌', '🙂', '🤗', '😌', '😉', '🤗', '😊', '🎊', '🎉', '🎁', '🎈']
      const { key } = await citel.reply( `(\\_/)\n( •.•)\n/>🤍`)
      for (let i = 0; i < teddy.length; i++) {
        await sleep(500);
        await citel.reply(`(\\_/)\n( •.•)\n/>${teddy[i]}`, { edit: key })             
      } 
    }

})