import {
    // Import state variables and setters needed in this file
    myNickname, myRealAddress, mySessionId, streamrClient, myPartition, isManuallyPaused,
    gainNode, audioContext, nextAudioScheduleTime, mediaStartTime, playbackStartTime,
    isViewing, broadcastSourceType, emojiPicker, currentUserId,
    setMyNickname, setMyPartition,
    setIsManuallyPaused, setBroadcastSourceType, setRoomNameToJoin,
    setPlaybackStartTime, setMediaStartTime, setEffectiveBufferTargetMs,
    // Import UI element references needed for event listeners
    initializeUiElements, guestBtn, connectWalletBtn, nicknameBtn, nicknameBtnBroadcast, saveNicknameBtn,
    resetNicknameBtn, nicknameInput, nicknameModal, startBroadcastBtn, goLiveBtnLobby,
    fullscreenBtn, canvasWrapper, playPauseBtn, playIcon, pauseIcon, volumeSlider, bufferSlider,
    bufferValue, toggleLatencyControlsBtn, latencyControlsCollapsible, toggleLatencyArrow,
    shareBtnBroadcast, myRoomName, shareBtnWatch, roomNames, audioSourceSelect, resolutionSlider,
    resolutionValue, bitrateSlider, bitrateValue, framerateSlider, framerateValue,
    audioQualitySlider, audioQualityValue, performanceSlider, performanceValue,
    keyframeIntervalSlider, keyframeIntervalValue, broadcastSourceRadios, inputDevicesGroup,
    videoQualityGroup, resolutionSetting, framerateSetting, sendBtn, messageInput, emojiBtn,
    tipBtn, cancelTipBtn, closeTipSuccessBtn, sendTipBtn, tipModal, tipTokenSelect, // FIXED: duplicate 'sendBtn' changed to 'sendTipBtn'
    tipAmountLabel, lobbyStatus, roomNameInput, chatUserId, broadcasterUserId,
    userNicknames, currentChainId, roomNameToJoin
} from './state.js';

import {
    // Import constants
    resolutions, audioQualities, emojis, NETWORKS
} from './constants.js';

import {
    // Import UI functions
    showPage, showToast, populateDeviceLists, alignAndMatchHeight, stopAudioMeter, updateStreamListUI
} from './ui.js';

import {
    // Import utility functions
    copyToClipboard, sanitizeHTML, getDisplayName, getStreamId
} from './utils.js';

import {
    // Import Web3 functions
    connectWithWallet, updateTipModalUI, sendTip
} from './web3.js';

import {
    // Import streaming and main logic functions
    startBroadcast, sendMessage
} from './stream.js';

// Import orchestrator functions
import { initializeApp, goBackToLobby } from './app.js';


// --- Event Listeners Configuration ---

