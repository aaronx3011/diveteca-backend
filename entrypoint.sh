#!/bin/sh
set -e

CONFIG=/etc/wireguard/wg0.conf

if [ -f "$CONFIG" ]; then
  echo "WireGuard config found — setting up VPN..."
  modprobe wireguard 2>/dev/null || true

  mkdir -p /dev/net
  mknod /dev/net/tun c 10 200 2>/dev/null || true

  ip link add dev wg0 type wireguard

  awk '
  /^\[/ { print; next }
  /^(PrivateKey|ListenPort|FwMark|PublicKey|PresharedKey|AllowedIPs|Endpoint|PersistentKeepalive|#|$)/ { print }
  ' "$CONFIG" > /tmp/wg.conf

  wg setconf wg0 /tmp/wg.conf

  ADDRESSES=$(grep -i '^Address' "$CONFIG" | head -1 | sed 's/.*=\s*//')
  OLDIFS=$IFS
  IFS=','
  for addr in $ADDRESSES; do
    addr=$(echo "$addr" | xargs)
    ip address add "$addr" dev wg0
  done
  IFS=$OLDIFS

  MTU=$(grep -i '^MTU' "$CONFIG" | head -1 | sed 's/.*=\s*//')
  if [ -n "$MTU" ]; then
    ip link set mtu "$MTU" up dev wg0
  else
    ip link set up dev wg0
  fi

  echo "WireGuard VPN established."
else
  echo "No WireGuard config found — skipping VPN. Server will start in degraded mode."
fi

node dist/server.js
