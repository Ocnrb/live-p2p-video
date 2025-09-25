import {
    pages,
    videoColumn,
    chatContainer,
    streamListContainer,
    streamListLoader,
    lobbyStatus,
    settingsStatus,
    videoSourceSelect,
    audioSourceSelect,
    startBroadcastBtn,
    audioMeterCanvas,
    audioMeter,
    toast,
    broadcasterDisplayName,
    messagesContainer,
    chatUserId,
    broadcasterUserId,
    audioQualitySlider,
    broadcastSourceType,
    myPartition,
    currentBroadcasterAddress,
    userNicknames,
    loginContent,
    loadingContent,
    viewerCountBroadcasterValue,
    viewerCountWatcherValue,
    viewerCountBroadcaster,
    viewerCountWatcher,
    verifiedUsers,
    userRealAddresses,
    mySessionId
} from './state.js';

import {
    sanitizeHTML,
    getDisplayName,
    getColorKey,
    getUserColor
} from './utils.js';

import {
    VIEWER_TIMEOUT_MS,
    NETWORKS,
    MAX_MESSAGES
} from './constants.js';

import {
    joinStream
} from './stream.js';
import {
    activePartitions,
    roomNames
} from './state.js';


export function showPage(pageName) {
    Object.values(pages).forEach(p => p.classList.remove('active'));
    if (pages[pageName]) pages[pageName].classList.add('active');

    if (pageName === 'broadcast' || pageName === 'watch') {
        videoColumn.classList.remove('lg:col-span-5');
        videoColumn.classList.add('lg:col-span-3');
        chatContainer.classList.remove('hidden');
        setTimeout(alignAndMatchHeight, 50); // Align after page is shown
    } else {
        videoColumn.classList.remove('lg:col-span-3');
        videoColumn.classList.add('lg:col-span-5');
        chatContainer.classList.add('hidden');
        chatContainer.style.paddingTop = '0px';
        const chatBox = document.querySelector('#chat-container > div');
        if (chatBox) chatBox.style.height = null;
    }
    if (pageName !== 'settings') stopAudioMeter();
}

export function alignAndMatchHeight() {
    const chatBox = document.querySelector('#chat-container > div');
    if (!chatBox || chatContainer.classList.contains('hidden')) {
        return;
    }

    const playerHeader = document.getElementById('player-header');
    const playerContainer = document.getElementById('player-container');

    if (document.getElementById('watch-page').classList.contains('active') && playerHeader && playerContainer) {
        const headerRect = playerHeader.getBoundingClientRect();
        const containerRect = playerContainer.getBoundingClientRect();
        const mainContainerRect = document.getElementById('main-container').getBoundingClientRect();

        const paddingTop = headerRect.top - mainContainerRect.top;
        const totalHeight = containerRect.bottom - headerRect.top;

        chatContainer.style.paddingTop = `${paddingTop}px`;
        chatBox.style.height = `${totalHeight}px`;
    } else {
        const activePlayerBox = document.querySelector('#broadcast-page .bg-zinc-800');
        if (activePlayerBox) {
            const playerRect = activePlayerBox.getBoundingClientRect();
            const mainContainerRect = document.getElementById('main-container').getBoundingClientRect();
            const paddingTop = playerRect.top - mainContainerRect.top;
            chatContainer.style.paddingTop = `${paddingTop}px`;
            chatBox.style.height = `${playerRect.height}px`;
        }
    }
}

export function updateStreamListUI() {
    streamListContainer.innerHTML = ''; // Clear the list

    const liveStreams = Array.from(activePartitions.entries())
        .filter(([partition, info]) => {
            return info && info.broadcaster && (Date.now() - info.lastSeen < VIEWER_TIMEOUT_MS);
        })
        .sort(([pA, infoA], [pB, infoB]) => {
            return (infoB.viewerCount || 0) - (infoA.viewerCount || 0);
        });

    liveStreams.forEach(([partition, partitionInfo]) => {
        const streamItem = document.createElement('div');
        streamItem.className = 'stream-item stream-item-live group relative';
        streamItem.onclick = () => joinStream(partition);

        const roomName = roomNames.get(partition) || `Room ${partition}`;

        streamItem.innerHTML = `
           <div class="flex flex-col justify-between h-full">
                <div>
                    <div class="flex items-center justify-between w-full mb-2">
                        <div class="flex items-center gap-2">
                            <span class="status-dot dot-green" title="Live"></span>
                            <span class="font-semibold text-white truncate" title="${sanitizeHTML(roomName)}">${sanitizeHTML(roomName)}</span>
                        </div>
                        <div class="flex items-center gap-1 text-sm text-zinc-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>
                            <span>${partitionInfo.viewerCount || 0}</span>
                        </div>
                    </div>
                    <p class="text-sm text-zinc-400 text-left">by ${getDisplayName(partitionInfo.broadcaster.publisherId)}</p>
                </div>
            </div>
            <div class="absolute top-0 left-0 right-0 bottom-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                </svg>
            </div>
        `;
        streamListContainer.appendChild(streamItem);
    });

    if (streamListLoader) streamListLoader.classList.add('hidden');
    streamListContainer.classList.remove('hidden');

    lobbyStatus.textContent = liveStreams.length > 0 ? 'Select a room to watch or start your own stream.' : 'No active streams. Be the first to go live!';
}

