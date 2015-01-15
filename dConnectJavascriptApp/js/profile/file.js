/**
 file.js
 Copyright (c) 2014 NTT DOCOMO,INC.
 Released under the MIT license
 http://opensource.org/licenses/mit-license.php
 */
 
var currentPath = "/";
var deleteMode;

/**
 * Fileプロファイルのメニューを表示する.
 *
 * @param {String} deviceId デバイスID
 */
function showFile(deviceId) {
    initAll();
    setTitle("File Top", "black");

    var btnStr = getBackButton('Device Top', 'doFileBack', deviceId, "");
    reloadHeader(btnStr);
    reloadFooter(btnStr);

    var str = "";
    var path = "/";
    if(myDeviceName.indexOf("Pebble") != -1){
        str += '<li><a href="javascript:showFileSend(\'' + deviceId + '\');" value="send">File Send</a></li>';
    } else if(myDeviceName.indexOf("SmartWatch") != -1){
        str += '<li><a href="javascript:showFileSend(\'' + deviceId + '\');" value="send">File Send</a></li>';
    } else {
        str += '<li><a href="javascript:showFileList(\'' + deviceId + '\',\'' + path + '\');" value="list">File Manager</a></li>';
        str += '<li><a href="javascript:showFileSend(\'' + deviceId + '\');" value="send">File Send</a></li>';
        str += '<li><a href="javascript:showFileReceive(\'' + deviceId + '\',\'' + path + '\');" value="send">File Receive</a></li>';
    }
    reloadList(str);
}

/**
 * ファイルURIの取得
 *
 * @param {String} path パス
 * @param {String} deviceId デバイスID
 */
function showFileReceive(deviceId, path){
    initAll();

    var btnStr = getBackButton('File Top', 'doFileRecieveBack', deviceId, "");
    reloadHeader(btnStr);
    reloadFooter(btnStr);
    
    var str = "";
    str += makeInputText("path", "path", "path")
    str += '<input type="button" onclick="javascript:doGetUriFromPath(\'' + deviceId + '\',\'' + path + '\');" value="Get URI from PATH" type="button" >';
    reloadContent(str);
}

/**
 * PathからURIを取得
 *
 * @param {String} deviceId デバイスID
 * @param {String} path パス
 */
function doGetUriFromPath(deviceId, path){
    var path = $('#path').val();
    var builder = new dConnect.URIBuilder();
    builder.setProfile("file");
    builder.setAttribute("receive");
    builder.setDeviceId(deviceId);
    builder.setAccessToken(accessToken);
    builder.addParameter("path", path);
    var uri = builder.build();
    if (DEBUG) console.log("Uri: " + uri);
    
    dConnect.execute('GET', uri, null, null, function(status, headerMap, responseText) {
        if (DEBUG) console.log("Response: " + responseText);
        
        var json = JSON.parse(responseText);
        if (json.result == 0) {
            alert("uri:" + json.uri + "\n" + "mimeType:" + json.mimeType);
        } else {
            showError("GET file/receive", json);
        }
    }, function(xhr, textStatus, errorThrown) {
    });
}

/**
 * Backボタン
 *
 * @param {String} deviceId デバイスID
 * @param {String} sessionKey セッションKEY
 */
function doFileBack(deviceId, sessionKey){
    searchDevice(deviceId);
}

/**
 * Backボタン
 *
 * @param {String} deviceId デバイスID
 * @param {String} sessionKey セッションKEY
 */
function doFileListBack(deviceId, sessionKey){
    showFile(deviceId);
}

/**
 * Backボタン
 *
 * @param {String} deviceId デバイスID
 * @param {String} sessionKey セッションKEY
 */
function doFileSendBack(deviceId, sessionKey){
    showFile(deviceId);
}

/**
 * Backボタン
 *
 * @param {String} deviceId デバイスID
 * @param {String} sessionKey セッションKEY
 */
function doFileRecieveBack(deviceId, sessionKey){
    showFile(deviceId);
}

/**
 * ファイル一覧の表示<br>
 * uri:/file/list
 *
 * @param {String} deviceId デバイスID
 * @param {String} path パス
 * @param {Number} mode 表示モード(1: normal, 2:削除)
 */
