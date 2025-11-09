const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const net = require('net');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

let bfgminerProcess = null;

app.use(bodyParser.json());
app.use(express.static('public'));

async function ensureDataDir() {
    try {
        await fs.ensureDir(DATA_DIR);

        const testFile = path.join(DATA_DIR, '.write-test');
        try {
            await fs.writeFile(testFile, 'test');
            await fs.remove(testFile);
        } catch (testError) {
            console.error('Cannot write to data directory. Permissions issue:', testError.message);
            console.error('Please ensure the data directory is writable by user 1000:1000');
            throw new Error(`Data directory is not writable: ${testError.message}`);
        }

        if (!await fs.pathExists(CONFIG_FILE)) {
            await fs.writeJson(CONFIG_FILE, {
                stratum: '',
                username: '',
                password: ''
            });
        }
    } catch (error) {
        console.error('Error ensuring data directory:', error);
        throw error;
    }
}

async function getConfig() {
    await ensureDataDir();
    return await fs.readJson(CONFIG_FILE);
}

async function saveConfig(config) {
    await ensureDataDir();
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
}

function stopBfgminer() {
    if (bfgminerProcess) {
        bfgminerProcess.kill('SIGTERM');
        bfgminerProcess = null;
    }
}

function startBfgminer(config) {
    stopBfgminer();

    if (!config.stratum || !config.username) {
        return { success: false, error: 'Stratum URL and username are required' };
    }

    const args = [
        '--url', config.stratum,
        '--user', config.username,
        '--text-only',
        '-S', 'cpu:auto'
    ];

    if (config.password) {
        args.push('--pass', config.password);
    }

    args.push('--api-listen');
    args.push('--api-allow', 'W:127.0.0.1');

    bfgminerProcess = spawn('bfgminer', args, {
        stdio: ['ignore', 'pipe', 'pipe']
    });

    bfgminerProcess.stdout.on('data', (data) => {
        console.log(`bfgminer stdout: ${data}`);
    });

    bfgminerProcess.stderr.on('data', (data) => {
        console.error(`bfgminer stderr: ${data}`);
    });

    bfgminerProcess.on('close', (code) => {
        console.log(`bfgminer process exited with code ${code}`);
        bfgminerProcess = null;
    });

    bfgminerProcess.on('error', (err) => {
        console.error('Failed to start bfgminer:', err);
        bfgminerProcess = null;
    });

    return { success: true };
}

