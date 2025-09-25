import {
    mySessionId, myRealAddress, myNickname, streamrClient, myPartition, myRoomName,
    isBroadcasting, isViewing, videoEncoder, audioEncoder, videoDecoder, audioDecoder, localStream,
    videoSubscription, audioSubscription, presenceSubscription, chatSubscription, lobbySubscription,
    lastKeyFrameTimestamp, lastChunkReceivedTimestamp, streamHealthInterval,
    activePartitions, presenceHeartbeatInterval, broadcasterPresenceInterval,
    videoBuffer, audioBuffer, isPlaying, isManuallyPaused, playbackStartTime,
    mediaStartTime, effectiveBufferTargetMs, nextAudioScheduleTime, lastRenderedFrame,
    currentStreamConfigId, waitingForKeyframe, audioContext, gainNode, roomNameToJoin,
    currentUserId, lobbyUpdateTimeout, currentBroadcasterAddress, roomNames,
    userNicknames, userRealAddresses, verifiedUsers, settingsStatus,
    localVideo, broadcastStatus, roomNameOnBroadcastPage, remoteCanvas, canvasContext,
    canvasWrapper, watchStatus, statusDot, broadcasterInfoOnWatchPage,
    broadcasterDisplayName, tipBtn, roomNameOnWatchPage, lobbyStatus,
    messagesContainer, streamListLoader, streamListContainer, detailedWatchStatus,
    broadcastSourceType, resolutionSlider, framerateSlider, bitrateSlider, performanceSlider,
    audioQualitySlider, keyframeIntervalSlider, videoSourceSelect, roomNameInput,
    bufferSlider, volumeSlider, messageInput, tipRecipientName,
    setMyPartition, setMyRoomName, setIsBroadcasting, setIsViewing,
    setVideoEncoder, setAudioEncoder, setAudioDecoder, setVideoDecoder, setLocalStream, setVideoSubscription,
    setAudioSubscription, setPresenceSubscription, setChatSubscription, setLobbySubscription,
    setLastKeyFrameTimestamp, setLastChunkReceivedTimestamp, setStreamHealthInterval,
    setPresenceHeartbeatInterval, setBroadcasterPresenceInterval,
    setIsPlaying, setPlaybackStartTime, setMediaStartTime, setNextAudioScheduleTime,
    setLastRenderedFrame, setCurrentStreamConfigId, setWaitingForKeyframe, setAudioContext,
    setGainNode, setCurrentUserId, setLobbyUpdateTimeout, setCurrentBroadcasterAddress,
    setEffectiveBufferTargetMs, setDetailedWatchStatus, setIsManuallyPaused, setRoomNameToJoin
} from './state.js';

import {
    LOBBY_STREAM_ID,
    PARTITIONS,
    VIEWER_TIMEOUT_MS,
    STALE_STREAM_TIMEOUT_MS,
    resolutions,
    audioQualities,
    HEARTBEAT_INTERVAL_MS
} from './constants.js';

import {
    getStreamId, arrayBufferToBase64, base64ToArrayBuffer, insertIntoSortedBuffer, sanitizeHTML, getDisplayName
} from './utils.js';

import {
    showPage, showToast, addMessageToUI, updateViewerCountUI, updateStreamListUI,
    processVerifiedUsers, stopAudioMeter, alignAndMatchHeight
} from './ui.js';

import {
    verifyIdentityProof
} from './web3.js';

import {
    goBackToLobby
} from './app.js';

// --- Chat and Identity Logic ---

async function addChatMessage(message, metadata) {
    if (message.type === 'identity_proof') {
        await verifyIdentityProof(message);
    } else {
        await addMessageToUI(message, metadata);
    }
}

export async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !streamrClient) return;
    try {
        const payload = {
            text: text,
            realAddress: myRealAddress,
            nickname: myNickname,
        };
        await streamrClient.publish(getStreamId('chat', myPartition), payload);
        messageInput.value = '';
        messageInput.focus();
    } catch (error) {
        console.error("Failed to send message:", error);
        alert('Failed to send: ' + error.message);
    }
}

