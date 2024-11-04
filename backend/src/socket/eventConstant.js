/**
 * 服务端监听事件
 */
const CSEvent = {
    //socket连接
    connection : "connection",
    //socket断开连接
    disconnect : "disconnect",
    //查阅当前pocket的所有端口
    listPocket : "listPocket",
    //展示当前pocket的所有端口
    showPocket : "showPocket",
    //加入用户当前的pocket
    joinPocket : "joinPocket",
    //请求建立P2P连接
    buildRtcConnection : "buildRtcConnection",
    //开始建立P2P连接
    startRtcConnection : "startRtcConnection",
    //断开P2P连接
    removeRtcConnection : "removeRtcConnection",
    //交换ice令牌？？test
    setDescription : "setDescription",
    //发送candidate？？test
    sendCandidate : "sendCandidate",
    //p2p查阅文件夹
    cdPath : "cdPath",
    //p2p下载指定文件
    downloadFile : "downloadFile",
}

const P2PEvent = {
    //socket连接
    connectionTest : "connectionTest",
    //p2p连接查阅文件夹
    listCurrentFolder : "listCurrentFolder",
    //p2p连接发送指定文件
    sendFile : "sendFile",
    //p2p下载指定文件
    downloadFile : "downloadFile",
    
}



module.exports = {
    CSEvent,P2PEvent
}