function setupEventListeners() {
    // Login
    guestBtn.onclick = () => {
        initializeApp();
    };
    connectWalletBtn.onclick = () => {
        connectWithWallet();
    };

    // Nickname
    if (nicknameBtn) {
        nicknameBtn.onclick = () => {
            nicknameInput.value = myNickname;
            nicknameModal.classList.remove('hidden');
        };
    }
    if (nicknameBtnBroadcast) {
        nicknameBtnBroadcast.onclick = () => {
            nicknameInput.value = myNickname;
            nicknameModal.classList.remove('hidden');
        };
    }
    saveNicknameBtn.onclick = () => {
        const newNickname = sanitizeHTML(nicknameInput.value.trim());
        setMyNickname(newNickname);
        const nicknameKey = myRealAddress || mySessionId;
        sessionStorage.setItem(`nickname_${nicknameKey}`, myNickname);
        userNicknames.set(mySessionId, myNickname);
        if (chatUserId) chatUserId.innerHTML = getDisplayName(mySessionId);
        if (broadcasterUserId) broadcasterUserId.innerHTML = getDisplayName(mySessionId);
        nicknameModal.classList.add('hidden');
    };
    resetNicknameBtn.onclick = () => {
        setMyNickname('');
        const nicknameKey = myRealAddress || mySessionId;
        sessionStorage.removeItem(`nickname_${nicknameKey}`);
        userNicknames.delete(mySessionId);
        if (chatUserId) chatUserId.innerHTML = getDisplayName(mySessionId);
        if (broadcasterUserId) broadcasterUserId.innerHTML = getDisplayName(mySessionId);
        nicknameModal.classList.add('hidden');
    };
    if (nicknameModal) nicknameModal.onclick = (e) => {
        if (e.target === nicknameModal) {
            nicknameModal.classList.add('hidden');
        }
    };

    // Navigation
    startBroadcastBtn.onclick = startBroadcast;
    const backToLobbyBtns = document.querySelectorAll('#back-to-lobby-btn, #back-to-lobby-btn-settings');
    backToLobbyBtns.forEach(btn => btn.onclick = goBackToLobby);

    if (goLiveBtnLobby) {
        goLiveBtnLobby.onclick = () => {
            setMyPartition(null); // Ensures partition is null to trigger automatic search
            initiateBroadcastFlow();
        };
    }

    // Viewing Page Controls
    if (fullscreenBtn) fullscreenBtn.onclick = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else canvasWrapper.requestFullscreen().catch(err => showToast(`Fullscreen error: ${err.message}`));
    };
    if (playPauseBtn) playPauseBtn.onclick = () => {
        const newIsManuallyPaused = !isManuallyPaused;
        setIsManuallyPaused(newIsManuallyPaused);
        if (playIcon) playIcon.classList.toggle('hidden', newIsManuallyPaused);
        if (pauseIcon) pauseIcon.classList.toggle('hidden', !newIsManuallyPaused);
        if (audioContext) {
            if (newIsManuallyPaused) {
                audioContext.suspend();
            } else {
                const newPlaybackStartTime = audioContext.currentTime;
                setPlaybackStartTime(newPlaybackStartTime);
                setMediaStartTime(nextAudioScheduleTime > 0 ? (mediaStartTime + (nextAudioScheduleTime - newPlaybackStartTime) * 1000000) : mediaStartTime);
                audioContext.resume();
            }
        }
    };
    if (volumeSlider) volumeSlider.addEventListener('input', e => {
        if (gainNode) gainNode.gain.setValueAtTime(e.target.value / 100, audioContext.currentTime);
    });

    if (bufferSlider) bufferSlider.addEventListener('input', e => {
        const newBufferValue = parseInt(e.target.value, 10);
        setEffectiveBufferTargetMs(newBufferValue);

        let label = '';
        if (newBufferValue <= 200) {
            label = '(Lowest Latency)';
        } else if (newBufferValue >= 2500) {
            label = '(Maximum Stability)';
        }
        bufferValue.textContent = `${newBufferValue} ms ${label}`.trim();
    });
    if (toggleLatencyControlsBtn) {
        toggleLatencyControlsBtn.onclick = () => {
            latencyControlsCollapsible.classList.toggle('hidden');
            toggleLatencyArrow.classList.toggle('open');
            setTimeout(alignAndMatchHeight, 50);
        };
    }

    // Share Buttons
    if (shareBtnBroadcast) shareBtnBroadcast.onclick = () => {
        const roomUrl = `${window.location.origin}/${encodeURIComponent(myRoomName)}`;
        copyToClipboard(roomUrl);
    };
    if (shareBtnWatch) shareBtnWatch.onclick = () => {
        const roomName = roomNames.get(myPartition) || '';
        if (roomName) {
            const roomUrl = `${window.location.origin}/${encodeURIComponent(roomName)}`;
            copyToClipboard(roomUrl);
        }
    };


    // Settings Page Controls
    if (audioSourceSelect) audioSourceSelect.addEventListener('change', () => startAudioMeter(audioSourceSelect.value));
    if (resolutionSlider) resolutionSlider.addEventListener('input', e => {
        resolutionValue.textContent = resolutions[e.target.value].text;
    });
    if (bitrateSlider) bitrateSlider.addEventListener('input', e => {
        bitrateValue.textContent = `${(e.target.value / 1000000).toFixed(1)} Mbps`;
    });
    if (framerateSlider) framerateSlider.addEventListener('input', e => {
        framerateValue.textContent = `${e.target.value} fps`;
    });
    if (audioQualitySlider) audioQualitySlider.addEventListener('input', e => {
        audioQualityValue.textContent = audioQualities[e.target.value].text;
    });
    const performanceModes = ['Lowest Latency', 'Best Quality'];
    if (performanceSlider) performanceSlider.addEventListener('input', e => {
        performanceValue.textContent = performanceModes[e.target.value];
    });
    if (keyframeIntervalSlider) keyframeIntervalSlider.addEventListener('input', e => {
        keyframeIntervalValue.textContent = `${(e.target.value / 1000).toFixed(1)} s`;
    });
    if (broadcastSourceRadios) broadcastSourceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            setBroadcastSourceType(e.target.value);
            document.querySelectorAll('label[for^="source-"]').forEach(label => {
                label.classList.remove('bg-zinc-600', 'text-white');
                label.classList.add('hover:bg-zinc-600/50');
            });
            const selectedLabel = document.querySelector(`label[for="${e.target.id}"]`);
            selectedLabel.classList.add('bg-zinc-600', 'text-white');
            selectedLabel.classList.remove('hover:bg-zinc-600/50');
            const isCamera = broadcastSourceType === 'camera';
            if (inputDevicesGroup) inputDevicesGroup.style.display = isCamera ? 'block' : 'none';
            if (videoQualityGroup) videoQualityGroup.style.display = 'block';
            if (resolutionSetting) resolutionSetting.style.display = isCamera ? 'block' : 'none';
            if (framerateSetting) framerateSetting.style.display = isCamera ? 'block' : 'none';
            if (isCamera) {
                populateDeviceLists();
            } else {
                if (startBroadcastBtn) startBroadcastBtn.disabled = false;
                stopAudioMeter();
            }
        });
    });

    // Chat Controls
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    if (emojiBtn) emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (emojiPicker) emojiPicker.style.display = emojiPicker.style.display === 'flex' ? 'none' : 'flex';
    });
    emojis.forEach(e => {
        const span = document.createElement('span');
        span.textContent = e;
        span.addEventListener('click', () => {
            if (messageInput) messageInput.value += e;
            if (messageInput) messageInput.focus();
            if (emojiPicker) emojiPicker.style.display = 'none';
        });
        if (emojiPicker) emojiPicker.appendChild(span);
    });

    // Tip Modal Listeners
    if (tipBtn) {
        tipBtn.onclick = () => {
            updateTipModalUI();
            if (tipModal) tipModal.classList.remove('hidden');
        };
    }
    if (cancelTipBtn) cancelTipBtn.onclick = () => tipModal.classList.add('hidden');
    if (closeTipSuccessBtn) closeTipSuccessBtn.onclick = () => tipModal.classList.add('hidden');
    // FIXED: Listener was being assigned to wrong button ('sendBtn')
    if (sendTipBtn) sendTipBtn.onclick = sendTip;
    if (tipModal) tipModal.onclick = (e) => {
        if (e.target === tipModal) tipModal.classList.add('hidden');
    };
    if (tipTokenSelect) tipTokenSelect.onchange = () => {
        const selectedToken = tipTokenSelect.value;
        const network = NETWORKS[currentChainId] || {
            symbol: 'Coin'
        };
        const symbol = selectedToken === 'native' ? network.symbol : selectedToken;
        tipAmountLabel.textContent = `Amount (${symbol})`;
    };

    // Global Listeners
    document.addEventListener('click', (e) => {
        if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
            emojiPicker.style.display = 'none';
        }
    });
    window.addEventListener('resize', alignAndMatchHeight);
    window.addEventListener('beforeunload', () => {
        if (isViewing && currentUserId) streamrClient.publish(getStreamId('presence', myPartition), {
            type: 'leave',
            userId: currentUserId
        });
    });
}