export async function startChat() {
    if (chatSubscription) return;
    try {
        const newChatSubscription = await streamrClient.subscribe(getStreamId('chat', myPartition), (message, metadata) => addChatMessage(message, metadata));
        setChatSubscription(newChatSubscription);
    } catch (error) {
        console.error("Error starting chat:", error);
    }
}

export async function stopChat() {
    if (chatSubscription) {
        await chatSubscription.unsubscribe();
        setChatSubscription(null);
    }
}


// --- Lobby and Room Management ---

export async function startLobby() {
    showPage('lobby');
    streamListLoader.classList.remove('hidden');
    streamListContainer.classList.add('hidden');

    if (lobbySubscription) {
        await lobbySubscription.unsubscribe();
        setLobbySubscription(null);
    }

    let hasAttemptedJoin = false;
    let joinAttemptTimeout = null;

    if (roomNameToJoin) {
        lobbyStatus.textContent = `Searching for room "${roomNameToJoin}"...`;
        joinAttemptTimeout = setTimeout(() => {
            if (!hasAttemptedJoin) {
                lobbyStatus.textContent = `Room "${roomNameToJoin}" not found or is offline.`;
                setRoomNameToJoin(null);
                setTimeout(() => {
                    if (lobbyStatus) updateStreamListUI();
                }, 3000);
            }
        }, 8000);
    }

    clearTimeout(lobbyUpdateTimeout);
    const newLobbyUpdateTimeout = setTimeout(() => {
        if (streamListContainer.classList.contains('hidden')) {
            updateStreamListUI();
        }
    }, 5000);
    setLobbyUpdateTimeout(newLobbyUpdateTimeout);

    const newLobbySubscription = await streamrClient.subscribe(LOBBY_STREAM_ID, (message) => {
        if (message.type === 'stream_update') {
            clearTimeout(lobbyUpdateTimeout);
            const partition = message.partition;
            if (message.broadcaster) {
                const {
                    publisherId,
                    realAddress,
                    nickname,
                    roomName
                } = message.broadcaster;
                if (realAddress) userRealAddresses.set(publisherId, realAddress);
                if (nickname) userNicknames.set(publisherId, nickname);
                if (roomName) roomNames.set(partition, roomName);
            } else {
                roomNames.delete(partition);
            }
            activePartitions.set(partition, {
                broadcaster: message.broadcaster,
                viewerCount: message.viewerCount,
                lastSeen: Date.now()
            });

            processVerifiedUsers(message.verifiedUsersList);
            updateStreamListUI();

            if (roomNameToJoin && !hasAttemptedJoin) {
                for (const [p, rName] of roomNames.entries()) {
                    if (decodeURIComponent(rName).toLowerCase() === decodeURIComponent(roomNameToJoin).toLowerCase()) {
                        const partitionInfo = activePartitions.get(p);
                        const isLive = partitionInfo && partitionInfo.broadcaster && (Date.now() - partitionInfo.lastSeen < VIEWER_TIMEOUT_MS);
                        if (isLive) {
                            hasAttemptedJoin = true;
                            clearTimeout(joinAttemptTimeout);
                            console.log(`Room "${roomNameToJoin}" found in partition ${p}. Attempting to join...`);
                            joinStream(p);
                            setRoomNameToJoin(null);
                        }
                        break;
                    }
                }
            }
        } else if (message.type === 'identity_proof') {
            verifyIdentityProof(message);
        }
    });
    setLobbySubscription(newLobbySubscription);

    setInterval(() => {
        let listChanged = false;
        activePartitions.forEach((streamInfo, partition) => {
            if (streamInfo.broadcaster && (Date.now() - streamInfo.lastSeen > VIEWER_TIMEOUT_MS)) {
                activePartitions.set(partition, { ...streamInfo,
                    broadcaster: null,
                    viewerCount: 0
                });
                roomNames.delete(partition);
                listChanged = true;
            }
        });
        if (listChanged) {
            updateStreamListUI();
        }
    }, 5000);
}