function showFileList(deviceId, path, mode) {
    initAll();
    
    closeLoading();
    showLoading();
    
    var btnStr = getBackButton('File Top', 'doFileListBack', deviceId, "");
    reloadHeader(btnStr);
    reloadFooter(btnStr);
    
    deleteMode = false;
    
    var builder = new dConnect.URIBuilder();
    builder.setProfile("file");
    builder.setAttribute("list");
    builder.setDeviceId(deviceId);
    builder.setAccessToken(accessToken);
    builder.addParameter("path", path);
    var uri = builder.build();
    
    if (DEBUG) console.log("Uri: " + uri);
    
    dConnect.execute('GET', uri, null, null, function(status, headerMap, responseText) {
        if (DEBUG) console.log("Response: " + responseText);
        
        var json = JSON.parse(responseText);
        if (json.result === 0) {
            if (mode === 2) {
                setTitle("File list(Delete Mode)", "red");
            } else {
                setTitle("File list", "black");
            }
            currentPath = path;

            var cmdStr = '<input data-icon="folder" data-inline="true" data-mini="true" onclick="javascript:showFileList(\'' + deviceId +
                '\',\'/\');" type="button" value="/"/>';
            cmdStr += '<input data-icon="delete" data-inline="true" data-mini="true" onclick="javascript:changeDeleteMode(\'' + deviceId +
                '\');" type="button" value="Delete Mode"/>';
            cmdStr += '<input data-icon="folder" data-inline="true" data-mini="true" onclick="javascript:doMKDir(\'' + deviceId +
                '\');" type="button" value="mkdir"/>';

            if (mode != 2) {
                reloadMenu(cmdStr);
            }

            var listStr = "";
            for (var i = 0; i < json.files.length; i++) {
                var iconName = getFileIcon(json.files[i].mimeType, json.files[i].fileType);
                if (json.files[i].fileType == "1") {
                    listStr += '<li>';
                    listStr += '<a href="javascript:doFileAction(\'' + deviceId + '\',\'' + json.files[i].path + '\',\'dir/folder\');"  >';
                    if (mode == 2) {
                        listStr += '<img src="css/images/icon_del.png">';
                    }
                    listStr += '<img src=\'' + iconName + '\' >' + json.files[i].fileName + '</a></li>';
                } else {
                    listStr += '<li>';
                    listStr += '<a href="javascript:doFileAction(\'' + deviceId + '\',\'' + json.files[i].path + '\',\'' + json.files[i].mimeType +
                        '\');"  >';
                    if (mode == 2) {
                        listStr += '<img src="css/images/icon_del.png">';
                    }
                    listStr += '<img src=\'' + iconName + '\' >' + json.files[i].fileName + '</a></li>';
                }
            }
            closeLoading();
            reloadList(listStr);
        } else {
            showError("GET file/list", json);
        }
    }, function(xhr, textStatus, errorThrown) {
    });
}

/**
 * UIをファイル削除モードに遷移させる.
 *
 * @param {String} deviceId デバイスID
 */
function changeDeleteMode(deviceId) {
    setTitle("File list(Delete Mode)", "red");

    showFileList(deviceId, currentPath, 2);

    var cmdStr = "";
    cmdStr += '<input data-icon="folder" data-inline="true" data-mini="true" onclick="javascript:showFileList(\'' + deviceId +
        '\',\'/\',\'1\');" type="button" value="/"/>';
    cmdStr += '<input data-icon="delete" data-inline="true" data-mini="true" onclick="javascript:changeNormalMode(\'' + deviceId +
        '\');" type="button" value="Normal  Mode"/>';
	cmdStr += '<input data-icon="folder" data-inline="true" data-mini="true" onclick="javascript:doMKDir(\'' + deviceId +
		'\');" type="button" value="mkdir"/>';

    reloadMenu(cmdStr);
    deleteMode = true;
}

/**
 * UIをファイル閲覧モードに遷移させる.
 *
 * @param {String}deviceId デバイスID
 */
function changeNormalMode(deviceId) {
    deleteMode = false;
    setTitle("File list", "black");

    showFileList(deviceId, currentPath, 1);

    var cmdStr = "";
    cmdStr = '<input data-icon="folder" data-inline="true" data-mini="true" onclick="javascript:showFileList(\'' + deviceId +
        '\',\'/\');" type="button" value="/" />';
    cmdStr += '<input data-icon="delete" data-inline="true" data-mini="true" onclick="javascript:changeDeleteMode(\'' + deviceId +
        '\');" type="button" value="Delete  Mode" />';
	cmdStr += '<input data-icon="folder" data-inline="true" data-mini="true" onclick="javascript:doMKDir(\'' + deviceId +
		'\');" type="button" value="mkdir"/>';
    reloadMenu(cmdStr);
}

/**
 * Get Icon
 *
 * @param {String} mineType MIME/Type
 * @param {String} fileType 0ならフォルダ,1ならファイル
 * @return {String} アイコンのURI
 */
