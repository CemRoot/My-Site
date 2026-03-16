
// Mock fetch to simulate network latency
const mockFetch = (url, options) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }, 100); // 100ms latency
  });
};

const postEntries = Array.from({ length: 10 }, (_, i) => ({ id: `post_${i}` }));

async function runSequential() {
  const start = Date.now();
  for (const post of postEntries) {
    try {
      const n8nWebhookUrl = 'https://mock-n8n.com/webhook';
      await mockFetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          action: 'approve'
        })
      });
    } catch (n8nError) {
      console.error('N8N webhook error:', n8nError.message);
    }
  }
  const end = Date.now();
  return end - start;
}

async function runParallel() {
  const start = Date.now();
  const n8nWebhookUrl = 'https://mock-n8n.com/webhook';

  await Promise.all(postEntries.map(async (post) => {
    try {
      await mockFetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          action: 'approve'
        })
      });
    } catch (n8nError) {
      console.error('N8N webhook error:', n8nError.message);
    }
  }));

  const end = Date.now();
  return end - start;
}

async function runBenchmark() {
  console.log('Starting benchmark...');
  const sequentialTime = await runSequential();
  console.log(`Sequential execution time: ${sequentialTime}ms`);

  const parallelTime = await runParallel();
  console.log(`Parallel execution time: ${parallelTime}ms`);

  const improvement = ((sequentialTime - parallelTime) / sequentialTime * 100).toFixed(2);
  console.log(`Improvement: ${improvement}%`);
}

runBenchmark();
