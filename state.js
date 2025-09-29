// --- UI Element State ---
export let mainContainer, videoColumn, pages, startBroadcastBtn, localVideo, remoteCanvas,
    canvasWrapper, broadcastStatus, watchStatus, statusDot, fullscreenBtn, playPauseBtn, playIcon, pauseIcon,
    viewerCountBroadcaster, viewerCountBroadcasterValue, viewerCountWatcher, viewerCountWatcherValue,
    broadcastSourceRadios, inputDevicesGroup, videoQualityGroup, videoSourceSelect, audioSourceSelect, audioMeterCanvas,
    resolutionSlider, resolutionValue, resolutionSetting, framerateSetting, bitrateSlider, bitrateValue, framerateSlider,
    framerateValue, audioQualitySlider, audioQualityValue, performanceSlider, performanceValue, keyframeIntervalSlider,
    keyframeIntervalValue, volumeSlider, bufferSlider, bufferValue, latencyControls, canvasContext, loginModal, loginContent, loadingContent, connectWalletBtn, guestBtn,
    loadingInstructions, chatContainer, messageInput, sendBtn, emojiBtn, messagesContainer, emojiPicker,
    nicknameModal, nicknameInput, saveNicknameBtn, resetNicknameBtn, nicknameBtn, chatUserId, settingsStatus, nicknameBtnBroadcast, broadcasterUserId,
    broadcasterInfoOnWatchPage, toggleLatencyControlsBtn, latencyControlsCollapsible, toggleLatencyArrow, lobbyPage, streamListContainer, lobbyStatus, roomNameOnWatchPage,
    roomNameInput, roomNameOnBroadcastPage, shareBtnBroadcast, shareBtnWatch, toast, goLiveBtnLobby,
    streamListLoader,
    broadcasterDisplayName, tipBtn, tipModal, tipInitialView, tipLoadingView, tipSuccessView,
    tipRecipientName, tipAmountInput, tipErrorMsg, cancelTipBtn, sendTipBtn, closeTipSuccessBtn, tipEtherscanLink, tipTokenSelect, tipAmountLabel;

// --- Application Core State ---
export let streamrClient = null;
export let videoEncoder, audioEncoder, videoDecoder, audioDecoder;
export let localStream, audioContext, gainNode;
export let videoSubscription, audioSubscription, presenceSubscription, chatSubscription, lobbySubscription;
export let isBroadcasting = false,
    isViewing = false;
export let mySessionId = '';
export let myRealAddress = '';
export let currentChainId = null;
export let myNickname = '';
export let myRoomName = '';
export let roomNameToJoin = null;
export let currentBroadcasterAddress = null;
export let lastKeyFrameTimestamp = 0,
    lastChunkReceivedTimestamp = 0,
    streamHealthInterval = null;
export let broadcastSourceType = 'camera';
export let audioMeter = {
    context: null,
    stream: null,
    analyser: null,
    animationId: null
};
export let currentUserId = null;
export let myPartition = null;
export let presenceHeartbeatInterval = null,
    broadcasterPresenceInterval = null;
export let detailedWatchStatus = 'Looking for a broadcast...';
export let lobbyUpdateTimeout = null;

// --- Broadcasting State ---
export let videoSequenceNumber = 0;
export let audioSequenceNumber = 0;
export let latestVideoTimestamp = 0;

// --- Viewer Playback State ---
export let videoBuffer = [],
    audioBuffer = [];
export let isPlaying = false,
    isManuallyPaused = false;
export let playbackStartTime = 0,
    mediaStartTime = 0;
export let effectiveBufferTargetMs = 250;
export let nextAudioScheduleTime = 0;
export let lastRenderedFrame = null,
    currentStreamConfigId = null;
export let waitingForKeyframe = false;
export let expectedVideoSequenceNumber = 0;
export let expectedAudioSequenceNumber = 0;
export let syncOffset = 0; // The difference between video and audio timestamps for synchronization

// --- Data Maps ---
export const userNicknames = new Map();
export const roomNames = new Map();
export const verifiedUsers = new Map();
export const userColors = new Map();
export const userRealAddresses = new Map();
export const activePartitions = new Map();