function getFileIcon(mimeType, fileType) {
    if (fileType == "1") {
        iconName = "css/images/icon_folder.png";
    } else if ((mimeType == "audio/mpeg")
            ||(mimeType == "audio/x-wav")
            ||(mimeType == "audio/x-ms-wma")
            ||(mimeType == "audio/mp3")
            ||(mimeType == "audio/ogg")
            ||(mimeType == "audio/mp4"))
    {
        iconName = "css/images/icon_music.png";
    }
    else if ((mimeType == "image/png")
            ||(mimeType == "image/jpeg")
            ||(mimeType == "image/jpg")
            ||(mimeType == "image/bmp"))
    {
        iconName = "css/images/icon_pic.png";
    }
    else if ((mimeType == "video/3gpp")
            ||(mimeType == "video/mp4")
            ||(mimeType == "video/m4v")
            ||(mimeType == "video/3gpp2")
            ||(mimeType == "video/mpeg"))
    {
        iconName = "css/images/icon_video.png";
    } else {
        iconName = "css/images/icon_file.png";
    }
    return iconName;
}

/**
 * MIME/TYPE毎にActionを振り分け
 *
 * @param {String} deviceId デバイスID
 * @param {String} path パス
 * @param {String} mimeType MIME/TYPE
 */
function doFileAction(deviceId, path, mimeType) {
    if (deleteMode) {
        if (mimeType == "dir/folder") {
    		doRMDir(deviceId, path);
    	} else {
	        doDeleteFile(deviceId, path, mimeType);
	    }
    } else {
        initAll();
    	if (mimeType == "dir/folder") {
    		showFileList(deviceId, path);
    	} else if ((mimeType == "audio/mpeg")
            ||(mimeType == "audio/x-wav")
            ||(mimeType == "audio/x-ms-wma")
            ||(mimeType == "audio/mp3")
            ||(mimeType == "audio/ogg")
            ||(mimeType == "audio/mp4"))
        {
            doMediaPlay(deviceId, path);
        } else if ((mimeType == "image/png")
            ||(mimeType == "image/jpeg")
            ||(mimeType == "image/jpg")
            ||(mimeType == "image/bmp"))
        {
            doImageShow(deviceId, path);
        } else if ((mimeType == "video/3gpp")
            ||(mimeType == "video/mp4")
            ||(mimeType == "video/m4v")
            ||(mimeType == "video/3gpp2")
            ||(mimeType == "video/mpeg"))
        {
            doMediaPlay(deviceId, path);
        } else {
            alert("Unsupported MIME-Type: " + mimeType);
            showFileList(deviceId, currentPath, 1);

        }
    }
}

/**
 * Video/Musicの再生
 *
 * @param {String} deviceId デバイスID
 * @param {String} path パス
 */
function doMediaPlay(deviceId, path) {
    var sessionKey = currentClientId;
    doRegisterOnStatusChange(deviceId, sessionKey);
    doMediaPlayer(deviceId, path, 2);
}

/**
 * ファイル削除要求を送信する.
 *
 * @param {String} deviceId デバイスID
 * @path {String} path パス
 */
function doDeleteFile(deviceId, path) {
    var builder = new dConnect.URIBuilder();
    builder.setProfile("file");
    builder.setAttribute("remove");
    builder.setDeviceId(deviceId);
    builder.setAccessToken(accessToken);
    builder.addParameter("path", path);
    var uri = builder.build();
    if (DEBUG) console.log("Uri: " + uri);

    dConnect.execute('DELETE', uri, null, null, function(status, headerMap, responseText) {
        if(DEBUG) console.log("Response:"+responseText)
        
        var json = JSON.parse(responseText);
        if (json.result === 0) {
			alert("deleted " + path);
        } else {
            showError("DELETE file/remove", json);
        }
        changeDeleteMode(deviceId);
    });
}

/**
 * ディレクトリ作成要求を送信する.
 *
 * @param {String} deviceId デバイスID
 */
function doMKDir(deviceId) {
	var path = window.prompt("ディレクトリ名を入力してください");
	if (path == null) {
		return;
	}
	if (path.substring(0,1) != '/') {
		path = currentPath + '/' + path;
	} else {
		path = currentPath + path;
	}
    var builder = new dConnect.URIBuilder();
    builder.setProfile("file");
    builder.setAttribute("mkdir");
    builder.setDeviceId(deviceId);
    builder.setAccessToken(accessToken);
    builder.addParameter("path", path);
    var uri = builder.build();
    if (DEBUG) console.log("Uri: " + uri);

    dConnect.execute('POST', uri, null, null, function(status, headerMap, responseText) {
        if(DEBUG) console.log("Response:"+responseText)
        
        var json = JSON.parse(responseText);
        var fileMode = 1;
        if (deleteMode) {
        	fileMode = 2;
        }
        if (json.result === 0) {
			alert("mkdir " + path);
        } else {
            showError("POST file/mkdir", json);
        }
        if (deleteMode) {
	        changeDeleteMode(deviceId);
        } else {
	        changeNormalMode(deviceId);
	    }
	    showFileList(deviceId, currentPath, fileMode);

    });
}
/**
 * ディレクトリ削除要求を送信する.
 *
 * @param {String} deviceId デバイスID
 * @param {String} dir ディレクトリ名
 */