export async function joinStream(partition) {
    if (!window.VideoDecoder || !window.AudioDecoder) return alert('Error: WebCodecs API is not supported.');
    setMyPartition(partition);
    messagesContainer.innerHTML = '';
    showPage('watch');
    setIsViewing(true);
    startViewerPresence();
    await startChat();

    setEffectiveBufferTargetMs(parseInt(bufferSlider.value, 10));

    setDetailedWatchStatus('Looking for a stream...');
    watchStatus.textContent = detailedWatchStatus;
    statusDot.className = 'status-dot dot-yellow';
    statusDot.title = 'Connecting...';
    setStreamHealthInterval(setInterval(checkStreamHealth, 1000));

    const newAudioContext = new(window.AudioContext || window.webkitAudioContext)();
    await newAudioContext.resume();
    setAudioContext(newAudioContext);

    const newGainNode = newAudioContext.createGain();
    newGainNode.gain.setValueAtTime(volumeSlider.value / 100, newAudioContext.currentTime);
    newGainNode.connect(newAudioContext.destination);
    setGainNode(newGainNode);

    const newVideoDecoder = new VideoDecoder({
        output: f => {
            if (waitingForKeyframe) setWaitingForKeyframe(false);
            insertIntoSortedBuffer(videoBuffer, f);
        },
        error: e => {
            console.error(`VDecErr: ${e.message}`);
            setIsPlaying(false);
            videoBuffer.forEach(frame => frame.close());
            audioBuffer.forEach(chunk => chunk.close());
            videoBuffer.length = 0;
            audioBuffer.length = 0;
            if(lastRenderedFrame) lastRenderedFrame.close();
            setLastRenderedFrame(null);

            watchStatus.textContent = "Recovering from stream error...";
            statusDot.className = 'status-dot dot-yellow-flashing';

            setWaitingForKeyframe(true);
            if (videoDecoder.state === 'configured') {
                videoDecoder.reset();
            }
        }
    });
    setVideoDecoder(newVideoDecoder);


    const newAudioDecoder = new AudioDecoder({
        output: d => insertIntoSortedBuffer(audioBuffer, d),
        error: e => {
            console.error(`ADecErr: ${e.message}`);
            if (audioDecoder.state === 'configured') {
                audioDecoder.reset();
            }
        }
    });
    setAudioDecoder(newAudioDecoder);

    renderAndSchedule();

    const handleMessage = () => {
        setLastChunkReceivedTimestamp(Date.now());
        if (statusDot.classList.contains('dot-yellow-flashing') || statusDot.classList.contains('dot-yellow')) {
            statusDot.className = 'status-dot dot-green';
            statusDot.title = 'Connected';
            if (!isPlaying) watchStatus.textContent = "Buffering...";
        }
    };
    const newVideoSubscription = await streamrClient.subscribe(getStreamId('video', myPartition), msg => {
        if (!isViewing) return;
        handleMessage();
        if (msg.config) {
            const newConfig = msg.config,
                newConfigId = `${newConfig.codedWidth}x${newConfig.codedHeight}`;
            const s = newConfig.streamSettings;
            const newDetailedWatchStatus = s ? `Receiving: ${s.width}x${s.height} @ ${Math.round(s.framerate)}fps, ~${(s.bitrate / 1000000).toFixed(1)}Mbps` : `Receiving: ${newConfig.codedWidth}x${newConfig.codedHeight}`;
            setDetailedWatchStatus(newDetailedWatchStatus);
            watchStatus.textContent = newDetailedWatchStatus;
            if (newConfigId !== currentStreamConfigId) {
                setCurrentStreamConfigId(newConfigId);
                if (newConfig.description) newConfig.description = new Uint8Array(newConfig.description).buffer;
                videoDecoder.configure(newConfig);
                videoBuffer.forEach(f => f.close());
                audioBuffer.forEach(c => c.close());
                if(lastRenderedFrame) lastRenderedFrame.close();
                videoBuffer.length = 0;
                audioBuffer.length = 0;
                setLastRenderedFrame(null);
                setIsPlaying(false);
                setWaitingForKeyframe(false);
                if (audioDecoder.state === 'configured') audioDecoder.reset();
                if (audioContext) setNextAudioScheduleTime(audioContext.currentTime);
                remoteCanvas.width = newConfig.codedWidth;
                remoteCanvas.height = newConfig.codedHeight;
                canvasWrapper.style.aspectRatio = `${newConfig.codedWidth} / ${newConfig.codedHeight}`;
            }
        }
        if (waitingForKeyframe && msg.type !== 'key') {
            console.log("Ignoring delta frame while waiting for keyframe.");
            return;
        }
        if (videoDecoder.state === 'configured') {
            try {
                videoDecoder.decode(new EncodedVideoChunk({
                    type: msg.type,
                    timestamp: msg.timestamp,
                    duration: msg.duration,
                    data: base64ToArrayBuffer(msg.data_base64)
                }));
            } catch (e) {
                console.error("Error decoding video chunk:", e);
            }
        }
    });
    setVideoSubscription(newVideoSubscription);

    const newAudioSubscription = await streamrClient.subscribe(getStreamId('audio', myPartition), msg => {
        if (!isViewing) return;
        handleMessage();
        if (audioDecoder.state === 'unconfigured') audioDecoder.configure({
            codec: 'opus',
            sampleRate: 48000,
            numberOfChannels: 1
        });
        if (audioDecoder.state === 'configured') audioDecoder.decode(new EncodedAudioChunk({
            type: 'key',
            timestamp: msg.timestamp,
            duration: msg.duration,
            data: base64ToArrayBuffer(msg.data_base64)
        }));
    });
    setAudioSubscription(newAudioSubscription);
}


