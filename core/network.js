const axios = require('axios');
const utils = require('../core/utility/common');

function Network(host, port, blockchain, TransactionManager){
    let id = utils.SHA256(new Date().toISOString()).substring(0,20);
    this.nodeId = id;
    this.host = host;
    this.port = port;
    this.networkUrl = `http://${host}:${port}`;
    this.nodes = [];
    this.blockchain = blockchain;
    this.chainID = this.blockchain.chain[0].blockHash;
    this.TransactionManager = TransactionManager;
}

Network.prototype.nodeHash = function(nodeUrl){
    if(this.nodes.indexOf(nodeUrl) === -1) return false;
    return true;
}

Network.prototype.isCurrentNode = function(nodeUrl){
    if(this.networkUrl !== nodeUrl) return false;
    return true;
}

Network.prototype.validateNode = function(node, nodeUrl){
    if(this.nodeId === node.nodeId){
        return {status: 500, err: "Bad request: Trying to connect to self url"};
    }
    else if(this.nodes[node.nodeId]){
        return {status: 500, err: "Bad request: Already connected to this node"};
    }
    else if(this.chainID !== node.chainID){
        return {status: 500, err: "Bad request: Connecting to a unidentified chain"};
    }
    else{
        for(let nodeID in this.nodes){
            if(this.nodes[nodeID] === nodeUrl) delete this.nodes[nodeID];
        }
        this.nodes[node.nodeId] == nodeUrl;
        axios.post(`${nodeUrl}/nodes/connect`, {nodeUrl: node.networkUrl})
             .then(function(){
                this.matchChain(node);
                return {status: 200, message: "Successfully connected to : " + node.nodeUrl};
             })
             .catch(function(err){
                return {status: 500, message: err};
             });
    }

}

Network.prototype.matchChain = function(connectingNode){
    let connectingNodeChain = connectingNode.cumulativeDifficulty;
    let currentNodeChain = this.blockchain.cumulativeDifficulty();
    if(connectingNodeChain > currentNodeChain){
        axios.get(`${connectingNode.nodeUrl}/blocks`)
             .then(function(chain){
                this.getLongerChain(chain);
             })
             .catch();
    }
}

Network.prototype.getLongerChain = function(chain){
    this.blockchain.chain = chain;
    this.blockchain.pending_transactions = [];
}

// refactors
Network.prototype.syncPendingTransactionsFromPeerInfo = async function(peerChainInfo) {
    try {
        if (peerChainInfo.pendingTransactions > 0) {
            logger.debug(
                `Pending transactions sync started. Peer: ${peerChainInfo.nodeUrl}`);
            let transactions = (await axios.get(
                peerChainInfo.nodeUrl + "/transactions/pending")).data;
            for (let tran of transactions) {
                let addedTran = node.chain.addNewTransaction(tran);
                if (addedTran.transactionDataHash) {
                    // Added a new pending tx --> broadcast it to all known peers
                    node.broadcastTransactionToAllPeers(addedTran);
                }
            }
        }
    } catch (err) {
        logger.error("Error loading the pending transactions: " + err);
    }
};

Network.prototype.notifyPeersAboutNewBlock = async function() {
    let notification = {
        blocksCount: node.chain.blocks.length,
        cumulativeDifficulty: node.chain.calcCumulativeDifficulty(),
        nodeUrl: node.selfUrl
    };
    for (let nodeId in node.peers) {
        let peerUrl = node.peers[nodeId];
        logger.debug(`Notifying peer ${peerUrl} about the new block`);
        axios.post(peerUrl + "/peers/notify-new-block", notification)
            .then(function(){}).catch(function(){})
    }
};

Network.prototype.broadcastTransactionToAllPeers = async function(tran) {
    for (let nodeId in node.peers) {
        let peerUrl = node.peers[nodeId];
        logger.debug(`Broadcasting a transaction ${tran.transactionsHash} to peer ${peerUrl}`);
        axios.post(peerUrl + "/transactions/send", tran)
            .then(function(){}).catch(function(){})
    }
};


// Version 2


module.exports = Network;