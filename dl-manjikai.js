// ==UserScript==
// @name     DL-manjikai
// @version  1
// @grant    none
// @match    https://one-piece-scan.com/manga/*
// @match    https://www.scan-fr.cc/manga/*
// @run-at   document-idle
// @require  https://raw.githubusercontent.com/Stuk/jszip/master/dist/jszip.min.js 
// @require  https://raw.githubusercontent.com/Stuk/jszip-utils/master/dist/jszip-utils.min.js
// @require  https://raw.githubusercontent.com/eligrey/FileSaver.js/master/dist/FileSaver.js
// ==/UserScript==

// "use strict";

async function initDL() {
    let imglist = document.getElementsByTagName((website == 1 ? 'amp-img' : 'img'));
    let zip = new JSZip();
    dlButton.setAttribute('disabled', true);
    updateLoadbar(0);
    modifyStatus('gathering images');
    await appendToZip(imglist, zip);
    modifyStatus('preparing download');
    if (website == 1) {
        zip.remove('page -2.jpg');
        zip.remove('page -1.jpg');
    }
    downloadFile(zip);
    updateLoadbar(100);
    dlButton.removeAttribute('disabled');
}

async function appendToZip(imglist, zip) {
    let index, src, binary;
    let w = 0;
    for (let i = 0; i < imglist.length; i++) {
        switch (website) {
            case 1: {
                src = imglist[i].getAttribute('src');
                index = i - 2;
                break;
            }
            case 2: {
                if (imglist[i].getAttribute('data-src')) {
                    src = imglist[i].getAttribute('data-src');
                } else {
                    src = false;
                }
                index = i;
                break;
            }
        }
        if (src) {
            try {
                binary = await toBin(src);
                zip.file(`page ${index}.jpg`, binary, { binary: true });
                w = i / imglist.length * 100;
                modifyStatus(`gathering images ${i}/${imglist.length}`);
                updateLoadbar(w);
            } catch (err) {
                modifyStatus(err);
            }
        }
    }
}

function toBin(src) {
    return new Promise((resolve, reject) => {
        JSZipUtils.getBinaryContent(src, (err, data) => {
            if (err) {
                return reject(err);
            }
            return resolve(data);
        })
    })
}

function downloadFile(zip) {
    zip.generateAsync({ type: "blob" })
        .then(res => {
            modifyStatus('click ok to download');
            let name = window.location.pathname.split('');
            switch (website) {
                case 1: name.splice(0, 12); name.splice(-8, 8);
                case 2: name.splice(0, 7); name.splice(-2, 2);
            }
            name = name.join('');
            name = name.replaceAll('-', '_');
            name = name.replaceAll('/', '_');
            saveAs(res, `${name}.zip`);
        }, errCode => modifyStatus(errCode));
}

function updateLoadbar(w) {
    let p = document.querySelector('#dlman-progress');
    if (w < 100) {
        p.style.width = `${Math.round(w * 3)}px`;
    } else if (w == 100) {
        p.style.width = '300px';
        modifyStatus('preparing download');
    }
}

// function loading() {
//     let max = getComputedStyle(document.querySelector('#dlman-loadbar')).width.split('');
//     max.splice(-2, 2);
//     max = parseInt(max.join(''));
//     let progress = document.querySelector('#dlman-progress');
//     progress.style.width = '0px';
//     let w = 0;
//     let interval = setInterval(_ => {
//         if (w > 99) {
//             clearInterval(interval);
//         } else {
//             w++;
//             progress.style.width = `${Math.round(w * max / 100)}px`;
//         }
//     }, 1000);
// }

function modifyStatus(msg) {
    dlParag.innerHTML = `status : ${msg}`;
}

let dlDiv = document.createElement('div');
dlDiv.id = 'dlman-div';
let dlButton = document.createElement('button');
dlButton.id = 'dlman-btn';
dlButton.innerHTML = 'Download';
dlButton.addEventListener('click', initDL);
dlButton.removeAttribute('disabled');
let dlLoadbar = document.createElement('div');
dlLoadbar.id = 'dlman-loadbar';
let dlProgress = document.createElement('div');
dlProgress.id = 'dlman-progress';
dlProgress.style.width = '0px';
dlLoadbar.appendChild(dlProgress);
let dlParag = document.createElement('p');
dlParag.id = 'dlman-p';
dlParag.innerHTML = 'status : idle';
document.styleSheets[0].insertRule('#dlman-div{position:absolute;top:100px;right:50px;background-color:navy;border-radius:15px;height:auto;width:300px;box-sizing:border-box;display:flex;flex-direction:column}');
document.styleSheets[0].insertRule('#dlman-btn{background-color:transparent;color:white;border-radius:15px 15px 0 0;font-family:Helvetica, sans-serif;font-size:2em;font-weight:bold;border:none;padding:5px 0;text-align:center;user-select:none;cursor:pointer}');
document.styleSheets[0].insertRule('#dlman-btn:hover{background-color:#00000020}');
document.styleSheets[0].insertRule('#dlman-btn:disabled{background-color:#00000070;cursor:default;pointer-events:none}');
document.styleSheets[0].insertRule('#dlman-p{background-color:transparent;color:white;border-radius:15px 15px 0 0;font-family:Helvetica,sans-serif;font-size:1em;font-weight:normal;margin:10px}');
document.styleSheets[0].insertRule('#dlman-loadbar{background-color:#eee;height:5px}');
document.styleSheets[0].insertRule('#dlman-progress{background-color:deepskyblue;height:5px}');
dlDiv.appendChild(dlButton);
dlDiv.appendChild(dlLoadbar);
dlDiv.appendChild(dlParag);
let content, website;
switch (window.location.hostname) {
    case 'one-piece-scan.com':
        content = document.querySelector('article');
        website = 1;
        break;
    case 'www.scan-fr.cc':
        document.querySelector('#modeALL').click();
        content = document.querySelector('.viewer-cnt');
        website = 2;
        break;
}
document.body.insertBefore(dlDiv, content);