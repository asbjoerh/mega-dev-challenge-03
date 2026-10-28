<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { PROBLEMS, splitTicket } from '#lib/kb/split';
  import { tenantOf } from '#lib/kb/locales';
  import type { Report } from '#lib/kb/causes';

  // tickets: problem → link to the ticket filed for it.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Record<string, string> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const groups = $derived(split.groups);
  const total = $derived(split.merged);
  const shifts = $derived(groups.find((g) => g.problem === 'shift')?.reports.length ?? 0);
  const rows = (reports as Report[]).length;
</script>

<p class="sum">
  <strong>{total}</strong> reports in #{ticket} ({rows} rows in the export, one id counted once) ·
  <strong>{groups.length}</strong> problems
</p>

<table>
  <thead><tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>looks like</th><th>ticket</th></tr></thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{g.problem === 'unplaced' ? 'no tenant on file' : PROBLEMS[g.problem].seenAs}</td>
        <td>{#if tickets[g.problem]}<a href={tickets[g.problem]}>{tickets[g.problem].replace(/^.*\/issues\//, '#')}</a>{:else}—{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#if shifts}
  <p class="note">The {shifts} <code>shift</code> reports are also counted under the cause their tenant files them in, as the desk counts them.</p>
{/if}

<dl>
  {#each groups as g (g.problem)}
    {#if g.problem !== 'unplaced'}
      <dt><code>{g.problem}</code></dt>
      <dd>{PROBLEMS[g.problem].what}</dd>
    {/if}
  {/each}
</dl>

<style>
  .sum { font-size: 1.1rem; }
  .note { color: var(--muted); font-size: 0.85em; }
  dt { font-weight: 600; margin-top: 0.5rem; }
  dd { margin: 0 0 0 1rem; color: var(--muted); }
</style>
