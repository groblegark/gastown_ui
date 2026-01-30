#!/bin/bash
# Setup Caddy reverse proxy for Gastown UI
# This script installs and configures Caddy with basic auth

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing Caddy..."
sudo apt-get update
sudo apt-get install -y caddy apache2-utils

echo "Creating log directory..."
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy

echo "Installing Caddyfile..."
sudo cp "$SCRIPT_DIR/Caddyfile" /etc/caddy/Caddyfile
sudo caddy fmt --overwrite /etc/caddy/Caddyfile

echo "Validating configuration..."
sudo caddy validate --config /etc/caddy/Caddyfile

echo "Restarting Caddy..."
sudo systemctl restart caddy
sudo systemctl enable caddy

echo "Checking status..."
sleep 2
sudo systemctl status caddy --no-pager

echo ""
echo "Setup complete!"
echo ""
echo "Access URLs:"
echo "  - HTTP:  http://localhost:8888"
echo "  - HTTPS: https://localhost:9443 (self-signed)"
echo ""
echo "Credentials:"
echo "  - Username: gastown"
echo "  - Password: gastown2026"
echo ""
echo "To test: curl -u gastown:gastown2026 http://localhost:8888"