// --- State Setter Functions ---
export function setStreamrClient(client) { streamrClient = client; }
export function setMySessionId(id) { mySessionId = id; }
export function setMyNickname(nickname) { myNickname = nickname; }
export function setMyPartition(partition) { myPartition = partition; }
export function setIsBroadcasting(status) { isBroadcasting = status; }
export function setIsViewing(status) { isViewing = status; }
export function setMyRealAddress(address) { myRealAddress = address; }
export function setCurrentChainId(id) { currentChainId = id; }
export function setBroadcastSourceType(type) { broadcastSourceType = type; }
export function setRoomNameToJoin(name) { roomNameToJoin = name; }
export function setMyRoomName(name) { myRoomName = name; }
export function setLocalStream(stream) { localStream = stream; }
export function setVideoEncoder(encoder) { videoEncoder = encoder; }
export function setAudioEncoder(encoder) { audioEncoder = encoder; }
export function setLastKeyFrameTimestamp(timestamp) { lastKeyFrameTimestamp = timestamp; }
export function setLobbyUpdateTimeout(timeout) { lobbyUpdateTimeout = timeout; }
export function setChatSubscription(subscription) { chatSubscription = subscription; }
export function setLobbySubscription(subscription) { lobbySubscription = subscription; }
export function setCurrentBroadcasterAddress(address) { currentBroadcasterAddress = address; }
export function setEffectiveBufferTargetMs(ms) { effectiveBufferTargetMs = ms; }
export function setDetailedWatchStatus(status) { detailedWatchStatus = status; }
export function setStreamHealthInterval(interval) { streamHealthInterval = interval; }
export function setAudioContext(context) { audioContext = context; }
export function setGainNode(node) { gainNode = node; }
export function setVideoDecoder(decoder) { videoDecoder = decoder; }
export function setAudioDecoder(decoder) { audioDecoder = decoder; }
export function setWaitingForKeyframe(status) { waitingForKeyframe = status; }
export function setLastRenderedFrame(frame) { lastRenderedFrame = frame; }
export function setIsPlaying(status) { isPlaying = status; }
export function setPlaybackStartTime(time) { playbackStartTime = time; }
export function setMediaStartTime(time) { mediaStartTime = time; }
export function setNextAudioScheduleTime(time) { nextAudioScheduleTime = time; }
export function setCurrentStreamConfigId(id) { currentStreamConfigId = id; }
export function setVideoSubscription(subscription) { videoSubscription = subscription; }
export function setAudioSubscription(subscription) { audioSubscription = subscription; }
export function setLastChunkReceivedTimestamp(timestamp) { lastChunkReceivedTimestamp = timestamp; }
export function setIsManuallyPaused(status) { isManuallyPaused = status; }
export function setCurrentUserId(id) { currentUserId = id; }
export function setPresenceHeartbeatInterval(interval) { presenceHeartbeatInterval = interval; }
export function setPresenceSubscription(subscription) { presenceSubscription = subscription; }
export function setBroadcasterPresenceInterval(interval) { broadcasterPresenceInterval = interval; }
export function setVideoSequenceNumber(seq) { videoSequenceNumber = seq; }
export function setAudioSequenceNumber(seq) { audioSequenceNumber = seq; }
export function setExpectedVideoSequenceNumber(seq) { expectedVideoSequenceNumber = seq; }
export function setExpectedAudioSequenceNumber(seq) { expectedAudioSequenceNumber = seq; }
export function setLatestVideoTimestamp(timestamp) { latestVideoTimestamp = timestamp; }
export function setSyncOffset(offset) { syncOffset = offset; }


