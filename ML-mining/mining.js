const axios = require('axios');
const hash = require('crypto-js');
const Block = require('../core/block');
let baseUrl = "http://localhost:3001";
let previosBlock;

function startMine(url){
    let bsUrl = url || baseUrl;
    axios.get(bsUrl + '/mining/getjobs/84ede81c58f5c490fc6e1a3035789eef897b5b35')
    .then(function(res){
        previosBlock = res.data;
        //console.log(res.data)
        mine(previosBlock);
    });
}

function mine(previosBlock){
    var nonce = 0;
    var nextTimeStamp = new Date().getTime() / 1000;
    var nextHash = hashData(previosBlock.blockDataHash, nextTimeStamp,nonce);
    var difficulty = previosBlock.difficulty;

    mining(previosBlock,nextHash, difficulty, nonce);
}

function processSubmission(previosBlock, nonce, nextHash,nextTimeStamp, block){
    let nextBlock = {
        "transactions": previosBlock.transactions,
        "blockDataHash": previosBlock.blockDataHash,
        "block": block
    }

    submitBlock(nextBlock);
}

function mining(previosBlock,nextHash, difficulty, nonce){
    let nextTimeStamp;
    var nextIndex = previosBlock.index;
    while(nextHash.substring(0, difficulty) !== Array(difficulty + 1).join("0")){
        nonce++;
        nextTimeStamp = new Date().toISOString();
        nextHash = hashData(previosBlock.blockDataHash, nextTimeStamp,nonce);

        console.log(" Nonce: " + nonce);
    }

    // SUCCESSFULLY MINED
    console.log("Yay! Successfully mined. submitting...");

    let block = new Block(nextIndex,nextHash,previosBlock.previousHash,previosBlock.rewardAddress,nextTimeStamp,difficulty,nonce,previosBlock.transactions);

    // submit
    processSubmission(previosBlock, nonce, nextHash,nextTimeStamp, block);
}

function hashData(blockhash, timestamp, nonce){
    let data = `${blockhash}|${timestamp}|${nonce}`; 
    return hash.SHA256(data).toString();
}

function submitBlock(nextBlock){
    console.log(nextBlock);
    axios.post(baseUrl + "/mining/submit-block", nextBlock)
    .then(function(res){
        console.log(res);
    })
    .catch((err)=>{
        console.log(err);
    })
}

module.exports = {startMine};
//startMine();