// --- Broadcasting Logic ---

export async function startBroadcast() {
    stopAudioMeter();
    settingsStatus.textContent = '';

    if (myPartition === null) {
        let foundPartition = false;
        for (let i = 1; i <= PARTITIONS; i++) {
            const partitionInfo = activePartitions.get(i);
            const isLive = partitionInfo && partitionInfo.broadcaster && (Date.now() - partitionInfo.lastSeen < VIEWER_TIMEOUT_MS);
            if (!isLive) {
                setMyPartition(i);
                foundPartition = true;
                break;
            }
        }
        if (!foundPartition) {
            settingsStatus.textContent = 'Sorry, all rooms are occupied. Please try again later.';
            return;
        }
    }

    const roomName = sanitizeHTML(roomNameInput.value.trim());
    if (roomName.length === 0) {
        settingsStatus.textContent = 'Please enter a name for your room.';
        return;
    }
    setMyRoomName(roomName);

    if (!window.VideoEncoder || !window.AudioEncoder) {
        settingsStatus.textContent = 'Error: WebCodecs API is not supported in this browser.';
        return;
    }
    try {
        const audioConstraints = {
            autoGainControl: false,
            echoCancellation: true,
            noiseSuppression: true
        };
        let newLocalStream;
        if (broadcastSourceType === 'camera') {
            const res = resolutions[resolutionSlider.value].value;
            const [w, h] = res.split('x').map(Number);
            const fps = parseInt(framerateSlider.value, 10);
            const constraints = {
                video: {
                    deviceId: { exact: videoSourceSelect.value },
                    width: w, height: h,
                    frameRate: { ideal: fps, max: fps }
                },
                audio: { deviceId: { exact: audioSourceSelect.value }, ...audioConstraints }
            };
            newLocalStream = await navigator.mediaDevices.getUserMedia(constraints);
            localVideo.classList.add('camera-view');
        } else {
            newLocalStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: audioConstraints
            });
            localVideo.classList.remove('camera-view');
            newLocalStream.getVideoTracks()[0].onended = goBackToLobby;
        }
        setLocalStream(newLocalStream);

        const hasVideo = newLocalStream.getVideoTracks().length > 0;
        const hasAudio = newLocalStream.getAudioTracks().length > 0;
        if (!hasVideo && !hasAudio) {
            settingsStatus.textContent = "The selected source has no video or audio.";
            newLocalStream.getTracks().forEach(t => t.stop());
            return;
        }
        showPage('broadcast');
        setCurrentBroadcasterAddress(myRealAddress);
        setIsBroadcasting(true);
        startBroadcasterPresence();
        await startChat();
        localVideo.srcObject = newLocalStream;
        let vSettings, statusText = `Broadcasting ${broadcastSourceType} `;
        if (hasVideo) {
            const trackSettings = newLocalStream.getVideoTracks()[0].getSettings();
            const bitrate = parseInt(bitrateSlider.value, 10);
            const perf = (performanceSlider.value === '0') ? 'realtime' : 'quality';
            const fps = parseInt(framerateSlider.value, 10);
            vSettings = {
                width: trackSettings.width,
                height: trackSettings.height,
                framerate: fps,
                bitrate
            };
            const vConfig = {
                codec: 'avc1.64002A',
                width: vSettings.width,
                height: vSettings.height,
                bitrate: vSettings.bitrate,
                framerate: vSettings.framerate,
                hardwareAcceleration: 'prefer-hardware',
                latencyMode: perf
            };
            if (!(await VideoEncoder.isConfigSupported(vConfig)).supported) {
                goBackToLobby();
                showToast(`Video settings not supported.`);
                return;
            }
            const newVideoEncoder = new VideoEncoder({
                output: (c, m) => handleVideoEncoderOutput(c, m, vSettings),
                error: e => console.error(`VErr: ${e.message}`)
            });
            await newVideoEncoder.configure(vConfig);
            setVideoEncoder(newVideoEncoder);
            readVideoFrames(new MediaStreamTrackProcessor({
                track: newLocalStream.getVideoTracks()[0]
            }).readable.getReader());
            statusText += `(${vSettings.width}x${vSettings.height}@${Math.round(vSettings.framerate)}fps, ${(vSettings.bitrate/1000000).toFixed(1)} Mbps)`;
        }
        if (hasAudio) {
            const aBitrate = audioQualities[audioQualitySlider.value].bitrate;
            const aQualityTxt = audioQualities[audioQualitySlider.value].text;
            const aConfig = {
                codec: 'opus',
                sampleRate: 48000,
                numberOfChannels: 1,
                bitrate: aBitrate
            };
            const newAudioEncoder = new AudioEncoder({
                output: handleAudioEncoderOutput,
                error: e => console.error(`AErr: ${e.message}`)
            });
            await newAudioEncoder.configure(aConfig);
            setAudioEncoder(newAudioEncoder);
            readAudioFrames(new MediaStreamTrackProcessor({
                track: newLocalStream.getAudioTracks()[0]
            }).readable.getReader());
            if (hasVideo) statusText += " & ";
            statusText += `Audio (${aQualityTxt})`;
        }
        broadcastStatus.textContent = statusText;
        if (roomNameOnBroadcastPage) roomNameOnBroadcastPage.textContent = `Room: "${myRoomName}"`;
    } catch (err) {
        console.error(`Error starting broadcast: ${err.message}`, err);
        settingsStatus.textContent = `An unexpected error occurred: ${err.name}. Please try again.`;
        showPage('settings');
    }
}

