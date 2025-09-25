import {
    userRealAddresses,
    userColors,
    userNicknames,
    verifiedUsers,
    toast
} from './state.js';

import {
    colorPalette,
    VIDEO_STREAM_BASE,
    AUDIO_STREAM_BASE,
    PRESENCE_STREAM_BASE,
    CHAT_STREAM_BASE,
    LOBBY_STREAM_ID
} from './constants.js';


export function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2000); // Hide after 2 seconds
}

export function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => showToast('Room link copied to clipboard!'))
            .catch(err => {
                console.error('Failed to copy text: ', err);
                showToast('Failed to copy link.');
            });
    } else {
        // Fallback for insecure contexts or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; // Avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Room link copied to clipboard!');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            showToast('Failed to copy link.');
        }
        document.body.removeChild(textArea);
    }
}

export function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

export function getColorKey(publisherId) {
    return userRealAddresses.get(publisherId) || publisherId;
}

export function getUserColor(publisherId) {
    const colorKey = getColorKey(publisherId);
    if (!userColors.has(colorKey)) {
        const hash = simpleHash(colorKey);
        const color = colorPalette[hash % colorPalette.length];
        userColors.set(colorKey, color);
    }
    return userColors.get(colorKey);
}

export function getDisplayName(publisherId) {
    const realAddress = userRealAddresses.get(publisherId);
    const nickname = userNicknames.get(publisherId);
    const sanitizedNickname = sanitizeHTML(nickname || '');
    const isVerified = verifiedUsers.get(getColorKey(publisherId));

    if (realAddress) { // Wallet user
        const shortAddress = `${realAddress.slice(0, 6)}...${realAddress.slice(-4)}`;
        const verificationMark = isVerified
            ? ` <span class="tooltip-container">
                   <span class="cursor-help">✅</span>
                   <span class="tooltip-text !w-56 !-ml-28 !bottom-6 !text-xs !text-left !font-normal">This user has proven ownership of their wallet address through a cryptographic signature.</span>
               </span>`
            : '';

        if (sanitizedNickname) {
            return `${sanitizedNickname} (${shortAddress})${verificationMark}`;
        }
        return `${shortAddress}${verificationMark}`;
    } else { // Guest user
        const shortSessionId = `${publisherId.slice(0, 6)}...${publisherId.slice(-4)}`;
        if (sanitizedNickname) {
            return `${sanitizedNickname} (${shortSessionId})`;
        }
        return shortSessionId;
    }
}

export function sanitizeHTML(str) {
    return DOMPurify.sanitize(str, {
        ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'a'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
    });
}

export function arrayBufferToBase64(buffer) {
    let binary = '',
        bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export function base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64),
        len = binary_string.length,
        bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export function insertIntoSortedBuffer(buffer, item) {
    let low = 0,
        high = buffer.length;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (buffer[mid].timestamp < item.timestamp) low = mid + 1;
        else high = mid;
    }
    buffer.splice(low, 0, item);
}

export function getStreamId(type, partition) {
    let streamBase;
    switch (type) {
        case 'video':
            streamBase = VIDEO_STREAM_BASE;
            break;
        case 'audio':
            streamBase = AUDIO_STREAM_BASE;
            break;
        case 'presence':
            streamBase = PRESENCE_STREAM_BASE;
            break;
        case 'chat':
            streamBase = CHAT_STREAM_BASE;
            break;
        default:
            throw new Error(`Unknown stream type: ${type}`);
    }
    return {
        streamId: streamBase,
        partition: partition
    };
}

export function getGlobalStreamId(type) {
    if (type === 'lobby') {
        return LOBBY_STREAM_ID;
    }
    // Fallback for other global streams if needed, though lobby is the only one right now
    return `${STREAM_BASE}/${type}`;
}