// --- Navigation and Flow Control ---

async function initiateBroadcastFlow() {
    if (lobbyStatus) lobbyStatus.textContent = 'Requesting permissions...';
    try {
        const tempStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        tempStream.getTracks().forEach(track => track.stop()); // Stop immediately
        showPage('settings');
        if (roomNameInput) roomNameInput.value = ''; // Clear input when loading page

        const cameraRadio = document.getElementById('source-camera');
        if (cameraRadio) {
            cameraRadio.checked = true;
            cameraRadio.dispatchEvent(new Event('change'));
        }

    } catch (err) {
        console.error("Permission error in initial request:", err);
        if (err.name === 'NotAllowedError') {
            if (lobbyStatus) lobbyStatus.textContent = 'Permission denied. Please authorize access in the browser settings.';
        } else {
            if (lobbyStatus) lobbyStatus.textContent = `An error occurred: ${err.name}.`;
        }
        setTimeout(() => {
            if (lobbyStatus) updateStreamListUI();
        }, 3000);
    }
}


// --- Main Execution ---

function main() {
    // Parse URL for direct links
    const path = window.location.pathname;
    if (path && path !== '/') {
        setRoomNameToJoin(decodeURIComponent(path.substring(1)));
        console.log(`Attempting to join room from URL: "${roomNameToJoin}"`);
    }

    // Initialize UI elements from DOM
    initializeUiElements();

    // Configure Event Listeners
    setupEventListeners();
}

document.addEventListener('DOMContentLoaded', main);