app.get('/api/config', async (req, res) => {
    try {
        const config = await getConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/config', async (req, res) => {
    try {
        const config = await getConfig();
        const newConfig = { ...config, ...req.body };
        await saveConfig(newConfig);
        res.json({ success: true, config: newConfig });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/start', async (req, res) => {
    try {
        const config = await getConfig();
        const result = startBfgminer(config);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stop', (req, res) => {
    try {
        stopBfgminer();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        running: bfgminerProcess !== null && bfgminerProcess.killed === false
    });
});

function queryBfgminerAPI(command) {
    return new Promise((resolve, reject) => {
        if (!bfgminerProcess || bfgminerProcess.killed) {
            reject(new Error('BFGMiner is not running'));
            return;
        }

        const client = new net.Socket();
        const timeout = 10000;
        let responseData = '';
        let responseReceived = false;
        let dataTimeout;

        client.setTimeout(timeout);

        client.on('connect', () => {
            const request = JSON.stringify({ command: command }) + '\n';
            client.write(request);
        });

        client.on('data', (data) => {
            responseData += data.toString();

            // Verificar si el JSON está completo y balanceado
            const trimmed = responseData.trim();
            const openBraces = (trimmed.match(/\{/g) || []).length;
            const closeBraces = (trimmed.match(/\}/g) || []).length;
            const openBrackets = (trimmed.match(/\[/g) || []).length;
            const closeBrackets = (trimmed.match(/\]/g) || []).length;

            // Si el JSON está balanceado, intentar parsear inmediatamente
            if (openBraces === closeBraces && openBrackets === closeBrackets && trimmed.length > 0) {
                clearTimeout(dataTimeout);
                try {
                    const response = JSON.parse(trimmed);
                    if (!responseReceived) {
                        responseReceived = true;
                        client.destroy();
                        resolve(response);
                        return;
                    }
                } catch (e) {
                    // JSON parece balanceado pero no se puede parsear, esperar más datos o cierre de conexión
                }
            }

            // No usar timeout aquí - esperar hasta que la conexión se cierre o el timeout general
        });

        client.on('timeout', () => {
            if (!responseReceived) {
                clearTimeout(dataTimeout);
                client.destroy();
                if (responseData.trim()) {
                    // Intentar parsear lo que tenemos
                    try {
                        const trimmed = responseData.trim();
                        const response = JSON.parse(trimmed);
                        resolve(response);
                        return;
                    } catch (e) {
                        reject(new Error(`API request timeout. Partial response: ${responseData.substring(0, 200)}`));
                    }
                } else {
                    reject(new Error('API request timeout - no response received'));
                }
            }
        });

        client.on('error', (err) => {
            if (!responseReceived) {
                clearTimeout(dataTimeout);
                client.destroy();
                reject(new Error(`API connection error: ${err.message}`));
            }
        });

        function tryParseJSON(data) {
            const trimmed = data.trim();

            // Intentar encontrar el primer objeto JSON válido
            let braceCount = 0;
            let bracketCount = 0;
            let inString = false;
            let escapeNext = false;
            let startPos = -1;

            for (let i = 0; i < trimmed.length; i++) {
                const char = trimmed[i];

                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }

                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }

                if (char === '"' && !escapeNext) {
                    inString = !inString;
                    continue;
                }

                if (inString) continue;

                if (char === '{') {
                    if (startPos === -1) startPos = i;
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0 && bracketCount === 0 && startPos !== -1) {
                        // Encontramos un objeto JSON completo
                        try {
                            const jsonStr = trimmed.substring(startPos, i + 1);
                            return JSON.parse(jsonStr);
                        } catch (e) {
                            // Continuar buscando
                        }
                    }
                } else if (char === '[') {
                    if (startPos === -1) startPos = i;
                    bracketCount++;
                } else if (char === ']') {
                    bracketCount--;
                    if (braceCount === 0 && bracketCount === 0 && startPos !== -1) {
                        // Encontramos un array JSON completo
                        try {
                            const jsonStr = trimmed.substring(startPos, i + 1);
                            return JSON.parse(jsonStr);
                        } catch (e) {
                            // Continuar buscando
                        }
                    }
                }
            }

            // Si no encontramos un objeto completo, intentar parsear todo
            try {
                return JSON.parse(trimmed);
            } catch (e) {
                // Intentar parsear línea por línea
                const lines = trimmed.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            return JSON.parse(line);
                        } catch (e) {
                            // Continuar
                        }
                    }
                }
                throw e;
            }
        }

        client.on('close', () => {
            clearTimeout(dataTimeout);
            if (!responseReceived && responseData.trim()) {
                try {
                    const response = tryParseJSON(responseData);
                    resolve(response);
                    return;
                } catch (parseError) {
                    const trimmed = responseData.trim();
                    // Verificar si el JSON está incompleto
                    const openBraces = (trimmed.match(/\{/g) || []).length;
                    const closeBraces = (trimmed.match(/\}/g) || []).length;
                    const openBrackets = (trimmed.match(/\[/g) || []).length;
                    const closeBrackets = (trimmed.match(/\]/g) || []).length;

                    if (openBraces > closeBraces || openBrackets > closeBrackets) {
                        reject(new Error(`Incomplete JSON response. Missing ${openBraces - closeBraces} closing braces and ${openBrackets - closeBrackets} closing brackets. Response: ${trimmed.substring(0, 300)}`));
                    } else {
                        reject(new Error(`Invalid JSON response: ${parseError.message}. Response: ${trimmed.substring(0, 500)}`));
                    }
                }
            } else if (!responseReceived) {
                reject(new Error('Connection closed without response'));
            }
        });

        // Conectar al final para asegurar que todos los listeners estén registrados
        client.connect(4028, '127.0.0.1');
    });
}

app.get('/api/mining/summary', async (req, res) => {
    try {
        const summary = await queryBfgminerAPI('summary');
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/mining/devs', async (req, res) => {
    try {
        const devs = await queryBfgminerAPI('devs');
        res.json(devs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/mining/pools', async (req, res) => {
    try {
        const pools = await queryBfgminerAPI('pools');
        res.json(pools);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, async () => {
    console.log(`BFGMiner management server running on port ${PORT}`);
    try {
        await ensureDataDir();

        // Intentar autoarrancar bfgminer si la configuración está establecida
        try {
            const config = await getConfig();
            if (config.stratum && config.username) {
                console.log('Configuration found, attempting to start BFGMiner automatically...');
                setTimeout(() => {
                    const result = startBfgminer(config);
                    if (result.success) {
                        console.log('BFGMiner started automatically');
                    } else {
                        console.log('Failed to auto-start BFGMiner:', result.error);
                    }
                }, 2000);
            } else {
                console.log('No configuration found, BFGMiner will not auto-start');
            }
        } catch (error) {
            console.error('Error checking configuration for auto-start:', error.message);
        }
    } catch (error) {
        console.error('Failed to initialize data directory:', error);
        console.error('The server will continue but some features may not work.');
    }
});

process.on('SIGTERM', () => {
    stopBfgminer();
    process.exit(0);
});