export async function populateDeviceLists() {
    settingsStatus.textContent = '';
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoSourceSelect.innerHTML = '';
        audioSourceSelect.innerHTML = '';
        let hasVideo = false,
            hasAudio = false;
        devices.forEach(device => {
            if (!device.label || !device.deviceId || device.kind === 'audiooutput') return;
            const option = document.createElement('option');
            option.value = device.deviceId;
            if (device.kind === 'videoinput') {
                option.text = device.label || `Camera ${videoSourceSelect.length + 1}`;
                videoSourceSelect.appendChild(option);
                hasVideo = true;
            } else if (device.kind === 'audioinput') {
                option.text = device.label || `Microphone ${audioSourceSelect.length + 1}`;
                audioSourceSelect.appendChild(option);
                hasAudio = true;
            }
        });
        videoSourceSelect.disabled = !hasVideo;
        audioSourceSelect.disabled = !hasAudio;
        audioQualitySlider.disabled = !hasAudio;

        if (broadcastSourceType === 'camera') {
            startBroadcastBtn.disabled = !hasVideo;
        } else {
            startBroadcastBtn.disabled = false;
        }

        if (hasAudio) {
            startAudioMeter(audioSourceSelect.value);
        } else {
            stopAudioMeter();
        }

    } catch (err) {
        console.error("Error enumerating devices:", err);
        settingsStatus.textContent = `Error getting devices: ${err.message}.`;
    }
}

export function stopAudioMeter() {
    if (audioMeter.animationId) cancelAnimationFrame(audioMeter.animationId);
    audioMeter.stream?.getTracks().forEach(track => track.stop());
    if (audioMeter.context?.state !== 'closed') audioMeter.context?.close();
    const ctx = audioMeterCanvas.getContext('2d');
    ctx.clearRect(0, 0, audioMeterCanvas.width, audioMeterCanvas.height);
    audioMeter.context = null;
    audioMeter.stream = null;
    audioMeter.analyser = null;
    audioMeter.animationId = null;
}

export async function startAudioMeter(deviceId) {
    stopAudioMeter();
    if (!deviceId) return;
    try {
        audioMeter.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: {
                    exact: deviceId
                },
                autoGainControl: false,
                echoCancellation: true,
                noiseSuppression: true
            }
        });
        audioMeter.context = new(window.AudioContext || window.webkitAudioContext)();
        const source = audioMeter.context.createMediaStreamSource(audioMeter.stream);
        audioMeter.analyser = audioMeter.context.createAnalyser();
        audioMeter.analyser.fftSize = 256;
        source.connect(audioMeter.analyser);
        const bufferLength = audioMeter.analyser.frequencyBinCount,
            dataArray = new Uint8Array(bufferLength);
        const canvasCtx = audioMeterCanvas.getContext('2d');

        function draw() {
            audioMeter.animationId = requestAnimationFrame(draw);
            audioMeter.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
            const average = sum / bufferLength,
                width = (average / 128) * audioMeterCanvas.width;
            canvasCtx.clearRect(0, 0, audioMeterCanvas.width, audioMeterCanvas.height);
            const gradient = canvasCtx.createLinearGradient(0, 0, audioMeterCanvas.width, 0);
            gradient.addColorStop(0, '#4ade80');
            gradient.addColorStop(0.7, '#facc15');
            gradient.addColorStop(1, '#f87171');
            canvasCtx.fillStyle = gradient;
            canvasCtx.fillRect(0, 0, width, audioMeterCanvas.height);
        };
        draw();
    } catch (err) {
        console.error("Error starting audio meter:", err);
    }
}


export function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2000);
}

export function setLoginModalState(state) {
    if (state === 'loading') {
        loginContent.classList.add('hidden');
        loadingContent.classList.remove('hidden');
    } else { // 'buttons'
        loginContent.classList.remove('hidden');
        loadingContent.classList.add('hidden');
    }
}

