# Gastown UI Deployment Guide

## Overview

The Gastown UI web application is exposed via the internet using Caddy as a reverse proxy with HTTP Basic Authentication.

## Architecture

```
Internet → Caddy (port 443/9443) → Basic Auth → Vite Dev Server (localhost:5173)
```

## Current Setup

### Access URLs

| URL | Type | Use Case |
|-----|------|----------|
| `https://localhost:9443` | Self-signed cert | Local HTTPS access |
| `http://localhost:8888` | HTTP | Local development/testing |
| `https://35-153-115-41.sslip.io` | Let's Encrypt | External access (requires firewall) |

### Credentials

- **Username:** `gastown`
- **Password:** `gastown2026`

## Installation

### Prerequisites

```bash
# Install Caddy and htpasswd utility
sudo apt-get update
sudo apt-get install -y caddy apache2-utils
```

### Configuration

The Caddyfile is located at `/etc/caddy/Caddyfile`:

```
# HTTP access on port 8888
http://:8888 {
    basicauth * {
        gastown $2a$14$AARsqkG313a.1WxA/LMu/uQK13ogzU697.NYHaGDYy7GPGOoTgMau
    }
    reverse_proxy localhost:5173
    encode gzip
}

# HTTPS with internal/self-signed cert on port 9443
https://localhost:9443 {
    tls internal
    basicauth * {
        gastown $2a$14$AARsqkG313a.1WxA/LMu/uQK13ogzU697.NYHaGDYy7GPGOoTgMau
    }
    reverse_proxy localhost:5173
    encode gzip
}
```

### Service Management

```bash
# Start/restart Caddy
sudo systemctl restart caddy

# Check status
sudo systemctl status caddy

# View logs
sudo journalctl -u caddy -f
```

## AWS Security Group Requirements

To enable external access via HTTPS with automatic Let's Encrypt certificates:

1. Open port **80** (HTTP) - Required for ACME HTTP-01 challenge
2. Open port **443** (HTTPS) - For HTTPS traffic
3. Optionally open ports **8888** and **9443** for alternative access

After opening ports, update the Caddyfile to add the sslip.io domain:

```
35-153-115-41.sslip.io {
    basicauth * {
        gastown $2a$14$AARsqkG313a.1WxA/LMu/uQK13ogzU697.NYHaGDYy7GPGOoTgMau
    }
    reverse_proxy localhost:5173
    encode gzip
    log {
        output file /var/log/caddy/gastown_ui.log
    }
}
```

Caddy will automatically obtain and renew Let's Encrypt certificates.

## Generating New Password Hash

To change the password:

```bash
# Generate new hash
caddy hash-password --plaintext 'your-new-password'

# Update /etc/caddy/Caddyfile with new hash
# Restart Caddy
sudo systemctl restart caddy
```

## Troubleshooting

### Certificate Issues

```bash
# Check certificate status
sudo journalctl -u caddy | grep -i cert

# Force certificate renewal
sudo caddy reload --config /etc/caddy/Caddyfile
```

### Connection Refused

1. Verify Vite dev server is running: `curl http://localhost:5173`
2. Verify Caddy is running: `sudo systemctl status caddy`
3. Check port bindings: `ss -tlnp | grep -E ':5173|:8888|:9443'`

### 401 Unauthorized

Verify credentials are correct. The password hash in Caddyfile must match:
- Username: `gastown`
- Password: `gastown2026`
