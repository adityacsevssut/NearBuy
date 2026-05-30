const http = require('http');
const WebSocket = require('ws');

http.get('http://127.0.0.1:9229/json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const targets = JSON.parse(data);
    const wsUrl = targets[0].webSocketDebuggerUrl;
    
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      // Send command to evaluate process.env
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: 'JSON.stringify(process.env)',
          returnByValue: true
        }
      }));
    });
    
    ws.on('message', (msg) => {
      const response = JSON.parse(msg);
      if (response.id === 1) {
        console.log(response.result.result.value);
        process.exit(0);
      }
    });
  });
}).on('error', (err) => {
  console.error('Error fetching targets:', err.message);
});
