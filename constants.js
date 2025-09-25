// --- Stream Constants ---
export const LOBBY_STREAM_ID = '0x75fc31876b8cd9af59a0e882d87dd8468c2d0e35/lobby';
export const VIDEO_STREAM_BASE = '0x75fc31876b8cd9af59a0e882d87dd8468c2d0e35/video';
export const AUDIO_STREAM_BASE = '0x75fc31876b8cd9af59a0e882d87dd8468c2d0e35/audio';
export const PRESENCE_STREAM_BASE = '0x75fc31876b8cd9af59a0e882d87dd8468c2d0e35/presence';
export const CHAT_STREAM_BASE = '0x75fc31876b8cd9af59a0e882d87dd8468c2d0e35/chat';
export const PARTITIONS = 10; // Total number of available partitions
export const MAX_MESSAGES = 100;
export const LIVE_BUFFER_TARGET_MS = 250; // Increased for audio stability

// --- Emojis ---
export const emojis = [
    '😂', '😭', '❤️', '👍', '👎', '👏', '🔥', '💯', '🤔', '🙏', '🤯', '🥳', '😎', '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '🤩', '🤪', '😜', '😝', '😋', '😛', '🤑', '🤭', '🤫', '😶', '😐', '😑', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😴', '🤤', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '😎', '🤓', '🧐', '😕',
    '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😩', '😫', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '👻', '👽', '🤖', '👾', '🙈', '🙉', '🙊', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '🤛', '🤜', '👏', '🙌',
    '💪', '✍️', '🙏', '🦶', '🦵', '👂', '👃', '👁️', '👀', '🧠', '👅', '👄', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦉', '🐛', '🦋', '🐢', '🐍', '🐙', '🦑', '🦞', '🦀', '🐠', '🐟', '🐡', '🦈', '🐳', '🐬', '🐾',
    '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥕', '🥔', '🌶️', '🌽', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🥞', '🧇', '🧀', '🍗', '🍖', '🍣', '🍤', '🍙', '🍚', '🍜', '🍲', '🍝', '🍕', '🍔', '🍟', '🌭', '🌮', '🌯', '🥙', '🥪', '🍟', '🍡', '🍦', '🍩', '🍪', '🎂', '🍰', '🍫', '🍬', '🍭', '🍮',
    '⚽', '🏀', '🏈', '⚾', '🥎', '🏐', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳', '🎯', '🪁', '🎣', '🤿', '🎨', '🎬', '🎤', '🎧', '🎸', '🎹', '🎷', '🎺', '🎻', '🥁', '🎲', '♟️', '🎮', '🕹️',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💌', '💥', '💫', '🌟', '✨', '⚡', '🔥', '☄️', '💧', '🌊', '💦', '💧',
    '🎈', '🎉', '🎊', '🎁', '🎀', '🪄', '🔔', '📢', '🔊', '📣', '📯', '🎶', '🎵', '🎼', '🎙️', '📱', '📞', '💻', '🖥️', '⌨️', '🖱️', '🔋', '🔌', '💡', '🔦', '💵', '💰', '💳', '💎'
];

// --- Web3 Constants ---
export const ERC20_ABI = ["function transfer(address to, uint amount) returns (bool)"];
export const NETWORKS = {
    1: { name: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io', rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' },
    137: { name: 'Polygon', symbol: 'MATIC', explorer: 'https://polygonscan.com', rpcUrl: 'https://polygon-rpc.com' },
    42161: { name: 'Arbitrum', symbol: 'ETH', explorer: 'https://arbiscan.io', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
    10: { name: 'Optimism', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io', rpcUrl: 'https://mainnet.optimism.io' },
    8453: { name: 'Base', symbol: 'ETH', explorer: 'https://basescan.org', rpcUrl: 'https://mainnet.base.org' },
};
export const TOKEN_ADDRESSES = {
    1: { // Ethereum
        'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'DATA': '0x8f693ca8D21b157107184d29D398A8D082b38b76',
    },
    137: { // Polygon
        'USDC': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        'DATA': '0x3a9A81d576d83FF21f26f325066054540720fC34',
    },
    42161: { // Arbitrum One
        'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    },
    10: { // Optimism
        'USDC': '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        'USDT': '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    },
    8453: { // Base
        'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        'USDT': '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6Ca',
    }
};
export const TOKEN_DECIMALS = { 'USDC': 6, 'USDT': 6, 'DATA': 18 }; 

// --- Constants and Mappings ---
export const resolutions = [ { text: '480p', value: '640x480' }, { text: '720p', value: '1280x720' }, { text: '1080p', value: '1920x1080' }];
export const audioQualities = [ 
    { text: 'Voice (32 Kb)', bitrate: 32000 }, 
    { text: 'Balanced (64 Kb)', bitrate: 64000 }, 
    { text: 'High-Fidelity (128 Kb)', bitrate: 128000 },
    { text: 'Studio (256 Kb)', bitrate: 256000 }
];
export const colorPalette = [
    '#FF8A65', '#4FC3F7', '#AED581', '#F06292',
    '#BA68C8', '#FFD54F', '#4DB6AC', '#7986CB'
];

// --- Timing and Health Constants ---
export const STALE_STREAM_TIMEOUT_MS = 3000;
export const VIEWER_TIMEOUT_MS = 15000;
export const HEARTBEAT_INTERVAL_MS = 10000;

