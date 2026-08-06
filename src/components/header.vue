<script setup lang="ts">
import { sm } from "@/storage/db";
import { user } from "@/storage/user";
</script>

<template>
  <div class="header">
    <div class="home">
      NNOOTTEESS
    </div>

    <div class="user">
      Logged in: <span>{{
        user.id ? sm().abbrAddr(user.id) : "NOT LOGGED IN"
      }}</span>
    </div>
  </div>
</template>
