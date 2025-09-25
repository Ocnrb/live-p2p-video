import {
    mySessionId,
    myRealAddress,
    currentChainId,
    streamrClient,
    loadingInstructions,
    verifiedUsers,
    userRealAddresses,
    currentBroadcasterAddress,
    tipTokenSelect,
    tipInitialView,
    tipLoadingView,
    tipSuccessView,
    tipErrorMsg,
    tipEtherscanLink,
    tipAmountInput,
    myPartition,
    tipRecipientName,
    tipAmountLabel,
    setMyRealAddress,
    setCurrentChainId
} from './state.js';

import {
    LOBBY_STREAM_ID,
    NETWORKS,
    TOKEN_ADDRESSES,
    TOKEN_DECIMALS,
    ERC20_ABI
} from './constants.js';

import {
    getColorKey,
    getDisplayName,
    getStreamId
} from './utils.js';

import {
    setLoginModalState,
    updateUIVerification
} from './ui.js';

import {
    initializeApp,
    cleanupClient
} from './app.js';


export function handleChainChanged(chainId) {
    console.log("Network changed to:", chainId);
    window.location.reload();
}

export async function connectWithWallet() {
    const injectedProvider = window.ethereum || window.top?.ethereum;
    if (!injectedProvider) {
        alert("MetaMask not found. Please install the MetaMask extension and refresh the page.");
        return;
    }
    try {
        setLoginModalState('loading');
        loadingInstructions.textContent = 'Please follow the instructions in your wallet.';

        await initializeApp();

        injectedProvider.on('chainChanged', handleChainChanged);

        const provider = new ethers.providers.Web3Provider(injectedProvider);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const network = await provider.getNetwork();
        setCurrentChainId(network.chainId);

        setMyRealAddress(await signer.getAddress());

        const proofMsg = `Verifying ownership: My address ${myRealAddress} will be represented by session ${mySessionId}`;
        const proofSignature = await signer.signMessage(proofMsg);

        await streamrClient.publish(LOBBY_STREAM_ID, {
            type: 'identity_proof',
            realAddress: myRealAddress,
            sessionId: mySessionId,
            proofMsg: proofMsg,
            signature: proofSignature
        });

        verifiedUsers.set(getColorKey(mySessionId), true);
        userRealAddresses.set(mySessionId, myRealAddress);
        updateUIVerification(mySessionId);

    } catch (err) {
        console.error("Wallet connection failed:", err);
        await cleanupClient();
        setMyRealAddress('');
        setCurrentChainId(null);
        let errorMessage = "Wallet connection request was rejected or failed.";
        if (err.code === 'ACTION_REJECTED') {
            errorMessage = "Signature request was rejected in your wallet.";
        }
        alert(errorMessage);
        setLoginModalState('buttons');
    }
}


export async function verifyIdentityProof(message) {
    const {
        realAddress,
        sessionId,
        proofMsg,
        signature
    } = message;
    if (!realAddress || !sessionId || !proofMsg || !signature) return;

    const colorKey = userRealAddresses.get(sessionId) || sessionId;
    if (verifiedUsers.has(colorKey)) return;

    try {
        const recoveredAddress = ethers.utils.verifyMessage(proofMsg, signature);
        if (recoveredAddress.toLowerCase() === realAddress.toLowerCase()) {
            console.log(`Identity verified for ${realAddress} linked to session ${sessionId}`);
            userRealAddresses.set(sessionId, realAddress);
            verifiedUsers.set(getColorKey(sessionId), true);
            updateUIVerification(sessionId);
        }
    } catch (e) {
        console.error("Failed to verify identity proof:", e);
    }
}


export function updateTipModalUI() {
    if (!currentChainId) return;
    const network = NETWORKS[currentChainId];
    if (!network) {
        tipTokenSelect.innerHTML = '<option value="">Network Not Supported</option>';
        return;
    }

    tipTokenSelect.innerHTML = '';

    const nativeOption = document.createElement('option');
    nativeOption.value = 'native';
    nativeOption.textContent = network.symbol;
    tipTokenSelect.appendChild(nativeOption);

    const availableTokens = TOKEN_ADDRESSES[currentChainId] || {};
    for (const tokenSymbol in availableTokens) {
        const tokenOption = document.createElement('option');
        tokenOption.value = tokenSymbol;
        tokenOption.textContent = tokenSymbol;
        tipTokenSelect.appendChild(tokenOption);
    }
    
    // FIXED: Removed line that incorrectly set recipient name.
    // The name is now set only in stream.js when information is received.
    
    tipTokenSelect.dispatchEvent(new Event('change'));
}


export async function sendTip() {
    if (!currentBroadcasterAddress) {
        tipErrorMsg.textContent = 'Streamer address not found.';
        return;
    }

    const amountStr = tipAmountInput.value;
    if (!amountStr || isNaN(amountStr) || parseFloat(amountStr) <= 0) {
        tipErrorMsg.textContent = 'Please enter a valid amount.';
        return;
    }
    tipErrorMsg.textContent = '';

    const selectedToken = tipTokenSelect.value;

    tipInitialView.style.display = 'none';
    tipLoadingView.style.display = 'block';

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        let tx;

        if (selectedToken === 'native') {
            const amountWei = ethers.utils.parseEther(amountStr);
            tx = await signer.sendTransaction({
                to: currentBroadcasterAddress,
                value: amountWei
            });
        } else {
            const tokenAddress = TOKEN_ADDRESSES[currentChainId][selectedToken];
            const tokenDecimals = TOKEN_DECIMALS[selectedToken];
            if (!tokenAddress || !tokenDecimals) {
                throw new Error(`Token ${selectedToken} not configured for this network.`);
            }
            const amountInSmallestUnit = ethers.utils.parseUnits(amountStr, tokenDecimals);
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
            tx = await tokenContract.transfer(currentBroadcasterAddress, amountInSmallestUnit);
        }

        await tx.wait();

        const networkName = NETWORKS[currentChainId]?.name || 'the network';
        const tokenSymbol = selectedToken === 'native' ? (NETWORKS[currentChainId]?.symbol || 'coins') : selectedToken;
        const shortTipper = `${myRealAddress.slice(0, 6)}...${myRealAddress.slice(-4)}`;
        const shortRecipient = `${currentBroadcasterAddress.slice(0, 6)}...${currentBroadcasterAddress.slice(-4)}`;
        const tipMessageText = `${shortTipper} tipped ${amountStr} ${tokenSymbol} to ${shortRecipient} via ${networkName}`;

        try {
            await streamrClient.publish(getStreamId('chat', myPartition), {
                type: 'tip',
                text: tipMessageText,
                txHash: tx.hash,
                chainId: currentChainId,
                realAddress: myRealAddress
            });
        } catch (err) {
            console.error("Failed to publish tip notification:", err);
        }

        tipLoadingView.style.display = 'none';
        tipSuccessView.style.display = 'block';
        const explorerUrl = NETWORKS[currentChainId]?.explorer;
        if (explorerUrl) {
            tipEtherscanLink.href = `${explorerUrl}/tx/${tx.hash}`;
            tipEtherscanLink.style.display = 'inline-block';
        } else {
            tipEtherscanLink.style.display = 'none';
        }

    } catch (err) {
        console.error("Tip failed:", err);
        tipLoadingView.style.display = 'none';
        tipInitialView.style.display = 'block';
        let errorMessage = 'Transaction failed.';
        if (err.code === 'ACTION_REJECTED') {
            errorMessage = 'Transaction rejected in wallet.';
        } else if (err.message.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds for transaction.';
        }
        tipErrorMsg.textContent = errorMessage;
    }
}