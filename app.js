import {
    myRealAddress, mySessionId, streamrClient,
    userNicknames,
    setStreamrClient, setMySessionId, setMyNickname,
    chatUserId, broadcasterUserId, loginModal, loadingInstructions, isBroadcasting, isViewing
} from './state.js';

import {
    setLoginModalState
} from './ui.js';

import {
    getDisplayName
} from './utils.js';

import {
    startLobby, stopBroadcast, stopViewing
} from './stream.js';


export async function initializeApp() {
    await cleanupClient();
    try {
        if (!loginModal.classList.contains('hidden')) {
            setLoginModalState('loading');
            loadingInstructions.textContent = 'Connecting to the P2P network...';
        }

        const newStreamrClient = new StreamrClient(); // Secure anonymous session
        await newStreamrClient.connect();
        setStreamrClient(newStreamrClient);

        const newMySessionId = await streamrClient.getAddress();
        setMySessionId(newMySessionId);

        const nicknameKey = myRealAddress || newMySessionId;
        const newMyNickname = sessionStorage.getItem(`nickname_${nicknameKey}`) || '';
        setMyNickname(newMyNickname);

        if (newMyNickname) {
            userNicknames.set(newMySessionId, newMyNickname);
        }

        if (chatUserId) chatUserId.innerHTML = getDisplayName(newMySessionId);
        if (broadcasterUserId) broadcasterUserId.innerHTML = getDisplayName(newMySessionId);

        loginModal.classList.add('hidden');
        startLobby();
    } catch (error) {
        console.error('Failed to initialize Streamr client:', error);
        alert(`Error connecting: ${error.message}. Please refresh the page.`);
        setLoginModalState('buttons');
    }
}

export async function cleanupClient() {
    if (streamrClient) {
        console.log("Cleaning up previous Streamr client...");
        await streamrClient.destroy();
        setStreamrClient(null);
    }
}

// FIXED: Centralized navigation logic to avoid cycles
export async function goBackToLobby() {
    if (window.location.pathname !== '/') {
        window.history.pushState({}, document.title, window.location.origin);
    }
    if (isBroadcasting) {
        await stopBroadcast();
    } else if (isViewing) {
        await stopViewing();
    }
    
    // After cleanup, restart the application to show the lobby
    await initializeApp();
}