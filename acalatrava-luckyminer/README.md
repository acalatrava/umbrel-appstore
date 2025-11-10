# Lucky Miner

**Because if there is a hash, there is a chance.**

Lucky Miner is a lightweight CPU mining app for Umbrel that lets you solo mine Bitcoin just for the thrill of it. Think of it as a fun, lotto-style mining experiment — no fancy rigs or profits expected, just your CPU giving it a shot. You can watch real hashes roll by, track your stats, and feel like part of the mining adventure without the noise or heat of a real farm.

## What is Lucky Miner? (Think Nerdminer, but Software)

If you're familiar with **Nerdminer** devices — those compact ESP32-based hardware miners that solo mine Bitcoin for fun — then you already understand the concept behind Lucky Miner. Lucky Miner is essentially the **software equivalent of a Nerdminer**, but running on your Umbrel device instead of requiring dedicated hardware.

### Lucky Miner vs. Nerdminer

| Feature          | Nerdminer                    | Lucky Miner                      |
| ---------------- | ---------------------------- | -------------------------------- |
| **Type**         | Hardware device (ESP32)      | Software app for Umbrel          |
| **Hashrate**     | ~55 KH/s                     | Variable (depends on your CPU)   |
| **Power**        | ~1.6W                        | Uses your existing Umbrel device |
| **Setup**        | Requires hardware purchase   | Software installation only       |
| **Purpose**      | Educational "lottery mining" | Educational "lottery mining"     |
| **Philosophy**   | Solo mine for the thrill     | Solo mine for the thrill         |
| **Block Reward** | 100% if you find a block     | 100% if you find a block         |

### The "Lottery Mining" Concept

Both Nerdminer and Lucky Miner embrace the same philosophy: **"lottery mining"** or **"solo mining for fun"**. The idea is simple:

- The probability of finding a block is astronomically low
- But if you do find one, you get the **entire block reward** (currently 3.125 BTC + fees)
- It's about participating in the Bitcoin network, learning about mining, and the excitement of the possibility
- It's not about profitability — it's about the adventure

**Lucky Miner** brings this same concept to your Umbrel device, using your CPU instead of dedicated hardware. No need to buy a separate device — just install the app and start hashing!

## Features

- **CPU Mining**: Automatic CPU thread detection for optimal performance
- **Web Interface**: Easy-to-use web interface for configuration and monitoring
- **Real-time Statistics**: Track hash rate, accepted/rejected shares, and difficulty
- **Stratum Support**: Connect to any Stratum-compatible mining pool
- **Background Operation**: Runs continuously in the background once started
- **Auto-start**: Automatically resumes mining when the app restarts (if configured)

## Recommended Setup

For the best solo mining experience, we highly recommend using Lucky Miner with:

