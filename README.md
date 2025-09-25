Decentralized P2P Streaming Platform
This is a real-time, peer-to-peer (P2P) streaming and chat application built on the Streamr Network. It provides a secure, censorship-resistant, and serverless communication platform where users can connect directly to each other to broadcast live video and audio streams.

Key Features
P2P Live Streaming: Broadcast live video and audio from your camera or screen. The application uses the WebCodecs API to handle real-time encoding and decoding of video frames, ensuring ultra-low latency. The data streams are then published directly to the Streamr Network.

Web3 Identity: Users can connect their Ethereum-compatible wallet (via Ethers.js) for a cryptographically verified and persistent identity. This allows for features like on-chain tipping and a public display of their wallet address. Guests can also join with a temporary, anonymous session ID.

Decentralized Chat: The platform includes a real-time chat feature where messages are also published to the Streamr Network, ensuring a decentralized and serverless communication channel alongside the live stream.

Cryptocurrency Tipping: Viewers can send tips to the broadcaster using ERC-20 tokens on various supported networks (Ethereum, Polygon, Arbitrum, Optimism, Base). The tipping functionality leverages Ethers.js for transaction signing and broadcasting.

No Central Server: The entire application is a self-contained web app that runs directly in the browser. It uses a P2P architecture to handle all data transfer, eliminating a single point of failure and ensuring resilience.

Responsive UI: The user interface is built with Tailwind CSS and is designed to adapt seamlessly to different screen sizes, providing an optimal viewing and broadcasting experience on desktop and mobile devices.

Technologies Used
Streamr SDK: The core library for all decentralized pub/sub communication on the Streamr Network.

WebCodecs API: Used for high-performance, low-latency video and audio encoding and decoding directly in the browser.

Ethers.js: Handles all wallet connections, transaction signing, and interactions with supported blockchains.

DOMPurify: Used to sanitize chat messages and other user-generated content, preventing cross-site scripting (XSS) attacks.

HTML, CSS, JavaScript (ES6+): The foundation of the web application.

How to Run
Clone this repository or download the source files.

Open the index.html file in any modern web browser that supports WebCodecs (e.g., Chrome, Edge).

No installation or server setup is required.

Contributing
Contributions are welcome! If you would like to contribute, feel free to open an issue or submit a pull request for any new features, bug fixes, or improvements.

License
This project is licensed under the MIT License.