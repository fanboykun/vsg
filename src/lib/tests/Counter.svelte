<script>
  import { db } from "../utils/user";
  import { writable } from 'svelte/store';
  import { onMount } from "svelte";

  onMount(() => {
    db.get('counter').on((data) => {
      if(!data) {return}
      console.log('count is:', data.count);
      count.set(data.count)
    });
  })

  let count = writable(0);
  const increment = () => {
    count.set($count + 1)
    db.get('counter').put({count : $count}, (ack) => {
      if(ack){
        console.log('Data saved:', ack);
      }
    })
  }
</script>

<button on:click={increment}>
  count is {$count}
</button>