function doRMDir(deviceId, dir) {
    var builder = new dConnect.URIBuilder();
    builder.setProfile("file");
    builder.setAttribute("rmdir");
    builder.setDeviceId(deviceId);
    builder.setAccessToken(accessToken);
    builder.addParameter("path", dir);
    var uri = builder.build();
    if (DEBUG) console.log("Uri: " + uri);

    dConnect.execute('DELETE', uri, null, null, function(status, headerMap, responseText) {
        if(DEBUG) console.log("Response:"+responseText)
        
        var json = JSON.parse(responseText);
        var fileMode = 1;
        if (deleteMode) {
        	fileMode = 2;
        }

        if (json.result === 0) {
	        alert("rmdir " + dir);
        } else {
            showError("DELETE file/rmdir", json);
        }
        if (deleteMode) {
	        changeNormalMode(deviceId);
        } else {
	        changeDeleteMode(deviceId);
	    }
 	    showFileList(deviceId, currentPath, fileMode);
    });
}
/**
 * ファイル送信フォームを表示する.
 *
 * @param {String} deviceId　デバイスID
 */
function showFileSend(deviceId) {
    initAll();
    setTitle("File Profile(Send)");

    var btnStr = getBackButton('File Top', 'doFileSendBack', deviceId, "");
    reloadHeader(btnStr);
    reloadFooter(btnStr);
    
    var builder = new dConnect.URIBuilder();
    builder.setProfile("file");
    builder.setAttribute("send");
    var uri = builder.build();
    
    if (DEBUG) console.log("Uri: " + uri);
    
    var str = "";
    str += '<form action="' + uri + '" method="POST" enctype="multipart/form-data" id="fileForm"><br>';
    str += '<input type="hidden" name="deviceId" value="' + deviceId + '"/>';
    str += '<input type="hidden" name="accessToken" value="' + accessToken + '"/>';
    str += makeInputText("path", "path", "path");
    str += '<input type="file" name="data" id="data"/>';
    str += '<input type="button" name="sendButton" id="sendButton" value="Upload" onclick="doFileSend(\'' + deviceId + '\');"/>';
    str += '</form>';
    
    reloadContent(str);
    
    $('#data').change(
        function() {
            if (!this.files.length) {
                alert("File is null");
                return;
            } else {
                var file = "/" + this.files[0].name;
                $('#path').val(file);
            }
        }
    );
}

/**
 * ファイル送信処理.
 *
 *  @param {String} deviceId デバイスID
 */
function doFileSend(deviceId) {
    closeLoading();
    showLoading();
    
    var myForm = document.getElementById("fileForm");
    var myFormData = new FormData(myForm);
    var myXhr = new XMLHttpRequest();
    
    myXhr.open(myForm.method, myForm.action, true);
    myXhr.onreadystatechange = function() {
        if (myXhr.readyState === 4) {
            if (myXhr.status === 200 || myXhr.status == 0) {
                if(DEBUG) console.log("Response:" + myXhr.responseText)
                var str = "";
                var obj = JSON.parse(myXhr.responseText);
                if (obj.result == 0) {
                    alert("success:file/send");
                    $('#path').val("");
                    $('#data').val("");
                } else{
                    showError("PUT file/send", obj);
                }
            } else {
                alert("error:" + myXhr.status);
            }
            closeLoading();
        }
    };
    myXhr.send(myFormData);
}

/**
 * 画像の表示
 *
 * @param {String} deviceId デバイスID
 * @path {String} path パス名
 */
function doImageShow(deviceId, path) {
    initAll();
    setTitle("ImageShow");
    
    var btnStr = getBackButton('File List', 'doImageShowBack', deviceId, "");
    reloadHeader(btnStr);
    reloadFooter(btnStr);
    
    var builder = new dConnect.URIBuilder();
    builder.setProfile("file");
    builder.setAttribute("receive");
    builder.setDeviceId(deviceId);
    builder.setAccessToken(accessToken);
    builder.addParameter("path", path);
    var uri = builder.build();
    
    if (DEBUG) console.log("Uri: " + uri);

    dConnect.execute('GET', uri, null, null, function(status, headerMap, responseText) {
        if (DEBUG) console.log("Response: " + responseText);

        var json = JSON.parse(responseText);
        if (json.result === 0){
            json.uri = json.uri.replace("localhost", ip);
            var str = "";
            str += '<img src="' + json.uri + '" width="100%">';
            str += '</center><br>';
            reloadContent(str);
        } else {
            showError("GET file/receive", json);
        }
    });
}

/**
 * Backボタン
 *
 * @param {String} deviceId デバイスID
 * @param {String} sessionKey セッションKEY
 */
function doImageShowBack(deviceId, sessionKey){
    showFileList(deviceId, currentPath);
}