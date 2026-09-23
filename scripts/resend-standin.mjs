// Records what the app asks Resend to do. Local only.
import { createServer } from 'node:http'
const calls = []; let n = 0
createServer((req, res) => {
  let b = ''; req.on('data', c => b += c); req.on('end', () => {
    if (req.url === '/__calls') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(calls)) }
    let body = null; try { body = JSON.parse(b) } catch {}
    calls.push({ path: req.url, body })
    res.setHeader('content-type', 'application/json')
    if (req.url === '/emails') return res.end(JSON.stringify({ id: `re_local_${++n}` }))
    if (/^\/emails\/[^/]+\/cancel$/.test(req.url)) return res.end(JSON.stringify({ object: 'email', id: req.url.split('/')[2] }))
    res.statusCode = 404; res.end('{}')
  })
}).listen(4719, '127.0.0.1')