async function handleVideoEncoderOutput(chunk, metadata, streamSettings) {
    if (!isBroadcasting) return;
    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);
    const msg = {
        type: chunk.type,
        timestamp: chunk.timestamp,
        duration: chunk.duration,
        data_base64: arrayBufferToBase64(data.buffer)
    };
    if (chunk.type === 'key' && metadata.decoderConfig) {
        const config = { ...metadata.decoderConfig };
        if (config.description) config.description = Array.from(new Uint8Array(config.description));
        config.streamSettings = streamSettings;
        msg.config = config;
    }
    await streamrClient.publish(getStreamId('video', myPartition), msg);
}

async function handleAudioEncoderOutput(chunk) {
    if (!isBroadcasting) return;
    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);
    const msg = {
        timestamp: chunk.timestamp,
        duration: chunk.duration,
        data_base64: arrayBufferToBase64(data.buffer)
    };
    await streamrClient.publish(getStreamId('audio', myPartition), msg);
}

async function readVideoFrames(reader) {
    const interval = parseInt(keyframeIntervalSlider.value, 10);
    while (isBroadcasting) {
        const {
            value: frame,
            done
        } = await reader.read().catch(() => ({
            done: true
        }));
        if (done || !isBroadcasting) break;
        const keyFrame = (Date.now() - lastKeyFrameTimestamp) > interval;
        if (keyFrame) setLastKeyFrameTimestamp(Date.now());
        if (videoEncoder?.state === 'configured') videoEncoder.encode(frame, {
            keyFrame
        });
        frame.close();
    }
}