- **[Bitcoin Node](https://apps.umbrel.com/app/bitcoin)**: Run your personal Bitcoin node powered by Bitcoin Core. Independently store and validate every Bitcoin transaction while helping keep the network decentralized.
- **[Public Pool](https://apps.umbrel.com/app/public-pool)**: A fully open-source solo Bitcoin mining pool that lets you run your own pool using your own node. If you successfully mine a block, you receive the entire block reward — no splitting with other miners, no fees, no middleman.

### Why Use Public Pool?

- **Full Block Rewards**: Mine independently and receive 100% of any block reward you find
- **Decentralization**: Help strengthen Bitcoin's decentralization by running your own pool
- **Privacy**: Your mining operation stays private and under your control
- **Zero Fees**: No pool fees or middlemen taking a cut
- **Easy Setup**: On umbrelOS, Public Pool automatically configures with your Bitcoin Node — no extra setup required

### Recommended Installation Order

1. Install **[Bitcoin Node](https://apps.umbrel.com/app/bitcoin)** from the Umbrel App Store
2. Install **[Public Pool](https://apps.umbrel.com/app/public-pool)** from the Umbrel App Store
3. Install **Lucky Miner** (see Installation section below)
4. Configure Lucky Miner to point to your Public Pool instance

This setup gives you complete sovereignty over your mining operation, from validating transactions to potentially finding blocks.

## Installation

Lucky Miner is available through the acalatrava Umbrel App Store. To install:

1. Add the acalatrava App Store to your Umbrel instance (see the main repository README)
2. Navigate to the App Store in your Umbrel dashboard
3. Find "Lucky Miner" and click Install

## Configuration

### Using Public Pool (Recommended)

If you're using [Public Pool](https://apps.umbrel.com/app/public-pool) with your [Bitcoin Node](https://apps.umbrel.com/app/bitcoin), you'll find the Stratum connection details directly in the Public Pool app interface. Simply:

1. Open the **Public Pool** app in your Umbrel dashboard
2. Copy the Stratum URL and connection details provided
3. Enter these details in Lucky Miner's configuration
4. Use your Bitcoin address as the username/worker

This setup ensures you're mining to your own pool, maintaining full control and receiving 100% of any block rewards.

### Stratum Pool Setup

Before you can start mining, you need to configure a Stratum pool connection:

1. **Stratum URL**: The pool's Stratum server address
   - Format: `stratum+tcp://pool.example.com:3333`
   - Example: `stratum+tcp://stratum.btc.com:3333`
   - **For Public Pool**: Use the Stratum URL shown in your Public Pool app (typically `stratum+tcp://your-umbrel.local:3333`)

2. **Username/Worker**: Your wallet address or pool username
   - Format: `wallet_address.worker_name` (for pools)
   - Or just your wallet address for solo mining pools
   - **For Public Pool**: Use your Bitcoin address (the one you configured in Public Pool)

3. **Password**: Usually `x` or can be left empty (depends on the pool)
   - **For Public Pool**: Usually `x` or can be left empty

### Starting Mining

1. Open the Lucky Miner app from your Umbrel dashboard
2. Enter your Stratum pool configuration
3. Click "Save & Start" to begin mining
4. Monitor your mining statistics in real-time

### Stopping Mining

Click the "Stop Mining" button in the web interface to stop the miner at any time.

## Usage

### Web Interface

The web interface provides:

- **Status Indicator**: Shows whether mining is currently running
- **Mining Statistics**: Real-time display of:
  - Hash rate (H/s)
  - Accepted shares
  - Rejected shares
  - Current difficulty
  - Device information
- **Configuration Panel**: Manage your Stratum pool settings
- **Control Buttons**: Start and stop mining operations

### API Endpoints

The app exposes a REST API for programmatic control:

- `GET /api/config` - Get current configuration
- `POST /api/config` - Update configuration
- `POST /api/start` - Start mining
- `POST /api/stop` - Stop mining
- `GET /api/status` - Get mining status
- `GET /api/mining/summary` - Get mining summary statistics
- `GET /api/mining/devs` - Get device information
- `GET /api/mining/pools` - Get pool information

## Technical Details

### Architecture

- **Backend**: Node.js with Express.js
- **Mining Engine**: BFGMiner (CPU-only build)
- **Frontend**: Vanilla JavaScript with a modern web interface
- **Container**: Docker-based deployment for Umbrel

### Requirements

- Umbrel OS
- CPU with multiple cores (recommended)
- Internet connection for pool connectivity
- **[Bitcoin Node](https://apps.umbrel.com/app/bitcoin)** (recommended for solo mining with Public Pool)
- **[Public Pool](https://apps.umbrel.com/app/public-pool)** (recommended for the best solo mining experience)

### Data Persistence

Configuration and data are stored in the `/data` directory, which is persisted across container restarts.

## Important Notes

⚠️ **Disclaimer**: This app is for educational and entertainment purposes. CPU mining Bitcoin is not profitable and should not be considered a source of income. The chances of finding a block with CPU mining are extremely low.

### Solo Mining with Your Own Node

When using Lucky Miner with [Public Pool](https://apps.umbrel.com/app/public-pool) and your own [Bitcoin Node](https://apps.umbrel.com/app/bitcoin), you're participating in true solo mining. This means:

- You're helping decentralize Bitcoin mining
- You maintain full control over your mining operation
- If you find a block, you receive the entire block reward (currently 3.125 BTC + transaction fees)
- You're contributing to Bitcoin's network security independently

While the odds are astronomical, the possibility exists — and that's what makes it exciting! Every hash you contribute helps strengthen the network, regardless of whether you find a block.

### Performance Expectations

- CPU mining is significantly slower than ASIC or GPU mining
- Hash rates will be in the range of hundreds to thousands of hashes per second (H/s)
- Modern ASIC miners operate in terahashes per second (TH/s)
- Solo mining success is extremely unlikely but not impossible

### Resource Usage

- CPU usage will be high (near 100% on all cores)
- Memory usage is minimal
- Network usage is low (only for pool communication)

## Troubleshooting

### Miner Won't Start

- Verify your Stratum URL format is correct
- Ensure your username/worker is properly configured
- Check that the pool is accessible from your network
- Review the app logs in Umbrel for error messages

### No Hash Rate Displayed

- Wait a few moments after starting - it takes time to establish connection
- Verify your pool connection is working
- Check that BFGMiner is running (check status indicator)

### High CPU Usage

- This is expected behavior - CPU mining uses all available cores
- You can stop mining at any time if you need CPU resources
- Consider limiting CPU usage through Umbrel's resource management if needed

## Support

For issues, questions, or contributions:

- **GitHub Issues**: [https://github.com/acalatrava/umbrel-appstore/issues](https://github.com/acalatrava/umbrel-appstore/issues)
- **Repository**: [https://github.com/acalatrava/umbrel-appstore](https://github.com/acalatrava/umbrel-appstore)

## Developer

**Antonio Calatrava**

## License

MIT License

## Version

Current version: **1.0.1**

---

*Remember: If there's a hash, there's a chance. Happy mining! 🍀*

Donations are welcome:

**Bitcoin** bc1pvap9emf3mw0y2led0rv9jpuwls02uzg2hj7ksz4dpuflwxw6sj3saz9c2h

**Lightning network** lno1zrxq8pjw7qjlm68mtp7e3yvxee4y5xrgjhhyf2fxhlphpckrvevh50u0q08c26rl8zf50c99vw8pe2tulrmcrlhnm0mf99dy26emmjpczve2gqsry4kwrvx5q8men93uevj4f4quea3w3tf6ayfjaq0c806m6h4lj53qqvmeze7qcmgckqfywzns5hdx0vzyfn9azzdsheyguns0z0wkwrczu339pk47pwkfck5uk5ry90u4hfcrug6jq0t39g2xqkkdks84xmf9pqa33mxmsq5qqus9z5a3axvje50cfd6l7qqsejg762d4ygrs7y9w89upc5fndv


