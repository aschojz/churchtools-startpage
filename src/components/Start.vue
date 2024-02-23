<script setup lang="ts">
import { useStore } from '../store';
import { Button } from '@churchtools/styleguide';

const store = useStore();
const onClick = () => store.count++;
</script>

<template>
    <div class="home">
        <Button size="S" @click="onClick">Hilfe & Fehler</Button>
    </div>
</template>

<style>
.home {
    text-align: center;
}
</style>