async function readAudioFrames(reader) {
    while (isBroadcasting) {
        const {
            value: frame,
            done
        } = await reader.read().catch(() => ({
            done: true
        }));
        if (done || !isBroadcasting) break;
        if (audioEncoder?.state === 'configured') audioEncoder.encode(frame);
        frame.close();
    }
}

export async function stopBroadcast() {
    setIsBroadcasting(false);
    stopBroadcasterPresence();
    if(localStream) localStream.getTracks().forEach(t => t.stop());
    if (videoEncoder?.state !== 'closed') videoEncoder.close();
    if (audioEncoder?.state !== 'closed') audioEncoder.close();
    localVideo.srcObject = null;
}

// --- Viewer Logic ---

function checkStreamHealth() {
    if (isViewing && lastChunkReceivedTimestamp > 0 && (Date.now() - lastChunkReceivedTimestamp > STALE_STREAM_TIMEOUT_MS)) {
        if (!statusDot.classList.contains('dot-yellow-flashing')) {
            statusDot.className = 'status-dot dot-yellow-flashing';
            statusDot.title = 'Unstable connection';
            watchStatus.textContent = 'Buffering...';
            setIsPlaying(false);
        }
    }
}

const renderAndSchedule = () => {
    if (!isViewing) return;

    if (!isManuallyPaused) {
        if (!isPlaying) {
            const videoDuration = (videoBuffer.length > 1) ? (videoBuffer[videoBuffer.length - 1].timestamp - videoBuffer[0].timestamp) / 1000 : 0;
            const audioDuration = (audioBuffer.length > 1) ? (audioBuffer[audioBuffer.length - 1].timestamp - audioBuffer[0].timestamp) / 1000 : 0;

            if (videoDuration >= effectiveBufferTargetMs && audioDuration >= effectiveBufferTargetMs) {
                setMediaStartTime(audioBuffer[0].timestamp);
                while (videoBuffer.length > 0 && videoBuffer[0].timestamp < mediaStartTime) {
                    videoBuffer.shift().close();
                }
                if (videoBuffer.length > 0) {
                    setIsPlaying(true);
                    const newPlaybackStartTime = audioContext.currentTime;
                    setPlaybackStartTime(newPlaybackStartTime);
		    setNextAudioScheduleTime(newPlaybackStartTime);
                    watchStatus.textContent = detailedWatchStatus;
                    statusDot.className = 'status-dot dot-green';
                }
            }
        }

        if (isPlaying) {
            while (audioBuffer.length > 0) {
                const audioData = audioBuffer.shift();
                try {
                    const buffer = audioContext.createBuffer(audioData.numberOfChannels, audioData.numberOfFrames, audioData.sampleRate);
                    for (let i = 0; i < audioData.numberOfChannels; i++) {
                        const chanData = new Float32Array(audioData.numberOfFrames);
                        audioData.copyTo(chanData, {
                            planeIndex: i
                        });
                        buffer.copyToChannel(chanData, i);
                    }
                    const source = audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(gainNode);
                    source.start(nextAudioScheduleTime);
                    setNextAudioScheduleTime(nextAudioScheduleTime + buffer.duration);
                    
                } catch (err) {
                    console.error("Error scheduling audio:", err);
                } finally {
                    audioData.close();
                }
            }

            const mediaTimeUs = mediaStartTime + ((audioContext.currentTime - playbackStartTime) * 1000000);

            let frameToRender = null;
            while (videoBuffer.length > 0 && videoBuffer[0].timestamp <= mediaTimeUs) {
                if (frameToRender) frameToRender.close();
                frameToRender = videoBuffer.shift();
            }

            if (frameToRender) {
                canvasContext.drawImage(frameToRender, 0, 0, remoteCanvas.width, remoteCanvas.height);
                if(lastRenderedFrame) lastRenderedFrame.close();
                setLastRenderedFrame(frameToRender);
            } else if (lastRenderedFrame) {
                canvasContext.drawImage(lastRenderedFrame, 0, 0, remoteCanvas.width, remoteCanvas.height);
            }

            if (audioContext.currentTime >= nextAudioScheduleTime && audioBuffer.length === 0) {
                setIsPlaying(false);
                watchStatus.textContent = "Buffering...";
                statusDot.className = 'status-dot dot-yellow-flashing';
            }
        }
    }
    requestAnimationFrame(renderAndSchedule);
};

