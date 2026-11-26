<script setup lang="ts">
import { computed } from "vue";
import { sm } from "@/storage/db";
import { syncState } from "@/storage/sync";

const vaultLabel = computed(() => {
  const vault = syncState.self?.vault;
  return vault ? sm().abbrAddr(vault) : "locked";
});

const deviceText = computed(() => {
  const count = syncState.vaultDeviceCount;
  return `${count} device${count === 1 ? "" : "s"} in this vault.`;
});

const peerText = computed(() => {
  const count = syncState.roomPeerCount;
  return `${count} peer connection${count === 1 ? "" : "s"}`;
});

const statusText = computed(() => {
  switch (syncState.status) {
    case "unavailable":
      return "Sync is off in this build.";
    case "signed-out":
      return "Open your vault to see its devices.";
    case "waiting":
      return "Waiting for another device.";
    case "connected":
      return deviceText.value;
  }
});

function ago(at: number) {
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));

  if (seconds < 60) return `${seconds}s ago`;

  return `${Math.round(seconds / 60)}m ago`;
}
</script>

<template>
  <dialog id="syncPanel" class="mdst-dialog sync-panel">
    <div class="mdst-dialog-header">
      <h2 class="mdst-dialog-title">Sync</h2>
      <button class="mdst-dialog-close" commandfor="syncPanel" command="close">✕</button>
    </div>

    <div class="mdst-dialog-body">
      <p class="sync-panel__status" :data-status="syncState.status">
        {{ statusText }}
      </p>

      <p v-if="syncState.self" class="mdst-p mdst-p--sm">
        This tab · {{ vaultLabel }} · {{ peerText }}
      </p>

      <table
        v-if="syncState.peers.length"
        class="mdst-table mdst-table--bordered sync-panel__table"
      >
        <thead>
          <tr>
            <th>Device</th>
            <th>RTT</th>
            <th>Seen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="peer in syncState.peers" :key="peer.id">
            <td>{{ peer.label }}</td>
            <td>{{ peer.rttMs === null ? "measuring" : `${peer.rttMs} ms` }}</td>
            <td>{{ ago(peer.lastSeenAt) }}</td>
          </tr>
        </tbody>
      </table>

      <p v-else-if="syncState.status === 'connected'" class="mdst-p mdst-p--sm">
        Connected to peers, but none have announced this vault yet.
      </p>

      <p v-if="syncState.lastError" class="mdst-p mdst-p--sm sync-panel__error">
        {{ syncState.lastError }}
      </p>
    </div>
  </dialog>
</template>