export function initializeUiElements() {
    mainContainer = document.getElementById('main-container');
    videoColumn = document.getElementById('video-column');
    pages = {
        lobby: document.getElementById('lobby-page'),
        settings: document.getElementById('settings-page'),
        broadcast: document.getElementById('broadcast-page'),
        watch: document.getElementById('watch-page')
    };
    startBroadcastBtn = document.getElementById('start-broadcast-btn');
    localVideo = document.getElementById('localVideo');
    remoteCanvas = document.getElementById('remoteCanvas');
    canvasWrapper = document.getElementById('canvas-wrapper');
    broadcastStatus = document.getElementById('broadcast-status');
    watchStatus = document.getElementById('watch-status');
    statusDot = document.getElementById('statusDot');
    fullscreenBtn = document.getElementById('fullscreen-btn');
    playPauseBtn = document.getElementById('playPauseBtn');
    playIcon = document.getElementById('playIcon');
    pauseIcon = document.getElementById('pauseIcon');
    viewerCountBroadcaster = document.getElementById('viewer-count-broadcaster');
    viewerCountBroadcasterValue = document.getElementById('viewer-count-broadcaster-value');
    viewerCountWatcher = document.getElementById('viewer-count-watcher');
    viewerCountWatcherValue = document.getElementById('viewer-count-watcher-value');
    broadcastSourceRadios = document.querySelectorAll('input[name="broadcast-source"]');
    inputDevicesGroup = document.getElementById('input-devices-group');
    videoQualityGroup = document.getElementById('video-quality-group');
    videoSourceSelect = document.getElementById('videoSourceSelect');
    audioSourceSelect = document.getElementById('audioSourceSelect');
    audioMeterCanvas = document.getElementById('audio-meter-canvas');
    resolutionSlider = document.getElementById('resolutionSlider');
    resolutionValue = document.getElementById('resolutionValue');
    resolutionSetting = document.getElementById('resolution-setting');
    framerateSetting = document.getElementById('framerate-setting');
    bitrateSlider = document.getElementById('bitrateSlider');
    bitrateValue = document.getElementById('bitrateValue');
    framerateSlider = document.getElementById('framerateSlider');
    framerateValue = document.getElementById('framerateValue');
    audioQualitySlider = document.getElementById('audioQualitySlider');
    audioQualityValue = document.getElementById('audioQualityValue');
    performanceSlider = document.getElementById('performanceSlider');
    performanceValue = document.getElementById('performanceValue');
    keyframeIntervalSlider = document.getElementById('keyframeIntervalSlider');
    keyframeIntervalValue = document.getElementById('keyframeIntervalValue');
    volumeSlider = document.getElementById('volume-slider');
    bufferSlider = document.getElementById('bufferSlider');
    bufferValue = document.getElementById('bufferValue');
    latencyControls = document.getElementById('latency-controls');
    canvasContext = remoteCanvas.getContext('2d');
    loginModal = document.getElementById('loginModal');
    loginContent = document.getElementById('loginContent');
    loadingContent = document.getElementById('loadingContent');
    connectWalletBtn = document.getElementById('connectWalletBtn');
    guestBtn = document.getElementById('guestBtn');
    loadingInstructions = document.getElementById('loading-instructions');
    chatContainer = document.getElementById('chat-container');
    messageInput = document.getElementById('messageInput');
    sendBtn = document.getElementById('sendBtn');
    emojiBtn = document.getElementById('emojiBtn');
    messagesContainer = document.getElementById('messagesContainer');
    emojiPicker = document.getElementById('emojiPicker');
    nicknameModal = document.getElementById('nicknameModal');
    nicknameInput = document.getElementById('nicknameInput');
    saveNicknameBtn = document.getElementById('saveNicknameBtn');
    resetNicknameBtn = document.getElementById('resetNicknameBtn');
    nicknameBtn = document.getElementById('nicknameBtn');
    chatUserId = document.getElementById('chat-user-id');
    settingsStatus = document.getElementById('settings-status');
    broadcasterUserId = document.getElementById('broadcaster-user-id');
    nicknameBtnBroadcast = document.getElementById('nicknameBtnBroadcast');
    broadcasterInfoOnWatchPage = document.getElementById('broadcaster-info-on-watch-page');
    toggleLatencyControlsBtn = document.getElementById('toggle-latency-controls-btn');
    latencyControlsCollapsible = document.getElementById('latency-controls-collapsible');
    toggleLatencyArrow = document.getElementById('toggle-latency-arrow');
    lobbyPage = document.getElementById('lobby-page');
    streamListContainer = document.getElementById('stream-list-container');
    streamListLoader = document.getElementById('stream-list-loader');
    lobbyStatus = document.getElementById('lobby-status');
    roomNameInput = document.getElementById('roomNameInput');
    roomNameOnWatchPage = document.getElementById('roomNameOnWatchPage');
    roomNameOnBroadcastPage = document.getElementById('roomNameOnBroadcastPage');
    shareBtnBroadcast = document.getElementById('shareBtnBroadcast');
    shareBtnWatch = document.getElementById('shareBtnWatch');
    toast = document.getElementById('toast');
    goLiveBtnLobby = document.getElementById('go-live-btn-lobby');
    broadcasterDisplayName = document.getElementById('broadcaster-display-name');
    tipBtn = document.getElementById('tipBtn');
    tipModal = document.getElementById('tipModal');
    tipInitialView = document.getElementById('tip-initial-view');
    tipLoadingView = document.getElementById('tip-loading-view');
    tipSuccessView = document.getElementById('tip-success-view');
    tipRecipientName = document.getElementById('tip-recipient-name');
    tipAmountInput = document.getElementById('tipAmountInput');
    tipErrorMsg = document.getElementById('tip-error-msg');
    cancelTipBtn = document.getElementById('cancelTipBtn');
    sendTipBtn = document.getElementById('sendTipBtn');
    closeTipSuccessBtn = document.getElementById('closeTipSuccessBtn');
    tipEtherscanLink = document.getElementById('tip-etherscan-link');
    tipTokenSelect = document.getElementById('tipTokenSelect');
    tipAmountLabel = document.getElementById('tipAmountLabel');
}