export async function stopViewing() {
    setIsViewing(false);
    stopViewerPresence(true);
    videoBuffer.forEach(f => f.close());
    audioBuffer.forEach(c => c.close());
    if(lastRenderedFrame) lastRenderedFrame.close();
    videoBuffer.length = 0;
    audioBuffer.length = 0;
    setLastRenderedFrame(null);
    canvasWrapper.style.aspectRatio = '';
    setCurrentStreamConfigId(null);
    setIsPlaying(false);
    setIsManuallyPaused(false);
    if (streamHealthInterval) {
        clearInterval(streamHealthInterval);
        setStreamHealthInterval(null);
    }
    setLastChunkReceivedTimestamp(0);
    statusDot.className = 'status-dot dot-red';
    statusDot.title = 'Disconnected';
    setDetailedWatchStatus('Looking for a stream...');

    broadcasterInfoOnWatchPage.classList.add('hidden');
    broadcasterDisplayName.textContent = '';
    setCurrentBroadcasterAddress(null);
    if (tipBtn) tipBtn.disabled = true;

    if (videoSubscription) await videoSubscription.unsubscribe();
    if (audioSubscription) await audioSubscription.unsubscribe();
    if (videoDecoder?.state !== 'closed') videoDecoder.close();
    if (audioDecoder?.state !== 'closed') audioDecoder.close();
    if (audioContext?.state !== 'closed') await audioContext.close();
    setMyPartition(null);
}


// --- Presence Logic ---

async function startBroadcasterPresence() {
    if (lobbySubscription) {
        await lobbySubscription.unsubscribe();
        setLobbySubscription(null);
    }

    let viewers = new Map();
    const newPresenceSubscription = await streamrClient.subscribe(getStreamId('presence', myPartition), msg => {
        if (msg.userId) {
            if (msg.type === 'join' || msg.type === 'heartbeat') viewers.set(msg.userId, Date.now());
            else if (msg.type === 'leave') viewers.delete(msg.userId);
        }
    });
    setPresenceSubscription(newPresenceSubscription);

    const newBroadcasterPresenceInterval = setInterval(async () => {
        const now = Date.now();
        for (const [id, seen] of viewers.entries())
            if (now - seen > VIEWER_TIMEOUT_MS) viewers.delete(id);
        updateViewerCountUI(viewers.size);

        const verifiedUsersList = Array.from(userRealAddresses.entries());

        const presencePayload = {
            type: 'stream_update',
            partition: myPartition,
            viewerCount: viewers.size,
            broadcaster: {
                publisherId: mySessionId,
                realAddress: myRealAddress,
                nickname: myNickname,
                roomName: myRoomName
            },
            verifiedUsersList: verifiedUsersList
        };
        await streamrClient.publish(LOBBY_STREAM_ID, presencePayload);
    }, 5000);
    setBroadcasterPresenceInterval(newBroadcasterPresenceInterval);
}