export function updateUIVerification(sessionId) {
    const broadcasterInfo = activePartitions.get(myPartition)?.broadcaster;
    if (broadcasterInfo && broadcasterInfo.publisherId === sessionId) {
        broadcasterDisplayName.innerHTML = `Streaming now: ${getDisplayName(sessionId)}`;
    }

    document.querySelectorAll(`.message-entry[data-publisher-id="${sessionId}"] .chat-username`).forEach(el => {
        el.innerHTML = `${getDisplayName(sessionId)}:`;
    });

    if (mySessionId === sessionId) {
        if (chatUserId) chatUserId.innerHTML = getDisplayName(mySessionId);
        if (broadcasterUserId) broadcasterUserId.innerHTML = getDisplayName(mySessionId);
    }
}

export async function addMessageToUI(message, metadata) {
    if (typeof message !== 'object' || message === null) {
        console.warn("Received non-object message, skipping:", message);
        return;
    }

    if (message.realAddress) {
        userRealAddresses.set(metadata.publisherId, message.realAddress);
    }
    if (message.nickname) {
        userNicknames.set(metadata.publisherId, message.nickname);
    }

    const msgDiv = document.createElement('div');

    if (message.type === 'tip' && message.txHash && message.chainId) {
        msgDiv.className = 'tip-notification opacity-50';
        msgDiv.innerHTML = 'Verifying tip...';
        messagesContainer.appendChild(msgDiv);

        try {
            const network = NETWORKS[message.chainId];
            if (!network || !network.rpcUrl) throw new Error('Unsupported network for verification.');

            const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
            const tx = await provider.getTransaction(message.txHash);

            const isTxValid = tx &&
                tx.from.toLowerCase() === message.realAddress.toLowerCase() &&
                tx.to.toLowerCase() === currentBroadcasterAddress.toLowerCase();

            if (!isTxValid) throw new Error('Transaction data does not match.');

            const explorerLink = `${network.explorer}/tx/${message.txHash}`;
            msgDiv.classList.remove('opacity-50');
            msgDiv.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-2 align-middle" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.134 0V7.418zM12.25 10a2.5 2.5 0 01-2.25 2.45V15a.75.75 0 01-1.5 0v-2.55a2.5 2.5 0 01-2.25-2.45V9a.75.75 0 011.5 0v1h.75a.75.75 0 010 1.5H9.5v-1a.75.75 0 011.5 0v1h.75a.75.75 0 010 1.5H11v-1a.75.75 0 011.5 0V10z" />
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-1.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" clip-rule="evenodd" />
                </svg>
                <span class="align-middle">${sanitizeHTML(message.text)}</span>
                <a href="${explorerLink}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline ml-2">(view tx)</a>
            `;
        } catch (err) {
            console.error("Tip verification failed:", err);
            msgDiv.innerHTML = 'Tip verification failed.';
            setTimeout(() => msgDiv.remove(), 3000);
        }

    } else {
        msgDiv.className = 'message-entry text-sm';
        msgDiv.setAttribute('data-publisher-id', metadata.publisherId);

        const userSpan = document.createElement('span');
        userSpan.className = 'chat-username';
        userSpan.innerHTML = `${getDisplayName(metadata.publisherId)}:`;
        userSpan.style.color = getUserColor(metadata.publisherId);

        const textSpan = document.createElement('span');
        textSpan.className = 'chat-message-text';
        textSpan.innerHTML = sanitizeHTML(message.text);

        msgDiv.appendChild(userSpan);
        msgDiv.appendChild(textSpan);
        messagesContainer.appendChild(msgDiv);
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    if (messagesContainer.children.length > MAX_MESSAGES) {
        messagesContainer.removeChild(messagesContainer.firstChild);
    }
}

export function updateViewerCountUI(count) {
    viewerCountBroadcasterValue.textContent = count;
    viewerCountWatcherValue.textContent = count;
    viewerCountBroadcaster.classList.toggle('hidden', count < 0);
    viewerCountWatcher.classList.toggle('hidden', count < 0);
}

export function processVerifiedUsers(verifiedList) {
    if (verifiedList && Array.isArray(verifiedList)) {
        verifiedList.forEach(([sessionId, realAddress]) => {
            const colorKey = realAddress;
            if (!verifiedUsers.has(colorKey)) {
                console.log(`Synced verification for ${realAddress} via lobby update.`);
                userRealAddresses.set(sessionId, realAddress);
                verifiedUsers.set(colorKey, true);
                updateUIVerification(sessionId);
            }
        });
    }
}

