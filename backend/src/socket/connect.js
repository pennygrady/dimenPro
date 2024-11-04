const listPocket = require("./listPocket/listPocket.js");
const joinPocket = require("./joinPocket/joinPocket.js");
const disconnect = require("./disconnect/disconnect.js");
const setDescription = require("./setDescription/setDescription.js");
const sendCandidate = require("./sendCandidate/sendCandidate.js");
const buildRtcConnection = require("./buildRtcConnection/buildRtcConnection.js");
const removeRtcConnection = require("./removeRtcConnection/removeRtcConnection.js");
const CSEvent = require("./eventConstant.js").CSEvent



module.exports = (io, socket, tables, dbClient) => {

    // 列举连接的pocket
    socket.on(CSEvent.listPocket, (data)=>{
        listPocket.listPocket(io, socket, tables, dbClient, data)
    });
    socket.on(CSEvent.joinPocket, (data)=>{
        joinPocket.joinPocket(io, socket, tables, dbClient, data)
    });
    socket.on(CSEvent.disconnect, (data)=>{
        disconnect.disconnect(io, socket, tables, dbClient, data)
    });
    socket.on(CSEvent.buildRtcConnection, (data)=>{
        buildRtcConnection.buildRtcConnection(io, socket, tables, dbClient, data)
    });
    socket.on(CSEvent.setDescription, (data)=>{
        setDescription.setDescription(io, socket, tables, dbClient, data)
    });
    socket.on(CSEvent.sendCandidate, (data)=>{
        sendCandidate.sendCandidate(io, socket, tables, dbClient, data)
    });
    socket.on(CSEvent.removeRtcConnection, (data)=>{
        removeRtcConnection.removeRtcConnection(io, socket, tables, dbClient, data)
    });
    socket.on('offer', (offer) => {
        socket.to(offer.socketID).emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        socket.to(answer.socketID).emit('answer', answer);
    });

    socket.on('iceCandidate', (candidate) => {
        socket.to(candidate.to).emit('iceCandidate', candidate);
    });
}