function stopBroadcasterPresence() {
    if (broadcasterPresenceInterval) clearInterval(broadcasterPresenceInterval);
    if (presenceSubscription) presenceSubscription.unsubscribe();
    streamrClient.publish(LOBBY_STREAM_ID, {
        type: 'stream_update',
        partition: myPartition,
        viewerCount: 0,
        broadcaster: null
    });
    setMyPartition(null);
    setMyRoomName('');
    updateViewerCountUI(-1);
}

async function startViewerPresence() {
    if (lobbySubscription) {
        await lobbySubscription.unsubscribe();
        setLobbySubscription(null);
    }
    const newCurrentUserId = `viewer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentUserId(newCurrentUserId);

    await streamrClient.publish(getStreamId('presence', myPartition), {
        type: 'join',
        userId: newCurrentUserId
    });
    const newPresenceHeartbeatInterval = setInterval(() => streamrClient.publish(getStreamId('presence', myPartition), {
        type: 'heartbeat',
        userId: newCurrentUserId
    }), HEARTBEAT_INTERVAL_MS);
    setPresenceHeartbeatInterval(newPresenceHeartbeatInterval);

    const newPresenceSubscription = await streamrClient.subscribe(LOBBY_STREAM_ID, msg => {
        if (msg.type === 'stream_update' && msg.partition === myPartition) {
            processVerifiedUsers(msg.verifiedUsersList);

            if (msg.broadcaster) {
                updateViewerCountUI(msg.viewerCount);
                const {
                    publisherId,
                    realAddress,
                    nickname,
                    roomName
                } = msg.broadcaster;

                setCurrentBroadcasterAddress(realAddress || null);

                if (realAddress) userRealAddresses.set(publisherId, realAddress);
                if (nickname) userNicknames.set(publisherId, nickname);
                if (roomName) {
                    roomNames.set(myPartition, roomName);
                    roomNameOnWatchPage.textContent = roomName;
                }

                broadcasterDisplayName.innerHTML = `Live now: ${getDisplayName(publisherId)}`;
                if (tipRecipientName) tipRecipientName.innerHTML = getDisplayName(publisherId);
                broadcasterInfoOnWatchPage.classList.remove('hidden');

                if (tipBtn) {
                    const canTip = myRealAddress && currentBroadcasterAddress;
                    tipBtn.disabled = !canTip;
                    
                    // IMPROVEMENT: Update tooltip to give user feedback
                    const tipTooltip = tipBtn.closest('.tooltip-container')?.querySelector('.tooltip-text');
                    if (tipTooltip) {
                        if (!currentBroadcasterAddress) {
                            tipTooltip.textContent = 'The streamer does not have a connected wallet to receive tips.';
                        } else if (!myRealAddress) {
                            tipTooltip.textContent = 'Connect your wallet to send a tip.';
                        } else {
                            tipTooltip.textContent = 'Send a tip to the content creator!';
                        }
                    }
                }

                setTimeout(alignAndMatchHeight, 50);
            } else {
                broadcasterInfoOnWatchPage.classList.add('hidden');
                broadcasterDisplayName.textContent = '';
                setCurrentBroadcasterAddress(null);
                if (tipBtn) tipBtn.disabled = true;
                const newDetailedWatchStatus = 'The stream has ended. Returning to lobby...';
                setDetailedWatchStatus(newDetailedWatchStatus);
                watchStatus.textContent = newDetailedWatchStatus;
                setTimeout(goBackToLobby, 3000);
            }
        }
    });
    setPresenceSubscription(newPresenceSubscription);
}

function stopViewerPresence(sendLeave = false) {
    if (presenceHeartbeatInterval) {
        clearInterval(presenceHeartbeatInterval);
        setPresenceHeartbeatInterval(null);
    }
    if (presenceSubscription) {
        presenceSubscription.unsubscribe();
        setPresenceSubscription(null);
    }
    if (sendLeave && currentUserId) streamrClient.publish(getStreamId('presence', myPartition), {
        type: 'leave',
        userId: currentUserId
    });
    setCurrentUserId(null);
    updateViewerCountUI(-1);
}
